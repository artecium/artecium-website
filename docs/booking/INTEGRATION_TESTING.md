# Booking — integration validation runbook

**Production Supabase is forbidden** for seed, integration tests, and migration trials.  
Allowed targets:

| Target | Remote flag | Project ref |
|--------|-------------|-------------|
| Local `http://127.0.0.1:54321` | Not required | — |
| Hosted **test** project | `BOOKING_ALLOW_REMOTE_TESTS=1` | Must be in `BOOKING_ALLOWLISTED_PROJECT_REFS` (`scripts/booking-integration-fixtures.mjs`) |

Guards live in `scripts/booking-test-guards.mjs` (static checks: `npm run verify:booking-test-guards`).

---

## 1. Dedicated env file (sandbox — no Docker)

**Use:** `.env.booking.sandbox.local` (template: `.env.booking.sandbox.local.example`).  
**Do not use** `.env.booking.test.local` or production ref `bwxhdoxesqtdqwkxrmom` for Booking remote tests.

1. Copy/fill sandbox keys (never commit).
2. Required flags: `BOOKING_SANDBOX_ENV_LOADED=1`, `BOOKING_ALLOW_REMOTE_TESTS=1`, `BOOKING_EXPECTED_PROJECT_REF=ahbtpmlrzruwtfcichlg`.
3. URL must be `https://ahbtpmlrzruwtfcichlg.supabase.co`.

Guards reject protected refs even with remote flags (`scripts/booking-test-guards.mjs`).

---

## 2. Migrations

Platform baseline **001–011**, then Booking **012–026** (incl. guest manage `024`, idempotency order `025`, member-role helper `026`). Harness `023` is test-only schema — not required on production Booking.

**Execution plan (test DB, no data wipe):** `MIGRATION_012_016_EXECUTION_PLAN.md`.

Apply migrations only after explicit approval — not part of routine unit tests.

---

## 3. Read-only readiness (hosted test)

Probes tables/RPCs; **no writes**. Requires guards + allowlisted test project ref.

### Booking objects only (`012`–`016`)

```powershell
$env:BOOKING_DB_READINESS = "1"
node --env-file=.env.booking.sandbox.local scripts/booking-db-readiness.mjs
```

Or: `npm run check:booking-db-readiness` (with env loaded).

### Platform dependencies + Booking (before first `012` migration)

```powershell
$env:BOOKING_PLATFORM_READINESS = "1"
node --env-file=.env.booking.sandbox.local scripts/booking-platform-dependencies-readiness.mjs
```

Or: `npm run check:booking-platform-dependencies`.

- **REST:** agency tables (`profiles`, `companies`, …) and Booking probes. `staff_company_assignments` uses `user_id,company_id` (composite PK — no `id` column).
- **PostgreSQL SELECT (optional):** `btree_gist`, `pgcrypto`, `set_updated_at()`, `is_owner_or_admin()`, and `supabase_migrations.schema_migrations` when `SUPABASE_DB_PASSWORD` or `DATABASE_URL` is set — same optional pattern as `seed-demo-data.mjs`. Without DB password, catalog checks report **`unknown`**, not `ok` or `missing`.
- JSON field **`bookingBaseline`** summarises confirmed absent/present Booking objects (012–016 probes).
- Output JSON groups **`confirmedPresent`**, **`confirmedAbsent`**, **`notVerifiable`**, and **`errors`**, plus per-migration **`summary`**.

**Status:** this script is implemented and covered by static tests (`npm run verify:booking-platform-readiness`). It has **not** been executed against the hosted test Supabase in repo CI; run locally only after explicit approval.

Exit code `1` if platform tables are missing or probe errors occur.

---

## 4. Unit tests (no database)

```powershell
npx tsc --noEmit
npm run test:booking-unit
npm run verify:portal-routing
npm run verify:booking-test-guards
```

Includes routing, availability TS, public idempotency/slot helpers, and guard allowlist behaviour.

---

## 5. Integration seed (mutates test DB)

Deterministic fixture: two businesses, `@artecium.test` users, hours/breaks/time off, appointments.

```powershell
$env:BOOKING_SEED = "1"
node --env-file=.env.booking.sandbox.local scripts/seed-booking-integration.mjs
```

Or `npm run db:seed:booking-integration` with the same env file loaded in the shell.

- Requires `BOOKING_TEST_PASSWORD` (≥12 chars).
- Deletes only businesses tagged `integration_marker: artecium-booking-integration-v1` (cascade on booking children).
- Creates auth users via Admin API if missing.

**Run only after migrations 012–016 and explicit approval.**

---

## 6. Integration tests

```powershell
$env:BOOKING_INTEGRATION_TEST = "1"
node --env-file=.env.booking.sandbox.local scripts/booking-integration-test.mjs
```

Or: `BOOKING_INTEGRATION_TEST=1 npm run test:booking-integration` (with `node --env-file=…` wrapper as in CI).

**Run only after seed and explicit approval.**

### Other sandbox validations (opt-in)

| Script | Env flag |
|--------|-----------|
| `booking-public-e2e-smoke.mjs` | `BOOKING_PUBLIC_E2E_SMOKE=1` |
| `booking-sandbox-guest-reschedule-validate.mjs` | `BOOKING_SANDBOX_GUEST_RESCHEDULE_VALIDATE=1` |
| `booking-member-role-integration.mjs` | `BOOKING_MEMBER_ROLE_INTEGRATION_TEST=1` (+ optional `SUPABASE_DB_PASSWORD` for 020 catalog probe) |
| `test:booking-phase2-harness-full` | Local only (embedded Postgres) |
| `verify:booking-phase2-persistent-harness` | Local only |

---

## 7. Legacy RLS smoke

Optional; two custom users (`BOOKING_RLS_USER_A_*` / `B_*`). Same guards and env file as above.

---

## Unit vs integration

| | Unit | Readiness | Seed / integration |
|---|------|-----------|---------------------|
| Postgres | No | Read-only | Read/write |
| Remote test OK | N/A | With allowlist + flag | With allowlist + flag |
| CI default | Yes | Opt-in | Opt-in |

---

## Known gaps

`INTEGRATION_TEST_COVERAGE.md` — invites, DST, platform admin, load tests.

## Related

- `RLS_TESTING.md` — manual matrix  
- `PHASE3_PUBLIC_BOOKING.md` — migration 016  
- `LOCAL_ENV_STATUS.md` — local Docker audit (optional path)
