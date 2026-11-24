-- Artecium Booking — foundation schema, RLS, overlap protection, public RPCs
-- Run AFTER 001–011
-- Does NOT alter agency tables (services, service_plans, meetings, etc.)

create extension if not exists btree_gist;

-- ===========================================================================
-- Tenant & membership
-- ===========================================================================

create table if not exists public.booking_businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  timezone text not null default 'Europe/Lisbon',
  default_locale text not null default 'pt-PT'
    check (default_locale in ('pt-PT', 'en')),
  currency text not null default 'EUR',
  confirmation_mode text not null default 'manual'
    check (confirmation_mode in ('automatic', 'manual')),
  company_id uuid references public.companies(id) on delete set null,
  public_description text,
  logo_url text,
  brand_color text,
  min_notice_minutes int not null default 60 check (min_notice_minutes >= 0),
  max_booking_days int not null default 60 check (max_booking_days >= 1),
  cancellation_notice_minutes int not null default 1440 check (cancellation_notice_minutes >= 0),
  allow_customer_reschedule boolean not null default false,
  slot_interval_minutes int not null default 15 check (slot_interval_minutes in (5, 10, 15, 20, 30, 60)),
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists idx_booking_businesses_slug_lower
  on public.booking_businesses (lower(slug));

create index if not exists idx_booking_businesses_company
  on public.booking_businesses (company_id)
  where company_id is not null;

create table if not exists public.booking_business_members (
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'staff'
    check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index if not exists idx_booking_business_members_user
  on public.booking_business_members (user_id);

-- Future plan gating (inactive until product enables checks)
create table if not exists public.booking_business_subscriptions (
  business_id uuid primary key references public.booking_businesses(id) on delete cascade,
  plan_slug text not null default 'trial',
  status text not null default 'inactive'
    check (status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- Catalog (booking services — NOT agency public.services)
-- ===========================================================================

create table if not exists public.booking_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 480),
  buffer_before_minutes int not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes int not null default 0 check (buffer_after_minutes >= 0),
  price_cents int check (price_cents is null or price_cents >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_services_business
  on public.booking_services (business_id, sort_order);

create table if not exists public.booking_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  email text,
  is_active boolean not null default true,
  accepts_online_bookings boolean not null default true,
  calendar_color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_staff_business
  on public.booking_staff (business_id, sort_order);

create index if not exists idx_booking_staff_profile
  on public.booking_staff (profile_id)
  where profile_id is not null;

create table if not exists public.booking_staff_services (
  staff_id uuid not null references public.booking_staff(id) on delete cascade,
  service_id uuid not null references public.booking_services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ===========================================================================
-- Schedules
-- ===========================================================================

create table if not exists public.booking_working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.booking_staff(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (start_time < end_time)
);

create index if not exists idx_booking_working_hours_staff
  on public.booking_working_hours (staff_id, day_of_week);

create table if not exists public.booking_staff_breaks (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.booking_staff(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (start_time < end_time)
);

create index if not exists idx_booking_staff_breaks_staff
  on public.booking_staff_breaks (staff_id, day_of_week);

create table if not exists public.booking_time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.booking_staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  label text,
  check (starts_at < ends_at)
);

create index if not exists idx_booking_time_off_staff_range
  on public.booking_time_off (staff_id, starts_at, ends_at);

-- ===========================================================================
-- Customers & appointments
-- ===========================================================================

create table if not exists public.booking_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_customers_business
  on public.booking_customers (business_id);

create unique index if not exists idx_booking_customers_business_email
  on public.booking_customers (business_id, lower(email))
  where email is not null and email <> '';

create table if not exists public.booking_appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  service_id uuid not null references public.booking_services(id) on delete restrict,
  staff_id uuid not null references public.booking_staff(id) on delete restrict,
  customer_id uuid references public.booking_customers(id) on delete set null,
  guest_name text,
  guest_email text,
  guest_phone text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  source text not null default 'public'
    check (source in ('public', 'staff')),
  public_reference text not null,
  idempotency_key text,
  manage_token_hash text,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'refunded', 'waived')),
  stripe_checkout_session_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check (
    customer_id is not null
    or (guest_name is not null and guest_name <> '')
  )
);

create unique index if not exists idx_booking_appointments_public_reference
  on public.booking_appointments (public_reference);

create unique index if not exists idx_booking_appointments_idempotency
  on public.booking_appointments (business_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_booking_appointments_business_starts
  on public.booking_appointments (business_id, starts_at);

create index if not exists idx_booking_appointments_staff_starts
  on public.booking_appointments (staff_id, starts_at);

-- Prevent overlapping active appointments for the same staff member
alter table public.booking_appointments
  drop constraint if exists booking_appointments_no_staff_overlap;

alter table public.booking_appointments
  add constraint booking_appointments_no_staff_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));

