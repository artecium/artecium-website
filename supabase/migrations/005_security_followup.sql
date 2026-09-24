-- Artecium Platform — security follow-up (services & project_statuses RLS)
-- Run AFTER 001, 002, 003 and 004
-- Incremental: enables RLS on catalog tables identified in post-004 audit.
-- Does not alter subscriptions, staff assignments, CRM, entitlements, or discounts.

-- ===========================================================================
-- 1. public.services — catalog read-only for authenticated; owner/admin write
-- ===========================================================================

alter table public.services enable row level security;

-- Deny anon/public direct access (RLS alone blocks anon without policies;
-- explicit revoke aligns with 004 profiles hardening).
revoke all on public.services from anon;
revoke all on public.services from public;
grant select on public.services to authenticated;

drop policy if exists "Authenticated read active services" on public.services;
create policy "Authenticated read active services" on public.services
  for select to authenticated
  using (is_active = true or public.is_owner_or_admin());

drop policy if exists "Owner admin insert services" on public.services;
create policy "Owner admin insert services" on public.services
  for insert to authenticated
  with check (public.is_owner_or_admin());

drop policy if exists "Owner admin update services" on public.services;
create policy "Owner admin update services" on public.services
  for update to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Owner admin delete services" on public.services;
create policy "Owner admin delete services" on public.services
  for delete to authenticated
  using (public.is_owner_or_admin());

comment on table public.services is
  'Service catalog. RLS: authenticated SELECT (active); owner/admin INSERT/UPDATE/DELETE.';

-- ===========================================================================
-- 2. public.project_statuses — reference read; owner/admin write
-- ===========================================================================

alter table public.project_statuses enable row level security;

revoke all on public.project_statuses from anon;
revoke all on public.project_statuses from public;
grant select on public.project_statuses to authenticated;

drop policy if exists "Authenticated read project statuses" on public.project_statuses;
create policy "Authenticated read project statuses" on public.project_statuses
  for select to authenticated
  using (is_active = true or public.is_owner_or_admin());

drop policy if exists "Owner admin insert project statuses" on public.project_statuses;
create policy "Owner admin insert project statuses" on public.project_statuses
  for insert to authenticated
  with check (public.is_owner_or_admin());

drop policy if exists "Owner admin update project statuses" on public.project_statuses;
create policy "Owner admin update project statuses" on public.project_statuses
  for update to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

drop policy if exists "Owner admin delete project statuses" on public.project_statuses;
create policy "Owner admin delete project statuses" on public.project_statuses
  for delete to authenticated
  using (public.is_owner_or_admin());

comment on table public.project_statuses is
  'Project status reference. RLS: authenticated SELECT (active); owner/admin INSERT/UPDATE/DELETE.';

-- ===========================================================================
-- AUDIT NOTE (this migration)
-- ===========================================================================
--
-- ADDRESSED (post-004 audit):
--   - services: RLS + scoped read + owner/admin write only
--   - project_statuses: RLS + scoped read + owner/admin write only
--
-- DEFERRED (documented for future migration):
--   - staff_company_assignments global fallback for staff without rows
--   - leads/referrals with company_id IS NULL visible to all staff
--   - activity_logs with company_id IS NULL readable by all staff
--   - subscription_entitlements / subscription_feature_overrides staff write scope
--   - discounts global management by finance roles
--
-- HELPERS USED (defined in 003/004, not recreated here):
--   - is_owner_or_admin()
--
-- NO USING(true) ON WRITE POLICIES.
-- NO anon/public GRANTS (explicit REVOKE + authenticated SELECT only).

-- ===========================================================================
-- SECURITY VERIFICATION QUERIES
-- Run manually in Supabase SQL Editor after applying this migration.
-- Replace <OWNER_USER_UUID>, <CLIENT_USER_UUID> as needed for JWT tests.
-- ===========================================================================

/*
-- 1. RLS enabled on both tables
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('services', 'project_statuses');
-- Expected: both rls_enabled = true

-- 2. Policies exist
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('services', 'project_statuses')
ORDER BY tablename, policyname;
-- Expected: 4 policies per table (1 SELECT + 3 write ops for owner/admin)

-- 3. No USING(true) on write policies for these tables
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('services', 'project_statuses')
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  AND (qual = 'true' OR with_check = 'true');
-- Expected: 0 rows

-- 4. Grants anon/public revoked
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('services', 'project_statuses')
  AND grantee IN ('anon', 'public');
-- Expected: 0 rows

-- 5. Authenticated has SELECT
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('services', 'project_statuses')
  AND grantee = 'authenticated'
  AND privilege_type = 'SELECT';
-- Expected: 2 rows (one per table)

-- 6. Client authenticated — read catalog (run with client JWT)
SELECT id, slug, name FROM public.services WHERE is_active = true LIMIT 5;
SELECT id, slug, label FROM public.project_statuses WHERE is_active = true LIMIT 5;
-- Expected: rows returned

-- 7. Client authenticated — cannot write (run with client JWT)
INSERT INTO public.services (slug, name, category) VALUES ('test-x', 'Test', 'web');
UPDATE public.services SET name = 'Hacked' WHERE slug = 'website';
DELETE FROM public.services WHERE slug = 'test-x';
INSERT INTO public.project_statuses (slug, label, color) VALUES ('test-x', 'Test', '#000');
-- Expected: permission denied or RLS violation for each

-- 8. Owner/admin — can manage (run with owner/admin JWT)
-- INSERT/UPDATE/DELETE on services and project_statuses should succeed
-- when is_owner_or_admin() returns true for the session user.

-- 9. Staff normal (non owner/admin) — read only, no write
-- SELECT: succeeds for active rows
-- INSERT/UPDATE/DELETE: permission denied
*/
