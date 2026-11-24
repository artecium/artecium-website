# Phase 5 — Local environment report

**Generated:** 2026-11-16T21:05:23.597Z
**Protected remote ref:** `bwxhdoxesqtdqwkxrmom` — must remain untouched.

## Docker / CLI

| Check | Result |
|-------|--------|
| Docker | BLOCKED |
| Supabase CLI (npx) | available via `npx supabase@2` |

## Migration inventory

- Files in `supabase/migrations/`: **26**
- Canonical 023: `023_phase2_harness_persistent_tracking.sql`
- Archived (not in migrations): v2.5, v2.6 → `supabase/migrations_archive/`

## Pipeline steps

- Migrations listed: 001_initial_schema.sql, 002_services_plans_subscriptions.sql, 003_platform_hardening.sql, 004_security_hardening.sql, 005_security_followup.sql, 006_authenticated_select_grants.sql, 007_storage_docume…
- STOP: Docker not found — supabase start skipped

## Blockers

**Docker Desktop / Podman not available** — `supabase start` cannot run. Install Docker and re-run:

```powershell
$env:PHASE5_RUN_FULL='1'
node scripts/phase5-run-local-pipeline.mjs
```

## Remote verification

- No `supabase link` to remote was executed by this pipeline.
- `supabase/.temp/linked-project.json` may still reference remote from past work — **do not run db push** against it.
