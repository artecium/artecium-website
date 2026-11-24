-- Artecium Booking — public RPC idempotency + availability validation
-- Run AFTER 014_booking_membership_hardening.sql

create extension if not exists pgcrypto;

alter table public.booking_appointments
  add column if not exists idempotency_request_hash text;

comment on column public.booking_appointments.idempotency_request_hash is
  'SHA-256 hex of service|staff|starts_at_ms; binds idempotency_key to request shape.';

create or replace function public.booking_public_idempotency_request_hash(
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz
)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select encode(
    digest(
      p_service_id::text || '|' || p_staff_id::text || '|' ||
      (extract(epoch from p_starts_at) * 1000)::bigint::text,
      'sha256'::text
    ),
    'hex'
  );
$$;

create or replace function public.booking_validate_public_slot(
  p_business_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz
)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  v_business public.booking_businesses%rowtype;
  v_service public.booking_services%rowtype;
  v_staff public.booking_staff%rowtype;
  v_local timestamp;
  v_dow int;
  v_start_time time;
  v_end_time time;
  v_end_local timestamp;
  v_minutes int;
  v_blocked_start timestamptz;
  v_blocked_end timestamptz;
begin
  select * into v_business from public.booking_businesses where id = p_business_id;
  if not found or not v_business.is_active then
    raise exception 'business not found' using errcode = 'P0002';
  end if;

  select * into v_service
  from public.booking_services s
  where s.id = p_service_id and s.business_id = p_business_id and s.is_active = true;
  if not found then
    raise exception 'service not found' using errcode = 'P0002';
  end if;

  select * into v_staff
  from public.booking_staff st
  where st.id = p_staff_id
    and st.business_id = p_business_id
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

  if p_starts_at < now() + make_interval(mins => v_business.min_notice_minutes) then
    raise exception 'inside min notice window' using errcode = '22023';
  end if;

  if p_starts_at > now() + make_interval(days => v_business.max_booking_days) then
    raise exception 'outside max booking horizon' using errcode = '22023';
  end if;

  v_local := timezone(v_business.timezone, p_starts_at);
  v_end_local := timezone(v_business.timezone, p_starts_at + make_interval(mins => v_service.duration_minutes));
  if v_local::date <> v_end_local::date then
    raise exception 'appointment must fit within one local calendar day' using errcode = '22023';
  end if;

  v_dow := extract(dow from v_local)::int;
  v_start_time := v_local::time;
  v_end_time := v_end_local::time;

  if not exists (
    select 1 from public.booking_working_hours wh
    where wh.staff_id = v_staff.id
      and wh.day_of_week = v_dow
      and wh.start_time <= v_start_time
      and wh.end_time >= v_end_time
  ) then
    raise exception 'outside working hours' using errcode = '22023';
  end if;

  v_minutes := (extract(hour from v_local)::int * 60) + extract(minute from v_local)::int;
  if v_minutes % v_business.slot_interval_minutes <> 0 then
    raise exception 'slot not aligned to booking grid' using errcode = '22023';
  end if;

  if extract(second from v_local) <> 0 then
    raise exception 'slot must start on a whole minute' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.booking_staff_breaks b
    where b.staff_id = v_staff.id
      and b.day_of_week = v_dow
      and v_start_time >= b.start_time
      and v_start_time < b.end_time
  ) then
    raise exception 'slot during staff break' using errcode = '22023';
  end if;

  v_blocked_start := p_starts_at - make_interval(mins => coalesce(v_service.buffer_before_minutes, 0));
  v_blocked_end := p_starts_at + make_interval(mins => v_service.duration_minutes + coalesce(v_service.buffer_after_minutes, 0));

  if exists (
    select 1 from public.booking_time_off t
    where t.staff_id = v_staff.id
      and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(v_blocked_start, v_blocked_end, '[)')
  ) then
    raise exception 'staff unavailable' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.booking_appointments a
    where a.staff_id = v_staff.id
      and a.status in ('pending', 'confirmed')
      and tstzrange(a.blocked_starts_at, a.blocked_ends_at, '[)') && tstzrange(v_blocked_start, v_blocked_end, '[)')
  ) then
    raise exception 'slot no longer available' using errcode = '23505';
  end if;
end;
$$;

drop function if exists public.booking_public_create_appointment(
  text,
  uuid,
  uuid,
  timestamptz,
  text,
  text,
  text,
  text
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
  replayed boolean
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
  v_key text;
  v_hash text;
  v_existing public.booking_appointments%rowtype;
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
        true;
      return;
    end if;
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
      idempotency_key,
      idempotency_request_hash
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
      case when v_key is not null then v_hash else null end
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
            true;
          return;
        end if;
      end if;
      raise exception 'slot no longer available' using errcode = '23505';
    when exclusion_violation then
      raise exception 'slot no longer available' using errcode = '23505';
  end;

  return query
  select a.public_reference, a.status, a.starts_at, a.ends_at, false
  from public.booking_appointments a
  where a.public_reference = v_ref;
end;
$$;

revoke all on function public.booking_public_idempotency_request_hash(uuid, uuid, timestamptz) from public;
grant execute on function public.booking_public_idempotency_request_hash(uuid, uuid, timestamptz) to authenticated, anon;

revoke all on function public.booking_validate_public_slot(uuid, uuid, uuid, timestamptz) from public;
grant execute on function public.booking_validate_public_slot(uuid, uuid, uuid, timestamptz) to authenticated, anon;

revoke all on function public.booking_public_create_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text
) from public;
grant execute on function public.booking_public_create_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text
) to anon, authenticated;

comment on function public.booking_public_create_appointment is
  'Public booking: full server-side availability validation; safe idempotency without PII replay.';
