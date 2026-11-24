# Public booking — server availability validation

Authoritative enforcement lives in PostgreSQL (`015_booking_public_rpc_hardening.sql`):

- Function `booking_validate_public_slot(business_id, service_id, staff_id, starts_at)`
- Called by `booking_public_create_appointment` before insert

## Rules (safe defaults)

| Rule | Behaviour |
|------|-----------|
| Business | Must exist and `is_active = true` |
| Service | Active, belongs to business; **duration/buffers from DB** |
| Staff | Active, accepts online bookings, belongs to business |
| Staff ↔ service | Row in `booking_staff_services` |
| Min / max horizon | `min_notice_minutes`, `max_booking_days` on business |
| Timezone | All local calendar checks use `booking_businesses.timezone` |
| Working hours | Staff must have a row for `extract(dow)` covering `[start, end)` local times |
| Same local day | Appointment must not cross local midnight |
| Slot grid | Start minute must be `% slot_interval_minutes = 0`, seconds = 0 |
| Breaks | Slot **start** must not fall inside a break window (matches TS preview) |
| Time off | Blocked range (buffers + duration) must not overlap `booking_time_off` |
| Conflicts | Blocked range must not overlap existing `pending`/`confirmed` appointments |
| Concurrency | EXCLUDE constraint + early check; idempotency unique index |

## Client / UI

`src/lib/booking/availability.ts` and `public-slot-validation.ts` mirror rules for **previews and unit tests only**. The RPC does not trust client-sent duration, price, or IDs without DB validation.

## Product decisions documented

- **No multi-day appointments** in public flow (reject if local end date differs).
- **Break check at slot start only** (same as Phase 1 TS helper).
- **No business-wide working hours** — only per-staff rows; staff without hours cannot be booked publicly.

## Idempotency (same migration)

See `PUBLIC_IDEMPOTENCY.md`.
