# Booking — security hardening report (public RPC & permissions)

## 1. Problems found

| ID | Issue |
|----|--------|
| I1 | Idempotency replay returned existing appointment row to **anyone with the key** (metadata leak; no binding to request shape). |
| I2 | Public RPC did not validate working hours, breaks, time off, slot grid, or timezone-local day bounds. |
| I3 | Return type included `appointment_id` (unnecessary public surface). |
| I4 | `loadMemberships` errors looked like “no businesses”. |
| I5 | Server actions relied on RLS + `.eq(business_id)` but not always pre-check row ownership. |
| I6 | Cookie active business not re-verified against membership on privileged actions. |

## 2. Corrections

| ID | Change |
|----|--------|
| I1–I3 | **`015_booking_public_rpc_hardening.sql`**: request hash column, safe replay, concurrent unique handling, `booking_validate_public_slot`, minimal return columns + `replayed`. |
| I4 | `booking-session.ts`: log errors, `membershipsLoadFailed`, throw on require when failed. |
| I5 | `requireBookingRowInBusiness` on service/staff/appointment mutations. |
| I6 | `assertActiveBusinessMembership` in `requireManageBusiness` / `requireMemberBusiness`. |

Docs: `PUBLIC_IDEMPOTENCY.md`, `PUBLIC_AVAILABILITY.md`, `PLATFORM_ADMIN_AND_ONBOARDING.md`.

## 3. Tests executed (local agent)

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | (run after pull) |
| `verify:portal-routing` | 66/66 |
| `verify:booking-*` | routing, availability, admin-links, actions |
| `verify:booking-idempotency` | new |
| `verify:booking-public-slot` | new |
| `test:booking-rls` | **Not run** (no local Supabase) |

## 4. Tests not yet executed

- Full RLS matrix including public RPC idempotency/concurrency (`RLS_TESTING.md`)
- SQL integration tests for `booking_validate_public_slot` edge cases (DST, empty working hours)

## 5. Remaining risks

- **Platform admins** retain cross-tenant access by design.
- **Unlimited business creation** for any authenticated user (documented mitigations for future).
- **RLS** still unverified in runtime until local migrations 012–015 applied and `test:booking-rls` extended for public RPC.
- **Guest PII** stored on appointment; only exposure path reduced for idempotency replay — manage tokens / public page still Phase 3+.
