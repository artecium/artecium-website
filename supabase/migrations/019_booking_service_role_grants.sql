-- Artecium Booking — service_role grants (least privilege) for server scripts
-- Run AFTER 017_booking_public_idempotency_pgcrypto.sql
--
-- 012/013 grant booking tables to authenticated only; service_role bypasses RLS but needs ACL.
-- See docs/booking/PERMISSIONS_FIX_SECURITY_REVIEW.md.
--
-- Idempotent: GRANT is additive. Does not REVOKE anon/authenticated, change RLS, or ownership.

-- Full DML: seed + integration admin (10 tables)
grant select, insert, update, delete on table public.booking_businesses to service_role;
grant select, insert, update, delete on table public.booking_business_members to service_role;
grant select, insert, update, delete on table public.booking_business_subscriptions to service_role;
grant select, insert, update, delete on table public.booking_services to service_role;
grant select, insert, update, delete on table public.booking_staff to service_role;
grant select, insert, update, delete on table public.booking_staff_services to service_role;
grant select, insert, update, delete on table public.booking_working_hours to service_role;
grant select, insert, update, delete on table public.booking_staff_breaks to service_role;
grant select, insert, update, delete on table public.booking_time_off to service_role;
grant select, insert, update, delete on table public.booking_appointments to service_role;

-- Readiness schema probes only (no service_role DML in repo scripts)
grant select on table public.booking_customers to service_role;
grant select on table public.booking_member_invites to service_role;

-- Hash helper: EXECUTE for anon/authenticated only (015); readiness probes via anon client.
