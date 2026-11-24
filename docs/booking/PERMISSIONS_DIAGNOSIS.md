# Booking — `BOOKING_DB_READINESS=1` permission denied diagnosis

**Date:** 2026-11-01  
**Scope:** Static analysis of readiness scripts + migrations `001`–`017`. No SQL executed, no env secrets read or logged.

---

## 1. What the readiness script does

| Step | File | Behaviour |
|------|------|-----------|
| Gate | `scripts/booking-test-guards.mjs` | Requires `BOOKING_DB_READINESS=1`, allowlisted or local URL, non-empty `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` |
| Client | `scripts/booking-db-readiness.mjs` | Single Supabase JS client: `createClient(url, env.serviceKey, …)` |
| Key used | `getSupabaseEnv().serviceKey` | Value of **`SUPABASE_SERVICE_ROLE_KEY`** (not the publishable/anon key) |
| Table probes | `probeTableRest()` | PostgREST `GET` equivalent: `.from(table).select(columns).limit(0)` |
| RPC probes | `probeRpcRest()` | `.rpc(fn, args)` |

**Important:** PostgREST maps the API key to a PostgreSQL role (`service_role`, `anon`, or `authenticated` via JWT). Table-level **GRANT** is checked **before** RLS. `service_role` **bypasses RLS** but still needs **privileges on the table/function** unless it is superuser-like in a way that bypasses ACLs (on Supabase it does **not** bypass missing table GRANTs).

---

## 2. Failed operations (from `SUPABASE_INTEGRATION_REPORT` run)

Observed on allowlisted **hosted test** project (project ref allowlisted in repo; credentials not reproduced here).

### 2.1 Table probes — `method: rest-select` — status **error**

| Migration tag | Probe name | Table | Columns | Error text |
|---------------|------------|-------|---------|------------|
| 012 | `booking_businesses` | `booking_businesses` | `id` | `permission denied for table booking_businesses` |
| 012 | `booking_appointments` | `booking_appointments` | `id` | `permission denied for table booking_appointments` |
| 013 | `booking_member_invites` | `booking_member_invites` | `id` | `permission denied for table booking_member_invites` |
| 013 | `appointments.blocked_starts_at` | `booking_appointments` | `blocked_starts_at` | `permission denied for table booking_appointments` |
| 015 | `appointments.idempotency_request_hash` | `booking_appointments` | `idempotency_request_hash` | `permission denied for table booking_appointments` |

These are **SELECT** probes with `limit(0)` (no rows required). Failure is **42501-style privilege**, not RLS empty result.

### 2.2 RPC probes — mixed interpretation

| Migration | RPC | Reported status | Notes |
|-----------|-----|-----------------|-------|
| 012 | `booking_public_get_business` | **ok** | Probe treats most RPC errors as “callable” (see §4) |
| 014 | `booking_accept_member_invite` | **ok** | Same |
| 015 | `booking_validate_public_slot` | **missing** | PostgREST: function not found **without parameters** (see §5) |
| 016 | `booking_public_list_services`, `booking_public_list_day_slots` | **ok** | Same as get_business |
| 017 | `booking_public_idempotency_request_hash` | **error** | `42501: permission denied for function …` — probe uses `expectSuccess: true` |

---

## 3. Migration analysis — GRANT / REVOKE / RLS

### 3.1 Booking tables (012, 013)

**012** (`012_booking_foundation.sql`):

- Enables **RLS** on all core `booking_*` tables (no `FORCE ROW LEVEL SECURITY` anywhere in repo migrations).
- **REVOKE ALL** on each booking table **FROM `anon`, `public`**.
- **GRANT** `SELECT, INSERT, UPDATE, DELETE` **TO `authenticated` only**.
- **No `GRANT` to `service_role`** on booking tables.

**013** (`booking_member_invites`):

- Same pattern: revoke from `anon`, `public`; grant DML to **`authenticated` only**; RLS for managers.

Compare **009** / **018** (platform pattern when server must use service role on tables):

```sql
grant … on table public.company_payment_providers to service_role;
grant all on table public.google_oauth_tokens to service_role;
```

Booking migrations **never** add analogous `service_role` table grants.

### 3.2 Expected vs actual for `service_role` REST client

