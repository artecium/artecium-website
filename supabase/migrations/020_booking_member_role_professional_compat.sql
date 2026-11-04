-- Artecium Booking — Phase 1: professional member role (one-release staff compat)
-- Run AFTER 019 (when applied). Idempotent data backfill + triggers.
-- Does not change RLS scope (Phase 2).

-- ---------------------------------------------------------------------------
-- Normalize legacy "staff" membership role to "professional"
-- ---------------------------------------------------------------------------

create or replace function public.booking_normalize_member_role_text(p_role text)
returns text
language sql
immutable
as $$
  select case
    when p_role = 'staff' then 'professional'
    else p_role
  end;
$$;

comment on function public.booking_normalize_member_role_text(text) is
  'Maps legacy booking member role staff → professional. staff removed in migration 035.';

-- Widen CHECK constraints (accept both during compat window)
alter table public.booking_business_members
  drop constraint if exists booking_business_members_role_check;

alter table public.booking_business_members
  add constraint booking_business_members_role_check
  check (role in ('owner', 'manager', 'staff', 'professional'));

alter table public.booking_member_invites
  drop constraint if exists booking_member_invites_role_check;

alter table public.booking_member_invites
  add constraint booking_member_invites_role_check
  check (role in ('manager', 'staff', 'professional'));

-- Backfill stored roles
update public.booking_business_members
set role = 'professional'
where role = 'staff';

update public.booking_member_invites
set role = 'professional'
where role = 'staff'
  and accepted_at is null;

-- Defaults for new rows
alter table public.booking_business_members
  alter column role set default 'professional';

alter table public.booking_member_invites
  alter column role set default 'professional';

-- Triggers: legacy clients may still send staff
create or replace function public.booking_trg_normalize_member_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is not null then
    new.role := public.booking_normalize_member_role_text(new.role);
  end if;
  return new;
end;
$$;

drop trigger if exists booking_normalize_member_role on public.booking_business_members;
create trigger booking_normalize_member_role
  before insert or update of role on public.booking_business_members
  for each row execute function public.booking_trg_normalize_member_role();

drop trigger if exists booking_normalize_invite_role on public.booking_member_invites;
create trigger booking_normalize_invite_role
  before insert or update of role on public.booking_member_invites
  for each row execute function public.booking_trg_normalize_member_role();

-- ---------------------------------------------------------------------------
-- Team invite RPC: accept manager | staff | professional (staff deprecated)
-- ---------------------------------------------------------------------------

create or replace function public.booking_create_member_invite(
  p_business_id uuid,
  p_email text,
  p_role text default 'professional',
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
  v_role := public.booking_normalize_member_role_text(
    coalesce(nullif(trim(p_role), ''), 'professional')
  );

  if v_email = '' or v_role not in ('manager', 'professional') then
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

comment on function public.booking_create_member_invite(uuid, text, text, text, timestamptz) is
  'Phase 1: p_role staff|professional → professional; manager unchanged.';

comment on schema public is
  '020: booking member role professional + staff compat (triggers + backfill).';
