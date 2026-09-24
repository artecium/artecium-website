-- Artecium Platform — security & RLS hardening
-- Run AFTER 001, 002 and 003
-- Fixes overly permissive policies; does not recreate tables or delete data.

-- ===========================================================================
-- Helper functions (extended)
-- ===========================================================================

create or replace function public.staff_can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.deleted_at is null
      and public.staff_can_access_company(p.company_id)
  );
$$;

create or replace function public.staff_can_access_subscription(p_subscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_subscriptions cs
    where cs.id = p_subscription_id
      and cs.deleted_at is null
      and public.staff_can_access_company(cs.company_id)
  );
$$;

create or replace function public.staff_can_manage_subscriptions()
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
      and r.slug in ('owner', 'admin', 'finance', 'project_manager')
  );
$$;

comment on function public.staff_can_access_company(uuid) is
  'Owner/Admin: all companies. Scoped staff: assigned companies only. '
  'Staff without staff_company_assignments rows: all companies (legacy compat).';

-- ===========================================================================
-- Integrity triggers (author binding, profile self-service, message immutability)
-- ===========================================================================

create or replace function public.enforce_ticket_message_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_ticket_message_author on public.ticket_messages;
create trigger trg_ticket_message_author
  before insert on public.ticket_messages
  for each row execute function public.enforce_ticket_message_author();

create or replace function public.enforce_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_staff_member() then
    if new.id is distinct from old.id then
      raise exception 'Cannot change profile id';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Cannot change email via profile update';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'Cannot change profile created_at';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profile_self_update on public.profiles;
create trigger trg_profile_self_update
  before update on public.profiles
  for each row execute function public.enforce_profile_self_update();

-- ===========================================================================
-- Client-safe views (column filtering — RLS alone cannot hide columns)
-- ===========================================================================

create or replace view public.payment_methods_client
with (security_invoker = true) as
select
  id,
  company_id,
  method_type,
  last4,
  brand,
  exp_month,
  exp_year,
  is_default,
  is_active,
  created_at,
  updated_at
from public.payment_methods
where is_active = true;

create or replace view public.analytics_connections_client
with (security_invoker = true) as
select
  id,
  company_id,
  project_id,
  provider,
  account_id,
  property_id,
  display_name,
  status,
  connected_at,
  last_sync_at,
  created_at,
  updated_at
from public.analytics_connections;

create or replace view public.seo_connections_client
with (security_invoker = true) as
select
  id,
  company_id,
  project_id,
  provider,
  site_url,
  property_identifier,
  display_name,
  status,
  connected_at,
  last_sync_at,
  created_at,
  updated_at
from public.seo_connections;

create or replace view public.integration_connections_client
with (security_invoker = true) as
select
  id,
  company_id,
  project_id,
  integration_id,
  status,
  connected_at,
  last_sync_at,
  updated_at
from public.integration_connections;

grant select on public.payment_methods_client to authenticated;
grant select on public.analytics_connections_client to authenticated;
grant select on public.seo_connections_client to authenticated;
grant select on public.integration_connections_client to authenticated;

-- Column-level grants: authenticated role sees only safe columns on base tables.
-- Staff needing secrets must use service_role server-side.
revoke select on public.payment_methods from authenticated;
grant select (
  id, company_id, method_type, last4, brand, exp_month, exp_year,
  is_default, is_active, created_at, updated_at
) on public.payment_methods to authenticated;

revoke select on public.analytics_connections from authenticated;
grant select (
  id, company_id, project_id, provider, account_id, property_id,
  display_name, status, connected_at, last_sync_at, created_at, updated_at
) on public.analytics_connections to authenticated;

revoke select on public.seo_connections from authenticated;
grant select (
  id, company_id, project_id, provider, site_url, property_identifier,
  display_name, status, connected_at, last_sync_at, created_at, updated_at
) on public.seo_connections to authenticated;

revoke select on public.integration_connections from authenticated;
grant select (
  id, company_id, project_id, integration_id, status,
  connected_at, last_sync_at, updated_at
) on public.integration_connections to authenticated;

-- Sensitive columns remain accessible via service_role (bypasses column grants with full privileges)

-- ===========================================================================
-- A) PROJECTS — staff scoped by company
-- ===========================================================================

drop policy if exists "Staff manage projects" on public.projects;
create policy "Staff manage projects" on public.projects
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- ===========================================================================
-- B) TASKS — staff scoped via project → company
-- ===========================================================================

drop policy if exists "Staff manage tasks" on public.tasks;
create policy "Staff manage tasks" on public.tasks
  for all to authenticated
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

-- ===========================================================================
-- C) PROJECT_MILESTONES — staff scoped via project → company
-- ===========================================================================

drop policy if exists "Staff manage milestones" on public.project_milestones;
create policy "Staff manage milestones" on public.project_milestones
  for all to authenticated
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

-- ===========================================================================
-- D) DOCUMENTS — staff scoped by company
-- ===========================================================================

drop policy if exists "Staff manage documents" on public.documents;
create policy "Staff manage documents" on public.documents
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- Document versions inherit document access
drop policy if exists "Read document versions" on public.document_versions;
create policy "Read document versions" on public.document_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and d.deleted_at is null
        and (
          (
            d.company_id in (select public.user_company_ids())
            and d.visibility = 'client_visible'
          )
          or public.staff_can_access_company(d.company_id)
        )
    )
  );

