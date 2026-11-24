# Artecium Booking — Phase 2 (local implementation)

## Scope delivered in repo

- Admin shell on `booking.artecium.com` paths (via existing proxy rewrites), separate from agency portal nav.
- Onboarding via RPC `booking_create_business_with_owner` (requires migrations `012` + `013` applied locally).
- Dashboard with live Supabase counts and upcoming appointments (empty states when no data).
- CRUD: services, staff (+ service links), working hours, breaks, time off.
- Calendar (day / week / month), appointments list with status updates.
- Settings: confirmation mode, public copy, notice windows, optional `company_id`.
- Team invites via `booking_create_member_invite` (link shown in UI; email not wired).
- Data layer under `src/lib/data/booking/`; server actions under `src/lib/actions/booking/`.
- PT/EN strings under `booking.*` in message files.

## Migrations

Apply locally only (not production):

1. `supabase/migrations/012_booking_foundation.sql`
2. `supabase/migrations/013_booking_security_invites.sql`
3. `supabase/migrations/014_booking_membership_hardening.sql`
4. `supabase/migrations/015_booking_public_rpc_hardening.sql`

See `MIGRATION_012_SECURITY_REVIEW.md` for the security review notes.

## RLS / isolation testing

**Not executed in CI** unless a local Postgres/Supabase instance is available. Without `DATABASE_URL` pointing at a DB with migrations applied, RLS policies are unverified at runtime.

Recommended manual matrix (two businesses A/B):

| Actor | Expect |
|-------|--------|
| User with no membership | Onboarding only |
| Owner | Full manage on own business |
| Manager | Manage on own business |
| Staff member | Read; no settings/team writes |
| Member of A | No rows from B (services, appointments, customers) |
| `anon` | Only public RPCs; no table SELECT |

## Known gaps (post–Phase 2)

- Public booking page (`/booking/b/[slug]`) remains Phase 1 placeholder.
- Invite accept route UI (`/team/accept`) not implemented; RPC `booking_accept_member_invite` exists in `013`.
- Public RPC does not yet validate working hours / breaks (noted for Phase 3).
- Subscription stub does not gate features (by product decision).
- Schedules page reloads hours when `?staff=` changes; initial SSR uses first staff if param missing.

## Verification commands

```bash
npx tsc --noEmit
npm run verify:portal-routing
npm run verify:booking-routing
npm run verify:booking-availability
npm run verify:booking-admin-links
```
