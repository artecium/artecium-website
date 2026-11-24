-- Artecium Booking — Phase 2 (v2.3): RLS scope for professional members
-- Prerequisite: 021_booking_member_role_phase1_meta.sql
-- Does NOT change appointment writes, public RPCs, provision, or Phase 7 staff removal.

-- ---------------------------------------------------------------------------
-- Internal customer notes (manager/owner only — not readable via booking_customers)
-- ---------------------------------------------------------------------------

-- Composite FK target: UNIQUE (id, business_id) in column order. Never DROP existing constraints.
do $$
declare
  v_customers_oid oid := to_regclass('public.booking_customers');
  v_id_attnum smallint;
  v_biz_attnum smallint;
  v_expected_attnums smallint[];
  v_named_contype "char";
  v_named_conkey smallint[];
  v_equivalent_exists boolean;
begin
  if v_customers_oid is null then
    raise exception 'public.booking_customers not found (apply 012 first)' using errcode = '42P01';
  end if;

  select a.attnum
  into v_id_attnum
  from pg_catalog.pg_attribute a
  where a.attrelid = v_customers_oid
    and a.attname = 'id'
    and not a.attisdropped;

  select a.attnum
  into v_biz_attnum
  from pg_catalog.pg_attribute a
  where a.attrelid = v_customers_oid
    and a.attname = 'business_id'
    and not a.attisdropped;

  if v_id_attnum is null or v_biz_attnum is null then
    raise exception 'booking_customers missing id or business_id column' using errcode = '42703';
  end if;

  v_expected_attnums := array[v_id_attnum, v_biz_attnum];

  select con.contype, con.conkey
  into v_named_contype, v_named_conkey
  from pg_catalog.pg_constraint con
  where con.conrelid = v_customers_oid
    and con.conname = 'booking_customers_id_business_key';

  if found then
    if v_named_contype is distinct from 'u'
      or v_named_conkey is distinct from v_expected_attnums then
      raise exception
        'booking_customers_id_business_key exists but is not UNIQUE (id, business_id) in order — manual review required'
        using errcode = '23505';
    end if;
  else
    select exists (
      select 1
      from pg_catalog.pg_constraint con
      where con.conrelid = v_customers_oid
        and con.contype = 'u'
        and con.conkey = v_expected_attnums
    )
    into v_equivalent_exists;

    if not v_equivalent_exists then
      alter table public.booking_customers
        add constraint booking_customers_id_business_key unique (id, business_id);
    end if;
  end if;
end;
$$;

create table if not exists public.booking_customer_internal_notes (
  customer_id uuid primary key references public.booking_customers(id) on delete cascade,
  business_id uuid not null,
  notes text,
  updated_at timestamptz not null default now(),
  constraint booking_customer_internal_notes_customer_business_fkey
    foreign key (customer_id, business_id)
    references public.booking_customers (id, business_id)
    on delete cascade
);

create index if not exists idx_booking_customer_internal_notes_business
  on public.booking_customer_internal_notes (business_id);

insert into public.booking_customer_internal_notes (customer_id, business_id, notes)
select c.id, c.business_id, c.notes
from public.booking_customers c
where c.notes is not null
  and trim(c.notes) <> ''
on conflict (customer_id) do update
  set notes = excluded.notes,
      business_id = excluded.business_id,
      updated_at = now();

alter table public.booking_customers
  drop column if exists notes;

create or replace function public.booking_trg_customer_internal_notes_business_match()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_customer_business uuid;
begin
  select c.business_id into v_customer_business
  from public.booking_customers c
  where c.id = new.customer_id;

  if v_customer_business is null then
    raise exception 'customer not found for internal note' using errcode = '23503';
  end if;

  -- Always derive tenant from customer; ignore client-supplied business_id (RLS enforces manage).
  new.business_id := v_customer_business;
  return new;
end;
$$;

drop trigger if exists booking_customer_internal_notes_business_match
  on public.booking_customer_internal_notes;

create trigger booking_customer_internal_notes_business_match
  before insert or update
  on public.booking_customer_internal_notes
  for each row execute function public.booking_trg_customer_internal_notes_business_match();

