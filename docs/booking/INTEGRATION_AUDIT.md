# Artecium Booking — integration & functional validation audit

**Date:** 2026-03-30  
**Scope:** Code review + automated tests (no production DB changes, no remote migrations, no deploy, no feature work).  
**Not executed:** Live browser E2E on staging/production; DB integration/RLS suites (env flags off).

---

## Executive summary

The Booking module is **substantially implemented** (migrations `012`–`017`, admin UI, public wizard, RPCs, availability engine). Automated **unit-level** booking tests **pass**. Two private entry points exist (`/client/booking/*` and `booking.artecium.com` → `/booking/admin/*`), but **shared page components still emit links via `bookingAreaHref(..., /booking/admin/...)`**, which breaks entry-context on `/client/booking` and on the portal host.

**Highest-priority gap:** unify admin URL generation so `/client/booking` stays in `/client/booking/*` (and portal host uses public booking paths where applicable).

**Second priority:** run `BOOKING_INTEGRATION_TEST=1` and `BOOKING_RLS_TEST=1` against a local Supabase with migrations `012`–`017` applied to validate the full booking flow and tenant isolation.

---

## 1. Two entry points — navigation & links

### 1.1 Expected behaviour

| Entry | Shell nav | Home |
|-------|-----------|------|
| `booking.artecium.com` | Public segments `/dashboard`, `/calendar`, … → internal `/booking/admin/*` | `/dashboard` |
| Main / portal `/client/booking/*` | `buildBookingNavItems(..., adminBase: /client/booking)` subset | `/client/booking/dashboard` |

### 1.2 Verified (static)

| Check | Result |
|-------|--------|
| `/client/booking/layout.tsx` sidebar | **Pass** — 6 items (dashboard, calendar, services, staff, customers, settings); `matchHref` under `/client/booking/...` |
| `/booking/admin/layout.tsx` sidebar | **Pass** — full booking nav via `bookingAreaHref` |
| Portal client sidebar “Booking” group | **Pass** (code) — shown only if `hasBookingPortal`; links to `/client/booking/...` |
| `npm run verify:booking-routing` | **Pass** (10/10) |
| `npm run verify:booking-admin-links` | **Pass** (5/5) — documents booking host vs main-site href rules |

### 1.3 Failed / inconsistent — links that leave `/client/booking`

`bookingAreaHref()` on **non–booking-host** returns **internal `/booking/admin/...`** (see `src/lib/routing/booking-links.ts`). Re-exported pages under `/client/booking` still call it.

| File | Line(s) | Link target when user is on `/client/booking` (portal or localhost) |
|------|---------|---------------------------------------------------------------------|
| `src/app/booking/admin/dashboard/page.tsx` | 57, 63 | `/booking/admin/services`, `/booking/admin/staff` (setup CTAs) |
| `src/app/booking/admin/calendar/page.tsx` | 49 | `baseHref` → `/booking/admin/calendar?...` (day/week/month toggles) |
| `src/components/booking/OnboardingForm.tsx` | 27 | After create → `/booking/admin/dashboard` (client-side) |
| `src/lib/auth/booking-session.ts` | 104–115 | Login `next`, onboarding/dashboard redirects use `bookingAreaHref` → `/booking/admin/...` |
| `src/app/booking/admin/layout.tsx` | 55, 66, 101 | Redirects/home (expected for **booking host** entry, wrong if user entered via `/client/booking/onboarding`) |
| `src/app/booking/admin/team/page.tsx` | 17 | Redirect to dashboard |

**Not wrong on booking host:** same calls map to `/dashboard`, `/calendar`, etc.

### 1.4 Nav active-state (booking host)

`PlatformSidebar` always uses `clientAreaPathnameForNavMatch(pathname)` (`src/components/platform/PlatformSidebar.tsx`). On `booking.artecium.com`, browser pathname is `/dashboard`, while `matchHref` is `/booking/admin/dashboard`. **Likely fail:** sidebar may not highlight the active item on the booking subdomain (needs browser confirmation).

**Recommended fix (later):** use `bookingAdminPathnameForNavMatch` when shell is booking admin; introduce `clientBookingPathnameForNavMatch` or pass `matchHref` resolver into `PlatformShell`.

### 1.5 Missing routes on `/client/booking` (vs `/booking/admin`)

Still only on `/booking/admin`: **appointments**, **schedules**, **time-off**, **team**. Spec listed a subset; product gap if staff expect “Marcações” / horários under client entry.

---

## 2. Authentication & permissions

### 2.1 Model (code + migration `012`)

| Role | `booking_can_manage_business` | Typical UI |
|------|------------------------------|------------|
| **owner** | yes | Full CRUD via server actions |
| **manager** | yes | Full CRUD via server actions |
| **staff** | no (read via `booking_can_access_business`) | Read calendar/appointments; `AppointmentsManager` sets `canManage={false}` → no status buttons |