drop policy if exists "Staff manage document versions" on public.document_versions;
create policy "Staff manage document versions" on public.document_versions
  for all to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.staff_can_access_company(d.company_id)
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.staff_can_access_company(d.company_id)
    )
  );

-- ===========================================================================
-- E) AUTOMATION_CONFIGS — scoped by company/project
-- ===========================================================================

drop policy if exists "Staff manage automation configs" on public.automation_configs;
drop policy if exists "Staff read automation configs" on public.automation_configs;
create policy "Staff manage automation configs" on public.automation_configs
  for all to authenticated
  using (
    (company_id is not null and public.staff_can_access_company(company_id))
    or (project_id is not null and public.staff_can_access_project(project_id))
    or (company_id is null and project_id is null and public.is_owner_or_admin())
  )
  with check (
    (company_id is not null and public.staff_can_access_company(company_id))
    or (project_id is not null and public.staff_can_access_project(project_id))
    or (company_id is null and project_id is null and public.is_owner_or_admin())
  );

-- ===========================================================================
-- F) ACTIVITY_LOGS — scoped insert/read
-- ===========================================================================

drop policy if exists "Staff read activity logs" on public.activity_logs;
create policy "Staff read activity logs" on public.activity_logs
  for select to authenticated
  using (
    public.is_owner_or_admin()
    or (
      public.is_staff_member()
      and (
        company_id is null
        or public.staff_can_access_company(company_id)
      )
    )
  );

drop policy if exists "Staff insert activity logs" on public.activity_logs;
create policy "Staff insert activity logs" on public.activity_logs
  for insert to authenticated
  with check (
    public.is_staff_member()
    and (actor_id is null or actor_id = auth.uid())
    and (
      company_id is null
      or public.staff_can_access_company(company_id)
    )
    and (
      project_id is null
      or public.staff_can_access_project(project_id)
    )
  );

-- ===========================================================================
-- G) TICKET_MESSAGES — scoped insert; author forced by trigger; no updates
-- ===========================================================================

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

drop policy if exists "Staff update ticket messages" on public.ticket_messages;
drop policy if exists "Update ticket messages" on public.ticket_messages;
drop policy if exists "Delete ticket messages" on public.ticket_messages;

-- ===========================================================================
-- H) PROFILES — tighten self-update policy
-- ===========================================================================

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ===========================================================================
-- I–L) Sensitive connection tables — staff full row access; clients row-scoped
--      Column secrets stripped via column grants + client views above
-- ===========================================================================

drop policy if exists "Company read payment methods" on public.payment_methods;
create policy "Company read payment methods" on public.payment_methods
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage payment methods" on public.payment_methods;
create policy "Staff read payment methods" on public.payment_methods
  for select to authenticated
  using (public.staff_can_access_company(company_id));

create policy "Staff manage payment methods" on public.payment_methods
  for insert to authenticated
  with check (public.staff_can_access_company(company_id));

create policy "Staff update payment methods" on public.payment_methods
  for update to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

create policy "Staff delete payment methods" on public.payment_methods
  for delete to authenticated
  using (public.staff_can_access_company(company_id));

-- company_payment_providers: staff only, never clients
drop policy if exists "Staff manage company payment providers" on public.company_payment_providers;
drop policy if exists "Staff read company payment providers" on public.company_payment_providers;
create policy "Staff read company payment providers" on public.company_payment_providers
  for select to authenticated
  using (public.staff_can_access_company(company_id));

create policy "Staff write company payment providers" on public.company_payment_providers
  for insert to authenticated
  with check (
    public.staff_can_access_company(company_id)
    and public.staff_can_manage_subscriptions()
  );

create policy "Staff update company payment providers" on public.company_payment_providers
  for update to authenticated
  using (
    public.staff_can_access_company(company_id)
    and public.staff_can_manage_subscriptions()
  )
  with check (
    public.staff_can_access_company(company_id)
    and public.staff_can_manage_subscriptions()
  );

create policy "Staff delete company payment providers" on public.company_payment_providers
  for delete to authenticated
  using (
    public.staff_can_access_company(company_id)
    and public.staff_can_manage_subscriptions()
  );

-- Analytics / SEO / Integrations: replace client direct table read with scoped policies
drop policy if exists "Company read analytics connections" on public.analytics_connections;
create policy "Company read analytics connections" on public.analytics_connections
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    and not public.is_staff_member()
  );

drop policy if exists "Staff manage analytics connections" on public.analytics_connections;
create policy "Staff read analytics connections" on public.analytics_connections
  for select to authenticated
  using (public.staff_can_access_company(company_id));

create policy "Staff insert analytics connections" on public.analytics_connections
  for insert to authenticated
  with check (public.staff_can_access_company(company_id));

create policy "Staff update analytics connections" on public.analytics_connections
  for update to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

create policy "Staff delete analytics connections" on public.analytics_connections
  for delete to authenticated
  using (public.staff_can_access_company(company_id));

drop policy if exists "Company read seo connections" on public.seo_connections;
create policy "Company read seo connections" on public.seo_connections
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    and not public.is_staff_member()
  );

drop policy if exists "Staff manage seo connections" on public.seo_connections;
create policy "Staff read seo connections" on public.seo_connections
  for select to authenticated
  using (public.staff_can_access_company(company_id));

create policy "Staff insert seo connections" on public.seo_connections
  for insert to authenticated
  with check (public.staff_can_access_company(company_id));

create policy "Staff update seo connections" on public.seo_connections
  for update to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

