# Booking permissions fix — prepared solution (not applied)

**Status:** Awaiting approval before any SQL on a database.  
**References:** `PERMISSIONS_DIAGNOSIS.md`, migration `019_booking_service_role_grants.sql`.

---

## Phase 1 — Configuration validation (C)

### Automated (no secrets printed)

```powershell
$env:SUPABASE_KEY_ROLE_CHECK = "1"
node --env-file=.env.booking.test.local scripts/verify-supabase-service-role-key.mjs
# or: node --env-file=.env.local scripts/verify-supabase-service-role-key.mjs
```

Output is limited to **`JWT role claim`**, **`JWT iss`**, and PASS/FAIL.  
If the key uses the opaque **`sb_secret_*`** format (not JWT), the script exits **2** and prints a **manual** Dashboard verification step (no secret logged).

### Manual procedure (if env file unavailable in CI)

1. Open Supabase Dashboard → Project Settings → API.
2. Confirm **service_role** key is copied into `SUPABASE_SERVICE_ROLE_KEY` (not the anon/publishable key).
3. Optional: decode JWT payload (middle segment, base64url) locally; confirm `"role":"service_role"`.

**Do not** paste keys into chat, logs, or commits.

---

## Phase 2 — Migration 019 (A)

**File:** `supabase/migrations/019_booking_service_role_grants.sql`

### Table GRANTs (12 tables)

| Table | Privileges to `service_role` | Why |
|-------|------------------------------|-----|
| All `booking_*` from 012 + `booking_member_invites` (013) | `SELECT, INSERT, UPDATE, DELETE` | Seed/integration/readiness use PostgREST with service role; 012 only granted `authenticated` |

**Not changed:** RLS policies, `FORCE RLS`, ownership, `anon`/`authenticated` grants.

### Function GRANTs (minimal)

| Function | Privilege | Why |
|----------|-----------|-----|
| `booking_public_idempotency_request_hash(uuid, uuid, timestamptz)` | `EXECUTE` | Readiness probe uses service role with `expectSuccess: true` (015 grants anon/authenticated only) |

**Intentionally omitted from 019:** `EXECUTE` on public RPCs for `service_role` — readiness now calls those with **anon** client (Phase 3).

**Idempotency:** Repeated `GRANT` is safe in PostgreSQL.

---

## Phase 3 — Readiness (B)

### Files changed

| File | Change |
|------|--------|
| `scripts/booking-readiness-lib.mjs` | `isPermissionDenied`, `classifyRpcProbeResult`, fixed RPC args, `clientRole` per check |
| `scripts/booking-db-readiness.mjs` | Separate **service_role** (tables + hash RPC) and **anon** (public RPCs) clients |
| `scripts/booking-platform-dependencies-readiness.mjs` | Same RPC client split |

### Probe roles

| Check | Client | Success criterion |
|-------|--------|-------------------|
| Table `SELECT limit 0` | `service_role` | No error (after 019) |
| Public RPCs (get business, list services/slots, validate slot, accept invite) | `anon` | `ok_validation` on business/auth errors — **not** permission denied |
| `booking_public_idempotency_request_hash` | `service_role` | Returns hash (`expectSuccess`) |

### Outcomes (no false positives)

| `outcome` | Meaning |
|-----------|---------|
| `ok` | Probe succeeded |
| `ok_validation` | RPC/table reachable; expected business/validation rejection |
| `missing` | Relation or function not in schema cache |
| `permission_denied` | 42501 — fails run |
| `invalid_arguments` | Wrong RPC signature in probe (script bug) |
| `error` | Other failure |

---

## Phase 4 — Prepared tests

### Static (no DB) — in `test:booking-unit`

| Script | Validates |
|--------|-----------|
| `npm run verify:booking-readiness-probes` | Classifier + RPC check definitions |
| `npm run verify:booking-service-role-grants` | Migration 019 SQL contract |
| `npm run verify:supabase-service-role-key` | Phase C when `SUPABASE_KEY_ROLE_CHECK=1` |

### After approval — on test DB only

1. Apply **019** (Dashboard SQL or `supabase db push` on test project).
2. `SUPABASE_KEY_ROLE_CHECK=1` + env file → PASS service role.
3. `BOOKING_DB_READINESS=1` → all checks green.
4. `BOOKING_SEED=1` → seed completes (service role table writes).
5. `BOOKING_INTEGRATION_TEST=1` → full suite.
6. **RLS regression (manual or script):** sign in as integration **staff** user → `insert` on `booking_services` **denied**; **owner** **allowed**; **anon** `select` on `booking_appointments` **denied**; **anon** `booking_public_get_business` **allowed**.

---

## Risks and side effects

| Risk | Mitigation |
|------|------------|
| `service_role` has full DML on booking tables (bypasses RLS) | Keys server-only; same pattern as 009/018; never expose in browser |
| Broader blast radius if service key leaks | Existing operational requirement; 019 does not widen anon/authenticated |
| Migration not applied → readiness still fails on tables | Expected until 019 applied |
| Wrong key in env | Phase C catches anon key mislabeled as service role |

---

## Approval checklist

- [ ] Phase C PASS on target env  
- [ ] Apply 019 on **test** project only  
- [ ] Re-run readiness + seed + integration  
- [ ] Confirm anon table access still denied  

**No database operations have been performed as part of preparing this document.**
