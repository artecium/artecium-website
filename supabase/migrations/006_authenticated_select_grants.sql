-- Artecium Platform — authenticated SELECT grants for client-facing tables
-- Run AFTER 001, 002, 003, 004 and 005
--
-- Problem addressed: PostgREST returns "permission denied for table …" for the
-- authenticated role on several tables that already have RLS SELECT policies.
-- Table-level GRANT SELECT is required in addition to RLS (PostgreSQL checks
-- GRANT before RLS).
--
-- This migration:
--   - Grants SELECT ON TABLE … TO authenticated only
--   - Revokes anon/public direct table access (aligns with 004/005 hardening)
--   - Does NOT alter RLS policies
--   - Does NOT grant INSERT/UPDATE/DELETE to authenticated
--   - Does NOT grant anything to anon
--
-- Access control remains enforced by existing policies in 002–004, e.g.:
--   - service_plans: "Auth read service plans" (002)
--   - client_subscriptions: "Company read subscriptions" (002)
--   - usage_records: "Company read usage" (002) + "Staff read usage" (004)
--   - project_* / tasks: company/staff scoped read policies (003/004)
--   - invoices / invoice_items / payments: company read policies (003)
--   - tickets / ticket_messages: company read policies (003)
--   - documents / reports / notifications / meetings / feedback: company/user scoped (003/004)
--   - analytics_data / seo_data: connection-scoped read via company (003)
--   - subscription_feature_overrides / subscription_entitlements: company read (003/004)
--
-- NOT included (already have authenticated SELECT via prior migrations):
--   - public.services (005)
--   - public.project_statuses (005)
--   - public.profiles (004 — SELECT + UPDATE)
--   - public.analytics_connections (004 — column-level SELECT grant)
--   - public.seo_connections (004 — column-level SELECT grant)
--   - public.payment_methods (004 — column-level SELECT grant)
--
-- Tables below already worked for demo client without this migration (likely
-- default Supabase grants); omitted here per incremental scope:
--   companies, company_users, projects, client_subscriptions, invoices,
--   tickets, documents, notifications

-- ===========================================================================
-- Catalog & subscriptions (frontend: services page, entitlements, usage)
-- ===========================================================================

revoke all on public.service_plans from anon;
revoke all on public.service_plans from public;
grant select on table public.service_plans to authenticated;

revoke all on public.service_features from anon;
revoke all on public.service_features from public;
grant select on table public.service_features to authenticated;

revoke all on public.subscription_feature_overrides from anon;
revoke all on public.subscription_feature_overrides from public;
grant select on table public.subscription_feature_overrides to authenticated;

revoke all on public.subscription_entitlements from anon;
revoke all on public.subscription_entitlements from public;
grant select on table public.subscription_entitlements to authenticated;

revoke all on public.usage_records from anon;
revoke all on public.usage_records from public;
grant select on table public.usage_records to authenticated;

-- ===========================================================================
-- Project delivery (frontend: dashboard, projects detail — future pages)
-- ===========================================================================

revoke all on public.project_status_history from anon;
revoke all on public.project_status_history from public;
grant select on table public.project_status_history to authenticated;

revoke all on public.project_milestones from anon;
revoke all on public.project_milestones from public;
grant select on table public.project_milestones to authenticated;

revoke all on public.project_members from anon;
revoke all on public.project_members from public;
grant select on table public.project_members to authenticated;

revoke all on public.tasks from anon;
revoke all on public.tasks from public;
grant select on table public.tasks to authenticated;

-- ===========================================================================
-- Finance (frontend: invoices, payments pages)
-- ===========================================================================

revoke all on public.invoice_items from anon;
revoke all on public.invoice_items from public;
grant select on table public.invoice_items to authenticated;

revoke all on public.payments from anon;
revoke all on public.payments from public;
grant select on table public.payments to authenticated;

-- ===========================================================================
-- Support (frontend: support page, ticket threads)
-- ===========================================================================

revoke all on public.ticket_messages from anon;
revoke all on public.ticket_messages from public;
grant select on table public.ticket_messages to authenticated;

-- ===========================================================================
-- Reporting & comms (frontend: reports, meetings, feedback pages)
-- ===========================================================================

revoke all on public.reports from anon;
revoke all on public.reports from public;
grant select on table public.reports to authenticated;

revoke all on public.meetings from anon;
revoke all on public.meetings from public;
grant select on table public.meetings to authenticated;

revoke all on public.feedback from anon;
revoke all on public.feedback from public;
grant select on table public.feedback to authenticated;

-- ===========================================================================
-- Analytics & SEO metrics (frontend: analytics, seo pages)
-- ===========================================================================

revoke all on public.analytics_data from anon;
revoke all on public.analytics_data from public;
grant select on table public.analytics_data to authenticated;

revoke all on public.seo_data from anon;
revoke all on public.seo_data from public;
grant select on table public.seo_data to authenticated;

comment on schema public is
  '006: authenticated SELECT grants on client-facing tables; RLS unchanged.';

-- ===========================================================================
-- VERIFICATION (run manually after apply)
-- ===========================================================================
/*
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND privilege_type = 'SELECT'
  AND table_name IN (
    'service_plans', 'service_features', 'subscription_feature_overrides',
    'subscription_entitlements', 'usage_records', 'project_status_history',
    'project_milestones', 'project_members', 'tasks', 'invoice_items',
    'payments', 'ticket_messages', 'reports', 'meetings', 'feedback',
    'analytics_data', 'seo_data'
  )
ORDER BY table_name;
-- Expected: 17 rows

SELECT grantee, table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'service_plans', 'meetings', 'analytics_data'
  )
  AND grantee IN ('anon', 'public');
-- Expected: 0 rows
*/