-- ===========================================================================
-- updated_at triggers
-- ===========================================================================

drop trigger if exists booking_businesses_set_updated_at on public.booking_businesses;
create trigger booking_businesses_set_updated_at
  before update on public.booking_businesses
  for each row execute function public.set_updated_at();

drop trigger if exists booking_services_set_updated_at on public.booking_services;
create trigger booking_services_set_updated_at
  before update on public.booking_services
  for each row execute function public.set_updated_at();

drop trigger if exists booking_staff_set_updated_at on public.booking_staff;
create trigger booking_staff_set_updated_at
  before update on public.booking_staff
  for each row execute function public.set_updated_at();

drop trigger if exists booking_customers_set_updated_at on public.booking_customers;
create trigger booking_customers_set_updated_at
  before update on public.booking_customers
  for each row execute function public.set_updated_at();

drop trigger if exists booking_appointments_set_updated_at on public.booking_appointments;
create trigger booking_appointments_set_updated_at
  before update on public.booking_appointments
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- RLS helpers (booking-specific; do not broaden agency staff access)
-- ===========================================================================

create or replace function public.booking_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_owner_or_admin();
$$;

create or replace function public.booking_member_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id
  from public.booking_business_members
  where user_id = auth.uid();
$$;

create or replace function public.booking_can_manage_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.booking_is_platform_admin() then true
    else exists (
      select 1
      from public.booking_business_members bm
      where bm.business_id = p_business_id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    )
  end;
$$;

create or replace function public.booking_can_access_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.booking_is_platform_admin() then true
    else exists (
      select 1
      from public.booking_business_members bm
      where bm.business_id = p_business_id
        and bm.user_id = auth.uid()
    )
  end;
$$;

-- ===========================================================================
-- RLS policies
-- ===========================================================================

alter table public.booking_businesses enable row level security;
alter table public.booking_business_members enable row level security;
alter table public.booking_business_subscriptions enable row level security;
alter table public.booking_services enable row level security;
alter table public.booking_staff enable row level security;
alter table public.booking_staff_services enable row level security;
alter table public.booking_working_hours enable row level security;
alter table public.booking_staff_breaks enable row level security;
alter table public.booking_time_off enable row level security;
alter table public.booking_customers enable row level security;
alter table public.booking_appointments enable row level security;

-- businesses
drop policy if exists "Booking members read businesses" on public.booking_businesses;
create policy "Booking members read businesses" on public.booking_businesses
  for select to authenticated
  using (public.booking_can_access_business(id));

drop policy if exists "Booking managers write businesses" on public.booking_businesses;
create policy "Booking managers write businesses" on public.booking_businesses
  for all to authenticated
  using (public.booking_can_manage_business(id))
  with check (public.booking_can_manage_business(id));

-- members
drop policy if exists "Booking members read membership" on public.booking_business_members;
create policy "Booking members read membership" on public.booking_business_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.booking_can_manage_business(business_id)
  );

drop policy if exists "Booking managers write membership" on public.booking_business_members;
create policy "Booking managers write membership" on public.booking_business_members
  for all to authenticated
  using (public.booking_can_manage_business(business_id))
  with check (public.booking_can_manage_business(business_id));

