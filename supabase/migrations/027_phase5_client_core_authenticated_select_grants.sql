-- Artecium Platform — Phase 5.1: authenticated SELECT only on core client tables
-- Run AFTER 001–026 (requires 003/004 RLS and 006 pattern on sibling tables)
--
-- Grants only table-level privileges omitted in 006 (lines 35–38).
-- REVOKE authenticated removes Supabase default TRUNCATE/REFERENCES/TRIGGER (Dxt)
-- before granting minimal SELECT.
-- Does NOT change RLS policies.
-- Does NOT grant INSERT, UPDATE, DELETE to authenticated.
-- Does NOT grant privileges to anon or service_role.

-- companies
revoke all on table public.companies from anon;
revoke all on table public.companies from public;
revoke all on table public.companies from authenticated;
grant select on table public.companies to authenticated;

-- company_users (PK composite; no id column)
revoke all on table public.company_users from anon;
revoke all on table public.company_users from public;
revoke all on table public.company_users from authenticated;
grant select on table public.company_users to authenticated;

-- projects
revoke all on table public.projects from anon;
revoke all on table public.projects from public;
revoke all on table public.projects from authenticated;
grant select on table public.projects to authenticated;

-- client_subscriptions
revoke all on table public.client_subscriptions from anon;
revoke all on table public.client_subscriptions from public;
revoke all on table public.client_subscriptions from authenticated;
grant select on table public.client_subscriptions to authenticated;

-- invoices
revoke all on table public.invoices from anon;
revoke all on table public.invoices from public;
revoke all on table public.invoices from authenticated;
grant select on table public.invoices to authenticated;

-- documents
revoke all on table public.documents from anon;
revoke all on table public.documents from public;
revoke all on table public.documents from authenticated;
grant select on table public.documents to authenticated;

-- tickets
revoke all on table public.tickets from anon;
revoke all on table public.tickets from public;
revoke all on table public.tickets from authenticated;
grant select on table public.tickets to authenticated;

-- notifications
revoke all on table public.notifications from anon;
revoke all on table public.notifications from public;
revoke all on table public.notifications from authenticated;
grant select on table public.notifications to authenticated;