-- Artecium Platform — hardening & production readiness
-- Run AFTER 001_initial_schema.sql and 002_services_plans_subscriptions.sql
-- Idempotent where possible. Extends existing tables; does not recreate them.

-- ===========================================================================
-- Staff ↔ company assignments (scoped access for collaborators)
-- Must exist before staff_can_access_company() helper.
-- ===========================================================================

create table if not exists public.staff_company_assignments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role_hint text,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create index if not exists idx_staff_company_assignments_company
  on public.staff_company_assignments(company_id);

-- ===========================================================================
-- RLS helper functions (security definer, stable)
-- ===========================================================================

create or replace function public.is_staff_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug in (
        'owner', 'admin', 'project_manager', 'developer', 'designer',
        'seo', 'analytics', 'support', 'finance'
      )
  );
$$;

create or replace function public.is_owner_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug in ('owner', 'admin')
  );
$$;

create or replace function public.user_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.company_users
  where user_id = auth.uid();
$$;

create or replace function public.staff_can_access_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.is_owner_or_admin() then true
    when not public.is_staff_member() then false
    when exists (
      select 1 from public.staff_company_assignments sca
      where sca.user_id = auth.uid()
    ) then exists (
      select 1 from public.staff_company_assignments sca
      where sca.user_id = auth.uid() and sca.company_id = p_company_id
    )
    else true
  end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- Payment providers (PSP customer references — no card data)
-- ===========================================================================

create table if not exists public.company_payment_providers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  provider_customer_id text not null,
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider)
);

create index if not exists idx_company_payment_providers_company
  on public.company_payment_providers(company_id);

-- ===========================================================================
-- Payment & invoice status history
-- ===========================================================================

create table if not exists public.payment_status_history (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_status_history_payment
  on public.payment_status_history(payment_id, created_at desc);

create table if not exists public.invoice_status_history (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoice_status_history_invoice
  on public.invoice_status_history(invoice_id, created_at desc);

-- ===========================================================================
-- Subscription change history
-- ===========================================================================

create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.client_subscriptions(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created', 'plan_changed', 'status_changed',
      'cancelled', 'reactivated', 'paused', 'resumed', 'expired'
    )),
  from_plan_id uuid references public.service_plans(id) on delete set null,
  to_plan_id uuid references public.service_plans(id) on delete set null,
  from_status text,
  to_status text,
  reason text,
  changed_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscription_history_subscription
  on public.subscription_history(subscription_id, created_at desc);
create index if not exists idx_subscription_history_company
  on public.subscription_history(company_id, created_at desc);

-- ===========================================================================
-- Project milestones
-- ===========================================================================

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  completed_at timestamptz,
  sort_order int not null default 0,
  responsible_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_milestones_project
  on public.project_milestones(project_id, sort_order);

-- ===========================================================================
-- Notification preferences
-- ===========================================================================

create table if not exists public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null
    check (category in (
      'project_updates', 'payments', 'invoices', 'support',
      'reports', 'meetings', 'system', 'marketing'
    )),
  channel text not null
    check (channel in ('email', 'in_app', 'sms', 'whatsapp')),
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, category, channel)
);

-- ===========================================================================
-- AI / automation configuration (future-ready, no runtime logic yet)
-- ===========================================================================

create table if not exists public.automation_configs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  slug text not null,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_automation_configs_company
  on public.automation_configs(company_id);
create index if not exists idx_automation_configs_project
  on public.automation_configs(project_id);

-- ===========================================================================
-- Extend: companies & contacts
-- ===========================================================================

alter table public.companies
  add column if not exists deleted_at timestamptz;

alter table public.company_users
  add column if not exists contact_role text
    check (contact_role is null or contact_role in (
      'owner', 'billing', 'technical', 'general'
    ));

alter table public.contacts
  add column if not exists contact_type text
    check (contact_type is null or contact_type in (
      'owner', 'billing', 'technical', 'general'
    )),
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists is_primary boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- ===========================================================================
-- Extend: payments & payment_methods
-- ===========================================================================

