-- Test / seed support only — NOT a substitute for a versioned migration.
-- Context: 021 revokes EXECUTE on public.booking_normalize_member_role_text from PUBLIC.
-- Direct PostgREST inserts (service_role) fire booking_trg_normalize_member_role as INVOKER,
-- so service_role needs EXECUTE on the immutable SQL helper (no broad grants to anon/authenticated).
--
-- Run only on allowlisted Booking TEST Supabase projects (see booking-test-guards.mjs).

grant execute on function public.booking_normalize_member_role_text(text) to service_role;