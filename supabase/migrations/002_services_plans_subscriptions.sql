-- Artecium Platform — services, plans, subscriptions & entitlements
-- Run AFTER 001_initial_schema.sql
-- Idempotent where possible. Does not drop existing tables or data.

-- ---------------------------------------------------------------------------
-- Extend services (not all services have plans)
-- ---------------------------------------------------------------------------

alter table public.services
  add column if not exists has_plans boolean not null default false,
  add column if not exists billing_model text not null default 'custom',
  add column if not exists sort_order int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.services.billing_model is
  'subscription | one_time | custom — services without plans use custom/one_time';

create index if not exists idx_services_slug on public.services(slug);
create index if not exists idx_services_active on public.services(is_active);

-- ---------------------------------------------------------------------------
-- Feature catalog (stable slugs, quantitative limits supported)
-- ---------------------------------------------------------------------------

create table if not exists public.service_features (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  value_type text not null default 'boolean'
    check (value_type in ('boolean', 'numeric', 'text')),
  default_unit text,
  category text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Service plans (plans belong to a service; optional inheritance chain)
-- ---------------------------------------------------------------------------

create table if not exists public.service_plans (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  price numeric(12,2),
  currency text not null default 'EUR',
  billing_period text not null default 'monthly'
    check (billing_period in ('monthly', 'quarterly', 'yearly', 'one_time')),
  parent_plan_id uuid references public.service_plans(id) on delete set null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, slug)
);

create index if not exists idx_service_plans_service on public.service_plans(service_id);
create index if not exists idx_service_plans_parent on public.service_plans(parent_plan_id);

-- ---------------------------------------------------------------------------
-- Plan features (direct features per plan; inheritance resolved at query time)
-- ---------------------------------------------------------------------------

create table if not exists public.service_plan_features (
  id uuid primary key default gen_random_uuid(),
  service_plan_id uuid not null references public.service_plans(id) on delete cascade,
  feature_id uuid not null references public.service_features(id) on delete cascade,
  is_enabled boolean not null default true,
  limit_value numeric(14,4),
  limit_unit text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (service_plan_id, feature_id)
);

create index if not exists idx_service_plan_features_plan on public.service_plan_features(service_plan_id);

-- ---------------------------------------------------------------------------
-- Client subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  service_plan_id uuid references public.service_plans(id) on delete set null,
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  price numeric(12,2),
  currency text not null default 'EUR',
  billing_period text not null default 'monthly',
  started_at timestamptz not null default now(),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_subscriptions_company on public.client_subscriptions(company_id);
create index if not exists idx_client_subscriptions_service on public.client_subscriptions(service_id);

create table if not exists public.subscription_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.client_subscriptions(id) on delete cascade,
  feature_id uuid not null references public.service_features(id) on delete cascade,
  is_enabled boolean,
  limit_value numeric(14,4),
  limit_unit text,
  created_at timestamptz not null default now(),
  unique (subscription_id, feature_id)
);

create table if not exists public.subscription_entitlements (
  subscription_id uuid not null references public.client_subscriptions(id) on delete cascade,
  feature_id uuid not null references public.service_features(id) on delete cascade,
  feature_slug text not null,
  is_enabled boolean not null default true,
  limit_value numeric(14,4),
  limit_unit text,
  source text not null default 'plan'
    check (source in ('plan', 'override', 'addon')),
  refreshed_at timestamptz not null default now(),
  primary key (subscription_id, feature_id)
);