alter table public.payment_methods
  add column if not exists provider_customer_id text,
  add column if not exists brand text,
  add column if not exists exp_month smallint,
  add column if not exists exp_year smallint,
  add column if not exists is_active boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.payments
  add column if not exists payment_method_id uuid references public.payment_methods(id) on delete set null,
  add column if not exists provider_payment_intent_id text,
  add column if not exists transaction_reference text,
  add column if not exists refunded_amount numeric(12,2) not null default 0,
  add column if not exists failure_code text,
  add column if not exists failure_message text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_payments_company_status
  on public.payments(company_id, status);
create index if not exists idx_payments_invoice
  on public.payments(invoice_id);
create index if not exists idx_payments_subscription
  on public.payments(subscription_id);
create index if not exists idx_payments_created_at
  on public.payments(created_at desc);

-- ===========================================================================
-- Extend: invoices
-- ===========================================================================

alter table public.invoices
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists paid_at timestamptz,
  add column if not exists provider_invoice_id text,
  add column if not exists notes text,
  add column if not exists sent_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists discount_id uuid references public.discounts(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_invoices_company_status
  on public.invoices(company_id, status);
create index if not exists idx_invoices_due_date
  on public.invoices(due_date);
create index if not exists idx_invoices_subscription
  on public.invoices(subscription_id);

-- ===========================================================================
-- Extend: client_subscriptions
-- ===========================================================================

alter table public.client_subscriptions
  add column if not exists trial_ends_at timestamptz,
  add column if not exists provider_subscription_id text,
  add column if not exists cancellation_reason text,
  add column if not exists reactivated_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_client_subscriptions_status
  on public.client_subscriptions(status);
create index if not exists idx_client_subscriptions_period_end
  on public.client_subscriptions(current_period_end);

-- ===========================================================================
-- Extend: projects & tasks
-- ===========================================================================

alter table public.projects
  add column if not exists contract_value numeric(12,2),
  add column if not exists estimated_budget numeric(12,2),
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists internal_notes text,
  add column if not exists client_notes text,
  add column if not exists expected_completion_date date,
  add column if not exists deleted_at timestamptz;

alter table public.tasks
  add column if not exists milestone_id uuid references public.project_milestones(id) on delete set null,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists completed_at timestamptz,
  add column if not exists estimated_minutes int,
  add column if not exists actual_minutes int;

create index if not exists idx_projects_company_status
  on public.projects(company_id, status_id);
create index if not exists idx_projects_deleted_at
  on public.projects(deleted_at) where deleted_at is null;
create index if not exists idx_tasks_project_status
  on public.tasks(project_id, status);
create index if not exists idx_tasks_assignee
  on public.tasks(assignee_id);

-- ===========================================================================
-- Extend: support tickets
-- ===========================================================================

alter table public.tickets
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null,
  add column if not exists channel text
    check (channel is null or channel in ('email', 'whatsapp', 'phone', 'portal')),
  add column if not exists sla_response_target_minutes int,
  add column if not exists first_response_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists closed_at timestamptz;

create index if not exists idx_tickets_company_status
  on public.tickets(company_id, status);
create index if not exists idx_tickets_assignee
  on public.tickets(assignee_id);

-- ===========================================================================
-- Extend: documents
-- ===========================================================================

alter table public.documents
  add column if not exists visibility text not null default 'client_visible'
    check (visibility in ('client_visible', 'internal_only')),
  add column if not exists document_type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create index if not exists idx_documents_company_visibility
  on public.documents(company_id, visibility) where deleted_at is null;

-- ===========================================================================
-- Extend: analytics & SEO connections
-- ===========================================================================

alter table public.analytics_connections
  add column if not exists account_id text,
  add column if not exists display_name text,
  add column if not exists last_sync_at timestamptz,
  add column if not exists secret_reference text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.seo_connections
  add column if not exists display_name text,
  add column if not exists property_identifier text,
  add column if not exists last_sync_at timestamptz,
  add column if not exists secret_reference text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_analytics_connections_company
  on public.analytics_connections(company_id, status);
create index if not exists idx_seo_connections_company
  on public.seo_connections(company_id, status);

-- ===========================================================================
-- Extend: domains, hosting, integrations
-- ===========================================================================

alter table public.domains
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists dns_status text,
  add column if not exists ssl_status text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.hosting
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists environment text,
  add column if not exists uptime_percent numeric(5,2),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.integration_connections
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists last_sync_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_domains_company
  on public.domains(company_id);
create index if not exists idx_domains_project
  on public.domains(project_id);
create index if not exists idx_hosting_company
  on public.hosting(company_id);

-- ===========================================================================
-- Extend: activity_logs (audit)
-- ===========================================================================

alter table public.activity_logs
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_activity_logs_company
  on public.activity_logs(company_id, created_at desc);
create index if not exists idx_activity_logs_entity
  on public.activity_logs(entity_type, entity_id);
create index if not exists idx_activity_logs_actor
  on public.activity_logs(actor_id, created_at desc);

-- ===========================================================================
-- Extend: reports & notifications
-- ===========================================================================

alter table public.reports
  add column if not exists visibility text not null default 'client_visible'
    check (visibility in ('client_visible', 'internal_only')),
  add column if not exists updated_at timestamptz not null default now();

alter table public.notifications
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists category text;

create index if not exists idx_notifications_user_read
  on public.notifications(user_id, read_at);
create index if not exists idx_notifications_company
  on public.notifications(company_id, created_at desc);

-- ===========================================================================
-- Support feature: phone_support (Business plan entitlement)
-- ===========================================================================

insert into public.service_features (slug, name, value_type, category, sort_order) values
  ('phone_support', 'Phone support', 'boolean', 'support', 20)
on conflict (slug) do nothing;

do $$
declare
  v_business uuid;
  v_phone uuid;
begin
  select sp.id into v_business
  from public.service_plans sp
  join public.services s on s.id = sp.service_id
  where s.slug = 'maintenance' and sp.slug = 'business';

  select id into v_phone from public.service_features where slug = 'phone_support';

  if v_business is not null and v_phone is not null then
    insert into public.service_plan_features (service_plan_id, feature_id)
    values (v_business, v_phone)
    on conflict (service_plan_id, feature_id) do nothing;
  end if;
end $$;

-- ===========================================================================
-- Triggers: subscription history & updated_at
-- ===========================================================================

create or replace function public.log_subscription_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event text;
begin
  if tg_op = 'INSERT' then
    insert into public.subscription_history (
      subscription_id, company_id, event_type,
      to_plan_id, to_status, changed_by
    ) values (
      new.id, new.company_id, 'created',
      new.service_plan_id, new.status, auth.uid()
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.service_plan_id is distinct from new.service_plan_id then
      insert into public.subscription_history (
        subscription_id, company_id, event_type,
        from_plan_id, to_plan_id, from_status, to_status,
        reason, changed_by
      ) values (
        new.id, new.company_id, 'plan_changed',
        old.service_plan_id, new.service_plan_id,
        old.status, new.status,
        new.cancellation_reason, auth.uid()
      );
    elsif old.status is distinct from new.status then
      v_event := case new.status
        when 'cancelled' then 'cancelled'
        when 'active' then case when old.status = 'cancelled' then 'reactivated' when old.status = 'paused' then 'resumed' else 'status_changed' end
        when 'paused' then 'paused'
        when 'expired' then 'expired'
        else 'status_changed'
      end;
      insert into public.subscription_history (
        subscription_id, company_id, event_type,
        from_plan_id, to_plan_id, from_status, to_status,
        reason, changed_by
      ) values (
        new.id, new.company_id, v_event,
        old.service_plan_id, new.service_plan_id,
        old.status, new.status,
        new.cancellation_reason, auth.uid()
      );
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_subscription_history on public.client_subscriptions;
create trigger trg_subscription_history
  after insert or update on public.client_subscriptions
  for each row execute function public.log_subscription_change();

-- updated_at triggers (idempotent)
do $$
declare
  t text;
begin
  foreach t in array array[
    'payment_methods', 'payments', 'invoices', 'client_subscriptions',
    'projects', 'project_milestones', 'documents', 'contacts',
    'analytics_connections', 'seo_connections', 'domains', 'hosting',
    'integration_connections', 'company_payment_providers', 'automation_configs'
  ]
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ===========================================================================
-- Admin metrics views (derived, no redundant storage)
-- ===========================================================================

create or replace view public.v_active_subscription_mrr as
select
  cs.currency,
  cs.billing_period,
  count(*) as subscription_count,
  sum(
    case cs.billing_period
      when 'monthly' then coalesce(cs.price, 0)
      when 'quarterly' then coalesce(cs.price, 0) / 3
      when 'yearly' then coalesce(cs.price, 0) / 12
      else 0
    end
  ) as mrr
from public.client_subscriptions cs
where cs.status in ('active', 'trialing')
  and cs.deleted_at is null
group by cs.currency, cs.billing_period;

create or replace view public.v_outstanding_invoices as
select
  i.company_id,
  i.currency,
  count(*) filter (where i.status in ('issued', 'sent', 'viewed', 'partially_paid', 'overdue')) as open_count,
  coalesce(sum(greatest(i.total - i.amount_paid, 0)) filter (
    where i.status in ('issued', 'sent', 'viewed', 'partially_paid', 'overdue')
  ), 0) as outstanding_total
from public.invoices i
group by i.company_id, i.currency;

create or replace view public.v_support_workload as
select
  t.assignee_id,
  t.status,
  count(*) as ticket_count,
  count(*) filter (where t.first_response_at is null and t.status not in ('resolved', 'closed')) as awaiting_first_response
from public.tickets t
group by t.assignee_id, t.status;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

-- Enable RLS on tables not yet protected
alter table public.company_users enable row level security;
alter table public.contacts enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_status_history enable row level security;
alter table public.invoice_status_history enable row level security;
alter table public.company_payment_providers enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.analytics_connections enable row level security;
alter table public.analytics_data enable row level security;
alter table public.seo_connections enable row level security;
alter table public.seo_data enable row level security;
alter table public.reports enable row level security;
alter table public.meetings enable row level security;
alter table public.feedback enable row level security;
alter table public.tasks enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_members enable row level security;
alter table public.project_status_history enable row level security;
alter table public.activity_logs enable row level security;
alter table public.domains enable row level security;
alter table public.hosting enable row level security;
alter table public.ssl_certificates enable row level security;
alter table public.integration_connections enable row level security;
alter table public.staff_company_assignments enable row level security;
alter table public.subscription_history enable row level security;
alter table public.subscription_feature_overrides enable row level security;
alter table public.automation_configs enable row level security;

-- Profiles (extend)
drop policy if exists "Staff read profiles" on public.profiles;
create policy "Staff read profiles" on public.profiles
  for select to authenticated
  using (public.is_staff_member());

-- Companies
drop policy if exists "Company users read own companies" on public.companies;
create policy "Company users read own companies" on public.companies
  for select to authenticated
  using (
    id in (select public.user_company_ids())
    and deleted_at is null
  );

drop policy if exists "Staff read companies" on public.companies;
create policy "Staff read companies" on public.companies
  for select to authenticated
  using (public.is_staff_member() and deleted_at is null);

drop policy if exists "Staff manage companies" on public.companies;
create policy "Staff manage companies" on public.companies
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

-- Company users
drop policy if exists "Users read own company memberships" on public.company_users;
create policy "Users read own company memberships" on public.company_users
  for select to authenticated
  using (user_id = auth.uid() or public.staff_can_access_company(company_id));

drop policy if exists "Staff manage company users" on public.company_users;
create policy "Staff manage company users" on public.company_users
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

-- Projects
drop policy if exists "Company users read projects" on public.projects;
create policy "Company users read projects" on public.projects
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    and deleted_at is null
  );

drop policy if exists "Staff read projects" on public.projects;
create policy "Staff read projects" on public.projects
  for select to authenticated
  using (public.staff_can_access_company(company_id) and deleted_at is null);

drop policy if exists "Staff manage projects" on public.projects;
create policy "Staff manage projects" on public.projects
  for all to authenticated
  using (public.is_staff_member())
  with check (public.is_staff_member());

-- Client subscriptions (extend 002 — clients read-only)
drop policy if exists "Company insert subscriptions denied" on public.client_subscriptions;
-- clients cannot write; staff policy from 002 covers manage

drop policy if exists "Company read subscription entitlements" on public.subscription_entitlements;
create policy "Company read subscription entitlements" on public.subscription_entitlements
  for select to authenticated
  using (
    exists (
      select 1 from public.client_subscriptions cs
      where cs.id = subscription_id
        and cs.company_id in (select public.user_company_ids())
    )
    or public.is_staff_member()
  );

drop policy if exists "Staff read subscription history" on public.subscription_history;
create policy "Staff read subscription history" on public.subscription_history
  for select to authenticated
  using (public.staff_can_access_company(company_id));

drop policy if exists "Company read subscription history" on public.subscription_history;
create policy "Company read subscription history" on public.subscription_history
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage subscription history" on public.subscription_history;
create policy "Staff manage subscription history" on public.subscription_history
  for insert to authenticated
  with check (public.is_staff_member());

-- Invoices
drop policy if exists "Company read invoices" on public.invoices;
create policy "Company read invoices" on public.invoices
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage invoices" on public.invoices;
create policy "Staff manage invoices" on public.invoices
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- Invoice items (via invoice company)
drop policy if exists "Read invoice items" on public.invoice_items;
create policy "Read invoice items" on public.invoice_items
  for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (
          i.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(i.company_id)
        )
    )
  );

