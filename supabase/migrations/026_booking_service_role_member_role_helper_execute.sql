-- Grant EXECUTE on member-role normalizer to service_role only (seed / integration).
-- Run AFTER 021_booking_member_role_phase1_meta.sql (REVOKE from PUBLIC).
-- Idempotent: GRANT is additive; does not grant anon or authenticated.

grant execute on function public.booking_normalize_member_role_text(text) to service_role;