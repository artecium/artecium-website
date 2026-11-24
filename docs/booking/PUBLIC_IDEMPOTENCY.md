# Public booking idempotency

Implemented in `015_booking_public_rpc_hardening.sql`.

## Request binding

When `p_idempotency_key` is provided (8–128 chars, `[a-zA-Z0-9_-]`):

1. Compute `idempotency_request_hash = SHA256(service_id|staff_id|starts_at_epoch_ms)`.
2. Store hash on the appointment row with the key.

## Replay

- **Same key + same hash** → return `{ public_reference, status, starts_at, ends_at, replayed: true }`. No guest fields.
- **Same key + different hash** → error `idempotency key reused with different request`.
- **Concurrent duplicate inserts** → unique on `(business_id, idempotency_key)`; loser re-reads and replays if hash matches.

## Privacy

- Replay does **not** return `appointment_id`, guest name, email, or phone.
- Knowing a key only replays **non-PII** booking metadata for the **same** slot request.

## Client helpers

`src/lib/booking/public-idempotency.ts` — key format validation and payload canonicalization for tests.