Server actions for mutations use `requireManageBusiness()` (`src/lib/actions/booking/context.ts`).  
RLS: writes on services/staff/appointments/etc. require `booking_can_manage_business`; reads require `booking_can_access_business`.

### 2.2 Tests executed

| Test | Result |
|------|--------|
| `npm run verify:booking-actions` | **Pass** — all 6 action modules reference guards |
| `npm run verify:area-access` | **Pass** (27/27) — hub/onboarding policy |
| `npm run test:booking-rls` | **Skipped** — requires `BOOKING_RLS_TEST=1` + Supabase |

### 2.3 Scenarios — expected vs validated

| Scenario | Expected | Static review | Live DB test |
|----------|----------|---------------|--------------|
| Owner | Manage all resources for active business | Actions + RLS align | **Not run** |
| Manager | Same as owner | Same | **Not run** |
| Staff | Read; no writes | UI + RLS; `requireManage` redirects on write | **Not run** |
| No booking membership | No admin; onboarding or `/acesso?reason=bookingDenied` | Layout logic | **Not run** |
| Other business | No cross-tenant data | RLS + `requireBookingRowInBusiness` | **Not run** (needs RLS script) |

### 2.4 Staff UX note

`requireBookingSession({ requireManage: true })` **redirects** staff to dashboard (`booking-session.ts`) instead of returning 403. Acceptable but confusing if they bookmark `/booking/admin/services`.

### 2.5 Subscription / entitlement

`booking_business_subscriptions` exists; **no** gate tied to agency `services` / client entitlements. Any user with membership can use admin UI regardless of Artecium plan.

---

## 3. End-to-end booking flow

### 3.1 Automated (no DB)

| Area | Command | Result |
|------|---------|--------|
| Slot generation / overlap / buffers | `verify:booking-availability` | **Pass** (5/5) |
| Public slot validation helpers | `verify:booking-public-slot` | **Pass** (5/5) |
| Idempotency hashing | `verify:booking-idempotency` | **Pass** (5/5) |
| Public error mapping | `verify:booking-public-flow` | **Pass** (6/6) |
| Timezone local date | `verify:booking-local-date` | **Pass** |

### 3.2 Integration script (requires DB)

| Command | Result |
|---------|--------|
| `npm run test:booking-integration` | **Skipped** — `BOOKING_INTEGRATION_TEST=1` not set |

When enabled, `scripts/booking-integration-test.mjs` covers: business create, services/staff/hours, public slots, create appointment (manual/auto confirmation), idempotency replay, concurrent race, time-off, inactive business, etc.

### 3.3 Spec steps — implementation status

| Step | Status | Evidence |
|------|--------|----------|
| 1. Create business | **Implemented** | `createBookingBusiness` RPC + onboarding |
| 2. Create services | **Implemented** | `ServicesManager` + actions |
| 3. Create staff | **Implemented** | `StaffManager` + actions |
| 4. Working hours | **Implemented** | `SchedulesManager` + actions |
| 5. Time off | **Implemented** | `TimeOffManager` + actions |
| 6. Public availability | **Implemented** | RPC `booking_public_list_day_slots` + wizard |
| 7. Public create booking | **Implemented** | `booking_public_create_appointment` |
| 8. Confirm | **Implemented** | `updateBookingAppointmentStatus(..., 'confirmed')` |
| 9. Reject | **Implemented** | status `rejected` |
| 10. Cancel | **Implemented** | status `cancelled` |
| **Manual appointment (admin)** | **Not implemented** | No admin action/UI to create appointment; only public RPC |
| Concurrency / overlap | **Implemented (DB)** | GiST EXCLUDE + RPC validation (integration test when run) |
| Duplicate submit | **Implemented** | Idempotency key on public create |
| Timezone | **Implemented** | Business `timezone`; `local-date.ts` + slot RPCs |

---

## 4. Notifications

| Event | Implemented | Notes |
|-------|-------------|-------|
| New public booking | **No** | No email/in-app on `booking_public_create_appointment` |
| Pending (manual mode) | **No** | UI copy only in public wizard |
| Confirmed | **Partial** | `notifyBookingAppointmentStatusChange` on status update only; Resend if `EMAIL_PROVIDER=resend` + keys |
| Rejected | **Partial** | Same hook on status update |
| Cancelled | **Partial** | Same hook on status update |
| Business notified | **No** | No owner/manager email |
| In-app notifications table | **No** | Not wired for booking |

Implementation: `src/lib/booking/notifications.ts` (minimal HTML, English-only subject/body).

---

## 5. Regression checks (automated)

| Area | Command | Result |
|------|---------|--------|
| Portal routing / Stripe returns | `npm run verify:portal-routing` | **Pass** (77/77) |
| Booking unit bundle | `npm run test:booking-unit` | **Pass** (all sub-scripts) |
| TypeScript | `npx tsc --noEmit` | **Pass** (exit 0) |