-- subscriptions (read/manage same as business)
drop policy if exists "Booking read subscriptions" on public.booking_business_subscriptions;
create policy "Booking read subscriptions" on public.booking_business_subscriptions
  for select to authenticated
  using (public.booking_can_access_business(business_id));

drop policy if exists "Booking manage subscriptions" on public.booking_business_subscriptions;
create policy "Booking manage subscriptions" on public.booking_business_subscriptions
  for all to authenticated
  using (public.booking_is_platform_admin())
  with check (public.booking_is_platform_admin());

-- child tables via business_id (services, staff, customers, appointments)
drop policy if exists "Booking read services" on public.booking_services;
create policy "Booking read services" on public.booking_services
  for select to authenticated
  using (public.booking_can_access_business(business_id));

drop policy if exists "Booking write services" on public.booking_services;
create policy "Booking write services" on public.booking_services
  for all to authenticated
  using (public.booking_can_manage_business(business_id))
  with check (public.booking_can_manage_business(business_id));

drop policy if exists "Booking read staff" on public.booking_staff;
create policy "Booking read staff" on public.booking_staff
  for select to authenticated
  using (public.booking_can_access_business(business_id));

drop policy if exists "Booking write staff" on public.booking_staff;
create policy "Booking write staff" on public.booking_staff
  for all to authenticated
  using (public.booking_can_manage_business(business_id))
  with check (public.booking_can_manage_business(business_id));

drop policy if exists "Booking read staff services" on public.booking_staff_services;
create policy "Booking read staff services" on public.booking_staff_services
  for select to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_access_business(s.business_id)
    )
  );

drop policy if exists "Booking write staff services" on public.booking_staff_services;
create policy "Booking write staff services" on public.booking_staff_services
  for all to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  );

-- working hours / breaks / time off via staff join
drop policy if exists "Booking read working hours" on public.booking_working_hours;
create policy "Booking read working hours" on public.booking_working_hours
  for select to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_access_business(s.business_id)
    )
  );

drop policy if exists "Booking write working hours" on public.booking_working_hours;
create policy "Booking write working hours" on public.booking_working_hours
  for all to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  );

drop policy if exists "Booking read staff breaks" on public.booking_staff_breaks;
create policy "Booking read staff breaks" on public.booking_staff_breaks
  for select to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_access_business(s.business_id)
    )
  );

drop policy if exists "Booking write staff breaks" on public.booking_staff_breaks;
create policy "Booking write staff breaks" on public.booking_staff_breaks
  for all to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  );

drop policy if exists "Booking read time off" on public.booking_time_off;
create policy "Booking read time off" on public.booking_time_off
  for select to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_access_business(s.business_id)
    )
  );

drop policy if exists "Booking write time off" on public.booking_time_off;
create policy "Booking write time off" on public.booking_time_off
  for all to authenticated
  using (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.booking_staff s
      where s.id = staff_id and public.booking_can_manage_business(s.business_id)
    )
  );

drop policy if exists "Booking read customers" on public.booking_customers;
create policy "Booking read customers" on public.booking_customers
  for select to authenticated
  using (public.booking_can_access_business(business_id));

drop policy if exists "Booking write customers" on public.booking_customers;
create policy "Booking write customers" on public.booking_customers
  for all to authenticated
  using (public.booking_can_manage_business(business_id))
  with check (public.booking_can_manage_business(business_id));

drop policy if exists "Booking read appointments" on public.booking_appointments;
create policy "Booking read appointments" on public.booking_appointments
  for select to authenticated
  using (public.booking_can_access_business(business_id));

drop policy if exists "Booking write appointments" on public.booking_appointments;
create policy "Booking write appointments" on public.booking_appointments
  for all to authenticated
  using (public.booking_can_manage_business(business_id))
  with check (public.booking_can_manage_business(business_id));

