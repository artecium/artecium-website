# Artecium Booking — Phase 1 Technical Specification

## Repository baseline (verified)

- Supabase migrations `001`–`011` present; agency catalog uses `services` / `service_plans` (not booking).
- Client portal: `client.artecium.com` → `src/app/client/**` via `portal-host.ts` + `proxy.ts`.
- No prior `booking_*` tables or routes.

## Tenant model

- **`booking_businesses`**: booking tenant (public `slug`, timezone, confirmation mode, rules). Optional `company_id` → `companies` for agency linkage only.
- **`booking_business_members`**: authenticated users with roles `owner` | `manager` | `staff`.
- **`booking_staff`**: bookable resources; optional `profile_id` when the professional logs in.
- Agency **`services`** remain unchanged and unrelated to **`booking_services`**.

## Auth & permissions

| Actor | Access |
|-------|--------|
| Business member | CRUD scoped by `booking_member_business_ids()` |
| Artecium owner/admin | Full booking data via `booking_is_platform_admin()` |
| Artecium staff (assigned) | Only if `company_id` link + `staff_can_access_company` (optional path) — default deny on booking unless platform admin or explicit member |
| Public (anon) | No direct table access; `booking_public_*` RPCs only |

## RLS summary

- All `booking_*` tables: RLS enabled, `REVOKE ALL` from `anon` / `public`.
- `GRANT SELECT, INSERT, UPDATE, DELETE` to `authenticated` where policies allow (Phase 1 migration).
- Overlap: GiST `EXCLUDE` on `booking_appointments` for active statuses per `staff_id`.

## Host routing (`booking.artecium.com`)

| Public URL | Internal route |
|------------|----------------|
| `/dashboard`, `/calendar`, … | `/booking/admin/{segment}` |
| `/login` | `/login` (shared) |
| `/{business-slug}` | `/booking/b/{slug}` |
| `/` | `/booking/admin/dashboard` (rewrite) |

Reserved slugs cannot be used as business slugs (enforced in app + check constraint list in code).

## Server APIs (Phase 1)

- SQL RPCs: `booking_public_get_business`, `booking_public_create_appointment` (transactional + idempotency).
- TypeScript: `src/lib/booking/availability.ts` (slot generation, timezone via `Temporal` or `date-fns-tz` — use Intl/manual for zero deps: UTC storage + business timezone string).

## Notifications & payments (later phases)

- `booking_appointments.payment_status` + `stripe_checkout_session_id` nullable columns reserved.
- `booking_business_subscriptions` stub for plan gating (inactive until Phase 5).

## Tests (Phase 1)

- `npm run verify:booking-routing`
- `npm run verify:booking-availability`
- `npm run verify:portal-routing` (regression)

Remote Supabase: **do not apply** migrations until SQL review.