create policy "Staff delete seo connections" on public.seo_connections
  for delete to authenticated
  using (public.staff_can_access_company(company_id));

drop policy if exists "Company read integrations" on public.integration_connections;
create policy "Company read integrations" on public.integration_connections
  for select to authenticated
  using (
    company_id is not null
    and company_id in (select public.user_company_ids())
    and not public.is_staff_member()
  );

drop policy if exists "Staff manage integrations" on public.integration_connections;
create policy "Staff read integrations" on public.integration_connections
  for select to authenticated
  using (
    company_id is null and public.is_owner_or_admin()
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

create policy "Staff insert integrations" on public.integration_connections
  for insert to authenticated
  with check (
    company_id is null and public.is_owner_or_admin()
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

create policy "Staff update integrations" on public.integration_connections
  for update to authenticated
  using (
    company_id is null and public.is_owner_or_admin()
    or (company_id is not null and public.staff_can_access_company(company_id))
  )
  with check (
    company_id is null and public.is_owner_or_admin()
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

create policy "Staff delete integrations" on public.integration_connections
  for delete to authenticated
  using (
    company_id is null and public.is_owner_or_admin()
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

-- ===========================================================================
-- M) CLIENT_SUBSCRIPTIONS — client SELECT only; staff scoped manage
-- ===========================================================================

drop policy if exists "Staff manage subscriptions" on public.client_subscriptions;
create policy "Staff manage subscriptions" on public.client_subscriptions
  for all to authenticated
  using (
    public.staff_can_manage_subscriptions()
    and public.staff_can_access_company(company_id)
  )
  with check (
    public.staff_can_manage_subscriptions()
    and public.staff_can_access_company(company_id)
  );

-- Explicit: no client write policies (default deny)

-- ===========================================================================
-- N) INVOICES / PAYMENTS — client SELECT only (existing); fix invoice_items
-- ===========================================================================

drop policy if exists "Staff manage invoice items" on public.invoice_items;
create policy "Staff manage invoice items" on public.invoice_items
  for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and public.staff_can_access_company(i.company_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and public.staff_can_access_company(i.company_id)
    )
  );

drop policy if exists "Staff manage payment status history" on public.payment_status_history;
create policy "Staff insert payment status history" on public.payment_status_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and public.staff_can_access_company(p.company_id)
        and public.staff_can_manage_subscriptions()
    )
  );

-- ===========================================================================
-- O) USAGE_RECORDS — already scoped in 003; split staff ALL into CRUD
-- ===========================================================================

drop policy if exists "Staff manage usage" on public.usage_records;
create policy "Staff read usage" on public.usage_records
  for select to authenticated
  using (public.staff_can_access_company(company_id));

create policy "Staff insert usage" on public.usage_records
  for insert to authenticated
  with check (public.staff_can_access_company(company_id));

create policy "Staff update usage" on public.usage_records
  for update to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

create policy "Staff delete usage" on public.usage_records
  for delete to authenticated
  using (
    public.is_owner_or_admin()
    and public.staff_can_access_company(company_id)
  );

-- ===========================================================================
-- P) STAFF_COMPANY_ASSIGNMENTS — unchanged (Owner/Admin only manage)
-- ===========================================================================

-- ===========================================================================
-- Q) SUBSCRIPTION_ENTITLEMENTS — staff scoped
-- ===========================================================================

drop policy if exists "Company read subscription entitlements" on public.subscription_entitlements;
create policy "Company read subscription entitlements" on public.subscription_entitlements
  for select to authenticated
  using (
    exists (
      select 1 from public.client_subscriptions cs
      where cs.id = subscription_id
        and cs.company_id in (select public.user_company_ids())
    )
    or public.staff_can_access_subscription(subscription_id)
  );

drop policy if exists "Staff manage subscription entitlements" on public.subscription_entitlements;
create policy "Staff manage subscription entitlements" on public.subscription_entitlements
  for all to authenticated
  using (public.staff_can_access_subscription(subscription_id))
  with check (public.staff_can_access_subscription(subscription_id));

-- subscription_feature_overrides (RLS enabled in 003, no policies)
drop policy if exists "Company read subscription overrides" on public.subscription_feature_overrides;
create policy "Company read subscription overrides" on public.subscription_feature_overrides
  for select to authenticated
  using (
    exists (
      select 1 from public.client_subscriptions cs
      where cs.id = subscription_id
        and cs.company_id in (select public.user_company_ids())
    )
    or public.staff_can_access_subscription(subscription_id)
  );

drop policy if exists "Staff manage subscription overrides" on public.subscription_feature_overrides;
create policy "Staff manage subscription overrides" on public.subscription_feature_overrides
  for all to authenticated
  using (public.staff_can_access_subscription(subscription_id))
  with check (public.staff_can_access_subscription(subscription_id));

-- ===========================================================================
-- R) SUBSCRIPTION_HISTORY — scoped manual insert; trigger uses SECURITY DEFINER
-- ===========================================================================

drop policy if exists "Staff manage subscription history" on public.subscription_history;
create policy "Staff insert subscription history" on public.subscription_history
  for insert to authenticated
  with check (
    public.staff_can_manage_subscriptions()
    and public.staff_can_access_company(company_id)
  );

-- ===========================================================================
-- Companies — staff read scoped (was global is_staff_member)
-- ===========================================================================

drop policy if exists "Staff read companies" on public.companies;
create policy "Staff read companies" on public.companies
  for select to authenticated
  using (public.staff_can_access_company(id) and deleted_at is null);

