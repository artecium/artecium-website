# Member role integration tests (MR-01 … MR-07)

Prepared for **AUTH-03** (migration 020). Does **not** run in CI by default.

## Guards (production safety)

All remote execution uses `scripts/booking-test-guards.mjs`:

| Guard | Effect |
|-------|--------|
| `BOOKING_MEMBER_ROLE_INTEGRATION_TEST=1` | Required to run (otherwise exit 0 skip) |
| `BOOKING_ALLOW_REMOTE_TESTS=1` | Required for hosted Supabase |
| `BOOKING_ALLOWLISTED_PROJECT_REFS` | Only `bwxhdoxesqtdqwkxrmom` in fixtures |
| `BOOKING_EXPECTED_PROJECT_REF` | Optional mismatch check vs URL |

Hosted URLs not on the allowlist **throw** before any test logic.

## Commands

```bash
# Catalog only (no DB)
BOOKING_MEMBER_ROLE_INTEGRATION_LIST=1 node scripts/booking-member-role-integration.mjs

# Run integration (writes invites; allowlisted test project only)
BOOKING_MEMBER_ROLE_INTEGRATION_TEST=1 BOOKING_ALLOW_REMOTE_TESTS=1 \
  node --env-file=.env.booking.test.local scripts/booking-member-role-integration.mjs
```

Optional: `BOOKING_SCHEMA_EXPECT=pre020|post020` to skip incompatible cases.

## Cases

| ID | Description |
|----|-------------|
| MR-01 | Pre-020: RPC `staff` → invite row `staff` |
| MR-02 | Post-020: RPC `professional` → row `professional` |
| MR-03 | Post-020: RPC `staff` → row `professional` |
| MR-04 | Post-020: `owner`/`invalid` rejected; `staff` and empty `p_role` → invite row `professional` (unique emails per run) |
| MR-05 | Accept pending `staff` invite → member `professional` |
| MR-06 | Owner/manager vs professional privileges |
| MR-07 | Payload helpers (local, no DB) |

## Prerequisites

- Migrations **012–014** (minimum), seed `db:seed:booking-integration`
- **MR-02+** require **020** applied
- **MR-05** may skip: migration **019** applied but `service_role` has **SELECT-only** on `booking_member_invites` (no INSERT)
- Read-only 020 detection: Postgres catalog (`BOOKING_MEMBER_ROLE_PROBE_020_ONLY=1`; requires `SUPABASE_DB_PASSWORD`)

## Verify 012–014 (read-only)

**Supabase Dashboard:** Project → **Database** → **Migrations** — confirm versions listing `012`, `013`, `014`.

**SQL Editor (SELECT only):**

```sql
select version, name
from supabase_migrations.schema_migrations
where version like '012%' or version like '013%' or version like '014%'
order by version;
```

**Indirect REST probes:** `npm run check:booking-db-readiness` with `BOOKING_DB_READINESS=1` (014 RPC ok; table SELECT may fail until 019).
