-- One-time helper for demo seed / server-side admin scripts.
-- Run in Supabase SQL Editor if npm run db:seed:demo fails with
-- "permission denied for table ..." errors.
--
-- Does NOT change RLS policies. Only restores Data API table grants for service_role.
-- Grants are limited to public tables accessed by scripts/seed-demo-data.mjs.

grant usage on schema public to service_role;

-- Auth & org
grant select, insert, update, delete on table public.roles to service_role;
grant select, insert, update, delete on table public.user_roles to service_role;
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.companies to service_role;
grant select, insert, update, delete on table public.company_users to service_role;
grant select, insert, update, delete on table public.staff_company_assignments to service_role;

-- Services & subscriptions
grant select, insert, update, delete on table public.services to service_role;
grant select, insert, update, delete on table public.service_plans to service_role;
grant select, insert, update, delete on table public.service_features to service_role;
grant select, insert, update, delete on table public.client_subscriptions to service_role;
grant select, insert, update, delete on table public.subscription_feature_overrides to service_role;
grant select, insert, update, delete on table public.usage_records to service_role;

-- Projects
grant select, insert, update, delete on table public.project_statuses to service_role;
grant select, insert, update, delete on table public.projects to service_role;
grant select, insert, update, delete on table public.project_status_history to service_role;
grant select, insert, update, delete on table public.project_milestones to service_role;
grant select, insert, update, delete on table public.project_members to service_role;
grant select, insert, update, delete on table public.tasks to service_role;

-- Finance
grant select, insert, update, delete on table public.invoices to service_role;
grant select, insert, update, delete on table public.invoice_items to service_role;
grant select, insert, update, delete on table public.payments to service_role;
grant select, insert, update, delete on table public.company_payment_providers to service_role;

-- Support
grant select, insert, update, delete on table public.tickets to service_role;
grant select, insert, update, delete on table public.ticket_messages to service_role;

-- Documents & reporting
grant select, insert, update, delete on table public.documents to service_role;
grant select, insert, update, delete on table public.reports to service_role;

-- Analytics & SEO
grant select, insert, update, delete on table public.analytics_connections to service_role;
grant select, insert, update, delete on table public.analytics_data to service_role;
grant select, insert, update, delete on table public.seo_connections to service_role;
grant select, insert, update, delete on table public.seo_data to service_role;

-- Client comms
grant select, insert, update, delete on table public.notifications to service_role;
grant select, insert, update, delete on table public.meetings to service_role;
grant select, insert, update, delete on table public.feedback to service_role;
