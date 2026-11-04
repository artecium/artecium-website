# Artecium Booking — implementation status

Last reviewed against product spec (2026-03-30).

## Architecture decision: tenant model

Booking uses **`booking_businesses`** (optional `company_id` → agency `companies`), not a duplicate of the agency company row. Catalog tables are **`booking_services`** / **`booking_staff`** — separate from agency **`services`** / subscriptions catalog.

## Routing (two private entry points + public host)

| Area | URLs | Internal App Router |
|------|------|---------------------|
| Booking host admin | `booking.artecium.com/dashboard`, … | `/booking/admin/*` |
| Client portal booking | `/client/booking/dashboard`, … | Re-exports `/booking/admin/*` pages with `/client/booking` shell |
| Public booking | `booking.artecium.com/{slug}` | `/booking/b/[slug]` |

See `src/lib/routing/booking-host.ts`, `docs/booking/PHASE1_TECHNICAL_SPEC.md`.

## Migrations (not applied by this doc)

| File | Purpose |
|------|---------|
| `012_booking_foundation.sql` | Schema, RLS, overlap EXCLUDE, public RPCs |
| `013_booking_security_invites.sql` | Team invites |
| `014_booking_membership_hardening.sql` | Membership helpers |
| `015_booking_public_rpc_hardening.sql` | Hardened public create |
| `016_booking_public_catalog_slots.sql` | Public catalog + day slots RPCs |
| `017_booking_public_idempotency_pgcrypto.sql` | Idempotency |
| `020_booking_member_role_professional_compat.sql` | Phase 1: `professional` role + `staff` compat (**AUTH-03** to apply) |
| `021_booking_member_role_phase1_meta.sql` | Phase 1 metadata / grants |

Apply locally: `supabase db push` or run SQL in order on a **test** project only. **019** requires **AUTH-02**; **020+** requires **AUTH-03**.

## Phase 1 (AUTH-01 — in repo, not necessarily applied)

See `docs/booking/PHASE1_ROLE_PROFESSIONAL.md`. Member role **`professional`** replaces tenant role **`staff`** (one-release compat). **`booking_staff`** table unchanged.

## Implemented (end-to-end)

- Private admin: dashboard, calendar, appointments, services, staff, schedules, time-off, customers, team, settings, onboarding
- Public wizard: service → staff → date → slots → contact → submit (RPC + server validation)
- Availability engine: `src/lib/booking/availability.ts` + SQL slot RPCs
- Concurrency: GiST overlap on appointments; public create transactional; idempotency keys
- Auth: `requireBookingSession`, RLS via `booking_business_members`, roles owner/manager/professional (legacy staff normalized in app)
- i18n: `booking.*` in `en.json` / `pt-PT.json`
- Tests: `npm run test:booking-unit` (routing, availability, actions guards, public flow, area-access)

## Partial / not in MVP

| Item | Status |
|------|--------|
| Agency subscription gating | `booking_business_subscriptions` stub; not wired to `service_plans` entitlements |
| Email notifications | Guest status emails on confirm/reject/cancel when `EMAIL_PROVIDER=resend` + `BOOKING_EMAIL_FROM` / `RESEND_API_KEY`; skipped otherwise |
| Payments per appointment | Columns reserved; no Stripe checkout |
| Guest self-service cancel/reschedule links | Not implemented |
| In-app notification center entries for booking | Not implemented |

## Environment (no secret values)

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, publishable key, `SUPABASE_SERVICE_ROLE_KEY` (server/scripts only)
- Email (optional): `EMAIL_PROVIDER`, `RESEND_API_KEY`, `BOOKING_EMAIL_FROM` or `EMAIL_FROM`
- Hosts (dev): `NEXT_PUBLIC_APP_URL`, portal/booking host headers via proxy

## Local test procedure

1. Apply migrations 012–017 on local Supabase.
2. `npm run dev` — use `/booking/admin/onboarding` or `/client/booking/onboarding` (booking membership required).
3. Seed: `npm run db:seed:booking-integration` (guarded; see script env flags).
4. Public: `/booking/b/{slug}` or `booking.artecium.com/{slug}` with rewrite.
5. `npm run test:booking-unit` — no DB required for most checks.
6. With DB: `npm run test:booking-integration`, `npm run test:booking-rls`.

## Before production

- SQL review + apply migrations on staging
- Configure booking host DNS + Vercel rewrites (existing docs; no auto-deploy)
- Rate limits / WAF on public RPC paths
- Email provider + templates (PT/EN)
- Product decision: subscription gating vs open business creation (see `PLATFORM_ADMIN_AND_ONBOARDING.md`)