alter table public.booking_customer_internal_notes enable row level security;

revoke all on public.booking_customer_internal_notes from anon, public;
grant select, insert, update, delete on public.booking_customer_internal_notes to authenticated;
grant select, insert, update, delete on public.booking_customer_internal_notes to service_role;

drop policy if exists "Booking manage customer internal notes" on public.booking_customer_internal_notes;
create policy "Booking manage customer internal notes" on public.booking_customer_internal_notes
  for all to authenticated
  using (
    public.booking_can_manage_business(booking_customer_internal_notes.business_id)
  )
  with check (
    public.booking_can_manage_business(booking_customer_internal_notes.business_id)
    and exists (
      select 1
      from public.booking_customers c
      where c.id = booking_customer_internal_notes.customer_id
        and c.business_id = booking_customer_internal_notes.business_id
    )
  );

comment on table public.booking_customer_internal_notes is
  'Internal CRM notes for customers. Professionals cannot SELECT this table (manage-only RLS).';

-- ---------------------------------------------------------------------------
-- Member-safe views (time_off.label omitted on colleague paths via RPC / availability view)
-- ---------------------------------------------------------------------------

create or replace view public.booking_customers_member
with (security_invoker = true)
as
select
  id,
  business_id,
  full_name,
  email,
  phone,
  profile_id,
  created_at,
  updated_at
from public.booking_customers;

comment on view public.booking_customers_member is
  'Customer member listing (no internal notes column on booking_customers).';

create or replace view public.booking_time_off_availability
with (security_invoker = true)
as
select
  id,
  staff_id,
  starts_at,
  ends_at
from public.booking_time_off;

comment on view public.booking_time_off_availability is
  'Time off blocks without label. RLS on booking_time_off applies.';

grant select on public.booking_customers_member to authenticated;
grant select on public.booking_time_off_availability to authenticated;

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER; EXECUTE required for RLS policy evaluation)
-- ---------------------------------------------------------------------------
-- PostgreSQL evaluates RLS policies as the querying role (authenticated). Each SQL and
-- PL/pgSQL function referenced in a policy expression requires EXECUTE for that role,
-- even when the function is SECURITY DEFINER (definer applies inside the function body).
-- These helpers return booleans or membership data only; they must not leak row payloads.

