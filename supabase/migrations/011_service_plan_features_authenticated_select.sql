-- Artecium Platform — authenticated SELECT on service_plan_features (006 follow-up)
-- Run AFTER 001–010
--
-- Problem: get_subscription_entitlements / get_service_plan_features (002) read
-- public.service_plan_features as SECURITY INVOKER. PostgREST returns 42501
-- "permission denied for table service_plan_features" when authenticated lacks
-- table-level SELECT, even though RLS policy "Auth read plan features" (002) exists.
--
-- This migration:
--   - Grants SELECT ON TABLE public.service_plan_features TO authenticated only
--   - Revokes anon/public direct table access (aligns with 006 hardening)
--   - Does NOT alter RLS policies
--   - Does NOT alter SQL functions
--
-- Access control remains: RLS "Auth read plan features" (002) — catalog read for
-- authenticated users only; subscription scope is enforced via client_subscriptions
-- and related policies when resolving entitlements.

revoke all on public.service_plan_features from anon;
revoke all on public.service_plan_features from public;
grant select on table public.service_plan_features to authenticated;

comment on schema public is
  '011: authenticated SELECT grant on service_plan_features; RLS unchanged.';

-- ===========================================================================
-- VERIFICATION (run manually after apply)
-- ===========================================================================
/*
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'service_plan_features'
  AND grantee = 'authenticated';
-- Expected: 1 row, privilege_type = SELECT

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'service_plan_features'
  AND grantee IN ('anon', 'public');
-- Expected: 0 rows
*/
