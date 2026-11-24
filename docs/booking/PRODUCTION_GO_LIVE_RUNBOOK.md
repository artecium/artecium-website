# Artecium Booking — Production Go-Live Runbook

**Versão:** 1.0 (preparação documental — sem execução remota)  
**Produção (ref):** `bwxhdoxesqtdqwkxrmom`  
**Sandbox validado:** `ahbtpmlrzruwtfcichlg`  
**Matriz detalhada:** [PRODUCTION_MIGRATION_MATRIX.md](./PRODUCTION_MIGRATION_MATRIX.md)

---

## 0. Âmbito e regras

Este runbook descreve **como** executar o lançamento Booking em produção.  
**Não substitui** autorização explícita do operador para cada passo que toque na base de dados ou em deploy.

- **Não** executar seed de integração em produção.
- **Não** aplicar `023_phase2_harness_persistent_tracking.sql` em produção.
- Scripts repo com guards: `scripts/booking-prod-guards.mjs`, `scripts/booking-migration-prod-preflight-readonly.mjs` (apenas leitura, quando autorizado).

---

## 1. Decisão sobre migração 023

### Perguntas obrigatórias (resposta com base no SQL do repo)

| # | Pergunta | Conclusão |
|---|----------|-----------|
| 1 | Infraestrutura de testes apenas? | **Sim.** Cabeçalho: *“Phase 2 test harness … Test Supabase project only.”* Cria `schema phase2_harness`. |
| 2 | Usada por funcionalidades reais do Booking? | **Não.** Nenhum ficheiro em `src/` referencia `phase2_harness`. App usa apenas `public.booking_*` e RPCs `booking_public_*`. |
| 3 | Outras migrações dependem dela? | **Não (SQL).** 024 contém comentário *“Run AFTER 023”* mas **zero** referências a `phase2_harness` no corpo. 025–026 dependem de `public` apenas. |
| 4 | RPCs de produção referenciam 023? | **Não.** Todas as RPCs prod estão em `public`. |
| 5 | Necessária para migrações posteriores? | **Não.** 024–026 aplicam-se sobre `booking_public_create_appointment` / guest RPCs de `public`. |
| 6 | Versão canónica? | `supabase/migrations/023_phase2_harness_persistent_tracking.sql` (v2.6). Arquivos `_v2.5.sql` / `_v2.6.sql` em `supabase/migrations_archive/`. |
| 7 | Só fixture/harness? | **Sim** para operações autorizadas de teste (embedded PG, sandbox harness). |

### Risco se 023 for aplicada em produção

- Cria schema e funções **não expostas** a anon/authenticated (REVOKE explícito).
- `cleanup_execute` pode **apagar** `booking_customers` / notas de fixtures **se** `deployment_guard.cleanup_armed = true` — risco operacional inaceitável em prod.
- Aumenta superfície de schema sem benefício para clientes.

### Recomendação formal

**Excluir 023 da sequência de produção.**  
Manter o ficheiro no repo para CI/harness local; no momento do apply em prod, **não** executar esse SQL e **não** registar versão `023` como migração Booking prod (ver secção 6 sobre `supabase db push`).

---

## 2. Pré-requisitos de plataforma (antes do 012)

Confirmar em produção **com autorização** (comandos na secção 5):

| Pré-requisito | Motivo |
|---------------|--------|
| Migrações **001–011** aplicadas | 012 referencia `public.profiles`, `public.companies`, `public.set_updated_at()` |
| Extensão **btree_gist** | Overlap `EXCLUDE` em appointments (012, 013) |
| Extensão **pgcrypto** | Idempotência e tokens (014–017, 024) |
| Auth Supabase configurado | Membros booking = `auth.users` / `profiles` |
| Backup recente | PITR ou dump lógico (Dashboard) |

**Atenção — pasta `supabase/migrations/` completa:**  
Entre 017 e 019 existe `018_google_oauth_tokens.sql` (plataforma, não Booking).  
`027_phase5_client_core_authenticated_select_grants.sql` também existe.  
Um `supabase db push` cego aplica **tudo** por ordem lexicográfica — **inclui 023**. Planeie o método de apply (secção 6).

---

## 3. Sequência SQL definitiva (Booking produção)

Ordem **obrigatória** (ficheiros em `supabase/migrations/`):

1. `012_booking_foundation.sql`
2. `013_booking_security_invites.sql`
3. `014_booking_membership_hardening.sql`
4. `015_booking_public_rpc_hardening.sql`
5. `016_booking_public_catalog_slots.sql`
6. `017_booking_public_idempotency_pgcrypto.sql`
7. `019_booking_service_role_grants.sql`
8. `020_booking_member_role_professional_compat.sql`
9. `021_booking_member_role_phase1_meta.sql`
10. `022_booking_professional_rls_scope.sql`
11. **SKIP** `023_phase2_harness_persistent_tracking.sql`
12. `024_booking_public_guest_manage.sql`
13. `025_booking_public_create_idempotency_before_slot.sql`
14. `026_booking_service_role_member_role_helper_execute.sql`

