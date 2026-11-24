# Platform admin privileges & business onboarding

## Artecium platform admins (`is_owner_or_admin()`)

Booking reuses agency platform admin detection:

| Mechanism | Effect |
|-----------|--------|
| `booking_is_platform_admin()` | Wraps `public.is_owner_or_admin()` |
| `booking_can_manage_business(id)` | **True for any business** when platform admin |
| `booking_can_access_business(id)` | **True for any business** when platform admin |
| RLS on all `booking_*` tables | Platform admin satisfies `using` clauses for read/write |

**Intentional:** Artecium operations staff can support any tenant. Not granted to portal clients or booking-only staff/managers.

### RPCs without extra platform checks

- `booking_create_business_with_owner` — any **authenticated** user (not only platform admin).
- Public RPCs — anon/authenticated, no admin bypass needed.

## Unlimited business creation

**Current product behaviour:** any signed-in user may call `booking_create_business_with_owner` and become **owner** of a new tenant.

**Risk:** spam / abuse of slugs and storage.

**Future limit options (not implemented):**

1. Require platform admin flag or invite code to create businesses.
2. Cap businesses per user via counter table + RPC check.
3. Tie first business to verified email domain.
4. Stripe subscription before activation (`booking_business_subscriptions` already stubbed).

**Safe default until then:** rate-limit at edge (Vercel/WAF) and monitor; schema unchanged.

## Booking roles vs platform admin

| Role | Scope |
|------|--------|
| Booking `owner` / `manager` | Single business (RLS) |
| Booking `staff` | Read tenant data; writes denied by RLS except via future staff tools |
| Platform admin | Cross-tenant (support) |