-- ---------------------------------------------------------------------------
-- Usage tracking
-- ---------------------------------------------------------------------------

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.client_subscriptions(id) on delete cascade,
  feature_id uuid not null references public.service_features(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  period_start date not null,
  period_end date not null,
  quantity_used numeric(14,4) not null default 0,
  unit text not null,
  description text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_usage_records_subscription_period
  on public.usage_records(subscription_id, feature_id, period_start, period_end);

-- ---------------------------------------------------------------------------
-- Finance & relations
-- ---------------------------------------------------------------------------

alter table public.invoices
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null;

alter table public.payments
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null;

alter table public.analytics_connections
  add column if not exists project_id uuid references public.projects(id) on delete set null;

alter table public.seo_connections
  add column if not exists project_id uuid references public.projects(id) on delete set null;

alter table public.reports
  add column if not exists service_id uuid references public.services(id) on delete set null,
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null;

alter table public.documents
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null;

alter table public.notifications
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Project statuses
-- ---------------------------------------------------------------------------

insert into public.project_statuses (slug, label, color, sort_order) values
  ('live', 'Live', '#22C55E', 11),
  ('cancelled', 'Cancelled', '#EF4444', 12)
on conflict (slug) do update set
  label = excluded.label,
  color = excluded.color,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Inherited plan features (child overrides parent for same feature)
-- ---------------------------------------------------------------------------

create or replace function public.get_service_plan_features(p_plan_id uuid)
returns table (
  feature_id uuid,
  feature_slug text,
  feature_name text,
  value_type text,
  is_enabled boolean,
  limit_value numeric,
  limit_unit text,
  plan_depth int
)
language sql
stable
as $$
  with recursive plan_chain as (
    select sp.id, sp.parent_plan_id, 0 as depth
    from public.service_plans sp
    where sp.id = p_plan_id
    union all
    select parent.id, parent.parent_plan_id, pc.depth + 1
    from public.service_plans parent
    join plan_chain pc on parent.id = pc.parent_plan_id
  ),
  merged as (
    select
      sf.id as feature_id,
      sf.slug as feature_slug,
      sf.name as feature_name,
      sf.value_type,
      spf.is_enabled,
      spf.limit_value,
      spf.limit_unit,
      pc.depth as plan_depth,
      row_number() over (partition by sf.id order by pc.depth asc) as rn
    from plan_chain pc
    join public.service_plan_features spf on spf.service_plan_id = pc.id
    join public.service_features sf on sf.id = spf.feature_id
    where spf.is_enabled = true
  )
  select feature_id, feature_slug, feature_name, value_type, is_enabled, limit_value, limit_unit, plan_depth
  from merged where rn = 1;
$$;

create or replace function public.get_subscription_entitlements(p_subscription_id uuid)
returns table (
  feature_id uuid,
  feature_slug text,
  feature_name text,
  value_type text,
  is_enabled boolean,
  limit_value numeric,
  limit_unit text,
  source text
)
language sql
stable
as $$
  with plan_features as (
    select pf.feature_id, pf.feature_slug, pf.feature_name, pf.value_type,
      pf.is_enabled, pf.limit_value, pf.limit_unit, 'plan'::text as source
    from public.client_subscriptions cs
    join public.get_service_plan_features(cs.service_plan_id) pf on true
    where cs.id = p_subscription_id and cs.service_plan_id is not null
  ),
  overrides as (
    select
      sf.id as feature_id,
      sf.slug as feature_slug,
      sf.name as feature_name,
      sf.value_type,
      coalesce(sfo.is_enabled, true) as is_enabled,
      sfo.limit_value,
      sfo.limit_unit,
      'override'::text as source
    from public.subscription_feature_overrides sfo
    join public.service_features sf on sf.id = sfo.feature_id
    where sfo.subscription_id = p_subscription_id
  ),
  combined as (
    select * from overrides
    union all
    select * from plan_features pf where not exists (
      select 1 from overrides o where o.feature_id = pf.feature_id
    )
  )
  select * from combined where is_enabled = true;
$$;

-- ---------------------------------------------------------------------------
-- Seed services
-- ---------------------------------------------------------------------------

insert into public.services (slug, name, category, description, has_plans, billing_model, sort_order) values
  ('website', 'Website', 'web', 'Websites, landing pages and web presence.', false, 'custom', 1),
  ('software', 'Software', 'software', 'Custom software and applications.', false, 'custom', 2),
  ('ai-automation', 'Automação com IA', 'ai', 'AI automation, agents and workflows.', false, 'custom', 3),
  ('seo', 'SEO', 'seo', 'Search engine optimisation services.', false, 'subscription', 4),
  ('analytics', 'Google Analytics / Analytics', 'analytics', 'Analytics setup, reporting and insights.', false, 'subscription', 5),
  ('consulting', 'Consultoria', 'data', 'Digital consulting and strategy.', false, 'custom', 6),
  ('custom-development', 'Desenvolvimento personalizado', 'software', 'Bespoke development projects.', false, 'one_time', 7),
  ('maintenance', 'Manutenção', 'infrastructure', 'Website and platform maintenance plans.', true, 'subscription', 8)
on conflict (slug) do update set
  name = excluded.name,
  has_plans = excluded.has_plans,
  billing_model = excluded.billing_model,
  sort_order = excluded.sort_order;

insert into public.service_features (slug, name, description, value_type, default_unit, category, sort_order) values
  ('security_updates', 'Security updates', null, 'boolean', null, 'maintenance', 1),
  ('automatic_backups', 'Automatic backups', null, 'boolean', null, 'maintenance', 2),
  ('uptime_monitoring', 'Uptime monitoring', null, 'boolean', null, 'maintenance', 3),
  ('bug_fixes', 'Bug fixes', null, 'boolean', null, 'maintenance', 4),
  ('email_support', 'Email support', null, 'boolean', null, 'support', 5),
  ('monthly_changes_minutes', 'Monthly changes', null, 'numeric', 'minutes', 'maintenance', 6),
  ('basic_seo', 'Basic SEO', null, 'boolean', null, 'seo', 7),
  ('monthly_reports', 'Monthly reports', null, 'boolean', null, 'reporting', 8),
  ('advanced_monitoring', 'Advanced monitoring', null, 'boolean', null, 'maintenance', 9),
  ('priority_support', 'Priority support', null, 'boolean', null, 'support', 10),
  ('content_management_pages', 'Content management', null, 'numeric', 'pages', 'maintenance', 11),
  ('new_pages_features', 'New pages & features', null, 'boolean', null, 'maintenance', 12),
  ('advanced_seo', 'Advanced SEO', null, 'boolean', null, 'seo', 13),
  ('advanced_reports', 'Advanced reports', null, 'boolean', null, 'reporting', 14),
  ('whatsapp_support', 'WhatsApp support', null, 'boolean', null, 'support', 15),
  ('digital_consulting', 'Digital consulting', null, 'boolean', null, 'consulting', 16),
  ('development_discounts', 'Development discounts', null, 'boolean', null, 'billing', 17),
  ('analytics_access', 'Analytics access', null, 'boolean', null, 'analytics', 18),
  ('seo_access', 'SEO access', null, 'boolean', null, 'seo', 19)
on conflict (slug) do nothing;

-- Maintenance plans + features (inheritance: essential <- professional <- business)
do $$
declare
  v_service uuid;
  v_essential uuid;
  v_professional uuid;
  v_business uuid;
begin
  select id into v_service from public.services where slug = 'maintenance';

  insert into public.service_plans (service_id, slug, name, price, billing_period, parent_plan_id, sort_order)
  values (v_service, 'essential', 'Essential', 50, 'monthly', null, 1)
  on conflict (service_id, slug) do update set price = 50, parent_plan_id = null
  returning id into v_essential;
  if v_essential is null then select id into v_essential from public.service_plans where service_id = v_service and slug = 'essential'; end if;

  insert into public.service_plans (service_id, slug, name, price, billing_period, parent_plan_id, sort_order)
  values (v_service, 'professional', 'Professional', 100, 'monthly', v_essential, 2)
  on conflict (service_id, slug) do update set price = 100, parent_plan_id = v_essential
  returning id into v_professional;
  if v_professional is null then select id into v_professional from public.service_plans where service_id = v_service and slug = 'professional'; end if;

  insert into public.service_plans (service_id, slug, name, price, billing_period, parent_plan_id, sort_order)
  values (v_service, 'business', 'Business', 200, 'monthly', v_professional, 3)
  on conflict (service_id, slug) do update set price = 200, parent_plan_id = v_professional
  returning id into v_business;
  if v_business is null then select id into v_business from public.service_plans where service_id = v_service and slug = 'business'; end if;

  insert into public.service_plan_features (service_plan_id, feature_id, limit_value, limit_unit)
  select v_essential, id,
    case slug when 'monthly_changes_minutes' then 30 else null end,
    case slug when 'monthly_changes_minutes' then 'minutes' else default_unit end
  from public.service_features
  where slug in ('security_updates','automatic_backups','uptime_monitoring','bug_fixes','email_support','monthly_changes_minutes')
  on conflict (service_plan_id, feature_id) do update set limit_value = excluded.limit_value, limit_unit = excluded.limit_unit;

  insert into public.service_plan_features (service_plan_id, feature_id, limit_value, limit_unit)
  select v_professional, id,
    case slug when 'monthly_changes_minutes' then 120 when 'content_management_pages' then 5 else null end,
    case slug when 'monthly_changes_minutes' then 'minutes' when 'content_management_pages' then 'pages' else default_unit end
  from public.service_features
  where slug in ('monthly_changes_minutes','basic_seo','monthly_reports','advanced_monitoring','priority_support','content_management_pages')
  on conflict (service_plan_id, feature_id) do update set limit_value = excluded.limit_value, limit_unit = excluded.limit_unit;

  insert into public.service_plan_features (service_plan_id, feature_id, limit_value, limit_unit)
  select v_business, id,
    case slug when 'monthly_changes_minutes' then 300 else null end,
    case slug when 'monthly_changes_minutes' then 'minutes' else default_unit end
  from public.service_features
  where slug in ('monthly_changes_minutes','new_pages_features','advanced_seo','advanced_reports','whatsapp_support','digital_consulting','development_discounts')
  on conflict (service_plan_id, feature_id) do update set limit_value = excluded.limit_value, limit_unit = excluded.limit_unit;
end $$;

-- RLS
alter table public.service_features enable row level security;
alter table public.service_plans enable row level security;
alter table public.service_plan_features enable row level security;
alter table public.client_subscriptions enable row level security;
alter table public.usage_records enable row level security;
alter table public.subscription_entitlements enable row level security;

drop policy if exists "Auth read service features" on public.service_features;
create policy "Auth read service features" on public.service_features for select to authenticated using (is_active = true);

drop policy if exists "Auth read service plans" on public.service_plans;
create policy "Auth read service plans" on public.service_plans for select to authenticated using (is_active = true);

drop policy if exists "Auth read plan features" on public.service_plan_features;
create policy "Auth read plan features" on public.service_plan_features for select to authenticated using (true);

drop policy if exists "Company read subscriptions" on public.client_subscriptions;
create policy "Company read subscriptions" on public.client_subscriptions for select to authenticated
  using (company_id in (select company_id from public.company_users where user_id = auth.uid()));

drop policy if exists "Company read usage" on public.usage_records;
create policy "Company read usage" on public.usage_records for select to authenticated
  using (company_id in (select company_id from public.company_users where user_id = auth.uid()));

drop policy if exists "Staff manage subscriptions" on public.client_subscriptions;
create policy "Staff manage subscriptions" on public.client_subscriptions for all to authenticated
  using (exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.slug in ('owner','admin','finance','project_manager')
  ));