Referência inequívoca: caminhos acima relativos à raiz do repo.

---

## 4. Plano por migração (aplicação)

Para **cada** ficheiro da sequência (exceto 023):

| Passo | Ação |
|-------|------|
| Pré | Confirmar migração anterior registada / objetos da matriz presentes |
| Apply | Executar ficheiro SQL **completo** numa transação (quando o editor o permitir) ou ficheiro a ficheiro no SQL Editor |
| Esperado | Objetos listados em [PRODUCTION_MIGRATION_MATRIX.md](./PRODUCTION_MIGRATION_MATRIX.md) |
| Verificação | Probes read-only (secção 8) + checklist parcial |
| Rollback | Ver secção 7 — na prática **forward fix** após 012 |
| Risco parcial | **STOP** se falhar mid-file; não repetir às cegas |

### Pontos de atenção especial

| Migração | Atenção |
|----------|---------|
| **013** | Backfill `blocked_*` + NOT NULL; recria EXCLUDE — pode falhar se dados overlap inválidos |
| **014** | Remove policy INSERT em `booking_business_members` — onboarding só via convite |
| **020** | CHECK `professional` — falha se roles inválidas em dados existentes |
| **022** | Políticas RLS substituídas — validar painel com owner/manager/professional |
| **024** | `DROP FUNCTION` create — janela curta; requer 015+ |
| **025** | Replace body create — ordem idempotência vs slot |

Scripts opcionais no repo (só com **password DB** e guards de produção aprovados):

- `scripts/booking-apply-migration-024.mjs` (padrão para apply 024 + postcheck)
- Outros `booking-apply-migration-*.mjs` — ler cabeçalho antes de usar

---

## 5. Pré-verificações (comandos — **não executar sem autorização**)

### 5.1 Guard de project ref

Copiar `.env.booking.prod.local.example` → `.env.booking.prod.local` (nunca commit).

Obrigatório:

```text
BOOKING_PROD_READONLY=1
BOOKING_PROD_PROJECT_REF=bwxhdoxesqtdqwkxrmom
BOOKING_EXPECTED_PROJECT_REF=bwxhdoxesqtdqwkxrmom
NEXT_PUBLIC_SUPABASE_URL=https://bwxhdoxesqtdqwkxrmom.supabase.co
```

O script `assertBookingProdReadonlyTarget` **rejeita** refs da allowlist de testes.

### 5.2 Preflight pós-024/025/026 (read-only)

```powershell
$env:BOOKING_PROD_READONLY = "1"
node --env-file=.env.booking.prod.local scripts/booking-migration-prod-preflight-readonly.mjs
```

Requer `SUPABASE_DB_PASSWORD` ou `DATABASE_URL` no mesmo env file.

### 5.3 Readiness REST (sem DML)

```powershell
$env:BOOKING_DB_READINESS = "1"
node --env-file=.env.booking.prod.local scripts/booking-db-readiness.mjs
```

*Nota:* alguns probes com UUID fictício podem reportar `permission_denied` em `booking_validate_public_slot` — não indica ausência de função; validar com RPC real no smoke prod.

### 5.4 Catálogo SQL (opcional)

Com password read-only, queries manuais:

```sql
-- Versões aplicadas
select version, name from supabase_migrations.schema_migrations order by version;

-- Harness NÃO deve existir em prod
select 1 from pg_namespace where nspname = 'phase2_harness';

-- RPCs guest (esperado 4)
select p.proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'booking_public_%guest%'
   or p.proname = 'booking_public_manage_token_hash';

-- RLS enabled booking
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename like 'booking_%';
```

---

## 6. Método de aplicação recomendado

### Opção A — SQL Editor (recomendada para **excluir 023**)

| Prós | Contras |
|------|---------|
| Controlo explícito por ficheiro | Registo manual em `schema_migrations` se necessário |
| Omite 023 por construção | Mais trabalho operacional |

**Porquê:** `supabase/migrations/023_*.sql` no repo faz com que `supabase db push` / `migration up` tente aplicar o harness.

### Opção B — Supabase CLI `db push`