-- ===========================================================================
-- Tickets — bind created_by on insert
-- ===========================================================================

drop policy if exists "Company create tickets" on public.tickets;
create policy "Company create tickets" on public.tickets
  for insert to authenticated
  with check (
    company_id in (select public.user_company_ids())
    and (created_by is null or created_by = auth.uid())
  );

-- ===========================================================================
-- S–T) Missing policies for tables with RLS enabled but no policies (003)
-- ===========================================================================

-- project_members
drop policy if exists "Read project members" on public.project_members;
create policy "Read project members" on public.project_members
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

drop policy if exists "Staff manage project members" on public.project_members;
create policy "Staff manage project members" on public.project_members
  for all to authenticated
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

-- project_status_history
drop policy if exists "Read project status history" on public.project_status_history;
create policy "Read project status history" on public.project_status_history
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

drop policy if exists "Staff insert project status history" on public.project_status_history;
create policy "Staff insert project status history" on public.project_status_history
  for insert to authenticated
  with check (public.staff_can_access_project(project_id));

-- contacts
drop policy if exists "Company read contacts" on public.contacts;
create policy "Company read contacts" on public.contacts
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

drop policy if exists "Staff manage contacts" on public.contacts;
create policy "Staff manage contacts" on public.contacts
  for all to authenticated
  using (
    company_id is null and public.is_owner_or_admin()
    or (company_id is not null and public.staff_can_access_company(company_id))
  )
  with check (
    company_id is null and public.is_owner_or_admin()
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

-- meetings
drop policy if exists "Company read meetings" on public.meetings;
create policy "Company read meetings" on public.meetings
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

drop policy if exists "Staff manage meetings" on public.meetings;
create policy "Staff manage meetings" on public.meetings
  for all to authenticated
  using (
    company_id is null and public.is_staff_member()
    or (company_id is not null and public.staff_can_access_company(company_id))
  )
  with check (
    company_id is null and public.is_staff_member()
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

-- feedback
drop policy if exists "Company read feedback" on public.feedback;
create policy "Company read feedback" on public.feedback
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    or user_id = auth.uid()
  );

drop policy if exists "Company insert feedback" on public.feedback;
create policy "Company insert feedback" on public.feedback
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (company_id is null or company_id in (select public.user_company_ids()))
  );

drop policy if exists "Staff manage feedback" on public.feedback;
create policy "Staff manage feedback" on public.feedback
  for all to authenticated
  using (
    company_id is null and public.is_staff_member()
    or (company_id is not null and public.staff_can_access_company(company_id))
  )
  with check (
    company_id is null and public.is_staff_member()
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

-- ssl_certificates
drop policy if exists "Company read ssl" on public.ssl_certificates;
create policy "Company read ssl" on public.ssl_certificates
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage ssl" on public.ssl_certificates;
create policy "Staff manage ssl" on public.ssl_certificates
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- ===========================================================================
-- PROFILES — restrict to authenticated (fix 001 public-role exposure)
-- ===========================================================================

revoke all on public.profiles from anon;
revoke all on public.profiles from public;
grant select, update on public.profiles to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Staff read profiles" on public.profiles;
create policy "Staff read profiles" on public.profiles
  for select to authenticated
  using (
    public.is_staff_member()
    and (
      public.is_owner_or_admin()
      or exists (
        select 1 from public.company_users cu
        where cu.user_id = profiles.id
          and public.staff_can_access_company(cu.company_id)
      )
    )
  );

-- ===========================================================================
-- ROLES / PERMISSIONS / USER_ROLES — protect admin data
-- ===========================================================================

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Authenticated read roles" on public.roles;
create policy "Authenticated read roles" on public.roles
  for select to authenticated
  using (true);

drop policy if exists "Owner admin manage roles" on public.roles;
create policy "Owner admin manage roles" on public.roles
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Staff read permissions" on public.permissions;
create policy "Staff read permissions" on public.permissions
  for select to authenticated
  using (public.is_staff_member());

drop policy if exists "Owner admin manage permissions" on public.permissions;
create policy "Owner admin manage permissions" on public.permissions
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Staff read role permissions" on public.role_permissions;
create policy "Staff read role permissions" on public.role_permissions
  for select to authenticated
  using (public.is_staff_member());

drop policy if exists "Owner admin manage role permissions" on public.role_permissions;
create policy "Owner admin manage role permissions" on public.role_permissions
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Users read own user roles" on public.user_roles;
create policy "Users read own user roles" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_owner_or_admin());

drop policy if exists "Owner admin manage user roles" on public.user_roles;
create policy "Owner admin manage user roles" on public.user_roles
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

-- ===========================================================================
-- COMPANY_USERS — prevent client self-assignment to other companies
-- ===========================================================================

drop policy if exists "Users read own company memberships" on public.company_users;
create policy "Users read own company memberships" on public.company_users
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.staff_can_access_company(company_id)
  );

-- INSERT/UPDATE/DELETE only via "Staff manage company users" (owner/admin) from 003

-- ===========================================================================
-- PROJECT artefacts — task_comments, deliverables, approvals, change_requests
-- ===========================================================================

alter table public.task_comments enable row level security;
alter table public.deliverables enable row level security;
alter table public.approvals enable row level security;
alter table public.change_requests enable row level security;
alter table public.messages enable row level security;
alter table public.ticket_attachments enable row level security;