**Not run:** full `next build`, manual Analytics/SEO/Stripe flows. Booking changes touch `client/layout.tsx` and i18n nav keys only in addition to booking paths — **low risk** to unrelated modules if link fixes are scoped later.

---

## 6. Security risks

| Risk | Severity | Detail |
|------|----------|--------|
| Cross-tenant data | **Mitigated in design** | RLS on all `booking_*`; actions check `business_id` — **needs RLS test run** |
| Public anon write to tables | **Mitigated** | Revoke on tables; RPC-only public insert |
| Staff privilege escalation | **Low** | Writes require manager/owner in RLS + `requireManageBusiness` |
| Open business creation | **Product** | Any authenticated user can create tenant (`booking_create_business_with_owner`) — documented abuse risk |
| Email content | **Low** | Status emails leak minimal info; no tokens in client |
| UX redirect to `/booking/admin` | **Low** | Does not bypass auth; may confuse and leak URL structure |

---

## 7. Files recommended for correction (after approval)

| Priority | Files | Change |
|----------|-------|--------|
| P0 | `src/lib/routing/booking-links.ts` | Add `resolveBookingAdminHref(internalPath, { entry: 'client' \| 'host' })` or detect pathname prefix `/client/booking` |
| P0 | `src/app/booking/admin/dashboard/page.tsx`, `calendar/page.tsx`, `OnboardingForm.tsx` | Use context-aware hrefs |
| P1 | `src/components/platform/PlatformSidebar.tsx` | Booking-active matching via `bookingAdminPathnameForNavMatch` on booking host |
| P1 | `src/lib/auth/booking-session.ts`, `client/booking/layout.tsx` | Redirects/login `next` preserve `/client/booking` when applicable |
| P2 | `src/lib/actions/booking/context.ts` | `revalidatePath('/client/booking', 'layout')` |
| P2 | Optional routes | `/client/booking/appointments`, `schedules`, `time-off`, `team` re-exports |
| P3 | `src/lib/booking/notifications.ts` + public create RPC hook | Full notification matrix + PT/EN templates |
| P3 | Entitlements | Wire `booking_business_subscriptions` or agency plan feature |

---

## 8. Steps to validate on test Supabase

1. **Apply migrations locally only:** `012` → `013` → `014` → `015` → `016` → `017` (see `docs/booking/MIGRATION_012_016_EXECUTION_PLAN.md`).
2. Configure `.env.local` with local Supabase URL + anon + service role (never commit).
3. `npm run db:seed:booking-integration` (follow script guards in `docs/booking/LOCAL_DEVELOPMENT.md`).
4. Run:
   - `BOOKING_INTEGRATION_TEST=1 npm run test:booking-integration`
   - `BOOKING_RLS_TEST=1 npm run test:booking-rls`
5. Manual UI:
   - Hosts: add `127.0.0.1 booking.artecium.com client.artecium.com` (or use path-only localhost).
   - `/client/booking/dashboard` — click setup links; confirm they stay under `/client/booking`.
   - `booking.artecium.com/{slug}` — complete public booking.
   - Owner vs staff accounts — confirm write denial for staff.
6. Optional email: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `BOOKING_EMAIL_FROM` — change appointment status and verify delivery.

---

## 9. Test results ledger

| ID | Description | Method | Result |
|----|-------------|--------|--------|
| T1 | Booking host routing | `verify:booking-routing` | **Pass** |
| T2 | Admin link rewriting | `verify:booking-admin-links` | **Pass** |
| T3 | Availability engine | `verify:booking-availability` | **Pass** |
| T4 | Action guard presence | `verify:booking-actions` | **Pass** |
| T5 | Public/idempotency helpers | multiple verify scripts | **Pass** |
| T6 | Area access policy | `verify:area-access` | **Pass** |
| T7 | Portal regression | `verify:portal-routing` | **Pass** |
| T8 | Full DB integration flow | `test:booking-integration` | **Skipped** (env) |
| T9 | RLS isolation | `test:booking-rls` | **Skipped** (env) |
| T10 | `/client/booking` link context | Static audit | **Fail** (see §1.3) |
| T11 | Booking host sidebar active state | Static audit | **Likely fail** (see §1.4) |
| T12 | Manual admin appointment | Static audit | **Not implemented** |
| T13 | Notification matrix | Static audit | **Mostly not implemented** |

---

## 10. Recommended correction order (for next phase)

1. Context-aware booking admin URLs (fixes `/client/booking` integration).
2. Sidebar active-state on booking host.
3. Run integration + RLS tests on local Supabase; file issues from failures.
4. Admin manual booking (if still required by product).
5. Notifications + subscription gating.

**No corrections were applied in this audit.**