| Expectation (common assumption) | Actual in 012–013 |
|--------------------------------|-------------------|
| Service role key can `SELECT` any table for admin/seed/readiness | **False** unless Supabase default grants exist outside migration SQL (these migrations only grant **`authenticated`**) |
| RLS blocks service role | **No** — RLS is bypassed for `service_role`, but **ACL denies** first |
| Anon can read booking tables | **Revoked** — correct for security |

### 3.3 Policies (RLS) — not the cause of readiness table failures

Policies on booking tables target **`authenticated`** with `booking_can_access_business` / `booking_can_manage_business`. They do **not** explain `permission denied` for **`service_role`** REST calls: that error is **missing table GRANT**, not “0 rows”.

### 3.4 SECURITY DEFINER functions

Public/admin RPCs (`booking_public_*`, `booking_create_business_with_owner`, etc.) run as definer and read/write booking rows **inside** the function. **EXECUTE** is granted to **`anon` and/or `authenticated`** on those RPCs (012, 015, 016).

Helper **`booking_public_idempotency_request_hash`** (015):

```sql
revoke all on function public.booking_public_idempotency_request_hash(uuid, uuid, timestamptz) from public;
grant execute on function … to authenticated, anon;
```

**No `GRANT EXECUTE` to `service_role`.**

**017** only `CREATE OR REPLACE` the function body (`search_path = public, extensions`). It does **not** re-issue grants; privileges on the function object **remain** those from 015 (anon + authenticated only).

### 3.5 Ownership

Migrations do not reassign table ownership; objects are created in `public` by the migration runner (typically `postgres`). No ownership change explains the readiness pattern.

---

## 4. Readiness script behaviour (code, not migration)

### 4.1 Single client = service role for everything

`booking-db-readiness.mjs` uses **`SUPABASE_SERVICE_ROLE_KEY`** for:

- Direct table `select` probes → requires **`service_role` table GRANT** (missing in 012/013).
- RPC probes → requires **`service_role` EXECUTE** where not granted (017 helper).

### 4.2 RPC probe false positives

In `probeRpcRest()` (`booking-readiness-lib.mjs`), when `expectSuccess` is **false** (default for most RPCs):

- Any RPC error that is **not** “function not found” is reported as **`ok`** with detail `callable (probe returned business/validation error)`.

So **`42501 permission denied`** on `booking_public_get_business` would still be counted **`ok`**. That explains **“mixed signals”**: table probes fail honestly; several RPC probes can look **green** even when the service role cannot execute them.

Only **`booking_public_idempotency_request_hash`** sets `expectSuccess: true`, so **permission denied** surfaces as **error**.

**Classification:** readiness **code** amplifies confusion; underlying ACL issue is still **migration + probe role choice**.

### 4.3 Key validation gap

`assertKeysPresent()` only checks that **`SUPABASE_SERVICE_ROLE_KEY` is non-empty**. It does **not** verify that the JWT **`role`** claim is `service_role` (mis-pasting the publishable key would also fail table probes with permission denied).

**Recommended check (manual, no secrets in logs):** decode JWT payload and confirm `"role":"service_role"` (e.g. local one-liner on your machine, or Supabase dashboard key labels).

---

## 5. Migrations 015 and 017 — “mixed signals” explained

| Signal | Cause | Migration vs script |
|--------|--------|---------------------|
| `booking_validate_public_slot` **missing** | Probe calls `.rpc('booking_validate_public_slot', {})` with **no arguments**. PostgREST requires overload `(uuid, uuid, uuid, timestamptz)` (015). | **Script bug** (wrong probe args), not proof 015 is unapplied |
| `booking_public_idempotency_request_hash` **permission denied** | 015 grants EXECUTE to **anon, authenticated** only; readiness calls RPC with **service role** key. | **Migration gap** for service_role + **script** (`expectSuccess: true`) |
| Public catalog RPCs **ok** | Likely **misleading ok** via §4.2 unless service_role inherits EXECUTE (do not assume; verify with anon key or fix grants) | **Script** interpretation |

**017** does not remove grants; it fixes `digest()` / `extensions` search_path. If 015 is applied, 017 is an in-place replace. Readiness failure on 017 is **not** evidence 017 broke grants — it exposes **service_role cannot EXECUTE** the helper.

---

## 6. Probable root cause (ranked)

### Primary — **Migration design gap (012, 013, 015)**

Booking schema follows **“authenticated + RPC for anon”** and **explicitly omits `service_role` table and some function GRANTs**, unlike 009/018.