drop policy if exists "Read task comments" on public.task_comments;
create policy "Read task comments" on public.task_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_id
        and (
          p.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(p.company_id)
        )
    )
  );

drop policy if exists "Staff manage task comments" on public.task_comments;
create policy "Staff manage task comments" on public.task_comments
  for all to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.staff_can_access_project(t.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.staff_can_access_project(t.project_id)
    )
  );

drop policy if exists "Company insert task comments" on public.task_comments;
create policy "Company insert task comments" on public.task_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_id
        and p.company_id in (select public.user_company_ids())
    )
  );

drop policy if exists "Read deliverables" on public.deliverables;
create policy "Read deliverables" on public.deliverables
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

drop policy if exists "Staff manage deliverables" on public.deliverables;
create policy "Staff manage deliverables" on public.deliverables
  for all to authenticated
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

drop policy if exists "Read approvals" on public.approvals;
create policy "Read approvals" on public.approvals
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

drop policy if exists "Staff manage approvals" on public.approvals;
create policy "Staff manage approvals" on public.approvals
  for all to authenticated
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

drop policy if exists "Company insert approvals" on public.approvals;
create policy "Company insert approvals" on public.approvals
  for insert to authenticated
  with check (
    approved_by = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.company_id in (select public.user_company_ids())
    )
  );

drop policy if exists "Read change requests" on public.change_requests;
create policy "Read change requests" on public.change_requests
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

drop policy if exists "Staff manage change requests" on public.change_requests;
create policy "Staff manage change requests" on public.change_requests
  for all to authenticated
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

drop policy if exists "Company insert change requests" on public.change_requests;
create policy "Company insert change requests" on public.change_requests
  for insert to authenticated
  with check (
    (requested_by is null or requested_by = auth.uid())
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.company_id in (select public.user_company_ids())
    )
  );

drop policy if exists "Read messages" on public.messages;
create policy "Read messages" on public.messages
  for select to authenticated
  using (
    (project_id is not null and exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(p.company_id)
        )
    ))
    or (ticket_id is not null and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (
          t.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(t.company_id)
        )
    ))
  );

drop policy if exists "Insert messages" on public.messages;
create policy "Insert messages" on public.messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      (project_id is not null and exists (
        select 1 from public.projects p
        where p.id = project_id
          and (
            p.company_id in (select public.user_company_ids())
            or public.staff_can_access_company(p.company_id)
          )
      ))
      or (ticket_id is not null and exists (
        select 1 from public.tickets t
        where t.id = ticket_id
          and (
            t.company_id in (select public.user_company_ids())
            or public.staff_can_access_company(t.company_id)
          )
      ))
    )
  );

drop policy if exists "Staff manage messages" on public.messages;
create policy "Staff manage messages" on public.messages
  for all to authenticated
  using (
    (project_id is not null and public.staff_can_access_project(project_id))
    or (ticket_id is not null and exists (
      select 1 from public.tickets t
      where t.id = ticket_id and public.staff_can_access_company(t.company_id)
    ))
  )
  with check (
    (project_id is not null and public.staff_can_access_project(project_id))
    or (ticket_id is not null and exists (
      select 1 from public.tickets t
      where t.id = ticket_id and public.staff_can_access_company(t.company_id)
    ))
  );

drop policy if exists "Read ticket attachments" on public.ticket_attachments;
create policy "Read ticket attachments" on public.ticket_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.ticket_messages tm
      join public.tickets t on t.id = tm.ticket_id
      where tm.id = ticket_message_id
        and (
          t.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(t.company_id)
        )
    )
  );

drop policy if exists "Insert ticket attachments" on public.ticket_attachments;
create policy "Insert ticket attachments" on public.ticket_attachments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.ticket_messages tm
      join public.tickets t on t.id = tm.ticket_id
      where tm.id = ticket_message_id
        and tm.author_id = auth.uid()
        and (
          t.company_id in (select public.user_company_ids())
          or public.staff_can_access_company(t.company_id)
        )
    )
  );

drop policy if exists "Staff manage ticket attachments" on public.ticket_attachments;
create policy "Staff manage ticket attachments" on public.ticket_attachments
  for all to authenticated
  using (
    exists (
      select 1 from public.ticket_messages tm
      join public.tickets t on t.id = tm.ticket_id
      where tm.id = ticket_message_id
        and public.staff_can_access_company(t.company_id)
    )
  )
  with check (
    exists (
      select 1 from public.ticket_messages tm
      join public.tickets t on t.id = tm.ticket_id
      where tm.id = ticket_message_id
        and public.staff_can_access_company(t.company_id)
    )
  );

-- ===========================================================================
-- FINANCE — discounts, coupons, invoice status history
-- ===========================================================================

alter table public.discounts enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "Staff read discounts" on public.discounts;
create policy "Staff read discounts" on public.discounts
  for select to authenticated
  using (public.is_staff_member());

drop policy if exists "Finance manage discounts" on public.discounts;
create policy "Finance manage discounts" on public.discounts
  for all to authenticated
  using (public.is_owner_or_admin() or public.staff_can_manage_subscriptions())
  with check (public.is_owner_or_admin() or public.staff_can_manage_subscriptions());

drop policy if exists "Company read coupons" on public.coupons;
create policy "Company read coupons" on public.coupons
  for select to authenticated
  using (
    company_id in (select public.user_company_ids())
    or (company_id is not null and public.staff_can_access_company(company_id))
  );

