# Booking — security audit report (code review)

Date: local review without runtime RLS execution.

## 1. Problems found

| ID | Area | Severity | Description |
|----|------|----------|-------------|
| P1 | RLS `booking_business_members` | **High** | Policy allowed managers to `INSERT`/`UPDATE`/`DELETE` members directly, bypassing email invites (product rule). |
| P2 | RPC `booking_accept_member_invite` | **Medium** | Parameter was named `p_token_hash` but invite links carry a **raw** token; clients would hash incorrectly unless documented. |
| P3 | Server action settings | **Medium** | Any manager could set `company_id` to any existing `companies.id` without portal membership. |
| P4 | Public RPC | **Medium** (known) | No validation of working hours, breaks, or time off when creating appointments. |
| P5 | Public RPC idempotency | **Low** | Anyone with `idempotency_key` can replay appointment metadata for that business/key. |
| P6 | App session | **Low** | `loadMemberships` swallows errors → empty memberships (UX/confusion, not bypass). |
| P7 | UI vs server | **Info** | Staff-facing pages hide write controls; **RLS** still required for staff mutating via API (writes denied for staff role). |
| P8 | Platform admin | **Info** | `booking_is_platform_admin()` grants cross-tenant access by design. |

**Not observed in code review:** cross-tenant read/write when using correct RLS + `.eq("business_id", activeBusinessId)` in actions — **must be confirmed by local RLS tests.**

## 2. Corrections applied (local repo)

| ID | Fix |
|----|-----|
| P1 | `014_booking_membership_hardening.sql` — drop manager write policy on `booking_business_members`. |
| P2 | Same migration — `booking_accept_member_invite(p_token text)` hashes with SHA-256 server-side; `FOR UPDATE` on invite row. |
| P3 | `assertUserCanLinkCompany` + check in `updateBookingBusinessSettings`. |
| P2 app | `acceptBookingMemberInvite` server action passes raw token to RPC. |

## 3. Tests executed

| Test | Result |
|------|--------|
| `npx tsc --noEmit` | Run in CI/local after changes |
| `npm run verify:portal-routing` | Expected 66/66 |
| `npm run verify:booking-routing` | Expected 10/10 |
| `npm run verify:booking-availability` | Expected 5/5 |
| `npm run verify:booking-admin-links` | Expected 5/5 |
| `npm run verify:booking-actions` | New static guard |
| `npm run test:booking-rls` | **Skipped** (no local Supabase + `BOOKING_RLS_TEST=1`) |

## 4. Tests not yet executed

- Full RLS matrix (`docs/booking/RLS_TESTING.md`)
- `npm run test:booking-rls` with two local users and migrations 012–014
- Public RPC slot abuse (hours/breaks/time off)
- Invite accept UI flow end-to-end

## 5. Open risks

- **Public booking surface** can still create appointments outside business hours until Phase 3 availability RPC.
- **Unlimited business creation** for any authenticated user (product-accepted for first owner).
- **Agency platform admins** can read/manage all booking tenants.
- **RLS policies** are unverified in runtime until local Postgres tests pass.
- **012 alone** uses overlap on `starts_at`/`ends_at` only — always apply **013+014** together locally.
