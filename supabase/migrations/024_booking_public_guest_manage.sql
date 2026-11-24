-- Guest cancel / view / reschedule via manage token (MVP launch).
-- Run AFTER 023 (booking harness) — only touches public booking RPCs.

create or replace function public.booking_public_manage_token_hash(p_token text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(trim(p_token), 'sha256'::text), 'hex');
$$;

revoke all on function public.booking_public_manage_token_hash(text) from public;
grant execute on function public.booking_public_manage_token_hash(text) to anon, authenticated;

-- Extend create_appointment: persist manage_token_hash, return one-time manage_token on new inserts.

drop function if exists public.booking_public_create_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text
);

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
  public_reference text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  replayed boolean,
  manage_token text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_business public.booking_businesses%rowtype;
  v_service public.booking_services%rowtype;
  v_staff public.booking_staff%rowtype;
  v_ends_at timestamptz;
  v_status text;
  v_ref text;
  v_key text;
  v_hash text;
  v_existing public.booking_appointments%rowtype;
  v_manage_token text;
  v_manage_hash text;
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

  perform public.booking_validate_public_slot(
    v_business.id,
    p_service_id,
    p_staff_id,
    p_starts_at
  );

  select * into v_service from public.booking_services where id = p_service_id;
  select * into v_staff from public.booking_staff where id = p_staff_id;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_minutes);
  v_hash := public.booking_public_idempotency_request_hash(p_service_id, p_staff_id, p_starts_at);
  v_key := nullif(trim(coalesce(p_idempotency_key, '')), '');

  if v_key is not null then
    if v_key !~ '^[a-zA-Z0-9_-]{8,128}$' then
      raise exception 'invalid idempotency key' using errcode = '22023';
    end if;

    select * into v_existing
    from public.booking_appointments a
    where a.business_id = v_business.id
      and a.idempotency_key = v_key
    limit 1;

    if found then
      if v_existing.idempotency_request_hash is distinct from v_hash then
        raise exception 'idempotency key reused with different request' using errcode = '22023';
      end if;
      return query
      select
        v_existing.public_reference,
        v_existing.status,
        v_existing.starts_at,
        v_existing.ends_at,
        true,
        null::text;
      return;
    end if;
  end if;

  v_status := case
    when v_business.confirmation_mode = 'automatic' then 'confirmed'
    else 'pending'
  end;

  v_ref := 'bk_' || replace(gen_random_uuid()::text, '-', '');
  v_manage_token := encode(gen_random_bytes(32), 'hex');
  v_manage_hash := public.booking_public_manage_token_hash(v_manage_token);

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
      idempotency_key,
      idempotency_request_hash,
      manage_token_hash
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
      v_key,
      case when v_key is not null then v_hash else null end,
      v_manage_hash
    );
  exception
    when unique_violation then
      if v_key is not null then
        select * into v_existing
        from public.booking_appointments a
        where a.business_id = v_business.id
          and a.idempotency_key = v_key
        limit 1;
        if found then
          if v_existing.idempotency_request_hash is distinct from v_hash then
            raise exception 'idempotency key reused with different request' using errcode = '22023';
          end if;
          return query
          select
            v_existing.public_reference,
            v_existing.status,
            v_existing.starts_at,
            v_existing.ends_at,
            true,
            null::text;
          return;
        end if;
      end if;
      raise exception 'slot no longer available' using errcode = '23505';
    when exclusion_violation then
      raise exception 'slot no longer available' using errcode = '23505';
  end;

  return query
  select
    a.public_reference,
    a.status,
    a.starts_at,
    a.ends_at,
    false,
    v_manage_token
  from public.booking_appointments a
  where a.public_reference = v_ref;
end;
$$;

revoke all on function public.booking_public_create_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text
) from public;
grant execute on function public.booking_public_create_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text
) to anon, authenticated;