drop policy if exists "Finance manage coupons" on public.coupons;
create policy "Finance manage coupons" on public.coupons
  for all to authenticated
  using (
    company_id is null and (public.is_owner_or_admin() or public.staff_can_manage_subscriptions())
    or (company_id is not null and public.staff_can_access_company(company_id)
      and (public.is_owner_or_admin() or public.staff_can_manage_subscriptions()))
  )
  with check (
    company_id is null and (public.is_owner_or_admin() or public.staff_can_manage_subscriptions())
    or (company_id is not null and public.staff_can_access_company(company_id)
      and (public.is_owner_or_admin() or public.staff_can_manage_subscriptions()))
  );

drop policy if exists "Staff insert invoice status history" on public.invoice_status_history;
create policy "Staff insert invoice status history" on public.invoice_status_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and public.staff_can_access_company(i.company_id)
        and (public.is_owner_or_admin() or public.staff_can_manage_subscriptions())
    )
  );

-- ===========================================================================
-- LEGACY SUBSCRIPTIONS / PLANS / COMPANY_SERVICES
-- ===========================================================================

alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.subscriptions enable row level security;
alter table public.company_services enable row level security;

drop policy if exists "Authenticated read plans" on public.plans;
create policy "Authenticated read plans" on public.plans
  for select to authenticated
  using (is_active = true);

drop policy if exists "Owner admin manage plans" on public.plans;
create policy "Owner admin manage plans" on public.plans
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Authenticated read plan features" on public.plan_features;
create policy "Authenticated read plan features" on public.plan_features
  for select to authenticated
  using (true);

drop policy if exists "Owner admin manage plan features" on public.plan_features;
create policy "Owner admin manage plan features" on public.plan_features
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Company read legacy subscriptions" on public.subscriptions;
create policy "Company read legacy subscriptions" on public.subscriptions
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage legacy subscriptions" on public.subscriptions;
create policy "Staff manage legacy subscriptions" on public.subscriptions
  for all to authenticated
  using (
    public.staff_can_manage_subscriptions()
    and public.staff_can_access_company(company_id)
  )
  with check (
    public.staff_can_manage_subscriptions()
    and public.staff_can_access_company(company_id)
  );

drop policy if exists "Company read company services" on public.company_services;
create policy "Company read company services" on public.company_services
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff manage company services" on public.company_services;
create policy "Staff manage company services" on public.company_services
  for all to authenticated
  using (public.staff_can_access_company(company_id))
  with check (public.staff_can_access_company(company_id));

-- ===========================================================================
-- CRM / INTERNAL — leads, proposals, contracts, partners
-- ===========================================================================

alter table public.lead_sources enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_signatures enable row level security;
alter table public.partners enable row level security;
alter table public.referrals enable row level security;
alter table public.commissions enable row level security;

drop policy if exists "Staff read lead sources" on public.lead_sources;
create policy "Staff read lead sources" on public.lead_sources
  for select to authenticated
  using (public.is_staff_member());

drop policy if exists "Owner admin manage lead sources" on public.lead_sources;
create policy "Owner admin manage lead sources" on public.lead_sources
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Staff read leads" on public.leads;
create policy "Staff read leads" on public.leads
  for select to authenticated
  using (
    public.is_staff_member()
    and (company_id is null or public.staff_can_access_company(company_id))
  );

drop policy if exists "Staff manage leads" on public.leads;
create policy "Staff manage leads" on public.leads
  for all to authenticated
  using (
    public.is_staff_member()
    and (company_id is null or public.staff_can_access_company(company_id))
  )
  with check (
    public.is_staff_member()
    and (company_id is null or public.staff_can_access_company(company_id))
  );

drop policy if exists "Staff read lead notes" on public.lead_notes;
create policy "Staff read lead notes" on public.lead_notes
  for select to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_id
        and public.is_staff_member()
        and (l.company_id is null or public.staff_can_access_company(l.company_id))
    )
  );

drop policy if exists "Staff manage lead notes" on public.lead_notes;
create policy "Staff manage lead notes" on public.lead_notes
  for all to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_id
        and public.is_staff_member()
        and (l.company_id is null or public.staff_can_access_company(l.company_id))
    )
  )
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_id
        and public.is_staff_member()
        and (l.company_id is null or public.staff_can_access_company(l.company_id))
    )
  );

drop policy if exists "Staff read proposals" on public.proposals;
create policy "Staff read proposals" on public.proposals
  for select to authenticated
  using (public.is_staff_member() and public.staff_can_access_company(company_id));

drop policy if exists "Staff manage proposals" on public.proposals;
create policy "Staff manage proposals" on public.proposals
  for all to authenticated
  using (public.is_staff_member() and public.staff_can_access_company(company_id))
  with check (public.is_staff_member() and public.staff_can_access_company(company_id));

drop policy if exists "Read proposal items" on public.proposal_items;
create policy "Read proposal items" on public.proposal_items
  for select to authenticated
  using (
    exists (
      select 1 from public.proposals pr
      where pr.id = proposal_id
        and public.is_staff_member()
        and public.staff_can_access_company(pr.company_id)
    )
  );

drop policy if exists "Staff manage proposal items" on public.proposal_items;
create policy "Staff manage proposal items" on public.proposal_items
  for all to authenticated
  using (
    exists (
      select 1 from public.proposals pr
      where pr.id = proposal_id
        and public.staff_can_access_company(pr.company_id)
    )
  )
  with check (
    exists (
      select 1 from public.proposals pr
      where pr.id = proposal_id
        and public.staff_can_access_company(pr.company_id)
    )
  );

