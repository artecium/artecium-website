-- Artecium Booking — security hardening & member invites (Phase 2)
-- Run AFTER 012_booking_foundation.sql
--
-- Addresses review findings:
--   - Member onboarding by invite (no direct membership INSERT by non-managers)
--   - Public appointment overlap includes service buffers in blocked window
--   - Stricter booking_create_business_with_owner slug validation
--   - Public RPC does not expose guest_email/phone in return set (unchanged)

-- ===========================================================================
-- Member invites (managers/owners invite by email; no open manager self-signup)
-- ===========================================================================

create table if not exists public.booking_member_invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  email text not null,
  role text not null default 'staff'
    check (role in ('manager', 'staff')),
  invited_by uuid references public.profiles(id) on delete set null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint booking_invites_email_nonempty check (length(trim(email)) > 3)
);

create unique index if not exists idx_booking_member_invites_pending_email
  on public.booking_member_invites (business_id, lower(trim(email)))
  where accepted_at is null;

create index if not exists idx_booking_member_invites_token_hash
  on public.booking_member_invites (token_hash)
  where accepted_at is null;

alter table public.booking_member_invites enable row level security;

revoke all on public.booking_member_invites from anon, public;
grant select, insert, update, delete on public.booking_member_invites to authenticated;

drop policy if exists "Booking managers read invites" on public.booking_member_invites;
create policy "Booking managers read invites" on public.booking_member_invites
  for select to authenticated
  using (public.booking_can_manage_business(business_id));

drop policy if exists "Booking managers write invites" on public.booking_member_invites;
create policy "Booking managers write invites" on public.booking_member_invites
  for all to authenticated
  using (public.booking_can_manage_business(business_id))
  with check (public.booking_can_manage_business(business_id));

-- ===========================================================================
-- Blocked time window for overlap (buffers included)
-- ===========================================================================

alter table public.booking_appointments
  add column if not exists blocked_starts_at timestamptz;

alter table public.booking_appointments
  add column if not exists blocked_ends_at timestamptz;

create or replace function public.booking_set_appointment_blocked_range()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_service public.booking_services%rowtype;
begin
  select * into v_service from public.booking_services where id = new.service_id;
  if not found then
    raise exception 'service not found for appointment';
  end if;

  new.blocked_starts_at :=
    new.starts_at - make_interval(mins => coalesce(v_service.buffer_before_minutes, 0));
  new.blocked_ends_at :=
    new.ends_at + make_interval(mins => coalesce(v_service.buffer_after_minutes, 0));

  return new;
end;
$$;

drop trigger if exists booking_appointments_blocked_range on public.booking_appointments;
create trigger booking_appointments_blocked_range
  before insert or update of starts_at, ends_at, service_id
  on public.booking_appointments
  for each row execute function public.booking_set_appointment_blocked_range();

alter table public.booking_appointments
  drop constraint if exists booking_appointments_no_staff_overlap;

alter table public.booking_appointments
  add constraint booking_appointments_no_staff_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(blocked_starts_at, blocked_ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));

-- Backfill blocked columns for any existing rows (none expected pre-apply)
update public.booking_appointments a
set
  blocked_starts_at = a.starts_at,
  blocked_ends_at = a.ends_at
where blocked_starts_at is null;

alter table public.booking_appointments
  alter column blocked_starts_at set not null;

alter table public.booking_appointments
  alter column blocked_ends_at set not null;

-- ===========================================================================
-- Hardened RPCs
-- ===========================================================================

