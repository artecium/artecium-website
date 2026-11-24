# Booking — integration test coverage matrix

Legend: **Unit** = `npm run test:booking-unit` (no Postgres). **RLS smoke** = `test:booking-rls` (legacy, ad-hoc users). **Integration** = `test:booking-integration` (requires seed).

| Scenario | Unit | RLS smoke | Integration | Notes |
|----------|------|-----------|-------------|-------|
| Cross-tenant isolation (A ↔ B) | — | Partial (services select) | Yes | |
| Owner permissions | — | Partial (create biz) | Partial | |
| Manager permissions | — | — | Read services | |
| Staff permissions | — | — | No service insert | |
| Anon table access blocked | — | Yes | Yes | |
| Anon public RPC allowed | Partial (flow script) | — | Yes | |
| Public catalog services (active only) | Partial | — | Yes | |
| Public staff for service | Partial | — | Yes | |
| Public `list_day_slots` | Partial (slot validation TS) | — | Yes | |
| Working hours respected | TS helpers | — | Partial (OOH create) | |
| Staff breaks | — | — | Yes (Wed 12:00 local) | |
| Time off | — | — | Yes | Seed + create rejection |
| Buffer / overlap EXCLUDE | — | Yes (staff insert) | Partial (blocked slot hidden) | |
| Inactive business | — | — | Yes | |
| Inactive service | — | — | Yes | |
| Auto vs manual confirmation | Partial | — | Yes | |
| Idempotency replay | Yes | — | Yes | |
| Idempotency key mismatch | Yes | — | Yes | |
| Invalid idempotency key | Yes | — | Yes | |
| Concurrent same slot | — | — | Yes | |
| Error responses without PII | Partial | — | Yes | |
| Timezone (business TZ in RPC) | — | — | Partial (local date for slots) | |
| DST transitions | — | — | **No** | Manual / future test |
| Invite create/accept/expire | — | — | **No** | Manual matrix in RLS doc |
| Platform admin onboarding | — | — | **No** | |
| Load / scale of `list_day_slots` | — | — | **No** | |

## Scripts reference

| Script | Env flag |
|--------|----------|
| `scripts/verify-booking-*.mjs` | none |
| `scripts/booking-rls-test.mjs` | `BOOKING_RLS_TEST=1` |
| `scripts/seed-booking-integration.mjs` | `BOOKING_SEED=1` |
| `scripts/booking-integration-test.mjs` | `BOOKING_INTEGRATION_TEST=1` |

Remote guard: hosted tests require `BOOKING_ALLOW_REMOTE_TESTS=1` and a project ref on `BOOKING_ALLOWLISTED_PROJECT_REFS` (see `booking-test-guards.mjs`).