drop policy if exists "Staff read contracts" on public.contracts;
create policy "Staff read contracts" on public.contracts
  for select to authenticated
  using (public.is_staff_member() and public.staff_can_access_company(company_id));

drop policy if exists "Staff manage contracts" on public.contracts;
create policy "Staff manage contracts" on public.contracts
  for all to authenticated
  using (public.is_staff_member() and public.staff_can_access_company(company_id))
  with check (public.is_staff_member() and public.staff_can_access_company(company_id));

drop policy if exists "Read contract signatures" on public.contract_signatures;
create policy "Read contract signatures" on public.contract_signatures
  for select to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and public.is_staff_member()
        and public.staff_can_access_company(c.company_id)
    )
  );

drop policy if exists "Staff manage contract signatures" on public.contract_signatures;
create policy "Staff manage contract signatures" on public.contract_signatures
  for all to authenticated
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and public.staff_can_access_company(c.company_id)
    )
  )
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and public.staff_can_access_company(c.company_id)
    )
  );

drop policy if exists "Staff read partners" on public.partners;
create policy "Staff read partners" on public.partners
  for select to authenticated
  using (public.is_staff_member());

drop policy if exists "Owner admin manage partners" on public.partners;
create policy "Owner admin manage partners" on public.partners
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Staff read referrals" on public.referrals;
create policy "Staff read referrals" on public.referrals
  for select to authenticated
  using (
    public.is_staff_member()
    and (company_id is null or public.staff_can_access_company(company_id))
  );

drop policy if exists "Staff manage referrals" on public.referrals;
create policy "Staff manage referrals" on public.referrals
  for all to authenticated
  using (
    public.is_staff_member()
    and (company_id is null or public.staff_can_access_company(company_id))
  )
  with check (
    public.is_staff_member()
    and (company_id is null or public.staff_can_access_company(company_id))
  );

drop policy if exists "Staff read commissions" on public.commissions;
create policy "Staff read commissions" on public.commissions
  for select to authenticated
  using (
    exists (
      select 1 from public.referrals r
      where r.id = referral_id
        and public.is_staff_member()
        and (r.company_id is null or public.staff_can_access_company(r.company_id))
    )
  );

drop policy if exists "Owner admin manage commissions" on public.commissions;
create policy "Owner admin manage commissions" on public.commissions
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

-- ===========================================================================
-- SETTINGS & INTEGRATIONS CATALOG
-- ===========================================================================

alter table public.settings enable row level security;
alter table public.integrations enable row level security;

drop policy if exists "Owner admin read settings" on public.settings;
create policy "Owner admin read settings" on public.settings
  for select to authenticated
  using (public.is_owner_or_admin());

drop policy if exists "Owner admin manage settings" on public.settings;
create policy "Owner admin manage settings" on public.settings
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Authenticated read integrations catalog" on public.integrations;
create policy "Authenticated read integrations catalog" on public.integrations
  for select to authenticated
  using (is_active = true);

drop policy if exists "Owner admin manage integrations catalog" on public.integrations;
create policy "Owner admin manage integrations catalog" on public.integrations
  for all to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

-- ===========================================================================
-- SUBSCRIPTION_HISTORY — client read-only (preserve 003)
-- ===========================================================================

drop policy if exists "Company read subscription history" on public.subscription_history;
create policy "Company read subscription history" on public.subscription_history
  for select to authenticated
  using (company_id in (select public.user_company_ids()));

drop policy if exists "Staff read subscription history" on public.subscription_history;
create policy "Staff read subscription history" on public.subscription_history
  for select to authenticated
  using (public.staff_can_access_company(company_id));

