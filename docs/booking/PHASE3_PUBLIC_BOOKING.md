# Phase 3 — Public booking page

## Routes

| Host | Public URL | Internal |
|------|------------|----------|
| `booking.artecium.com` | `/{slug}` | `/booking/b/{slug}` |

## Data layer

- `src/lib/data/booking/public.ts` — RPC-only reads/writes (no direct anon table access).
- `src/lib/actions/booking/public.ts` — server actions for client steps (slots, submit).

## SQL (local migration **016**)

Apply after 012–015 on **local** Supabase only:

- `booking_public_list_services(slug)`
- `booking_public_list_staff_for_service(slug, service_id)` — display name only
- `booking_public_list_day_slots(slug, service_id, staff_id, local_date)` — uses `booking_validate_public_slot` per candidate; `staff_id` null = auto-assign scan

Submit uses existing `booking_public_create_appointment` (015).

## Runtime dependency

Public slots and booking **require**:

1. Migrations 001–011 + 012–**016** applied.
2. `NEXT_PUBLIC_SUPABASE_URL` and publishable key (dev/staging/local — **not production credentials in docs**).

Without DB:

- Page shows **not configured** or **load failed** — no fabricated slots.

## i18n

`booking.public.*` in `en.json` / `pt-PT.json`. Locale follows site cookie/`x-locale` on booking host.

## Tests (no DB)

- `npm run verify:booking-public-flow`
- Existing `verify:booking-idempotency`, `verify:booking-public-slot`, routing scripts

## Guest manage (migration 024)

- Route: `/booking/b/[slug]/manage?ref=<public_reference>&token=<manage_token>`
- Token returned once on successful `booking_public_create_appointment` (not on idempotent replay).

## Not in scope

- Payments (Stripe checkout columns exist but unused).

## Limitations

- RPC list-day-slots iterates grid in SQL — performance OK for one day; not load-tested at scale.
- **016 + RPCs not validated in runtime** until local Postgres available.
- Auto-assign exposes staff display name on slot when multiple staff share a time.