create or replace function public.booking_create_business_with_owner(
  p_slug text,
  p_name text,
  p_timezone text default 'Europe/Lisbon'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  v_slug := lower(trim(p_slug));
  if v_slug is null or v_slug = '' or p_name is null or trim(p_name) = '' then
    raise exception 'invalid slug or name' using errcode = '22023';
  end if;

  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid slug format' using errcode = '22023';
  end if;

  insert into public.booking_businesses (slug, name, timezone)
  values (
    v_slug,
    trim(p_name),
    coalesce(nullif(trim(p_timezone), ''), 'Europe/Lisbon')
  )
  returning id into v_id;

  insert into public.booking_business_members (business_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  insert into public.booking_business_subscriptions (business_id)
  values (v_id)
  on conflict (business_id) do nothing;

  return v_id;
end;
$$;

create or replace function public.booking_public_create_appointment(
  p_business_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_idempotency_key text default null
)
returns table (
  appointment_id uuid,
  public_reference text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.booking_businesses%rowtype;
  v_service public.booking_services%rowtype;
  v_staff public.booking_staff%rowtype;
  v_ends_at timestamptz;
  v_status text;
  v_ref text;
  v_existing uuid;
begin
  if p_guest_name is null or trim(p_guest_name) = '' then
    raise exception 'guest_name required' using errcode = '22023';
  end if;

  select * into v_business
  from public.booking_businesses b
  where lower(b.slug) = lower(trim(p_business_slug))
    and b.is_active = true
  limit 1;

  if not found then
    raise exception 'business not found' using errcode = 'P0002';
  end if;

  if p_idempotency_key is not null and trim(p_idempotency_key) <> '' then
    select a.id into v_existing
    from public.booking_appointments a
    where a.business_id = v_business.id
      and a.idempotency_key = p_idempotency_key
    limit 1;
    if v_existing is not null then
      return query
      select a.id, a.public_reference, a.status, a.starts_at, a.ends_at
      from public.booking_appointments a
      where a.id = v_existing;
      return;
    end if;
  end if;

  select * into v_service
  from public.booking_services s
  where s.id = p_service_id
    and s.business_id = v_business.id
    and s.is_active = true;

  if not found then
    raise exception 'service not found' using errcode = 'P0002';
  end if;

  select * into v_staff
  from public.booking_staff st
  where st.id = p_staff_id
    and st.business_id = v_business.id
    and st.is_active = true
    and st.accepts_online_bookings = true;

  if not found then
    raise exception 'staff not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.booking_staff_services ss
    where ss.staff_id = v_staff.id and ss.service_id = v_service.id
  ) then
    raise exception 'staff cannot perform service' using errcode = '22023';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_minutes);

  if p_starts_at < now() + make_interval(mins => v_business.min_notice_minutes) then
    raise exception 'inside min notice window' using errcode = '22023';
  end if;

  if p_starts_at > now() + make_interval(days => v_business.max_booking_days) then
    raise exception 'outside max booking horizon' using errcode = '22023';
  end if;

  v_status := case
    when v_business.confirmation_mode = 'automatic' then 'confirmed'
    else 'pending'
  end;

  v_ref := 'bk_' || replace(gen_random_uuid()::text, '-', '');

  begin
    insert into public.booking_appointments (
      business_id,
      service_id,
      staff_id,
      guest_name,
      guest_email,
      guest_phone,
      starts_at,
      ends_at,
      status,
      source,
      public_reference,
      idempotency_key
    ) values (
      v_business.id,
      v_service.id,
      v_staff.id,
      trim(p_guest_name),
      nullif(trim(coalesce(p_guest_email, '')), ''),
      nullif(trim(coalesce(p_guest_phone, '')), ''),
      p_starts_at,
      v_ends_at,
      v_status,
      'public',
      v_ref,
      nullif(trim(coalesce(p_idempotency_key, '')), '')
    );
  exception
    when exclusion_violation then
      raise exception 'slot no longer available' using errcode = '23505';
  end;

  return query
  select a.id, a.public_reference, a.status, a.starts_at, a.ends_at
  from public.booking_appointments a
  where a.public_reference = v_ref;
end;
$$;

create or replace function public.booking_create_member_invite(
  p_business_id uuid,
  p_email text,
  p_role text default 'staff',
  p_token_hash text default null,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text;
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.booking_can_manage_business(p_business_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_email := lower(trim(p_email));
  v_role := coalesce(nullif(trim(p_role), ''), 'staff');

  if v_email = '' or v_role not in ('manager', 'staff') then
    raise exception 'invalid invite' using errcode = '22023';
  end if;

  if p_token_hash is null or trim(p_token_hash) = '' then
    raise exception 'token_hash required' using errcode = '22023';
  end if;

  insert into public.booking_member_invites (
    business_id,
    email,
    role,
    invited_by,
    token_hash,
    expires_at
  ) values (
    p_business_id,
    v_email,
    v_role,
    auth.uid(),
    trim(p_token_hash),
    coalesce(p_expires_at, now() + interval '7 days')
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.booking_accept_member_invite(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.booking_member_invites%rowtype;
  v_profile_email text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select email into v_profile_email from public.profiles where id = auth.uid();
  if v_profile_email is null then
    raise exception 'profile email required' using errcode = '22023';
  end if;

  select * into v_invite
  from public.booking_member_invites i
  where i.token_hash = trim(p_token_hash)
    and i.accepted_at is null
    and i.expires_at > now()
  limit 1;

  if not found then
    raise exception 'invite not found or expired' using errcode = 'P0002';
  end if;

  if lower(trim(v_profile_email)) <> lower(trim(v_invite.email)) then
    raise exception 'invite email mismatch' using errcode = '42501';
  end if;

  insert into public.booking_business_members (business_id, user_id, role)
  values (v_invite.business_id, auth.uid(), v_invite.role)
  on conflict (business_id, user_id) do update set role = excluded.role;

  update public.booking_member_invites
  set accepted_at = now()
  where id = v_invite.id;

  return v_invite.business_id;
end;
$$;

revoke all on function public.booking_create_member_invite(uuid, text, text, text, timestamptz) from public;
grant execute on function public.booking_create_member_invite(uuid, text, text, text, timestamptz) to authenticated;

revoke all on function public.booking_accept_member_invite(text) from public;
grant execute on function public.booking_accept_member_invite(text) to authenticated;

comment on schema public is
  '013: booking invites, buffer-aware overlap, hardened RPCs.';
