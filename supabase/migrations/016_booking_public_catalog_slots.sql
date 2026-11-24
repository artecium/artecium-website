-- Artecium Booking — public catalog & day slot listing (read-only RPCs)
-- Run AFTER 015_booking_public_rpc_hardening.sql
-- Anon has EXECUTE only; no direct table access.

create or replace function public.booking_public_list_services(p_slug text)
returns table (
  id uuid,
  name text,
  description text,
  duration_minutes int,
  price_cents int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price_cents
  from public.booking_businesses b
  join public.booking_services s on s.business_id = b.id
  where lower(b.slug) = lower(trim(p_slug))
    and b.is_active = true
    and s.is_active = true
  order by s.sort_order, s.name;
$$;

create or replace function public.booking_public_list_staff_for_service(
  p_slug text,
  p_service_id uuid
)
returns table (
  id uuid,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    st.id,
    st.display_name
  from public.booking_businesses b
  join public.booking_services s on s.business_id = b.id and s.id = p_service_id and s.is_active = true
  join public.booking_staff st on st.business_id = b.id and st.is_active = true and st.accepts_online_bookings = true
  join public.booking_staff_services ss on ss.staff_id = st.id and ss.service_id = s.id
  where lower(b.slug) = lower(trim(p_slug))
    and b.is_active = true
  order by st.sort_order, st.display_name;
$$;

create or replace function public.booking_public_list_day_slots(
  p_business_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_local_date date
)
returns table (
  starts_at timestamptz,
  staff_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business public.booking_businesses%rowtype;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_cursor timestamptz;
  v_step interval;
  v_staff uuid;
begin
  select * into v_business
  from public.booking_businesses b
  where lower(b.slug) = lower(trim(p_business_slug))
    and b.is_active = true
  limit 1;

  if not found then
    raise exception 'business not found' using errcode = 'P0002';
  end if;

  if p_local_date is null then
    raise exception 'date required' using errcode = '22023';
  end if;

  v_day_start := (p_local_date::text || ' 00:00:00')::timestamp at time zone v_business.timezone;
  v_day_end := v_day_start + interval '1 day';
  v_step := make_interval(mins => v_business.slot_interval_minutes);

  v_cursor := v_day_start;
  while v_cursor < v_day_end loop
    if p_staff_id is not null then
      begin
        perform public.booking_validate_public_slot(
          v_business.id,
          p_service_id,
          p_staff_id,
          v_cursor
        );
        return query select v_cursor, p_staff_id;
      exception
        when others then
          null;
      end;
    else
      for v_staff in
        select st.id
        from public.booking_staff st
        join public.booking_staff_services ss on ss.staff_id = st.id and ss.service_id = p_service_id
        where st.business_id = v_business.id
          and st.is_active = true
          and st.accepts_online_bookings = true
      loop
        begin
          perform public.booking_validate_public_slot(
            v_business.id,
            p_service_id,
            v_staff.id,
            v_cursor
          );
          return query select v_cursor, v_staff.id;
        exception
          when others then
            null;
        end;
      end loop;
    end if;
    v_cursor := v_cursor + v_step;
  end loop;
end;
$$;

revoke all on function public.booking_public_list_services(text) from public;
grant execute on function public.booking_public_list_services(text) to anon, authenticated;

revoke all on function public.booking_public_list_staff_for_service(text, uuid) from public;
grant execute on function public.booking_public_list_staff_for_service(text, uuid) to anon, authenticated;

revoke all on function public.booking_public_list_day_slots(text, uuid, uuid, date) from public;
grant execute on function public.booking_public_list_day_slots(text, uuid, uuid, date) to anon, authenticated;

comment on function public.booking_public_list_day_slots is
  'Returns UTC starts_at for slots passing booking_validate_public_slot on p_local_date (business TZ). p_staff_id null = any eligible staff.';
