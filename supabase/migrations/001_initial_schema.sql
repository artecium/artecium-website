-- Artecium Platform — initial Supabase schema
-- Run in Supabase SQL Editor or via Supabase CLI migrations

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles & permissions
-- ---------------------------------------------------------------------------

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  locale text not null default 'en',
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- ---------------------------------------------------------------------------
-- Companies (multi-company support)
-- ---------------------------------------------------------------------------

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  website text,
  locale text not null default 'en',
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_users (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role_title text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CRM / leads
-- ---------------------------------------------------------------------------

create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  company_name text,
  email text,
  phone text,
  service_interest text,
  source_id uuid references public.lead_sources(id) on delete set null,
  estimated_value numeric(12,2),
  status text not null default 'new',
  owner_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Services & plans
-- ---------------------------------------------------------------------------

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(12,2),
  currency text not null default 'EUR',
  billing_period text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_key text not null,
  feature_value text,
  sort_order int not null default 0
);

create table if not exists public.company_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'active',
  started_at timestamptz,
  ends_at timestamptz
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table if not exists public.project_statuses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  color text not null default '#2563EB',
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  description text,
  project_type text,
  status_id uuid references public.project_statuses(id) on delete set null,
  progress int not null default 0 check (progress between 0 and 100),
  owner_id uuid references public.profiles(id) on delete set null,
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  primary key (project_id, user_id)
);

create table if not exists public.project_status_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  from_status_id uuid references public.project_statuses(id) on delete set null,
  to_status_id uuid references public.project_statuses(id) on delete set null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  deliverable_type text not null,
  status text not null default 'pending',
  version int not null default 1,
  file_path text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  deliverable_id uuid references public.deliverables(id) on delete cascade,
  approved_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending',
  comment text,
  version int,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  deliverable_id uuid references public.deliverables(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  priority text not null default 'normal',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Proposals & contracts
-- ---------------------------------------------------------------------------

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  status text not null default 'draft',
  valid_until date,
  subtotal numeric(12,2),
  discount numeric(12,2),
  total numeric(12,2),
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  sort_order int not null default 0
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  title text not null,
  version int not null default 1,
  status text not null default 'draft',
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  signed_by uuid references public.profiles(id) on delete set null,
  signed_at timestamptz,
  signature_reference text,
  ip_address inet
);

-- ---------------------------------------------------------------------------
-- Finance (no card data stored)
-- ---------------------------------------------------------------------------

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_number text unique,
  status text not null default 'draft',
  issue_date date,
  due_date date,
  subtotal numeric(12,2),
  tax numeric(12,2),
  total numeric(12,2),
  currency text not null default 'EUR',
  pdf_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  provider_reference text,
  method_type text not null,
  last4 text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending',
  provider text,
  provider_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  description text,
  amount numeric(12,2),
  percentage numeric(5,2),
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  redeemed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Support & communication
-- ---------------------------------------------------------------------------

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  subject text not null,
  category text,
  priority text not null default 'normal',
  status text not null default 'new',
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_message_id uuid not null references public.ticket_messages(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications, meetings, feedback
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  meeting_url text,
  status text not null default 'scheduled',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Analytics, SEO, reports
-- ---------------------------------------------------------------------------

create table if not exists public.analytics_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null default 'google_analytics',
  property_id text,
  status text not null default 'inactive',
  connected_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_data (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.analytics_connections(id) on delete cascade,
  metric_date date not null,
  users int,
  sessions int,
  page_views int,
  conversions int,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.seo_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null default 'google_search_console',
  site_url text,
  status text not null default 'inactive',
  connected_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.seo_data (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.seo_connections(id) on delete cascade,
  metric_date date not null,
  clicks int,
  impressions int,
  ctr numeric(8,4),
  average_position numeric(8,2),
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  report_type text not null,
  title text not null,
  period_start date,
  period_end date,
  file_path text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documents & infrastructure
-- ---------------------------------------------------------------------------

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  category text not null,
  title text not null,
  file_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version int not null,
  file_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  domain text not null,
  registrar text,
  expires_at date,
  auto_renew boolean not null default false,
  status text not null default 'active'
);

create table if not exists public.hosting (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text,
  plan_name text,
  status text not null default 'active',
  renews_at date
);

create table if not exists public.ssl_certificates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  issuer text,
  expires_at date,
  status text not null default 'active'
);

-- ---------------------------------------------------------------------------
-- Integrations, partners, activity
-- ---------------------------------------------------------------------------

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text,
  is_active boolean not null default true
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  status text not null default 'inactive',
  config jsonb,
  secret_reference text,
  connected_at timestamptz
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  commission_rate numeric(5,2),
  status text not null default 'active'
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  status text not null default 'pending',
  commission_amount numeric(12,2),
  created_at timestamptz not null default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  paid_at timestamptz
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  key text not null,
  value jsonb not null,
  unique (scope, key)
);

-- ---------------------------------------------------------------------------
-- Seed roles, permissions, project statuses
-- ---------------------------------------------------------------------------

insert into public.roles (slug, name) values
  ('owner', 'Owner'),
  ('admin', 'Admin'),
  ('project_manager', 'Project Manager'),
  ('developer', 'Developer'),
  ('designer', 'Designer'),
  ('seo', 'SEO'),
  ('analytics', 'Analytics'),
  ('support', 'Support'),
  ('finance', 'Finance'),
  ('client', 'Client')
on conflict (slug) do nothing;

insert into public.project_statuses (slug, label, color, sort_order) values
  ('analysis', 'Em análise', '#64748B', 1),
  ('planning', 'Planeamento', '#6366F1', 2),
  ('design', 'Design', '#8B5CF6', 3),
  ('development', 'Em desenvolvimento', '#2563EB', 4),
  ('review', 'Em revisão', '#F59E0B', 5),
  ('testing', 'Em testes', '#14B8A6', 6),
  ('implementation', 'Em implementação', '#0EA5E9', 7),
  ('maintenance', 'Em manutenção', '#64748B', 8),
  ('paused', 'Pausado', '#94A3B8', 9),
  ('completed', 'Finalizado', '#22C55E', 10)
on conflict (slug) do nothing;

-- Profile bootstrap on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  client_role_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  select id into client_role_id from public.roles where slug = 'client' limit 1;
  if client_role_id is not null then
    insert into public.user_roles (user_id, role_id) values (new.id, client_role_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on all tables (policies to be refined per environment)
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.projects enable row level security;

-- Basic profile self-read policy
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