create or replace function public.booking_public_get_guest_appointment(
  p_public_reference text,
  p_manage_token text
)
returns table (
  business_slug text,
  business_name text,
  timezone text,
  service_name text,
  service_id uuid,
  staff_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  allow_customer_reschedule boolean,
  cancellation_notice_minutes int,
  guest_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.booking_appointments%rowtype;
  v_business public.booking_businesses%rowtype;
  v_service public.booking_services%rowtype;
begin
  if p_public_reference is null or trim(p_public_reference) = '' then
    raise exception 'reference required' using errcode = '22023';
  end if;
  if p_manage_token is null or trim(p_manage_token) = '' then
    raise exception 'manage token required' using errcode = '22023';
  end if;

  select * into v_row
  from public.booking_appointments a
  where a.public_reference = trim(p_public_reference)
    and a.manage_token_hash = public.booking_public_manage_token_hash(p_manage_token)
  limit 1;

  if not found then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  select * into v_business from public.booking_businesses where id = v_row.business_id;
  select * into v_service from public.booking_services where id = v_row.service_id;

  return query
  select
    v_business.slug,
    v_business.name,
    v_business.timezone,
    v_service.name,
    v_row.service_id,
    v_row.staff_id,
    v_row.starts_at,
    v_row.ends_at,
    v_row.status,
    v_business.allow_customer_reschedule,
    v_business.cancellation_notice_minutes,
    v_row.guest_name;
end;
$$;

revoke all on function public.booking_public_get_guest_appointment(text, text) from public;
grant execute on function public.booking_public_get_guest_appointment(text, text) to anon, authenticated;

create or replace function public.booking_public_cancel_guest_appointment(
  p_public_reference text,
  p_manage_token text
)
returns table (
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
  v_row public.booking_appointments%rowtype;
  v_business public.booking_businesses%rowtype;
begin
  select * into v_row
  from public.booking_appointments a
  where a.public_reference = trim(p_public_reference)
    and a.manage_token_hash = public.booking_public_manage_token_hash(p_manage_token)
  for update;

  if not found then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  select * into v_business from public.booking_businesses where id = v_row.business_id;

  if v_row.status not in ('pending', 'confirmed') then
    raise exception 'appointment cannot be cancelled' using errcode = '22023';
  end if;

  if v_row.starts_at < now() + make_interval(mins => v_business.cancellation_notice_minutes) then
    raise exception 'inside cancellation notice window' using errcode = '22023';
  end if;

  update public.booking_appointments
  set status = 'cancelled', updated_at = now()
  where id = v_row.id;

  return query
  select v_row.public_reference, 'cancelled'::text, v_row.starts_at, v_row.ends_at;
end;
$$;

revoke all on function public.booking_public_cancel_guest_appointment(text, text) from public;
grant execute on function public.booking_public_cancel_guest_appointment(text, text) to anon, authenticated;

create or replace function public.booking_public_reschedule_guest_appointment(
  p_public_reference text,
  p_manage_token text,
  p_new_starts_at timestamptz
)
returns table (
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
  v_row public.booking_appointments%rowtype;
  v_business public.booking_businesses%rowtype;
  v_service public.booking_services%rowtype;
  v_ends_at timestamptz;
begin
  select * into v_row
  from public.booking_appointments a
  where a.public_reference = trim(p_public_reference)
    and a.manage_token_hash = public.booking_public_manage_token_hash(p_manage_token)
  for update;

  if not found then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  select * into v_business from public.booking_businesses where id = v_row.business_id;

  if not v_business.allow_customer_reschedule then
    raise exception 'reschedule not allowed for this business' using errcode = '22023';
  end if;

  if v_row.status not in ('pending', 'confirmed') then
    raise exception 'appointment cannot be rescheduled' using errcode = '22023';
  end if;

  if v_row.starts_at < now() + make_interval(mins => v_business.cancellation_notice_minutes) then
    raise exception 'inside cancellation notice window' using errcode = '22023';
  end if;

  perform public.booking_validate_public_slot(
    v_business.id,
    v_row.service_id,
    v_row.staff_id,
    p_new_starts_at
  );

  select * into v_service from public.booking_services where id = v_row.service_id;
  v_ends_at := p_new_starts_at + make_interval(mins => v_service.duration_minutes);

  begin
    update public.booking_appointments
    set starts_at = p_new_starts_at,
        ends_at = v_ends_at,
        updated_at = now()
    where id = v_row.id;
  exception
    when exclusion_violation then
      raise exception 'slot no longer available' using errcode = '23505';
  end;

  return query
  select v_row.public_reference, v_row.status, p_new_starts_at, v_ends_at;
end;
$$;

revoke all on function public.booking_public_reschedule_guest_appointment(text, text, timestamptz) from public;
grant execute on function public.booking_public_reschedule_guest_appointment(text, text, timestamptz) to anon, authenticated;