drop policy if exists "Staff manage invoice items" on public.invoice_items;
create policy "Staff manage invoice items" on public.invoice_items
  for all to authenticated
  using (public.is_staff_member())
  with check (public.is_staff_member());

-- Payments
drop policy if exists "Company read payments" on public.payments;
create policy "Company read payments" on public.payments
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage payments" on public.payments;
create policy "Staff manage payments" on public.payments
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- Payment methods (clients read own; staff manage)
drop policy if exists "Company read payment methods" on public.payment_methods;
create policy "Company read payment methods" on public.payment_methods
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage payment methods" on public.payment_methods;
create policy "Staff manage payment methods" on public.payment_methods
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- Payment / invoice status history
drop policy if exists "Staff read payment status history" on public.payment_status_history;
create policy "Staff read payment status history" on public.payment_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id and public.staff_can_access_company(p.company_id)
    )
  );

drop policy if exists "Company read payment status history" on public.payment_status_history;
create policy "Company read payment status history" on public.payment_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and p.company_id in (select public.user_company_ids())
    )
  );

drop policy if exists "Staff manage payment status history" on public.payment_status_history;
create policy "Staff manage payment status history" on public.payment_status_history
  for insert to authenticated
  with check (public.is_staff_member());

drop policy if exists "Staff read invoice status history" on public.invoice_status_history;
create policy "Staff read invoice status history" on public.invoice_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.staff_can_access_company(i.company_id)
    )
  );

