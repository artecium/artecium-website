# Phase 2 persistent harness runbook (v2.6)

Test Supabase project `bwxhdoxesqtdqwkxrmom` when explicitly authorized. **Ativa no repo:** `supabase/migrations/023_phase2_harness_persistent_tracking.sql` (SHA-256 `f9baa5724fff726df70a6635971eede93e9be891ae4cba20504ab2a64a6c6e36`). **Arquivos:** `_v2.5.sql`, `_v2.6.sql` preservados. Does **not** modify migration 022 (`961bb64a…`).

## Validação local (sem remoto)

```powershell
npm run test:booking-phase2-harness-full
npm run verify:booking-phase2-persistent-harness
```

Documentação dos cenários PG: `docs/booking/PHASE2_HARNESS_PG_TWO_SESSION_TESTS.md`.

**Encerramento validação v2.6:** `docs/booking/PHASE2_HARNESS_V2_6_FINAL_VALIDATION.md`  
**Prontidão operacional (proposta, sem ativação):** `docs/booking/PHASE2_HARNESS_OPERATIONAL_READINESS.md`

Última bateria local integral: **2025-11-14** — C1, T1–T10, T9 parity, verifiers 114 + 49 PASS; postcheck remoto read-only OK.

## Prerequisites

- Migration 023 applied on the **test** project (await explicit authorization).
- Integration seed + optional incremental fixtures (`booking-phase2-incremental-fixtures.mjs`) — **separate** from `phase2_harness.*`.
- Distinct UUIDs for fixture keys `p15`–`p22` (see `buildNotesTestSql` / auth-plan).
- `business_a_id` / `business_b_id` stored in run metadata via `run_start` (snake_case JSON keys).

## Deployment guard (fail-closed)

`phase2_harness.deployment_guard` is created with `cleanup_armed = false`.

**Before any `cleanup_execute` on the authorized test project**, arm manually (SQL Editor as `postgres`):

```sql
UPDATE phase2_harness.deployment_guard
SET cleanup_armed = true,
    armed_at = now(),
    armed_by = '<operator>',
    environment_tag = '<human label for this test project, e.g. team name + purpose>'
WHERE id = 1;
```

- Do **not** commit arm SQL or production project refs into the repo.
- `cleanup_execute` aborts with `cleanup_not_armed` if disarmed or row missing.
- Disarm after test runs when appropriate: `UPDATE ... SET cleanup_armed = false, ...`.

## Preparation vs RLS tests

| Path | Purpose | Proves RLS? |
|------|---------|-------------|
| `fixturePrep` (`track_fixture_*`, JWT note INSERT in session `DO`) | Create fixtures + creation proof | **No** — administrative prep only |
| `p2_15` … `p2_22` (`wrapAuthenticatedSqlRollback`) | Authorization matrix | **Yes** |

- Do **not** insert into `phase2_harness.run_tracking` from `authenticated`.
- Harness functions are `SECURITY DEFINER` and must **not** use `SET ROLE` (PostgreSQL forbids it).
- Note fixtures: one `DO` block per note — authenticated `INSERT` then `track_fixture_note` after `RESET ROLE`, same transaction.
- Customer fixtures: `INSERT` then `track_fixture_customer` in the same `DO` block.

## Fixture prep contract

1. Run `runStart` then the full `fixturePrep` script as **one paste** when possible (avoids split MCP transactions).
2. Pre-existing customers/notes are validated but **not** tracked.
3. Tracking only after successful `INSERT` (`RETURNING` / `track_fixture_*` guards).

## Role check (Dashboard / CLI / MCP)

Run first on every session:

```sql
SELECT current_user, session_user;
```

Harness functions are granted to **`postgres` only**. If MCP uses another role, `cleanup_*` will fail until you use SQL Editor as postgres or adjust grants (out of default v2.6 candidata).

## Workflow

| Step | Action | SQL helper (from `buildNotesTestSql`) |
|------|--------|--------------------------------------|
| 0 | Confirm test project + arm guard | manual |
| 1 | `run_start` | `runStart` |
| 2 | Fixture prep SQL | `fixturePrep` |
| 3 | `mark_prepared` | `markPrepared` |
| 4 | Query tracking + optional JS sync | `queryRunTrackingSql` |
| 5 | Auth tests (ROLLBACK) | `p2_15` … `p2_22` |
| 6 | `mark_tested` with results JSON | `markTested` |
| 7 | **Preview** (returns digest v3) | `cleanupPreview` |
| 8 | **Human review** of digest + audits | read snapshot / tracking |
| 9 | **Approve** (separate step) | `cleanupApprove(digest)` |
| 10 | **Execute** cleanup | `cleanupExecute(digest)` |

