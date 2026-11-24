# Migration `012_booking_foundation.sql` — review before remote apply

## Effects

- Creates **11 new tables** prefixed `booking_*` (no changes to agency tables).
- Enables **RLS** on all booking tables; revokes `anon`/`public` direct access.
- Adds **GiST exclusion constraint** preventing overlapping `pending`/`confirmed` appointments per staff member.
- Adds **SECURITY DEFINER** RPCs:
  - `booking_public_get_business(slug)` — safe public fields only.
  - `booking_public_create_appointment(...)` — idempotency + overlap enforcement.
  - `booking_create_business_with_owner(...)` — onboarding first tenant + owner member.

## Risks

| Risk | Mitigation |
|------|------------|
| `btree_gist` extension | Standard on Supabase; requires superuser once per DB (usually allowed). |
| Exclusion constraint rejects valid edge cases | Buffers included in appointment `starts_at`/`ends_at` at insert time; expand in app before insert in Phase 3. |
| Public RPC abuse / spam | Rate limit at edge (Phase 4); idempotency key supported. |
| Agency staff global access | Booking RLS uses **`booking_business_members` only**; agency `is_staff_member()` does **not** grant booking access except `is_owner_or_admin()`. |
| SQL typo / policy gap | Run verification block in migration comments on **staging** only. |

## Not included (later phases)

- Slot validation inside `booking_public_create_appointment` against working hours (Phase 3 RPC).
- Email notifications.
- Stripe payment columns populated.

## Apply locally only

```bash
# Example (local Supabase CLI — not production)
# supabase db reset   # destructive local only
# supabase migration up
```

**Do not apply to production** until Phase 6 sign-off.