-- ===========================================================================
-- SECURITY DEFINER — harden search_path on set_updated_at (003)
-- ===========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- AUDIT LOG (this migration)
-- ===========================================================================
--
-- FUNCTIONS CREATED/REPLACED:
--   staff_can_access_project(uuid)
--   staff_can_access_subscription(uuid)
--   staff_can_manage_subscriptions()
--   enforce_ticket_message_author() + trigger
--   enforce_profile_self_update() + trigger
--
-- VIEWS CREATED:
--   payment_methods_client
--   analytics_connections_client
--   seo_connections_client
--   integration_connections_client
--
-- COLUMN GRANTS (authenticated role — secrets excluded):
--   payment_methods: hides provider, provider_reference, provider_customer_id, metadata
--   analytics_connections: hides secret_reference, metadata
--   seo_connections: hides secret_reference, metadata
--   integration_connections: hides config, secret_reference (no created_at on table — 001/003)
--
-- POLICIES REMOVED & REPLACED:
--   Staff manage projects          → scoped by staff_can_access_company
--   Staff manage tasks             → scoped by staff_can_access_project
--   Staff manage milestones        → scoped by staff_can_access_project
--   Staff manage documents         → scoped by staff_can_access_company
--   Staff manage automation configs → split read/manage, scoped
--   Staff read/manage activity logs → scoped insert + read
--   Staff manage subscriptions (002) → + staff_can_access_company
--   Staff manage invoice items     → scoped via invoice
--   Staff manage usage             → split CRUD, delete owner/admin only
--   Company read subscription entitlements → staff scoped (not global is_staff_member)
--   Staff read companies           → scoped (not global is_staff_member)
--   Staff manage payment methods   → split SELECT/INSERT/UPDATE/DELETE
--   Analytics/SEO/Integrations     → split client vs staff policies
--
-- POLICIES CREATED (previously missing):
--   document_versions (read + staff manage)
--   subscription_feature_overrides (read + staff manage)
--   company_payment_providers (staff only)
--   subscription_entitlements (staff manage)
--   project_members, project_status_history
--   contacts, meetings, feedback, ssl_certificates
--   payment_methods staff split policies
--   analytics/seo/integration staff split policies
--
-- TABLES PROTECTED (policies added or tightened):
--   projects, tasks, project_milestones, documents, document_versions
--   automation_configs, activity_logs, ticket_messages, profiles
--   payment_methods, company_payment_providers
--   analytics_connections, seo_connections, integration_connections
--   client_subscriptions, subscription_entitlements, subscription_feature_overrides
--   subscription_history, invoice_items, usage_records, companies, tickets
--   project_members, project_status_history, contacts, meetings, feedback, ssl_certificates
--
-- KNOWN LIMITATIONS:
--   1. Staff without staff_company_assignments retain global company access (003 compat).
--   2. Column grants block secrets for ALL authenticated users; staff must use
--      service_role server-side for provider_reference, secret_reference, config.
--   3. RLS does not enforce app-level permission slugs (finance, support, etc.).
--   4. ticket_messages: no UPDATE/DELETE policies — history preserved by default deny.
--   5. subscription_history inserts from trigger bypass RLS (SECURITY DEFINER).
--   6. service_plan_features catalog policy (002) remains open read — no secrets stored.
--   7. Client-safe views exist; base tables expose safe columns only via column grants.
--   8. handle_new_user() remains SECURITY DEFINER — required for auth signup bootstrap.
--
-- PART 2 ADDITIONS (extended hardening):
--   profiles: TO authenticated only; REVOKE anon/public; staff read scoped
--   roles, permissions, role_permissions, user_roles: RLS added
--   CRM: leads, proposals, contracts, partners, referrals, commissions
--   settings, integrations catalog
--   legacy plans/subscriptions/company_services
--   task_comments, deliverables, approvals, change_requests, messages, ticket_attachments
--   discounts, coupons, invoice_status_history insert scoped

-- ===========================================================================
-- SECURITY VERIFICATION QUERIES
-- Run manually in Supabase SQL Editor after applying all migrations.
-- Replace placeholders with real UUIDs from your environment.
-- Expected: queries return rows only when access is allowed; otherwise empty/error.
-- ===========================================================================

/*
-- Setup: run as postgres/service_role to inspect, or use Supabase "Run as user"

-- A) Cliente A vê a própria empresa
set local role authenticated;
set local request.jwt.claim.sub = '<CLIENT_A_USER_UUID>';
select id, name from public.companies
where id = '<COMPANY_A_UUID>';
-- expect: 1 row

-- B) Cliente A NÃO vê empresa B
select id, name from public.companies
where id = '<COMPANY_B_UUID>';
-- expect: 0 rows

-- C) Cliente A vê os próprios projetos
select id, name from public.projects
where company_id = '<COMPANY_A_UUID>';
-- expect: >= 0 rows (only company A)

-- D) Cliente A NÃO vê projetos de B
select id, name from public.projects
where company_id = '<COMPANY_B_UUID>';
-- expect: 0 rows

-- E) Cliente A vê a própria subscrição
select id, status from public.client_subscriptions
where company_id = '<COMPANY_A_UUID>';
-- expect: >= 0 rows

-- F) Cliente A NÃO consegue alterar subscrição
update public.client_subscriptions
set status = 'cancelled'
where company_id = '<COMPANY_A_UUID>';
-- expect: ERROR permission denied or 0 rows updated

-- G) Cliente A vê invoices/payments próprios
select id, status from public.invoices where company_id = '<COMPANY_A_UUID>';
select id, status from public.payments where company_id = '<COMPANY_A_UUID>';
-- expect: rows only for company A

-- H) Cliente A NÃO vê invoices/payments de B
select id from public.invoices where company_id = '<COMPANY_B_UUID>';
select id from public.payments where company_id = '<COMPANY_B_UUID>';
-- expect: 0 rows

-- I) Cliente A não vê activity_logs
select id from public.activity_logs limit 5;
-- expect: 0 rows

-- J) Cliente A não vê leads internos
select id from public.leads limit 5;
-- expect: 0 rows

-- K) Staff atribuído à empresa A vê A
set local request.jwt.claim.sub = '<STAFF_USER_UUID>';
select id, name from public.companies where id = '<COMPANY_A_UUID>';
-- expect: 1 row (if staff assigned to A or no assignments = global)

-- L) Staff atribuído à A NÃO vê B (when assignments exist for A only)
select id, name from public.companies where id = '<COMPANY_B_UUID>';
-- expect: 0 rows when staff has assignment only to A

-- M) OWNER vê ambas
set local request.jwt.claim.sub = '<OWNER_USER_UUID>';
select id, name from public.companies
where id in ('<COMPANY_A_UUID>', '<COMPANY_B_UUID>');
-- expect: 2 rows

-- N) ADMIN vê ambas
set local request.jwt.claim.sub = '<ADMIN_USER_UUID>';
select id, name from public.companies
where id in ('<COMPANY_A_UUID>', '<COMPANY_B_UUID>');
-- expect: 2 rows

-- O) Anónimo não consulta profiles
reset role;
set local role anon;
select id from public.profiles limit 1;
-- expect: permission denied or 0 rows (RLS + no grant)
*/