create or replace function public.booking_member_role_normalized(p_business_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select public.booking_normalize_member_role_text(bm.role)
  from public.booking_business_members bm
  where bm.business_id = p_business_id
    and bm.user_id = auth.uid()
  limit 1;
$$;

comment on function public.booking_member_role_normalized(uuid) is
  'Normalized member role for auth.uid() in business (020 staff → professional).';

create or replace function public.booking_is_professional_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    when public.booking_is_platform_admin() then false
    else coalesce(
      public.booking_member_role_normalized(p_business_id) = 'professional',
      false
    )
  end;
$$;

create or replace function public.booking_staff_ids_for_auth_user(p_business_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.booking_staff s
  where s.business_id = p_business_id
    and s.profile_id = auth.uid()
    and public.booking_can_access_business(p_business_id);
$$;

create or replace function public.booking_can_read_full_appointment(
  p_business_id uuid,
  p_staff_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    when public.booking_is_platform_admin() then true
    when public.booking_can_manage_business(p_business_id) then true
    when public.booking_is_professional_member(p_business_id)
      and p_staff_id in (
        select public.booking_staff_ids_for_auth_user(p_business_id)
      ) then true
    else false
  end;
$$;

create or replace function public.booking_can_read_time_off_row(p_staff_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.booking_staff s
    where s.id = p_staff_id
      and (
        public.booking_can_manage_business(s.business_id)
        or (
          public.booking_is_professional_member(s.business_id)
          and s.id in (
            select public.booking_staff_ids_for_auth_user(s.business_id)
          )
        )
      )
  );
$$;

revoke all on function public.booking_member_role_normalized(uuid) from public;
revoke all on function public.booking_is_professional_member(uuid) from public;
revoke all on function public.booking_staff_ids_for_auth_user(uuid) from public;
revoke all on function public.booking_can_read_full_appointment(uuid, uuid) from public;
revoke all on function public.booking_can_read_time_off_row(uuid) from public;

grant execute on function public.booking_member_role_normalized(uuid) to authenticated;
grant execute on function public.booking_is_professional_member(uuid) to authenticated;
grant execute on function public.booking_staff_ids_for_auth_user(uuid) to authenticated;
grant execute on function public.booking_can_read_full_appointment(uuid, uuid) to authenticated;
grant execute on function public.booking_can_read_time_off_row(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Subscriptions: owner/manager only
-- ---------------------------------------------------------------------------

drop policy if exists "Booking read subscriptions" on public.booking_business_subscriptions;
create policy "Booking read subscriptions" on public.booking_business_subscriptions
  for select to authenticated
  using (public.booking_can_manage_business(business_id));

-- "Booking manage subscriptions" (platform admin) unchanged

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------

drop policy if exists "Booking read appointments" on public.booking_appointments;
create policy "Booking read appointments" on public.booking_appointments
  for select to authenticated
  using (
    public.booking_can_read_full_appointment(business_id, staff_id)
  );

-- "Booking write appointments" unchanged (FOR ALL + manage)

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

drop policy if exists "Booking read customers" on public.booking_customers;
create policy "Booking read customers" on public.booking_customers
  for select to authenticated
  using (
    public.booking_can_manage_business(business_id)
    or (
      public.booking_is_professional_member(business_id)
      and exists (
        select 1
        from public.booking_appointments a
        where a.business_id = booking_customers.business_id
          and a.customer_id = booking_customers.id
          and a.staff_id in (
            select public.booking_staff_ids_for_auth_user(booking_customers.business_id)
          )
      )
    )
  );

-- write policy unchanged

-- ---------------------------------------------------------------------------
-- Time off: managers all rows; professionals only linked staff (own label on base table)
-- ---------------------------------------------------------------------------

drop policy if exists "Booking read time off" on public.booking_time_off;
create policy "Booking read time off" on public.booking_time_off
  for select to authenticated
  using (public.booking_can_read_time_off_row(staff_id));

-- write policies unchanged

-- ---------------------------------------------------------------------------
-- Shared validation for member availability RPCs (internal; no authenticated EXECUTE)
-- ---------------------------------------------------------------------------

create or replace function public.booking_assert_member_availability_request(
  p_business_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz,
  p_staff_ids uuid[] default null
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_max_interval constant interval := interval '31 days';
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_range_start is null or p_range_end is null then
    raise exception 'range bounds required' using errcode = '22023';
  end if;

  if p_range_start >= p_range_end then
    raise exception 'invalid range' using errcode = '22023';
  end if;

  if p_range_end - p_range_start > v_max_interval then
    raise exception 'range exceeds maximum allowed window' using errcode = '22023';
  end if;

  if not public.booking_can_access_business(p_business_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_staff_ids is not null and cardinality(p_staff_ids) = 0 then
    raise exception 'staff_ids must not be empty when provided' using errcode = '22023';
  end if;

  if p_staff_ids is not null then
    if exists (
      select 1
      from (
        select distinct unnest(p_staff_ids) as sid
      ) u
      where not exists (
        select 1
        from public.booking_staff s
        where s.id = u.sid
          and s.business_id = p_business_id
      )
    ) then
      raise exception 'invalid staff_ids for business' using errcode = '22023';
    end if;
  end if;
end;
$$;

revoke all on function public.booking_assert_member_availability_request(uuid, timestamptz, timestamptz, uuid[]) from public;

-- Staff filter for availability RPCs:
--   p_staff_ids NULL  → colleagues only (exclude all staff linked to auth.uid())
--   p_staff_ids set   → exactly those ids (must belong to business; may include own staff)

create or replace function public.booking_member_availability_staff_allowed(
  p_business_id uuid,
  p_staff_id uuid,
  p_staff_ids uuid[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_staff_ids is not null then
      p_staff_id in (select distinct unnest(p_staff_ids))
    else
      p_staff_id not in (
        select public.booking_staff_ids_for_auth_user(p_business_id)
      )
  end;
$$;

revoke all on function public.booking_member_availability_staff_allowed(uuid, uuid, uuid[]) from public;

-- ---------------------------------------------------------------------------
-- Colleague appointment busy intervals (VOLATILE: row-by-row cap; no temp tables)
-- ---------------------------------------------------------------------------

create or replace function public.booking_list_member_staff_busy_intervals(
  p_business_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz,
  p_staff_ids uuid[] default null
)
returns table (
  staff_id uuid,
  blocked_starts_at timestamptz,
  blocked_ends_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_max_rows constant int := 2000;
  v_count int := 0;
  r record;
begin
  perform public.booking_assert_member_availability_request(
    p_business_id,
    p_range_start,
    p_range_end,
    p_staff_ids
  );

  for r in
    select
      a.staff_id as sid,
      a.blocked_starts_at as b_start,
      a.blocked_ends_at as b_end
    from public.booking_appointments a
    where a.business_id = p_business_id
      and a.status in ('pending', 'confirmed')
      and a.blocked_starts_at < p_range_end
      and a.blocked_ends_at > p_range_start
      and public.booking_member_availability_staff_allowed(
        p_business_id,
        a.staff_id,
        p_staff_ids
      )
    order by a.staff_id, a.blocked_starts_at
    limit 2001
  loop
    v_count := v_count + 1;
    if v_count > v_max_rows then
      raise exception 'result set too large; narrow range or staff_ids' using errcode = '22023';
    end if;
    staff_id := r.sid;
    blocked_starts_at := r.b_start;
    blocked_ends_at := r.b_end;
    return next;
  end loop;
end;
$$;

comment on function public.booking_list_member_staff_busy_intervals(uuid, timestamptz, timestamptz, uuid[]) is
  'Member busy intervals (buffers included). Max 31d window, 2000 rows. NULL staff_ids = colleagues only.';

-- ---------------------------------------------------------------------------
-- Colleague time off (no label) — same staff filter semantics as busy RPC
-- ---------------------------------------------------------------------------

create or replace function public.booking_list_member_staff_time_off_intervals(
  p_business_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz,
  p_staff_ids uuid[] default null
)
returns table (
  staff_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_max_rows constant int := 2000;
  v_count int := 0;
  r record;
begin
  perform public.booking_assert_member_availability_request(
    p_business_id,
    p_range_start,
    p_range_end,
    p_staff_ids
  );

  for r in
    select
      t.staff_id as sid,
      t.starts_at as t_start,
      t.ends_at as t_end
    from public.booking_time_off t
    inner join public.booking_staff s on s.id = t.staff_id
    where s.business_id = p_business_id
      and t.starts_at < p_range_end
      and t.ends_at > p_range_start
      and public.booking_member_availability_staff_allowed(
        p_business_id,
        t.staff_id,
        p_staff_ids
      )
    order by t.staff_id, t.starts_at
    limit 2001
  loop
    v_count := v_count + 1;
    if v_count > v_max_rows then
      raise exception 'result set too large; narrow range or staff_ids' using errcode = '22023';
    end if;
    staff_id := r.sid;
    starts_at := r.t_start;
    ends_at := r.t_end;
    return next;
  end loop;
end;
$$;

comment on function public.booking_list_member_staff_time_off_intervals(uuid, timestamptz, timestamptz, uuid[]) is
  'Member time off blocks without label. Same window/row limits and staff filter as busy RPC.';

revoke all on function public.booking_list_member_staff_busy_intervals(uuid, timestamptz, timestamptz, uuid[]) from public;
grant execute on function public.booking_list_member_staff_busy_intervals(uuid, timestamptz, timestamptz, uuid[]) to authenticated;

revoke all on function public.booking_list_member_staff_time_off_intervals(uuid, timestamptz, timestamptz, uuid[]) from public;
grant execute on function public.booking_list_member_staff_time_off_intervals(uuid, timestamptz, timestamptz, uuid[]) to authenticated;