drop policy if exists "Company read invoice status history" on public.invoice_status_history;
create policy "Company read invoice status history" on public.invoice_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and i.company_id in (select public.user_company_ids())
    )
  );

-- Documents (visibility enforced for clients)
drop policy if exists "Company read client documents" on public.documents;
create policy "Company read client documents" on public.documents
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    and visibility = 'client_visible'
    and deleted_at is null
  );

drop policy if exists "Staff read documents" on public.documents;
create policy "Staff read documents" on public.documents
  for select to authenticated
  using (public.staff_can_access_company(company_id) and deleted_at is null);

drop policy if exists "Staff manage documents" on public.documents;
create policy "Staff manage documents" on public.documents
  for all to authenticated
  using (public.is_staff_member())
  with check (public.is_staff_member());

-- Support tickets
drop policy if exists "Company read tickets" on public.tickets;
create policy "Company read tickets" on public.tickets
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Company create tickets" on public.tickets;
create policy "Company create tickets" on public.tickets
  for insert to authenticated
  with check (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage tickets" on public.tickets;
create policy "Staff manage tickets" on public.tickets
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- Ticket messages
drop policy if exists "Read ticket messages" on public.ticket_messages;
create policy "Read ticket messages" on public.ticket_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          t.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(t.company_id)
        )
    )
  );