Never chain approve → execute in one automated turn without human confirmation.

## Digest v3

- Algorithm version **3** (`digest_algorithm_version`); note text in digest is **exact column content** (no trim).
- `to_delete_customer` excludes customers where `internal_note_blocks_customer_delete` is true (022: one note row per customer).
- Golden vectors: `scripts/booking-phase2-harness-digest-golden.mjs` — confirm via `npm run verify:booking-phase2-persistent-harness`.
- After apply on test DB, verify `SELECT phase2_harness.compute_cleanup_digest(...)` matches JS for the same fixture state.

## Cleanup execute (v2.6 — C1 + strict A + digest after lock + digest before DELETE)

| Step | Action |
|------|--------|
| 1 | `FOR UPDATE` on `phase2_harness.runs` + approval gates |
| 2 | Load active snapshot; **`validate_fixture_pairs`** → `v_fixture_pairs` (reject `invalid_fixture_pairs`) |
| 3 | Recompute digest from validated pairs; must match snapshot digest (`snapshot_digest_invalid` if tampered) |
| 4 | `deployment_guard` (`cleanup_not_armed`) |
| 5 | **C1:** all six `v_fixture_pairs` customers must exist in `booking_customers` with matching email/business → else `fixture_customers_incomplete` (zero DELETE, no row locks) |
| 6 | `FOR UPDATE` on `run_tracking` for this run (`ORDER BY kind, customer_id`) |
| 7 | `FOR UPDATE OF c` on **all six validated fixture customers** **F** (`ORDER BY c.id`) |
| 8 | `FOR UPDATE OF n` on existing notes for **F** (`ORDER BY n.customer_id`) |
| 9 | **`compute_cleanup_digest`** (#1); must match **approved** digest else `digest_mismatch_after_lock` (zero DELETE) |
| 10 | Strict A ineligible check → `ineligible_internal_note` (zero DELETE; repeated inside delete sub-block) |
| 11 | **`compute_cleanup_digest`** (#2) immediately before first DELETE; mismatch → `digest_mismatch_before_delete` (zero DELETE) |
| 12 | DELETE notes then customers; failure → `delete_failed`, approval cleared |

All abort paths use `_cleanup_abort_run`: `status = tested`, `cleanup_status = aborted`, approval nulled. No `executed_partial`. Digest algorithm remains **v3** (golden vectors unchanged).

## Digest sections vs locks (v2.6 audit — R1 A + C1)

| Section | Tables read | Locks held before post-lock digest | Concurrent change risk | Post-lock digest stable? |
|---------|-------------|-----------------------------------|-------------------------|--------------------------|
| `created_this_run` | `run_tracking`, `booking_customer_internal_notes` (note kind) | `run_tracking` rows; note rows on **F** if present | New `run_tracking` INSERT before lock → digest drift → `digest_mismatch_after_lock` | **Yes** while locks held (theory; PG tests required) |
| `pre_existing_untracked_customer` | `booking_customers` | All **F** customers | UPDATE/DELETE on locked customer rows blocked | **Yes** for locked columns; new customer outside **F** not in digest |
| `pre_existing_untracked_note` | `booking_customer_internal_notes`, `booking_customers` | **F** customers + existing notes | First note INSERT waits on `c` lock (FK); UPDATE on locked note blocked | **Yes** after locks + recalc |
| `to_delete_note` | notes + tracking | Same as above | Same | **Yes** if digest matches approved |
| `to_delete_customer` | customers + tracking + `internal_note_blocks_*` | **F** + tracking | Same + strict A abort | **Yes** if digest matches approved |

**Residual (not fully stabilizable in harness SQL alone):**

- Fixture customer **deleted after C1** but before/during locks — mitigated by locks + digest #1/#2; still needs PG two-session tests.
- `phase2_harness.runs.metadata` business ids — read at validate time, not row-locked (tamper → `validate_fixture_pairs` failure).
- PL/pgSQL vs JS `json_escape` on exotic Unicode in notes (digest parity).

## Supabase SQL Editor

- Paste each block separately; state persists in `phase2_harness` tables between runs.

## Supabase CLI

- Apply migration when authorized: link test project, then migrate per project docs (not in default agent flow).

## Cursor + Supabase MCP

- **Do not assume** shared transactions between MCP calls.
- Pass the same `run_id` in every call.
- After preview, copy **digest** from result before approve/execute.

## Rejection / aborted

- `cleanup_reject` → new preview allowed; previous approval invalidated.
- Execute: `fixture_customers_incomplete`, `digest_mismatch_after_lock`, `digest_mismatch_before_delete`, `snapshot_digest_invalid`, `invalid_fixture_pairs`, ineligible, not armed → `aborted`, `tested`, approval cleared.
- Sub-block delete failure → `delete_failed`.

## Concurrency validation (test DB, manual — **required**; not proven by static verifiers)

Suggested PostgreSQL sessions:

- Approve digest; mutate note text on **F** after approve, before/during execute → expect `digest_mismatch_after_lock` or `digest_mismatch_before_delete` depending on timing relative to digest #1/#2.
- Remove one fixture customer after approve, before execute → expect `fixture_customers_incomplete` (no DELETE).
- Insert eligible `phase2-%` note after approve while execute holds **c** lock → expect wait, then digest stable or mismatch depending on timing (measure).
- Insert ineligible note before locks → `ineligible_internal_note`.
- Tamper snapshot `fixture_pairs` in DB → `invalid_fixture_pairs` or `snapshot_digest_invalid`.
- Two simultaneous `cleanup_execute` on same `run_id`.

## Migration chain (recomendação — 2025-11-13 validação v2.6)

| Estado remoto (`bwxhdoxesqtdqwkxrmom`) | `022` aplicada; `phase2_harness` **ausente**; `023` **nunca** aplicada |
| Repo local | `023_phase2_harness_persistent_tracking.sql` = v2.5 **referência**; `023_phase2_harness_persistent_tracking_v2.6.sql` = candidata |

**Decisão recomendada: alternativa A (migration única 023 v2.6).**

- Aplicar **uma só** migration `023` com o conteúdo da candidata v2.6 (no release, renomear/substituir o ficheiro aplicável para `023_phase2_harness_persistent_tracking.sql`; manter cópia v2.5 arquivada no git history ou tag, **sem** aplicar v2.5 primeiro).
- **Não** usar 024 com DDL completo duplicado: v2.5 e v2.6 são ambas *bootstrap* do schema (`CREATE TABLE`, funções, triggers) — um 024 “full copy” duplicaria objetos ou exigiria migração incremental frágil.
- **024** só faria sentido se v2.5 já estivesse aplicada em algum ambiente; isso **não** é o caso do teste atual.

Checklist pré-apply (autorização explícita necessária):

1. Verificar `current_user = postgres` no SQL Editor.
2. Confirmar `schema_migrations` / CLI não regista `023`.
3. Aplicar `022` já presente — não reaplicar.
4. Aplicar ficheiro v2.6 como `023`.
5. Read-only: `SELECT cleanup_armed FROM phase2_harness.deployment_guard` → `false`.
6. Read-only: contagens zero em `phase2_harness.runs` após apply.

Procedimento read-only pós-apply: ver `PHASE2_HARNESS_PG_TWO_SESSION_TESTS.md` secção “Smoke read-only”.

Histórico CLI vs SQL directo: `docs/booking/PHASE2_HARNESS_MIGRATION_HISTORY.md`.

Verificador local: `npm run verify:booking-phase2-persistent-harness` (ficheiro activo `023_…sql` = v2.6; arquivo `_v2.5.sql`).

## Critérios “harness validado”

| Critério | Estado (validação 2025-11-13) |
|----------|-------------------------------|
| Verificadores estáticos ≥105 / ≥49 | **Concluído** (105 / 49) |
| Digest v3 goldens | **Concluído** (local) |
| Testes PostgreSQL duas sessões T1–T10 | **Pendente** (sem PG local isolado) |
| `deployment_guard` armado em teste | **Não** (só após autorização operacional) |
| Cleanup execute em projecto real | **Não** |

Não marcar o harness como validado em BD até T1–T10 (ou subconjunto acordado) passarem numa base **descartável** ou no projecto de teste com fixtures dedicadas.

## History

Runs, `run_tracking`, and snapshots are **never** deleted by cleanup. Optional manual archival only.

## Limitations (unconfirmed until test DB)

- Parity of `json_escape` between PL/pgSQL and JS on exotic Unicode in notes.
- MCP connection role and query size/timeouts.
- `customer.created_at` vs `run.started_at` guard on `track_fixture_customer` if prep is delayed >5s (adjust interval if needed).
