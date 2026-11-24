# Audit scripts — correção de falsos positivos (2026-11-16)

**Project ref (read-only):** `bwxhdoxesqtdqwkxrmom`  
**Operações na BD:** apenas `SELECT` / catálogo; **nenhuma** migration, repair, DDL/DML ou alteração de configuração Supabase.

## Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `scripts/supabase-phase3-audit-readonly.mjs` | Probes 013 e 021; nota em cabeçalho sobre RLS |
| `scripts/supabase-full-db-audit-readonly.mjs` | Agregados `payments` / `invoices`; contagem `booking_member_invites` via `pg_class` |

## 1. Migration 013 — `booking_member_invites`

| | Antes | Depois |
|---|--------|--------|
| **Probe** | `SELECT … FROM public.booking_member_invites LIMIT 0` | Catálogo: `information_schema.tables`; RLS em `pg_class`; ≥2 políticas em `pg_policies` (`Booking managers read invites`, `Booking managers write invites`); `blocked_starts_at` mantido |
| **Motivo** | Ligação de auditoria sem `auth.uid()` → RLS nega SELECT → **falso parcial** | Probes independentes de papel de sessão |
| **Estado reconciliação** | `partially_applied` | **`applied`** (4/4 probes OK) |

## 2. Migration 021 — COMMENT / REVOKE

| | Antes | Depois |
|---|--------|--------|
| **Probe** | `has_function_privilege('PUBLIC', …)` | `has_function_privilege('public', …)` (papel PostgreSQL correcto) |
| **Extra** | — | `pg_description` com comentário `Internal:%` na função |
| **Erro visto** | `role "PUBLIC" does not exist` | — |
| **Estado reconciliação** | `not_applied` | **`applied`** (2/2 probes OK) |

## 3. Fase 1 — `payments` / `invoices` e `deleted_at`

| | Antes | Depois |
|---|--------|--------|
| **SQL** | `… FROM payments WHERE deleted_at IS NULL` (idem invoices) | `GROUP BY status` sem filtro `deleted_at` |
| **Efeito** | Erro SQL ou conclusões erradas sobre coluna inexistente | Agregados OK no ambiente de teste |
| **Prova pós-correção** | — | `docs/audit/full-db-audit-readonly-latest.json` → `aggregates.payments_by_status` / `invoices_by_status` com arrays (sem `{ error }`) |

## 4. Outros probes (prevenção)

- **`booking_member_invites` (contagem fase 1):** substituído `COUNT(*)` na tabela por estimativa `pg_class.reltuples` (evita RLS na contagem).

## Resultados pós-correção (fase 3)

```
26/26 migrations → state: applied
schema_migrations listadas: 025, 026 (inalterado)
rls_policy_count: 205
security_definer_count: 39
payments_has_deleted_at: false
```

**Saídas atualizadas:** `docs/audit/phase3-audit-raw.json`, `docs/audit/RLS_INVENTORY.json`.

## Antes / depois (reconciliação resumida)

| v | Antes | Depois |
|---|--------|--------|
| 001–012, 014–020, 022–026 | applied | applied |
| **013** | partially_applied | **applied** |
| **021** | not_applied | **applied** |

## Execução

```powershell
$env:BOOKING_ALLOW_REMOTE_TESTS='1'
$env:BOOKING_EXPECTED_PROJECT_REF='bwxhdoxesqtdqwkxrmom'
node scripts/supabase-phase3-audit-readonly.mjs
node scripts/supabase-full-db-audit-readonly.mjs
```

Relatório de auditoria fase 3 revisto: `docs/audit/PHASE3_DEEP_AUDIT_REPORT.md` (secção «Correcção de scripts»).

---

## Fase 5.1 (2026-11-16) — cliente multi-tenant local

- Novos: `phase5-local-guards.mjs`, `seed-client-multi-tenant.mjs`, `supabase-phase5-client-isolation-readonly.mjs`, `phase5-run-local-pipeline.mjs`
- Migrações `023` v2.5/v2.6 arquivadas em `supabase/migrations_archive/`
- Pipeline: bloqueado por Docker ausente; remoto `bwxhdoxesqtdqwkxrmom` **não alterado**