| Prós | Contras |
|------|---------|
| Registo automático de migrações | Aplica **023** e **018**/**027** se pendentes |
| Alinhado com histórico CLI | Risco se projeto prod já divergiu |

**Só usar** se:

1. 023 for removido/renomeado **temporariamente** nesse branch de deploy, **ou**
2. `supabase migration repair` / estratégia documentada para marcar 023 como n/a em prod, **ou**
3. Projeto remoto já tem histórico que exclui 023.

**Não são equivalentes:** executar SQL no Editor vs `db push` — o segundo altera `supabase_migrations.schema_migrations` e valida checksums dos ficheiros.

### Opção C — Scripts `booking-apply-migration-*.mjs`

Aplicação cirúrgica (ex.: 024) com postchecks; requer credenciais DB e flags de aplicação explícitas no script. Usar conforme cabeçalho de cada script.

### Registo no histórico

Após apply manual, se a CLI não registar:

- Inserir linha em `supabase_migrations.schema_migrations` **apenas** com versão/nome corretos e alinhados ao repo, **ou**
- Usar `supabase migration repair --status applied <version>` conforme documentação Supabase da vossa CLI.

---

## 7. Backup e rollback

### Antes de qualquer DDL Booking

1. **Supabase Dashboard → Database → Backups** — confirmar PITR ou criar backup sob demanda.
2. Anotar versão actual em `schema_migrations`.
3. Janela de manutenção comunicada (create appointment breve indisponível se RPC a meio de replace).

### Por fase

| Após | Rollback realista |
|------|-------------------|
| 012 | DROP schema booking — **perda total** de dados booking |
| 013–017 | Forward fix (replace functions) |
| 020–022 | Ajuste policies/roles — sem perda se só DDL |
| 024–026 | `CREATE OR REPLACE` versão anterior **se** guardada |

### Migração parcial

1. **STOP** — não aplicar seguinte.
2. Capturar mensagem PostgreSQL e objecto em falta.
3. Se transação abortada: estado consistente; corrigir e repetir **só** o ficheiro falhado após diagnóstico.
4. Não duplicar `CREATE TABLE` sem `IF NOT EXISTS` — preferir probes.

### 023 em prod por engano

- **Desarmar** qualquer guard harness (se existir `phase2_harness.deployment_guard`).
- Avaliar `DROP SCHEMA phase2_harness CASCADE` **apenas** após confirmar que não há dependências (deve estar isolado).
- **Não** executar `cleanup_execute` armado.

---

## 8. Verificações pós-aplicação

### 8.1 Schema

- [ ] Tabelas `booking_*` da matriz existem
- [ ] `booking_customer_internal_notes` (022)
- [ ] `booking_appointments.manage_token_hash` populável (024+)
- [ ] EXCLUDE overlap activo
- [ ] `phase2_harness` **ausente** em produção

### 8.2 Segurança

- [ ] RLS `rowsecurity = true` em tabelas booking
- [ ] `anon` **sem** SELECT directo em `booking_appointments` (integration já validou)
- [ ] Guest RPCs: EXECUTE para `anon`
- [ ] `booking_normalize_member_role_text`: não EXECUTE para `authenticated` (021)
- [ ] Funções `SECURITY DEFINER` com `search_path` explícito nos ficheiros 015+

### 8.3 Booking (smoke produção — manual)

Executar **após deploy** app apontando para prod:

| # | Teste | Critério PASS |
|---|--------|----------------|
| 1 | `booking_public_get_business(slug)` | Negócio activo, sem PII indevida |
| 2 | `list_services` / `list_staff` / `list_day_slots` | Slots coerentes com timezone |
| 3 | Create appointment | `public_reference`, `manage_token` (se 024+), status correcto |
| 4 | Segunda create mesmo slot | Rejeição (overlap ou slot) |
| 5 | Get/cancel com token | Status `cancelled` |
| 6 | Reschedule | Só se `allow_customer_reschedule=true` no negócio |
| 7 | Painel owner | CRUD serviços; não vê outro `business_id` |
| 8 | Profissional ligado a staff | Vê só próprias marcações (022) |

**Não executar** integration seed em produção.

### 8.4 Scripts repo (opcional pós-migrate)

```powershell
npm run verify:booking-public-flow
npm run test:booking-unit
```

Unitários não ligam à BD.

---

## 9. Configuração Vercel Production

| Variável | Obrigatória | Lado | Função |
|----------|-------------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Sim** | Client + Server | API Supabase prod |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Sim** | Client + Server | Anon key (nome preferido no repo) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternativa | Client | Legacy alias da anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sim** | Server apenas | Admin API, operações server |
| `SUPABASE_SECRET_KEY` | Alternativa | Server | Alias em `admin.ts` |
| `RESEND_API_KEY` | Opcional | Server | Email confirmação (`notifications.ts`) |
| `BOOKING_EMAIL_FROM` ou `EMAIL_FROM` | Opcional | Server | Remetente |
| `NEXT_PUBLIC_BOOKING_HOSTNAME` | Opcional | Client | Override default `booking.artecium.com` |
| `VERCEL_URL` | Auto | Server | Redirects Stripe/outros (não crítico só Booking) |

**Nunca** expor service role no browser.  
Não commitar `.env*` com valores reais.

---

## 10. DNS, SSL e Auth

### DNS

- CNAME `booking.artecium.com` → target Vercel (conforme painel Vercel).
- SSL: automático Vercel quando domínio verificado.

### Rewrites

App usa `src/lib/routing/booking-host.ts` — hostname `booking.artecium.com` mapeia segmentos públicos/admin. Confirmar `middleware`/proxy conforme `docs/architecture/PHASE_B_AUTH_HOSTS_PLAN.md`.

### Supabase Auth redirect URLs

Incluir (mínimo):

```text
https://booking.artecium.com/**
https://artecium.com/**
```

E hosts admin/app se partilham o mesmo projeto Auth.  
Testar login owner após deploy.

---

## 11. Sequência prática de primeiro lançamento

| # | Etapa | STOP se… | GO se… |
|---|--------|----------|--------|
| 1 | Backup prod confirmado | Sem backup | PITR/dump OK |
| 2 | Preflight read-only (`schema_migrations`, 001–011) | Tabelas base em falta | Baseline OK |
| 3 | Apply 012→022 (sem 023) | Erro SQL | Probes schema OK |
| 4 | Apply 024→026 | Guest RPCs em falta | Preflight 024 PASS |
| 5 | Vercel env + deploy | Build falha | Preview OK |
| 6 | DNS + SSL | Host inválido | `booking.artecium.com` resolve |
| 7 | Auth redirects | Login loop | Sessão owner OK |
| 8 | Criar negócio real (slug, TZ, horários) | — | Painel acessível |
| 9 | 1 reserva pública real | RPC erro | Appointment confirmed/pending |
| 10 | Cancel teste (token) | Token inválido | Cancelled |
| 11 | Verificar isolamento | Cross-tenant leak | N/A |

---

## 12. Checklist final de lançamento

- [ ] Migrations **012–022, 024–026** aplicadas em `bwxhdoxesqtdqwkxrmom`
- [ ] **023 não aplicada** (`phase2_harness` ausente)
- [ ] Vercel Production env completo
- [ ] `booking.artecium.com` live
- [ ] Auth redirects configurados
- [ ] Resend (se email desejado)
- [ ] Primeiro negócio + staff + serviços
- [ ] Smoke manual secção 8.3 PASS
- [ ] Monitorização erros (Vercel logs / Supabase logs)

---

## 13. Riscos residuais

| Risco | Mitigação |
|-------|-----------|
| `db push` aplica 023 | Apply manual ou excluir 023 do batch |
| Prod já tem migrações parciais antigas | Inventário `schema_migrations` antes do 012 |
| Divergência 024 vs 025 | Aplicar ambas em ordem; usar preflight |
| Reagendamento desligado por defeito | Produto: `allow_customer_reschedule=false` em 012 |
| Email sem Resend | Booking funciona; sem email transacional |
| Rate limit | Sem camada dedicada na app; monitorar abuso RPC |

---

## 14. Evidência sandbox (não repetir testes sem necessidade)

Já validado em `ahbtpmlrzruwtfcichlg` (relatórios anteriores):

- Integration 25/25, E2E público, concorrência, guest cancel/reschedule (com flag)
- Harness 023/T3: **local embedded**, não requisito prod

---

## 15. Ficheiros de consulta (esta preparação)

| Tipo | Caminhos |
|------|----------|
| Migrations | `supabase/migrations/012_*.sql` … `026_*.sql` |
| Harness 023 archive | `supabase/migrations_archive/023_*` |
| Guards | `scripts/booking-test-guards.mjs`, `scripts/booking-prod-guards.mjs` |
| Preflight prod | `scripts/booking-migration-prod-preflight-readonly.mjs` |
| Env exemplo prod | `.env.booking.prod.local.example` |
| MVP | `docs/booking/MVP_LAUNCH_STATUS.md` |
| Integração | `docs/booking/INTEGRATION_TESTING.md` |

---

## 16. Confirmação desta entrega

- **Criados:** `docs/booking/PRODUCTION_GO_LIVE_RUNBOOK.md`, `docs/booking/PRODUCTION_MIGRATION_MATRIX.md`
- **Migrações incluídas na sequência prod:** 012–022, 024–026
- **Excluída:** 023 (harness test-only)
- **Não executado:** ligações Supabase, SQL remoto, deploy, alterações BD, leitura de `.env` com secrets

**Aguardar autorização explícita** para a fase operacional (apply + deploy + smoke prod).