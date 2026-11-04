# Phase 1 — Member role `professional` (staff compat)

Plan reference: **Booking technical plan v2.3**, **AUTH-01**.

## Scope

- SQL migrations **020** and **021** (files only until **AUTH-03**).
- TypeScript helpers in `src/lib/booking/member-role.ts`.
- UI invite role **Professional**; legacy DB rows/API may still use `staff` until backfill.
- **No** RLS scope changes (Phase 2).
- **No** changes to platform `permissions` / `booking.provision` (Phase 5).

## Database (020)

1. `booking_normalize_member_role_text` — maps `staff` → `professional`.
2. CHECK constraints accept `staff` and `professional` on `booking_business_members` / `booking_member_invites`.
3. Backfill existing `staff` rows; pending invites updated.
4. BEFORE INSERT/UPDATE triggers normalize role on write.
5. `booking_create_member_invite` accepts `manager` | `staff` | `professional`; stores `professional`.

## Database (021)

- Column comments; `GRANT EXECUTE` on normalize helper to `authenticated`.

## Application

| Area | Behaviour |
|------|-----------|
| `BookingMemberRole` | Includes `professional` + legacy `staff`. |
| Session | Normalizes `staff` → `professional` on read; manage flag unchanged (owner/manager only). |
| Team invite | UI sends `professional`; server uses `memberRoleToRpcPayloadPreMigration020` until **AUTH-03** (writes `staff` on RPC for DBs without 020). After 020 apply, switch to `memberRoleToRpcPayload`. |

## i18n

Add under `booking.team`:

- `roleProfessional`: `"Professional"` / `"Profissional"`

## Tests

```bash
npm run verify:booking-member-role
npm run test:booking-unit
```

Keep `scripts/booking-member-role-lib.mjs` in sync with `src/lib/booking/member-role.ts`.

## Cutover

- **Migration 035** (Phase 7): remove `staff` from CHECK and RPCs.
- After **AUTH-03**, update `team.ts` to use `memberRoleToRpcPayload` instead of `memberRoleToRpcPayloadPreMigration020`.
