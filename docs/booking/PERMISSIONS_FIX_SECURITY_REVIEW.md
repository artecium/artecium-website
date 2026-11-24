# Booking migration 019 — final security review

**Date:** 2026-11-02  
**Inputs:** `PERMISSIONS_FIX_PREPARED.md`, `019_booking_service_role_grants.sql`, migrations 009 + 012–018, readiness/integration scripts.  
**No code, SQL, credentials, or database were modified in this review.**

---

## Executive recommendation

| Verdict | Detail |
|---------|--------|
| **Approve for apply on allowlisted test project only** | Migration 019 is **consistent** with platform precedent (009, 018) and **required** for current seed/readiness/integration scripts that use PostgREST with `service_role`. |
| **Optional hardening before apply** | Narrow grants on **`booking_customers`** and **`booking_member_invites`**; drop **`EXECUTE`** on hash helper if readiness probes that RPC with **anon** instead of `service_role` (015 already grants anon). |
| **Do not apply to production** until product sign-off on service-role DML scope and operational key handling. |

---

## 1. GRANT review — 12 tables

PostgREST checks **table ACL before RLS**. `service_role` **bypasses RLS** but not missing GRANTs (see `PERMISSIONS_DIAGNOSIS.md`).  
019 adds **`SELECT, INSERT, UPDATE, DELETE`** on each table — no `TRUNCATE`, `REFERENCES`, or schema privileges.

### Script usage summary (repo evidence)

| Source | Role | Operations on booking tables |
|--------|------|------------------------------|
| `seed-booking-integration.mjs` | `service_role` | businesses: select/delete/insert; members, subscriptions, services, staff, links, hours, breaks, time_off, appointments: **insert** (+ some **select**) |
| `booking-integration-test.mjs` | `service_role` admin | **select** (load seed context, inactive service) |
| | `authenticated` (owner/manager/staff) | **select/insert/update** for RLS tests (not service_role) |
| | `anon` | **select** on appointments (expect deny) |
| `booking-db-readiness.mjs` | `service_role` | **select** `limit 0` on businesses, appointments, member_invites (+ column probes) |
| `booking-rls-test.mjs` | **authenticated** users | inserts (not service_role) |
| Booking **Server Actions** | user session (`createClient`) | no service_role |

**Not used by any script today (service_role):** direct DML on `booking_customers`; DML on `booking_member_invites`.

---

### Per-table justification

| Table | SELECT | INSERT | UPDATE | DELETE | Needed by (today) | Notes |
|-------|--------|--------|--------|--------|-------------------|-------|
| **booking_businesses** | Yes | Yes | No* | Yes | Seed cleanup + create; integration admin read; readiness | *UPDATE not in seed; DELETE required for marker cleanup |
| **booking_business_members** | No* | Yes | No | No* | Seed inserts | *DELETE via business CASCADE; SELECT not required for seed |
| **booking_business_subscriptions** | No | Yes | No | No* | Seed | *CASCADE on business delete |
| **booking_services** | Yes | Yes | No | No* | Seed; integration admin | |
| **booking_staff** | Yes | Yes | No | No* | Seed; integration admin | |
| **booking_staff_services** | No | Yes | No | No* | Seed | |
| **booking_working_hours** | No | Yes | No | No* | Seed | |
| **booking_staff_breaks** | No | Yes | No | No* | Seed | |
| **booking_time_off** | No | Yes | No | No* | Seed | |
| **booking_appointments** | Yes | Yes | No | No* | Seed; readiness column/table probes; integration admin | |
| **booking_customers** | No | No | No | No | **None via service_role REST** | Public create uses **SECURITY DEFINER** RPC; app uses authenticated session |
| **booking_member_invites** | Yes | No | No | No | Readiness probe only | Team flows use **authenticated** RPC + RLS |

### Full DML on all 12 tables — necessary?