-- ===========================================================================
-- Grants (authenticated only; public access via RPC)
-- ===========================================================================

revoke all on public.booking_businesses from anon, public;
revoke all on public.booking_business_members from anon, public;
revoke all on public.booking_business_subscriptions from anon, public;
revoke all on public.booking_services from anon, public;
revoke all on public.booking_staff from anon, public;
revoke all on public.booking_staff_services from anon, public;
revoke all on public.booking_working_hours from anon, public;
revoke all on public.booking_staff_breaks from anon, public;
revoke all on public.booking_time_off from anon, public;
revoke all on public.booking_customers from anon, public;
revoke all on public.booking_appointments from anon, public;

grant select, insert, update, delete on public.booking_businesses to authenticated;
grant select, insert, update, delete on public.booking_business_members to authenticated;
grant select, insert, update, delete on public.booking_business_subscriptions to authenticated;
grant select, insert, update, delete on public.booking_services to authenticated;
grant select, insert, update, delete on public.booking_staff to authenticated;
grant select, insert, update, delete on public.booking_staff_services to authenticated;
grant select, insert, update, delete on public.booking_working_hours to authenticated;
grant select, insert, update, delete on public.booking_staff_breaks to authenticated;
grant select, insert, update, delete on public.booking_time_off to authenticated;
grant select, insert, update, delete on public.booking_customers to authenticated;
grant select, insert, update, delete on public.booking_appointments to authenticated;

grant execute on function public.booking_is_platform_admin() to authenticated;
grant execute on function public.booking_member_business_ids() to authenticated;
grant execute on function public.booking_can_manage_business(uuid) to authenticated;
grant execute on function public.booking_can_access_business(uuid) to authenticated;

-- ===========================================================================
-- Public RPCs (anon + authenticated): read-only business discovery & booking
-- ===========================================================================

create or replace function public.booking_public_get_business(p_slug text)
returns table (
  id uuid,
  slug text,
  name text,
  timezone text,
  default_locale text,
  currency text,
  confirmation_mode text,
  public_description text,
  logo_url text,
  brand_color text,
  min_notice_minutes int,
  max_booking_days int,
  slot_interval_minutes int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.slug,
    b.name,
    b.timezone,
    b.default_locale,
    b.currency,
    b.confirmation_mode,
    b.public_description,
    b.logo_url,
    b.brand_color,
    b.min_notice_minutes,
    b.max_booking_days,
    b.slot_interval_minutes
  from public.booking_businesses b
  where lower(b.slug) = lower(trim(p_slug))
    and b.is_active = true;
$$;

revoke all on function public.booking_public_get_business(text) from public;
grant execute on function public.booking_public_get_business(text) to anon, authenticated;

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

revoke all on function public.booking_public_create_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text
) from public;
grant execute on function public.booking_public_create_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text
) to anon, authenticated;

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
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  insert into public.booking_businesses (slug, name, timezone)
  values (lower(trim(p_slug)), trim(p_name), coalesce(nullif(trim(p_timezone), ''), 'Europe/Lisbon'))
  returning id into v_id;

  insert into public.booking_business_members (business_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  insert into public.booking_business_subscriptions (business_id)
  values (v_id)
  on conflict (business_id) do nothing;

  return v_id;
end;
$$;

revoke all on function public.booking_create_business_with_owner(text, text, text) from public;
grant execute on function public.booking_create_business_with_owner(text, text, text) to authenticated;

comment on schema public is
  '012: Artecium Booking foundation — booking_* tables, RLS, overlap constraint, public RPCs.';

-- ===========================================================================
-- VERIFICATION (manual, after apply on staging)
-- ===========================================================================
/*
-- Overlap constraint
-- Two confirmed appointments same staff overlapping should fail on second insert.

-- Tenant isolation (as two authenticated test users)
-- set role authenticated; set request.jwt.claim.sub = '...';
-- select * from booking_businesses; -- should only see member businesses

-- Public RPC
-- select * from booking_public_get_business('demo-salon');
*/
