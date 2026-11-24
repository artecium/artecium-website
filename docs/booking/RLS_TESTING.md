# Booking — RLS & isolation testing (local only)

## Current status

See **`LOCAL_ENV_STATUS.md`** for the latest machine audit (Docker, CLI, `config.toml`).

**RLS / integration tests were not executed in runtime** until local Supabase is running with migrations 001–**016** applied. **Do not run these steps against production.**

For the full runbook (seed + integration suite), see **`INTEGRATION_TESTING.md`**. Coverage matrix: **`INTEGRATION_TEST_COVERAGE.md`**.

## Prerequisites

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker Desktop.
2. From the repo root: `supabase init` (if needed) and `supabase start`.
3. Apply agency migrations `001`–`011`, then Booking `012`–**`016`**:
   - `supabase db reset` (local only), or
   - `supabase migration up` on the local database URL.
4. Create two test auth users (Dashboard → Authentication or `supabase auth admin create-user`).
5. Set environment for the test script (local URLs only):

```env
BOOKING_RLS_TEST=1
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key>
SUPABASE_SERVICE_ROLE_KEY=<local service role key>
BOOKING_RLS_USER_A_EMAIL=...
BOOKING_RLS_USER_A_PASSWORD=...
BOOKING_RLS_USER_B_EMAIL=...
BOOKING_RLS_USER_B_PASSWORD=...
```

Hosted runs require `BOOKING_ALLOW_REMOTE_TESTS=1` and an allowlisted test project ref (see `INTEGRATION_TESTING.md`).

## Run automated checks

```bash
npm run test:booking-rls
```

## Manual matrix (recommended)

| Case | Expected |
|------|----------|
| Anon `select` on `booking_appointments` | Permission denied / 0 via API |
| Anon `booking_public_get_business` | Public fields only, no PII |
| User A member of business 1, `select` business 2 services | 0 rows |
| User A tries `update` service id from business 2 | 0 rows updated |
| Staff role member | Read appointments; no `update` on services |
| Manager direct `insert` into `booking_business_members` | **Denied** (after 014) |
| Accept invite wrong email | Error |
| Accept invite expired | Error |
| Accept invite twice | Second call fails |
| Two overlapping `pending`/`confirmed` same staff | Second insert / public RPC fails |
| Appointment with buffers overlapping blocked window | EXCLUDE violation (013+) |
| Public RPC idempotency replay same payload | `replayed=true`, no guest fields |
| Public RPC idempotency key + different staff/time | Error key reused |
| Public RPC outside working hours / break / time off | Error before insert |
| Invalid idempotency key format | Error |

## Overlap / buffers

After `013`+`014`, overlap uses `blocked_starts_at` / `blocked_ends_at` (service buffers). Test with `buffer_after_minutes` on service A so a second booking starting immediately after `ends_at` is rejected.