| Assessment | |
|------------|--|
| **Minimum for current tooling** | Full DML on **10 tables** (all except customers + invites). Seed + business **delete** drive INSERT/DELETE; readiness only needs **SELECT** everywhere it probes. |
| **019 as written** | Grants **full DML on customers and invites** although **no script performs service_role DML** on them — **broader than strictly necessary**. |
| **Indirect privileges** | No extra schema/sequence grants in 019. **Indirect risk:** any holder of `service_role` key can read/write **all rows** in granted tables **across all tenants** (RLS bypass). Same class of risk as 009/018 and `scripts/grant-service-role-admin.sql` for platform tables. |
| **012–018 unchanged** | `anon` still revoked on tables; `authenticated` grants and RLS policies unchanged. 019 is **additive** only. |

### Optional migration tightening (if you want least privilege)

```sql
-- Illustrative — not applied; for discussion only
grant select on table public.booking_customers to service_role;
grant select on table public.booking_member_invites to service_role;
-- (keep full DML on the other 10 tables)
```

---

## 2. Service role security

### 2.1 Browser / client exposure

| Check | Result |
|-------|--------|
| `NEXT_PUBLIC_*` service key | **Not used** — only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `src/lib/supabase/server.ts` and browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server/scripts only** — `getSupabaseEnv()`, `createAdminClient()` (`server-only`) |
| Booking actions | **No** `createAdminClient()` under `src/lib/actions/booking/` |
| `.env.booking.test.local.example` | Documents service key name; not committed filled |

**Residual risk:** accidental commit of `.env*` with secrets — mitigated by `.gitignore` and docs; not introduced by 019.

### 2.2 Server Actions and arbitrary client-driven service role

Booking mutations go through **`requireBookingSession` / `requireManageBusiness`** + user **`createClient()`** → RLS applies.  
No API route in the reviewed booking flow accepts a client-supplied “use service role” flag.

**019 does not expand browser attack surface**; it only affects PostgREST when the **secret key** is used (scripts/server).

### 2.3 Administrative scope

| Consumer | Legitimate need |
|----------|-----------------|
| Integration seed | Deterministic fixture CRUD |
| Integration test admin client | Load seed metadata |
| Readiness | Schema probes |
| Future server maintenance | Same pattern as `grant-service-role-admin.sql` (platform) |

**Out of scope for 019:** production app runtime — Booking UI does not require service_role after 019.

### 2.4 Accidental production execution

| Guard | Location |
|-------|----------|
| Explicit env flags | `BOOKING_DB_READINESS=1`, `BOOKING_SEED=1`, `BOOKING_INTEGRATION_TEST=1`, etc. |
| Remote block | `BOOKING_ALLOW_REMOTE_TESTS=1` required for hosted URL |
| Allowlist | `BOOKING_ALLOWLISTED_PROJECT_REFS = ["bwxhdoxesqtdqwkxrmom"]` only (`booking-integration-fixtures.mjs`) |
| URL/ref match | Optional `BOOKING_EXPECTED_PROJECT_REF` must match `NEXT_PUBLIC_SUPABASE_URL` |
| Local safe path | `127.0.0.1` / `localhost` without remote flag |

**Gap:** Production project ref is **not** on the allowlist — scripts **should refuse** production if env points at production URL and remote flag is set.  
**Operational risk:** developer sets allowlist flag + **production URL** in a local env file — ref check fails allowlist unless production ref were added. **Do not add production ref to allowlist.**

---

## 3. `sb_secret_*` key format

| Item | Finding |
|------|---------|
| Client version | `@supabase/supabase-js` **^2.112.4** (`package.json`) |
| Format | New Supabase **secret** keys (`sb_secret_…`) are **opaque**, not JWT — `verify-supabase-service-role-key.mjs` exits **2** with manual Dashboard check (no secret logged) |
| Compatibility | Supabase JS v2 accepts **`apikey` header** with both legacy JWT service keys and new secret keys; `createClient(url, serviceKey)` remains valid |
| JWT legacy | If key starts with `eyJ`, script validates `role=service_role` |

