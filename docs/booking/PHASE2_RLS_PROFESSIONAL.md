# Phase 2 — RLS scope for `professional` (v2.3)

Migration: `022_booking_professional_rls_scope.sql`

## Scope

- Read scope for `professional` / legacy `staff` on appointments, customers, subscriptions.
- Member RPCs for colleague **busy** and **time off** intervals (no PII).
- Views `booking_customers_member`, `booking_time_off_availability`.
- Dashboard appointment stats scoped to own staff for professionals.

Out of scope: appointment writes, public RPCs, provision, Phase 7.

## Sensitive fields

| Field | Approach |
|-------|----------|
| Internal customer notes | Table `booking_customer_internal_notes` with RLS **manage-only**. Column `notes` removed from `booking_customers`. |
| `booking_time_off.label` | Professionals read **own** linked staff rows on base table; colleague blocks via RPC (no label) or view `booking_time_off_availability`. |

## RLS helper EXECUTE

Policies reference `booking_*` SQL helpers. **`authenticated` must have `GRANT EXECUTE`** on those functions (PostgreSQL checks invoker privileges before running SECURITY DEFINER bodies). Internal-only `booking_assert_member_availability_request` has no grant to `authenticated`.

## Availability RPCs

- Marked **VOLATILE**; row cap via `FOR … LIMIT 2001` loop (no temp tables).
- `p_staff_ids NULL` → colleagues only (`booking_member_availability_staff_allowed`).
- Explicit array → validated business staff ids only.

## Customer internal notes integrity

- `UNIQUE (id, business_id)` on `booking_customers`.
- `FOREIGN KEY (customer_id, business_id)` on `booking_customer_internal_notes`.
- Trigger `booking_trg_customer_internal_notes_business_match`: **BEFORE INSERT OR UPDATE** (all columns); sets `NEW.business_id` from customer; missing customer → error.
- `UNIQUE (id, business_id)`: DO block verifies `conrelid`, `contype = u`, `conkey` order; same name with wrong definition → raise; never DROP.

## SECURITY DEFINER functions (022)

All use `SET search_path = ''` and fully qualified `public.*` references (mitigates search_path hijack without changing global Supabase settings).

| Function | EXECUTE authenticated | Role |
|----------|-------------------------|------|
| `booking_member_role_normalized` | Yes | RLS helper |
| `booking_is_professional_member` | Yes | RLS helper |
| `booking_staff_ids_for_auth_user` | Yes | RLS helper |
| `booking_can_read_full_appointment` | Yes | RLS helper |
| `booking_can_read_time_off_row` | Yes | RLS helper |
| `booking_assert_member_availability_request` | No | RPC-internal |
| `booking_member_availability_staff_allowed` | No | RPC-internal |
| `booking_list_member_staff_busy_intervals` | Yes | Member RPC |
| `booking_list_member_staff_time_off_intervals` | Yes | Member RPC |
| `booking_trg_customer_internal_notes_business_match` | N/A (trigger) | INVOKER |

## Tests

```bash
npm run verify:booking-professional-rls-phase2
BOOKING_PHASE2_LIST=1 node scripts/verify-booking-professional-rls-phase2.mjs
```

Runtime RLS matrix (P2-01+) runs after 022 is applied on a local or allowlisted test DB — not part of default CI until enabled.
