# Phase 2 harness 023 — histórico de migrations (divergência SQL directo)

## Estado observado (`bwxhdoxesqtdqwkxrmom`)

| Sinal | Valor |
|-------|--------|
| Schema `phase2_harness` | **Presente** (apply SQL directo v2.6) |
| Tabela `supabase_migrations.schema_migrations` | **Inexistente** na ligação `postgres` directa |
| Linha `023` em `schema_migrations` | **Não consultável** (tabela ausente) |

## Causa provável

1. A migration 023 foi aplicada com **SQL directo** (`pg` + ficheiro completo), à semelhança do padrão `scripts/booking-apply-migration-019.mjs`, **sem** Supabase CLI `db push`.
2. Neste projeto, o histórico oficial de migrations pode depender da **CLI / Dashboard Migrations**, que grava em `supabase_migrations.schema_migrations` quando a apply passa pelo pipeline Supabase.
3. O catálogo real (schema, funções) está **correto**; só a **trilha de auditoria CLI** pode estar desalinhada.

## Procedimento recomendado (exige autorização remota explícita)

**Não executar sem autorização.** Não inserir linhas manualmente em SQL Editor.

Opção A — **Supabase migration repair** (preferida para “já aplicada”):

```bash
# Preparado 2025-11-14 — NÃO executado (requer autorização remota de escrita no histórico)
supabase link --project-ref bwxhdoxesqtdqwkxrmom
supabase migration repair --status applied --remote 023
```

- CLI disponível via `npx supabase` (ex.: v3.1.0): sintaxe `migration repair [version...] --status applied|reverted --remote`.
- Marca `023` como aplicada **sem** reexecutar DDL.
- **Risco:** versão no histórico deve coincidir com o ficheiro local (`023_phase2_harness_persistent_tracking.sql`).
- **Verificado read-only 2025-11-14 (encerramento):** `schema_migrations` **não existe**; `phase2_harness` presente; 22 funções; C1 + `digest_mismatch_before_delete` em `cleanup_execute`; guard desarmado; `runs` = 0. Ver `PHASE2_HARNESS_V2_6_FINAL_VALIDATION.md` §9.

Opção B — **Aceitar dupla fonte de verdade**:

- **Verdade funcional:** catálogo PG (`phase2_harness.*`, hashes de funções).
- **Verdade operacional:** checklist pré-apply + scripts read-only (`booking-migration-023-postcheck-readonly.mjs`).

Opção C — **Recriar histórico no próximo projeto** (não recomendado aqui): dropar `phase2_harness` e `db push` — **destrutivo**, fora do âmbito.

## Comandos proibidos sem autorização

- `INSERT INTO supabase_migrations.schema_migrations`
- `supabase db push` (reaplicaria ou falharia em objetos existentes)
- `migration up` sobre 023 já presente

## Verificação read-only local

```powershell
$env:BOOKING_ALLOW_REMOTE_TESTS='1'
$env:BOOKING_EXPECTED_PROJECT_REF='bwxhdoxesqtdqwkxrmom'
npx -p pg node --env-file=.env.booking.test.local scripts/booking-migration-023-schema-migrations-readonly.mjs
npx -p pg node --env-file=.env.booking.test.local scripts/booking-migration-023-postcheck-readonly.mjs
```