### Confirm test project in Dashboard (no secrets shared)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select the **test** project (ref must match allowlist, e.g. `bwxhdoxesqtdqwkxrmom`).
2. **Project Settings → API** (or **API Keys**).
3. Under **Secret keys** (service role), confirm the key labeled **service_role** / **secret** — not “anon” / “publishable”.
4. Cross-check **Project URL** equals `NEXT_PUBLIC_SUPABASE_URL` in `.env.booking.test.local` (same project ref in hostname).
5. Optional: set `BOOKING_EXPECTED_PROJECT_REF` to that ref so scripts fail if URL and intent diverge.

---

## 4. RPC — `booking_public_idempotency_request_hash`

| Question | Answer |
|----------|--------|
| Is EXECUTE for `service_role` **required**? | **No**, if readiness uses **anon** client for this probe — **015** already `GRANT EXECUTE … TO anon, authenticated`. |
| Current readiness | `BOOKING_RPC_CHECKS` uses **`clientRole: service_role`** + **`expectSuccess: true`** for hash RPC. |
| Security of granting service_role | Function is **deterministic hash** (no PII); low direct harm. Grant exposes **one more** callable entrypoint with service key — **minimal** vs table DML. |
| Who should call it? | **Only inside** `booking_public_create_appointment` (SECURITY DEFINER) in normal production paths; **not** a public browser API. |

**Recommendation:**

- **Either** keep 019 line 24 (simplest; matches current readiness), **or**
- **Remove** `GRANT EXECUTE … TO service_role` from 019 and rely on anon probe (015) — **strictly tighter**, no behaviour change for end users.

Do **not** grant hash EXECUTE to **`public`**; 015 correctly revokes from `public`.

---

## 5. Comparison with migrations 009 and 018

| Pattern | 009 / 018 | 019 Booking |
|---------|-----------|-------------|
| Target role | `service_role` | `service_role` |
| RLS | Unchanged | Unchanged |
| Scope | Named platform tables | Booking tables only |
| App runtime | Server/scripts | Scripts only (Booking UI uses user JWT) |

019 does **not** replicate 018’s “no authenticated access” model — Booking remains **authenticated + RLS** for users; service_role is an **admin/script bypass**, same as platform payment providers (009).

---

## 6. Risks summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Service key leak → cross-tenant booking data R/W | **High** (existing class) | Key rotation, server-only, never in CI logs, `.gitignore` |
| 019 full DML on customers/invites unused | **Low** | Optional narrow grants |
| Misconfigured env (publishable in service var) | **Medium** | Dashboard + `verify-supabase-service-role-key` |
| False confidence from readiness before 019 | **Ops** | Apply 019 then re-run readiness |
| Production apply by mistake | **High** if mis-ops | Allowlist + no production ref; manual apply discipline |

---

## 7. Suggested changes to 019 (optional, before apply)

| Change | Benefit |
|--------|---------|
| `booking_customers`: **SELECT only** (or omit until a script needs DML) | Least privilege |
| `booking_member_invites`: **SELECT only** | Matches readiness-only use |
| Remove hash **EXECUTE** for `service_role`; probe with **anon** | One fewer service_role RPC; 015 already covers anon |

If you apply **019 unchanged**, risk is **acceptable for test project** and aligned with 009.

---

## 8. Post-apply verification (test DB only)

1. `SUPABASE_KEY_ROLE_CHECK=1` — manual or JWT PASS.  
2. `BOOKING_DB_READINESS=1` — all probes green; **no** `permission_denied` on tables.  
3. **Anon regression:** `anon.from('booking_appointments').select()` still **denied**.  
4. **Authenticated RLS:** staff cannot insert services (integration test).  
5. Public RPC smoke: `booking_public_get_business` / `list_day_slots` via **anon** still work.

---

## 9. Final decision matrix

| Option | Recommendation |
|--------|----------------|
| **Apply 019 as-is on test project** | **Approved** — proceed after Dashboard key/project confirmation |
| **Apply 019 with narrowed customers/invites + anon hash probe** | **Preferred** if you want least privilege before first apply |
| **Apply on production** | **Not approved** in this review — separate product/ops decision |
| **Skip 019; only change readiness** | Reject — seed remains broken; does not remove need for service_role table access for integration |

---

**Awaiting your explicit approval to apply migration 019 (or a narrowed variant) on the test database only.**