Evidence:

- Readiness uses **service role** → all **direct table SELECT** probes match **permission denied**.
- Same client on **idempotency helper** with `expectSuccess` → **permission denied for function**.
- Seed/integration scripts also use service role for `.from('booking_*').insert/update` (`seed-booking-integration.mjs`, `booking-integration-test.mjs`) → they would hit the **same ACL wall** unless grants exist outside repo migrations.

**Problem type:** **Migration / privilege model**, not RLS policy logic.

### Secondary — **Readiness script design (code)**

- Probes tables with a role that migrations do not grant.
- RPC probes misclassify permission errors as success when `expectSuccess` is false.
- `booking_validate_public_slot` probed with invalid signature → false **missing**.

**Problem type:** **Code** (test harness), fixable without DB change.

### Tertiary — **Environment configuration**

If `SUPABASE_SERVICE_ROLE_KEY` were actually the **publishable/anon** key, PostgREST would use **`anon`** → same table **permission denied** (revoked in 012). Symptom overlap; rule out by verifying JWT role claim.

**Problem type:** **Configuration** (if wrong key); same user-visible errors.

---

## 7. Tables and migrations involved

| Table / object | Migrations | Grantees in SQL |
|----------------|------------|-----------------|
| `booking_businesses`, `booking_appointments`, … (012 set) | 012 | `authenticated` only |
| `booking_member_invites` | 013 | `authenticated` only |
| `booking_public_idempotency_request_hash(...)` | 015 (body), 017 (replace body) | EXECUTE: `anon`, `authenticated` |
| `booking_validate_public_slot(...)` | 015 | EXECUTE: `anon`, `authenticated` |
| `booking_public_get_business`, create, list RPCs | 012, 016 | EXECUTE: `anon`, / or `authenticated` |

No booking migration **`001`–`017`** grants booking tables to **`service_role`**.

---

## 8. Minimal recommended corrections (for discussion — not applied)

Choose **one** consistent strategy:

### Option A — Migration patch (align with 009/018)

Add a new migration (e.g. after 017) **test/staging approved**:

```sql
-- Illustrative only — do not run from this doc without approval
grant select, insert, update, delete on all booking_* tables in scope to service_role;
grant execute on all booking admin/public RPCs used by server/scripts to service_role;
```

**Pros:** Seed, readiness, and integration scripts keep using service role.  
**Cons:** Broader service_role DML on booking tables (still bypasses RLS; server must stay server-only).

### Option B — Readiness/seed code only

- Table probes: use **authenticated** test user JWT, or use **anon** + accept that probes only validate “table exists via PostgREST” indirectly through RPCs.
- RPC probes: use **anon** client for public RPCs; stop treating all errors as `ok`.
- Fix `booking_validate_public_slot` probe args to match 015 signature.

**Pros:** No DB change; matches current GRANT model.  
**Cons:** Readiness no longer validates service-role admin path; seed still broken until A or seed rewritten to authenticated users.

### Option C — Configuration verification only

If JWT role is not `service_role`, fix `.env.booking.test.local` key mapping.

**Pros:** Trivial if misconfiguration.  
**Cons:** Does not fix intentional missing grants if keys are correct.

**Recommended minimum before Docker/migrations push:**

1. Confirm key role (configuration).  
2. Treat table `permission denied` with service role key as **expected** under current 012/013 SQL until Option A.  
3. Fix readiness probes (Option B) so 015/016 RPC status is trustworthy.  
4. Decide product-wide: **should server scripts use service_role on booking tables?** If yes → Option A (document in security review).

---

## 9. Summary table

| Question | Answer |
|----------|--------|
| Exact failing operations | `SELECT` on 3 logical table probes (+ 2 column probes on `booking_appointments`) via PostgREST as **service role** |
| Is RLS the blocker? | **No** for service role (bypasses RLS); **GRANT** is |
| Is FORCE RLS involved? | **No** (not used in repo) |
| Are 015/017 “broken”? | **015** likely applied if public list RPCs work at runtime; **017** replace is fine; readiness **mis-probes** 015 validate RPC |
| Main issue type | **Migration** (missing `service_role` grants) + **code** (readiness role + RPC classification) ± **config** (wrong key) |

---

**No code, migrations, seeds, SQL, or credentials were changed during this diagnosis.**
