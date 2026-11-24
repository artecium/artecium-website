-- Minimal product schema for isolated phase2_harness PG tests (not for Supabase apply).
-- Satisfies 023 dependencies without full 001–022 chain.

create schema if not exists extensions;
create extension if not exists pgcrypto schema extensions;

-- Supabase-like API roles (embedded PG bootstrap only).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end;
$$;

create table if not exists public.booking_businesses (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  timezone text not null default 'Europe/Lisbon',
  default_locale text not null default 'pt-PT',
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_customers (
  id uuid primary key,
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  full_name text not null default 'fixture',
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create table if not exists public.booking_customer_internal_notes (
  customer_id uuid primary key references public.booking_customers(id) on delete cascade,
  business_id uuid not null,
  notes text,
  updated_at timestamptz not null default now(),
  constraint booking_customer_internal_notes_customer_business_fkey
    foreign key (customer_id, business_id) references public.booking_customers (id, business_id) on delete cascade
);
