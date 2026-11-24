# Booking migrations 012–016 — execution plan (test Supabase)

**Scope:** apply on the allowlisted test project only (`bwxhdoxesqtdqwkxrmom`).  
**Not in this doc:** running SQL — execute only after explicit approval and a successful `check:booking-db-readiness`.

## Preconditions

1. Agency migrations **001–011** already applied (demo/portal depends on them).
2. Run read-only readiness **before** and **after** each batch:

```powershell
$env:BOOKING_DB_READINESS = "1"
node --env-file=.env.booking.test.local scripts/booking-db-readiness.mjs
```

3. Prefer applying via Supabase Dashboard SQL Editor or `supabase db push` **linked to the test project** — never production.

## Idempotency & data safety

| File | Destructive to existing agency data? | Re-run safety | Notes |
|------|--------------------------------------|---------------|-------|
| **012** | No agency table drops | Mostly safe | `create table if not exists`, `create or replace` functions, (re)creates policies/triggers on **booking_** tables only |
| **013** | No | Mostly safe | Adds `booking_member_invites`, columns/trigger on `booking_appointments`, replaces public RPC |
| **014** | No | Careful | **Drops** policy `Booking managers write membership` and **drops/recreates** `booking_accept_member_invite` — does not delete rows |
| **015** | No | Safe | Adds column `idempotency_request_hash`, replaces validation + `booking_public_create_appointment` |
| **016** | No | Safe | Only `create or replace` public catalog/slot RPCs |

**Does not:** `drop table` on agency or booking data, `truncate`, or `db reset`.  
**Existing booking rows:** if 012 was partially applied before, re-running 012 uses `IF NOT EXISTS` — no duplicate tables.  
**014 membership policy:** after 014, direct `INSERT` into `booking_business_members` by owners/managers is denied (invite flow only).

## Recommended order (do not skip)

1. `012_booking_foundation.sql`
2. `013_booking_security_invites.sql`
3. `014_booking_membership_hardening.sql`
4. `015_booking_public_rpc_hardening.sql`
5. `016_booking_public_catalog_slots.sql`

Apply **one file at a time**. If a statement fails, stop and fix before continuing (avoid half-applied 013 overlap trigger).

## Per-step verification (read-only)

After each migration file:

| Step | Readiness signals |
|------|-------------------|
| After 012 | `booking_businesses`, `booking_appointments`, `rpc:booking_public_get_business` → ok |
| After 013 | `booking_member_invites`, `appointments.blocked_starts_at` → ok |
| After 014 | No new table probe; re-run integration tests for membership insert denial |
| After 015 | `appointments.idempotency_request_hash`, `rpc:booking_validate_public_slot` → ok |
| After 016 | `rpc:booking_public_list_services`, `rpc:booking_public_list_day_slots` → ok |

## If objects already exist

- **012 already applied:** re-running may recreate policies/triggers (`drop … if exists` then `create`) — acceptable on test DB.
- **013 blocked columns already NOT NULL:** migration may no-op or error on constraint steps — compare readiness probes instead of blind re-run.
- **015/016 function-only:** safe to re-apply; replaces function bodies only.

## After all five

1. `npm run check:booking-db-readiness` (when wired with env file).
2. `BOOKING_SEED=1` → `npm run db:seed:booking-integration` (creates integration data; deletes prior seed by marker only).
3. `BOOKING_INTEGRATION_TEST=1` → `npm run test:booking-integration`.
4. Regression: `npm run db:verify:demo` (agency demo on same test project).

## Rollback

No automated rollback in repo. On test project only, rollback is manual (drop booking tables/functions) — **avoid** unless necessary; prefer fixing forward.
