-- Fix public booking create: digest() lives in extensions schema on Supabase.
-- Without search_path including extensions, booking_public_create_appointment fails with SQLSTATE 42883.

create or replace function public.booking_public_idempotency_request_hash(
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz
)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select encode(
    digest(
      p_service_id::text || '|' || p_staff_id::text || '|' ||
      (extract(epoch from p_starts_at) * 1000)::bigint::text,
      'sha256'::text
    ),
    'hex'
  );
$$;