drop policy if exists "Insert ticket messages" on public.ticket_messages;
create policy "Insert ticket messages" on public.ticket_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          t.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(t.company_id)
        )
    )
  );

-- Analytics & SEO (company-scoped)
drop policy if exists "Company read analytics connections" on public.analytics_connections;
create policy "Company read analytics connections" on public.analytics_connections
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage analytics connections" on public.analytics_connections;
create policy "Staff manage analytics connections" on public.analytics_connections
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

drop policy if exists "Read analytics data" on public.analytics_data;
create policy "Read analytics data" on public.analytics_data
  for select to authenticated
  using (
    exists (
      select 1 from public.analytics_connections ac
      where ac.id = connection_id
        and (
          ac.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(ac.company_id)
        )
    )
  );

drop policy if exists "Company read seo connections" on public.seo_connections;
create policy "Company read seo connections" on public.seo_connections
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage seo connections" on public.seo_connections;
create policy "Staff manage seo connections" on public.seo_connections
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

drop policy if exists "Read seo data" on public.seo_data;
create policy "Read seo data" on public.seo_data
  for select to authenticated
  using (
    exists (
      select 1 from public.seo_connections sc
      where sc.id = connection_id
        and (
          sc.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(sc.company_id)
        )
    )
  );

-- Reports (visibility)
drop policy if exists "Company read client reports" on public.reports;
create policy "Company read client reports" on public.reports
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    and visibility = 'client_visible'
  );

