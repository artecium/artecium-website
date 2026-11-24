# Migration 025 (+ 026) — publication plan (no deploy)

**Scope:** `025_booking_public_create_idempotency_before_slot.sql`, `026_booking_service_role_member_role_helper_execute.sql`.  
**Do not** edit `022`, `023`, or `024`. **Do not** `db push` production or change real customer data without a separate approval.

---

## Supabase projects (repo truth)

| Label | Project ref | Dashboard name (CLI) | In repo env |
|-------|-------------|----------------------|-------------|
| **Booking test** (allowlisted) | `bwxhdoxesqtdqwkxrmom` | Artecium | `.env.booking.test.local`, `.env.local`, `supabase/.temp/linked-project.json`, `BOOKING_ALLOWLISTED_PROJECT_REFS` |
| **Production** | *Not committed* | *Not linked in repo* | Docs warn against pointing `.env` at production; no production ref in versioned files |

**Note:** Supabase CLI may show `environment: production` for hosted projects; the **operational** distinction here is **allowlist + `BOOKING_EXPECTED_PROJECT_REF`**, not the CLI label.

---

## Audit: 025 vs 022–024

| Migration | Touches | Relation to 025 |
|-----------|---------|-----------------|
| **022** | RLS, `professional` scope, internal notes | Independent — no change to `booking_public_create_appointment` |
| **023** | `phase2_harness` schema | Independent |
| **024** | Guest manage RPCs; **`booking_public_create_appointment`** adds `manage_token_hash`; **order bug:** `booking_validate_public_slot` runs **before** idempotency lookup | **025 fixes only call order** inside the same function |
| **025** | Single `CREATE OR REPLACE` on `booking_public_create_appointment` + same `REVOKE`/`GRANT` as 024 | Moves service/staff load + idempotency block **before** `booking_validate_public_slot` |

### Safety / idempotency / existing reservations

- **DDL:** `CREATE OR REPLACE` only — no table/column changes, no deletes, no backfills.
- **Re-running 025:** Idempotent; final function body identical.
- **Existing rows:** Unchanged; replays return stored appointment without re-validating slot occupancy (intended).
- **New bookings:** Same validation path as 024 after idempotency miss.
- **Permissions:** Still `REVOKE PUBLIC`, `GRANT` to `anon, authenticated` on the public RPC only (unchanged from 024).

### Verified on test DB (read-only probe)

- `idempotency_lookup_before_slot: true` (025 order).
- `manage_token` fields present (024 semantics retained).
- `booking_normalize_member_role_text`: `service_role` EXECUTE **yes**; `anon` / `authenticated` **no**.

---

## Why 025 was applied manually and not in `schema_migrations`

1. Booking test DB history was built with **direct `postgres` SQL** (`booking-apply-migration-*.mjs`, one-off `pg` runs), not Supabase Dashboard/CLI pipeline.
2. Direct SQL applies object changes but **does not insert** into `supabase_migrations.schema_migrations`.
3. Read-only `postgres` session on test reported **`schema_migrations` table missing** (legacy manual-only applies). Supabase CLI `migration list` still shows **empty remote** for all versions until **repair** or CLI apply.

---

## Sync history without re-applying DDL

### Rules

1. **Never** `supabase db push` on a DB whose objects are ahead/behind history until remote rows match reality (push can re-run heavy migrations, especially duplicate `023_*` files).
2. **Always** object preflight before `repair`:
   - `node --env-file=.env.booking.test.local scripts/booking-migration-025-preflight-readonly.mjs`
   - `node --env-file=.env.booking.test.local scripts/booking-migration-024-postcheck-readonly.mjs`
3. **`migration repair`** marks versions applied **without** executing SQL (safe when preflight confirms state).

### 025 + 026 on test (allowlisted)

```powershell
cd C:\Users\rodri\Documents\Artecium\artecium-website
$env:BOOKING_ALLOW_REMOTE_TESTS='1'
$env:BOOKING_EXPECTED_PROJECT_REF='bwxhdoxesqtdqwkxrmom'

# 1) Read-only — must show looks_like_025_order and service_role grant
node --env-file=.env.booking.test.local scripts/booking-migration-025-preflight-readonly.mjs

# 2) Register history only (skip if 026 grant not yet on target)
npx supabase link --project-ref bwxhdoxesqtdqwkxrmom   # if not linked
npx supabase migration repair 025 --status applied --remote
# If 026 GRANT already present (test today): repair only. Else apply 026 SQL once, then:
npx supabase migration repair 026 --status applied --remote

# 3) Re-check
node --env-file=.env.booking.test.local scripts/booking-migration-025-preflight-readonly.mjs
npx supabase migration list --remote
```

**If 026 not yet on target:** run only on allowlisted DB:

```powershell
# Idempotent GRANT — or use official migration file via controlled apply script (pattern: 024 applier)
psql $DATABASE_URL -f supabase/migrations/026_booking_service_role_member_role_helper_execute.sql
npx supabase migration repair 026 --status applied --remote
```

Operational grant script (test helper, superseded by 026 for versioned deploy): `scripts/grant-booking-service-role-trigger-helpers.sql`.

### Aligning 001–024 on test (optional, separate window)

Use existing preflights (`booking-migration-019-preflight-readonly.mjs`, `023` postchecks, etc.), then **repair in order** per confirmed version — **not** a blind `repair 001 002 … 024`. Resolve **three local `023_*` files** before any `db push` (canonical file: `023_phase2_harness_persistent_tracking.sql` per docs).

---

## Tests after sync

```powershell
$env:BOOKING_INTEGRATION_TEST='1'
$env:BOOKING_ALLOW_REMOTE_TESTS='1'
$env:BOOKING_EXPECTED_PROJECT_REF='bwxhdoxesqtdqwkxrmom'
node --env-file=.env.booking.test.local scripts/booking-integration-test.mjs

npm run verify:booking-idempotency
npm run verify:booking-public-flow
```

---

## Production publication order (when approved — **not now**)

1. Merge repo containing `025` + `026` (no edits to 022–024).
2. Link **production** project (ref from Dashboard only, not in repo).
3. Production preflight: read-only probes on `booking_public_create_appointment` order; confirm 024 already applied.
4. Apply **025** via Dashboard SQL or approved `db push` **single migration** workflow — **not** blind push.
5. Apply **026** (GRANT only).
6. `migration repair` or CLI record if apply was manual.
7. Smoke: public create + idempotency replay; **no** integration seed on production.
8. **Then** Vercel deploy (out of scope here).

**Forbidden until explicit sign-off:** `db push` on production, seed scripts, `BOOKING_SEED=1`, repairing versions without object preflight.

---

## File hashes (reproducibility)

Recorded by `booking-migration-025-preflight-readonly.mjs`:

- `024_booking_public_guest_manage.sql`: `c9f5c534a9bfb033f1e919cba9e54a4e6fd86d5b90730ba51d27d7ab34e4b0d8`
- `025_booking_public_create_idempotency_before_slot.sql`: `9c3d4d9a72edf6e23691c9218ca7533b74ca0ad275fcc16c365e5c01f6cbf7bf`