# Phase 2 harness — testes PostgreSQL de duas sessões (v2.6)

**Não executar no Supabase remoto sem autorização explícita.**  
**Não usar dados reais ou fixtures partilhadas com outros testes.**

Última validação integrada: **2025-11-14** — ambiente local: **embedded-postgres**; postcheck remoto read-only concluído na mesma data. Registo formal: `PHASE2_HARNESS_V2_6_FINAL_VALIDATION.md`.

## Bateria completa (um comando)

```powershell
# Uma vez no Windows, se npm bloquear binários PG:
npm approve-scripts @embedded-postgres/windows-x64

npm run test:booking-phase2-harness-full
```

O orquestrador `scripts/booking-phase2-harness-full.mjs`:

1. Confirma SHA-256 da migration ativa 023.
2. Executa `scripts/booking-phase2-harness-pg-t1-t10.mjs` (C1 + T1–T8, T10; T9 delegado).
3. Executa `scripts/booking-phase2-harness-digest-sql-parity.mjs` (T9 vetores).
4. Executa `verify:booking-phase2-persistent-harness` e `verify:booking-phase2-incremental-fixtures`.

Peças individuais:

```powershell
node scripts/booking-phase2-harness-pg-t1-t10.mjs
node scripts/booking-phase2-harness-digest-sql-parity.mjs
node scripts/verify-booking-phase2-persistent-harness.mjs
```

## Pré-requisitos locais

1. Node 20+ e dependências do repo (`embedded-postgres`).
2. Bootstrap automático: `scripts/booking-phase2-harness-pg-minimal-prereq.sql` + migration ativa `supabase/migrations/023_phase2_harness_persistent_tracking.sql` (hash `f9baa572…`) + `scripts/booking-phase2-harness-pg-test-local.sql` (trigger T8 apenas local).
3. Sessão PG efetiva: `postgres` (embedded).
4. `deployment_guard.cleanup_armed` armado só na base descartável via `prepareApprovedRun` / `armGuard`.

## Convenções de sessões

- **Sessão A**: `cleanup_execute` ou locks até passo intermédio.
- **Sessão B**: UPDATE nota, INSERT tracking, segundo `cleanup_execute`, etc.
- Fixtures determinísticas: UUIDs `p15`–`p22` em `scripts/booking-phase2-harness-pg-lib.mjs`.
- `prepareApprovedRun` chama `ensureRunRow` antes de `run_start` para evitar `runs_pkey` quando `seedP17TrackedRun` já criou a run.

## C1 — Fixture incompleta (isolado)

| Campo | Valor |
|-------|--------|
| Setup | Seed **5/6** clientes (excluir `p22`); aprovar com snapshot válido |
| Execução | `cleanup_execute` com digest aprovado |
| Esperado | `fixture_customers_incomplete`; `cleanup_approval_digest` limpo; **0** DELETE |
| Diferença T2 | T2 remove cliente **depois** do approve → muitas vezes `snapshot_digest_invalid` antes de C1 |
| 2025-11-14 | **PASS** (embedded) |

## Matriz T1–T10 (execução local 2025-11-14)

| ID | Cenário | Sessões | Resultado | Evidência resumida |
|----|---------|---------|-----------|-------------------|
| T1 | Nota mutada após approve | 1 | **PASS** | `snapshot_digest_invalid`; contagens inalteradas |
| T2 | Cliente fixture removido após approve | 1 | **PASS** | `snapshot_digest_invalid` |
| T3 | Nota mutada concorrente com execute | 2 | **PASS** | `digest_mismatch_after_lock` ou `snapshot_digest_invalid` em A |
| T4 | INSERT nota vs execute (locks) | 2 | **PASS** | `digest_mismatch_after_lock`; B bloqueou ~30–40 ms |
| T5 | INSERT `run_tracking` concorrente | 2 | **PASS** | execute completou sem estado duplo |
| T6 | Nota interna inelegível (`Real CRM`) | 1 | **PASS** | `ineligible_internal_note` |
| T7 | Dois `cleanup_execute` | 2 | **PASS** | `okCount`: 1 |
| T8 | Falha controlada DELETE customer | 1 | **PASS** | trigger local `harness_test_fail_customer_delete` → `delete_failed`; notas revertidas |
| T9 | Paridade digest SQL/JS | — | **PASS** (script dedicado) | ver secção T9 abaixo |
| T10 | Ordem `digest_mismatch_before_delete` antes de `del_notes` + execute estável | 1 | **PASS** | `staticOk`; `deleted_notes`/`deleted_customers` |

T9 no runner T1–T10 aparece como **SKIP** (por desenho); a paridade é obrigatória no script `booking-phase2-harness-digest-sql-parity.mjs`.

## T9 — Vetores digest v3 (SQL = JS)

| Vetor | Golden | 2025-11-14 |
|-------|--------|------------|
| `empty_records` | `e53ae63c…9177` | PASS |
| `p16_customer_only` | `e3a2a1c1…6b49` | PASS (corrigido: inclui `to_delete_customer` como SQL) |
| `p17_full` | `d38709a5…ba25` | PASS |
| `p17_note_mutated` | `3b1aaa21…79e0` | PASS |
| `unicode_note` | — | PASS |
| `email_normalization` | — | PASS |
| `multiple_tracked_customers` | — | PASS |
| `empty_string_note_ineligible` | — | PASS |
| `json_escape_special_chars` | — | PASS |

Digest vazio conhecido: `e53ae63c1a31adcaf45da945b81dc80f703ea7aec218531d2ed7482489219177`.

## T8 — Atomicidade (local)

Trigger **apenas** em `booking-phase2-harness-pg-test-local.sql`: `set_config('phase2_harness.fail_customer_delete','on')` → DELETE customer aborta; `cleanup_execute` devolve `delete_failed`; contagem de notas igual; `cleanup_status = aborted`.

## Interpretar falhas

| Sintoma | Causa provável |
|---------|----------------|
| `runs_pkey` | `prepareApprovedRun` repetia `run_start` após `seed*` — usar `ensureRunRow` |
| `run_tracking_run_id_fkey` | tracking sem linha em `runs` — idem |
| EBUSY ao apagar `%TEMP%` | Windows + `persistent: false` no embedded — usar `persistent: true` no lib |
| T9 p16 FAIL | golden JS só `created_this_run` — alinhar com secções SQL (`to_delete_customer`) |

## Limitações

- Concorrência real (deadlocks, ordem de locks) demonstrada com embedded e timings curtos; não substitui stress em PG partilhado 24/7.
- T4 mede bloqueio por latência (~ms), não grava `pg_locks` por defeito.
- Remoto: **nunca** armar guard, `cleanup_execute`, ou seeds de harness nesta bateria.

## Smoke read-only (pós-apply remoto autorizado)

Ver `docs/booking/PHASE2_HARNESS_MIGRATION_HISTORY.md` e `scripts/booking-migration-023-postcheck-readonly.mjs`.