drop policy if exists "Staff manage reports" on public.reports;
create policy "Staff manage reports" on public.reports
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- Notifications
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Staff manage notifications" on public.notifications;
create policy "Staff manage notifications" on public.notifications
  for insert to authenticated
  with check (public.is_staff_member());

-- Notification preferences
drop policy if exists "Users manage own notification preferences" on public.notification_preferences;
create policy "Users manage own notification preferences" on public.notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Activity logs (staff only — never expose to clients)
drop policy if exists "Staff read activity logs" on public.activity_logs;
create policy "Staff read activity logs" on public.activity_logs
  for select to authenticated
  using (public.is_staff_member());

drop policy if exists "Staff insert activity logs" on public.activity_logs;
create policy "Staff insert activity logs" on public.activity_logs
  for insert to authenticated
  with check (public.is_staff_member());

-- Project milestones & tasks
drop policy if exists "Read project milestones" on public.project_milestones;
create policy "Read project milestones" on public.project_milestones
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(p.company_id)
        )
        and p.deleted_at is null
    )
  );

drop policy if exists "Staff manage milestones" on public.project_milestones;
create policy "Staff manage milestones" on public.project_milestones
  for all to authenticated
  using (public.is_staff_member())
  with check (public.is_staff_member());

drop policy if exists "Read tasks" on public.tasks;
create policy "Read tasks" on public.tasks
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(p.company_id)
        )
    )
  );

drop policy if exists "Staff manage tasks" on public.tasks;
create policy "Staff manage tasks" on public.tasks
  for all to authenticated
  using (public.is_staff_member())
  with check (public.is_staff_member());

-- Staff company assignments
drop policy if exists "Staff read assignments" on public.staff_company_assignments;
create policy "Staff read assignments" on public.staff_company_assignments
  for select to authenticated
  using (user_id = auth.uid() or public.is_owner_or_admin());

drop policy if exists "Admin manage staff assignments" on public.staff_company_assignments;
create policy "Admin manage staff assignments" on public.staff_company_assignments
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

-- Automation configs (staff only for now)
drop policy if exists "Staff manage automation configs" on public.automation_configs;
create policy "Staff manage automation configs" on public.automation_configs
  for all to authenticated
  using (public.is_staff_member())
  with check (public.is_staff_member());

-- Domains & hosting
drop policy if exists "Company read domains" on public.domains;
create policy "Company read domains" on public.domains
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage domains" on public.domains;
create policy "Staff manage domains" on public.domains
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

drop policy if exists "Company read hosting" on public.hosting;
create policy "Company read hosting" on public.hosting
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage hosting" on public.hosting;
create policy "Staff manage hosting" on public.hosting
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- Integration connections
drop policy if exists "Company read integrations" on public.integration_connections;
create policy "Company read integrations" on public.integration_connections
  for select to authenticated
  using (
    company_id is null
    or company_id in (select public.user_company_ids())
  );

drop policy if exists "Staff manage integrations" on public.integration_connections;
create policy "Staff manage integrations" on public.integration_connections
  for all to authenticated
  using (
    company_id is null
    or public.staff_can_access_company(company_id)
  )
  with check (
    company_id is null
    or public.staff_can_access_company(company_id)
  );

-- Usage records: staff insert (clients read-only from 002)
drop policy if exists "Staff manage usage" on public.usage_records;
create policy "Staff manage usage" on public.usage_records
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));
