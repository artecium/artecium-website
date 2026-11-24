# Booking — local Supabase environment status

Last verified: agent run on developer machine (Windows).

## Etapa 1 — Verificação

| Check | Result |
|-------|--------|
| Docker installed / running | **No** — `docker` not in PATH |
| Supabase CLI | **No** — `supabase` not in PATH |
| `supabase/config.toml` | **Missing** — only `supabase/migrations/` and `.temp/` in repo |
| Remote production DB touched | **No** — no CLI, no credentials used |

## Migrations in repo

Ordered chain:

| File | Scope |
|------|--------|
| `001_initial_schema.sql` | Core platform schema |
| `002`–`011` | Agency platform, RLS, grants |
| `012_booking_foundation.sql` | Booking tables, RLS, public RPCs, `btree_gist` |
| `013_booking_security_invites.sql` | Invites, buffer overlap, hardened RPCs |
| `014_booking_membership_hardening.sql` | Invite-only membership writes, accept token |
| `015_booking_public_rpc_hardening.sql` | Availability validation, idempotency binding |
| `016_booking_public_catalog_slots.sql` | Public catalog + `list_day_slots` RPCs |

### Dependencies (012–015 require 001–011)

- **Tables:** `public.profiles`, `public.companies` (FKs on booking businesses/members/staff).
- **Functions:** `public.set_updated_at()` (triggers), `public.is_owner_or_admin()` → `booking_is_platform_admin()`.
- **Extensions:** `btree_gist` (012 EXCLUDE overlap); `pgcrypto` (013/014/015 digests).
- **013+:** columns `blocked_starts_at` / `blocked_ends_at` + trigger on `booking_appointments`.
- **014+:** table `booking_member_invites`; drop direct INSERT policy on `booking_business_members`.
- **015:** column `idempotency_request_hash`; replaces `booking_public_create_appointment` return shape.

Applying **only** 012–015 on an empty database **will fail** without 001–011.

## Etapa 2 — Preparar ambiente (comandos seguros)

**Não executar** `supabase link`, `db push`, ou apontar `.env` para `*.supabase.co` de produção.

### Windows

1. Install [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) and ensure WSL2 backend is running.
2. Install Supabase CLI, e.g. `scoop install supabase` or `npm i -g supabase` (see [CLI docs](https://supabase.com/docs/guides/cli)).
3. From repo root:

```powershell
cd C:\Users\rodri\Documents\Artecium\artecium-website
supabase init   # creates config.toml locally; review before commit if desired
supabase start  # local only — prints anon/service keys for 127.0.0.1:54321
supabase db reset   # applies supabase/migrations/* in order — LOCAL ONLY
```

4. Create two test users (local):

```powershell
supabase auth admin create-user --email booking-test-a@example.com --password "<local-only-password>"
supabase auth admin create-user --email booking-test-b@example.com --password "<local-only-password>"
```

5. Use **local** keys from `supabase status` (never production):

```powershell
$env:BOOKING_RLS_TEST = "1"
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "<anon from supabase status>"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service_role from supabase status>"
$env:BOOKING_RLS_USER_A_EMAIL = "booking-test-a@example.com"
$env:BOOKING_RLS_USER_A_PASSWORD = "<local-only-password>"
$env:BOOKING_RLS_USER_B_EMAIL = "booking-test-b@example.com"
$env:BOOKING_RLS_USER_B_PASSWORD = "<local-only-password>"
npm run test:booking-rls
```

## Etapa 3 — Testes (nesta máquina)

| Test | Result |
|------|--------|
| `BOOKING_RLS_TEST=1 npm run test:booking-rls` | **Not run** — failed immediately: missing URL/keys (no local stack) |
| Unit verifies (`verify:booking-*`, portal routing) | Can run without Docker; see CI section in `RLS_TESTING.md` |

### Integration tooling (repo)

| Command | Purpose |
|---------|---------|
| `npm run db:seed:booking-integration` | Deterministic local seed (`BOOKING_SEED=1`) |
| `npm run test:booking-integration` | Full local suite (`BOOKING_INTEGRATION_TEST=1`) |
| `npm run test:booking-unit` | All `verify:booking-*` without Postgres |
| `npm run test:booking-rls` | Legacy smoke (custom users) |

See **`INTEGRATION_TESTING.md`** and **`INTEGRATION_TEST_COVERAGE.md`** for gaps (invites, DST, etc.).

## Confirmation

No remote database migrations, deploy, DNS, or Vercel changes were performed in this verification pass.
