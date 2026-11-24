# Supabase de produção — configuração e migrations 024–026

Planeamento e validação **read-only**. Não substitui aprovação humana para DDL remoto, `db push`, ou deploy Vercel.

---

## 1. Mapa de configuração Supabase no repositório

### Variáveis de ambiente (aplicação)

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + servidor (PostgREST, Auth) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública (`createServerClient` / browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alias legado em alguns scripts de teste |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | `src/lib/supabase/admin.ts`, seeds e scripts servidor |
| `SUPABASE_DB_PASSWORD` / `DATABASE_URL` / `SUPABASE_DB_URL` | Ligação `postgres` read-only ou apply controlado |

### Ficheiros locais (gitignored exceto `.example`)

| Ficheiro | Papel |
|----------|--------|
| `.env.local` | Dev local da app (hoje frequentemente aponta ao projeto de **teste** — separar antes do go-live) |
| `.env.booking.test.local` | Integração + migrations no allowlist `bwxhdoxesqtdqwkxrmom` |
| `.env.booking.test.local.example` | Template teste |
| `.env.booking.prod.local` | **Produção** — credenciais só operador (não versionado) |
| `.env.booking.prod.local.example` | Template produção |

### Código runtime

| Caminho | Função |
|---------|--------|
| `src/lib/supabase/server.ts` | SSR + cookies |
| `src/lib/supabase/client.ts` | Client components |
| `src/lib/supabase/proxy.ts` | Middleware / refresh sessão |
| `src/lib/supabase/admin.ts` | Service role server-only |
| `src/lib/supabase-query.ts` | Helpers de query |

### Scripts e guards

| Caminho | Função |
|---------|--------|
| `scripts/booking-test-guards.mjs` | Bloqueia remoto excepto allowlist de **teste** |
| `scripts/booking-prod-guards.mjs` | Exige prod ref explícito; **rejeita** allowlist de teste |
| `scripts/booking-integration-fixtures.mjs` | `BOOKING_ALLOWLISTED_PROJECT_REFS = ["bwxhdoxesqtdqwkxrmom"]` |
| `scripts/booking-load-test-env.mjs` | Carrega `.env.local` + teste |
| `scripts/booking-load-prod-env.mjs` | Carrega **só** `.env.booking.prod.local` |
| `scripts/booking-readiness-lib.mjs` | `resolveReadonlyDatabaseUrl()` |
| `scripts/booking-migration-prod-preflight-readonly.mjs` | Checklist 024/025/026 em produção |
| `scripts/booking-migration-025-preflight-readonly.mjs` | Equivalente no projeto de **teste** |

### Supabase CLI (local)

| Caminho | Nota |
|---------|------|
| `supabase/migrations/*.sql` | Fonte de verdade DDL (001–026) |
| `supabase/.temp/linked-project.json` | Último `supabase link` (hoje teste) — **relink** antes de operações prod |

### Vercel (fora do repo)

Configurar no dashboard **Production** as mesmas chaves públicas + `SUPABASE_SERVICE_ROLE_KEY` do projeto Supabase de produção. Não documentar valores no git.

---

## 2. Configurar um projeto Supabase de produção separado

1. **Criar** um projeto novo no [Supabase Dashboard](https://supabase.com/dashboard) (região alinhada com utilizadores / Vercel).
2. **Não** adicionar o ref a `BOOKING_ALLOWLISTED_PROJECT_REFS` (permanece só teste).
3. **Aplicar** a cadeia de migrações da plataforma + booking até **024** (conforme estado real do negócio — muitas vezes já aplicado em staging/prod antes do MVP booking). Usar o mesmo método que usaste historicamente (SQL faseado ou CLI), **sem** misturar credenciais de teste.
4. **Auth:** configurar URLs de redirect para domínios de produção (`src/app/auth/callback`, portal, booking host).
5. **Separar credenciais:**
   - Copiar `.env.booking.prod.local.example` → `.env.booking.prod.local` com ref de **produção**.
   - Manter `.env.booking.test.local` só para CI/local de integração.
   - Evitar `.env.local` com URL de produção durante desenvolvimento diário.
6. **CLI:** quando fores operar produção, `npx supabase link --project-ref <prod-ref>` numa sessão dedicada; confirma `BOOKING_PROD_PROJECT_REF` antes de qualquer comando.
7. **Git:** nunca commitar refs/passwords de produção.

---

## 3. Checklist read-only (024, 025, 026)

### Automático (recomendado)

```powershell
cd C:\Users\rodri\Documents\Artecium\artecium-website
# Criar .env.booking.prod.local a partir do .example
$env:BOOKING_PROD_READONLY='1'
node scripts/booking-migration-prod-preflight-readonly.mjs
```

O script verifica:

- **024:** 4 RPCs guest, coluna `manage_token_hash`, função `booking_public_create_appointment` com lógica manage token, linha `024` em `schema_migrations` (se visível).
- **025:** lookup idempotência **antes** de `booking_validate_public_slot`, linha `025` no histórico (se visível), `anon` mantém EXECUTE no RPC público.
- **026:** `service_role` com EXECUTE em `booking_normalize_member_role_text`; `anon`/`authenticated` **sem** EXECUTE; linha `026` (se visível).

### Manual no Dashboard SQL (só SELECT)

Se `schema_migrations` não for legível com o utilizador usado:

```sql
-- 024
select proname from pg_proc p
 join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and proname like 'booking_public_%guest%';

select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'booking_appointments'
   and column_name = 'manage_token_hash';

-- 025 (ordem no fonte da função)
select pg_get_functiondef(p.oid) from pg_proc p
 join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'booking_public_create_appointment';

-- 026
select grantee, privilege_type
 from information_schema.routine_privileges
 where routine_schema = 'public'
   and routine_name = 'booking_normalize_member_role_text';
```

**Critério de aprovação:** todos os checks do script `PASS` antes de qualquer apply de 025/026.

---

## 4. Aplicação controlada de 025 e 026 (produção)

**Pré-requisitos:** preflight `PASS`; backup / PITR Supabase disponível; janela de mudança acordada; **sem** `db push` em massa.

### Ordem

| Passo | Acção | Notas |
|-------|--------|--------|
| 0 | Confirmar **024** já em produção | Se RPCs guest ausentes, aplicar `024_*.sql` primeiro (processo separado) |
| 1 | Aplicar `025_booking_public_create_idempotency_before_slot.sql` | Só `CREATE OR REPLACE` + grants já na migration |
| 2 | Aplicar `026_booking_service_role_member_role_helper_execute.sql` | Um `GRANT` idempotente |
| 3 | Re-correr preflight read-only | Mesmo script, exit 0 |
| 4 | Registar histórico CLI | Ver abaixo |
| 5 | Smoke **não destrutivo** | Um create público + replay idempotency num slot real (sem seed de integração) |

### Métodos de apply (escolher um)

**A — SQL Editor (recomendado para controlo fino)**

1. Dashboard → SQL → New query.
2. Colar **conteúdo integral** de `supabase/migrations/025_...sql` → Run → guardar output.
3. Repetir para `026_...sql`.
4. Não executar seeds (`BOOKING_SEED`, `seed-booking-integration`).

**B — CLI ficheiro a ficheiro (não `db push` global)**

Ligação `postgres` com utilizador `postgres`, a partir da máquina do operador:

```powershell
# Exemplo conceptual — substituir DATABASE_URL por secret local
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f supabase/migrations/025_booking_public_create_idempotency_before_slot.sql
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f supabase/migrations/026_booking_service_role_member_role_helper_execute.sql
```

**C — `migration repair` (só histórico)**

Se DDL já foi aplicado manualmente e o estado coincide com o repo:

```powershell
npx supabase link --project-ref <prod-ref>
npx supabase migration repair 025 --status applied --remote
npx supabase migration repair 026 --status applied --remote
```

Nunca `repair` sem preflight object-level.

### O que **não** fazer em produção

- `supabase db push` (risco de reexecutar 023 duplicada e migrações antigas).
- `npm run db:seed:booking-integration` ou `BOOKING_SEED=1`.
- Scripts `booking-apply-migration-*` com flags de teste (`BOOKING_ALLOW_REMOTE_TESTS`).
- Conceder EXECUTE em helpers internos a `anon`/`authenticated`.

### Rollback (emergência)

- **025:** reaplicar o corpo de `booking_public_create_appointment` de `024_booking_public_guest_manage.sql` (reintroduz ordem antiga; só se falha crítica).
- **026:** `REVOKE EXECUTE ON FUNCTION public.booking_normalize_member_role_text(text) FROM service_role` — apenas se service role scripts falharem e for aceitável; normalmente **manter** 026.

---

## 5. Sequência concreta: configurar + validar produção (sem deploy)

```powershell
# 1) Criar ficheiro prod (fora do git)
copy .env.booking.prod.local.example .env.booking.prod.local
# Editar: BOOKING_PROD_PROJECT_REF, URL, chaves, SUPABASE_DB_PASSWORD (read-only user postgres)

# 2) Preflight inicial (estado antes de 025/026)
$env:BOOKING_PROD_READONLY='1'
node scripts/booking-migration-prod-preflight-readonly.mjs
# Esperado antes do cutover: PASS em 024, FAIL em 025/026 até apply

# 3) Janela de mudança — apply controlado (operador humano, SQL Editor ou psql)
#    → ficheiros 025 e 026 apenas

# 4) Preflight pós-apply
node scripts/booking-migration-prod-preflight-readonly.mjs

# 5) Histórico (opcional mas recomendado)
npx supabase link --project-ref <prod-ref>
npx supabase migration repair 025 026 --status applied --remote

# 6) Vercel Production env (dashboard) — URL + publishable + service_role do projeto prod
#    Deploy fica para passo posterior explícito
```

---

## Referências

- Teste allowlist: `docs/booking/MIGRATION_025_PUBLICATION.md`
- Permissões booking: `docs/booking/PERMISSIONS_FIX_SECURITY_REVIEW.md`
- Integração (só teste): `docs/booking/INTEGRATION_TESTING.md`