-- Artecium Booking — Phase 1 metadata (no RLS / scope changes)

comment on column public.booking_business_members.role is
  'Tenant membership: owner | manager | professional. Legacy input staff is normalized to professional until migration 035.';

comment on column public.booking_member_invites.role is
  'Team invite: manager | professional. Legacy staff normalized on write until migration 035.';

revoke all on function public.booking_normalize_member_role_text(text) from public;
grant execute on function public.booking_normalize_member_role_text(text) to authenticated;

comment on schema public is
  '021: Phase 1 professional role documented; booking_normalize_member_role_text granted to authenticated.';
