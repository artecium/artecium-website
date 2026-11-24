# Artecium — Fase 3: auditoria aprofundada (read-only)

**Project ref confirmado (única BD consultada):** `bwxhdoxesqtdqwkxrmom` (teste / allowlist)  
**Data da auditoria:** 2026-11-16 (`docs/audit/phase3-audit-raw.json`)  
**Modo:** exclusivamente leitura; nenhuma migration, SQL de escrita, deploy ou alteração de configuração.

**Artefactos gerados**

| Artefacto | Conteúdo |
|-----------|----------|
| `docs/audit/phase3-audit-raw.json` | Reconciliação, DDL payments/invoices, 205 políticas inline, 39 SECURITY DEFINER, OAuth/harness, Auth↔profiles |
| `docs/audit/RLS_INVENTORY.json` | Inventário completo de políticas (`public` + `storage`; ver nota `phase2_harness`) |

**Correcção de scripts (2026-11-16):** falsos positivos em probes 013/021 e em agregados fase 1 corrigidos; reconciliação **26/26 applied**. Detalhe: `docs/audit/AUDIT_SCRIPTS_CHANGELOG.md`.

**Legenda de estados (reconciliação)**

- **Facto confirmado:** evidência directa em `pg_catalog` / probes SQL.
- **Inferência:** conclusão plausível a partir de múltiplas evidências; probe individual falhou por limitação do papel de ligação.
- **Não verificado nesta fase:** teste de isolamento em tempo real não re-executado.

---

## A. Relatório de reconciliação migrations (001–026)

### Histórico `supabase_migrations.schema_migrations` (facto confirmado)

Apenas **2** entradas:

| version | name |
|---------|------|
| 025 | booking_public_create_idempotency_before_slot |
| 026 | booking_service_role_member_role_helper_execute |

**Consequência:** o histórico Supabase **não documenta** 001–024; o estado efectivo reflecte aplicação histórica/manual ou CLI anterior. Probes por objectos comprovam a maior parte do stack; **não substituem** um histórico completo para produção nova.

### Três ficheiros `023` no repositório (facto confirmado)

- `023_phase2_harness_persistent_tracking.sql` — **canónico** usado no probe.
- `023_phase2_harness_persistent_tracking_v2.5.sql` — variante; não aplicar em duplicado em produção.
- `023_phase2_harness_persistent_tracking_v2.6.sql` — variante; idem.

**Evidência BD:** schema `phase2_harness` existe (probe 023 OK). Conteúdo das variantes v2.5/v2.6 **não** foi diffado linha-a-linha contra a BD nesta fase.

### Tabela de reconciliação completa

| # | Ficheiro | Em `schema_migrations` | Estado (probes) | Evidência resumida |
|---|----------|------------------------|-----------------|-------------------|
| 001 | `001_initial_schema.sql` | Não | **Aplicada** | `public.roles`, `public.profiles` acessíveis |
| 002 | `002_services_plans_subscriptions.sql` | Não | **Aplicada** | `service_features`; `get_subscription_entitlements` existe |
| 003 | `003_platform_hardening.sql` | Não | **Aplicada** | `staff_company_assignments`; `companies.deleted_at` |
| 004 | `004_security_hardening.sql` | Não | **Aplicada** | `staff_can_access_project` |
| 005 | `005_security_followup.sql` | Não | **Aplicada** | `set_updated_at` |
| 006 | `006_authenticated_select_grants.sql` | Não | **Aplicada** | GRANT SELECT `companies` → `authenticated` |
| 007 | `007_storage_documents.sql` | Não | **Aplicada** | bucket `platform-documents` |
| 008 | `008_auth_role_grants.sql` | Não | **Aplicada** | grants `user_roles` → `authenticated` |
| 009 | `009_service_role_company_payment_providers.sql` | Não | **Aplicada** | `company_payment_providers` → `service_role` |
| 010 | `010_payments_transaction_reference_unique.sql` | Não | **Aplicada** | índice `idx_payments_transaction_reference_unique` |
| 011 | `011_service_plan_features_authenticated_select.sql` | Não | **Aplicada** | GRANT SELECT `service_plan_features` |
| 012 | `012_booking_foundation.sql` | Não | **Aplicada** | `btree_gist`; `booking_businesses` |
| 013 | `013_booking_security_invites.sql` | Não | **Aplicada** | Tabela + RLS + políticas 013 em catálogo; `blocked_starts_at` |
| 014 | `014_booking_membership_hardening.sql` | Não | **Aplicada** | `booking_accept_member_invite` |
| 015 | `015_booking_public_rpc_hardening.sql` | Não | **Aplicada** | coluna `idempotency_request_hash` |
| 016 | `016_booking_public_catalog_slots.sql` | Não | **Aplicada** | `booking_public_list_day_slots` |
| 017 | `017_booking_public_idempotency_pgcrypto.sql` | Não | **Aplicada** | `booking_public_idempotency_request_hash` |
| 018 | `018_google_oauth_tokens.sql` | Não | **Aplicada** | tabela `google_oauth_tokens` |
| 019 | `019_booking_service_role_grants.sql` | Não | **Aplicada** | `service_role` DELETE em `booking_appointments` |
| 020 | `020_booking_member_role_professional_compat.sql` | Não | **Aplicada** | `booking_normalize_member_role_text` |
| 021 | `021_booking_member_role_phase1_meta.sql` | Não | **Aplicada** | `REVOKE` do papel `public` + comentário na função `booking_normalize_member_role_text` |
| 022 | `022_booking_professional_rls_scope.sql` | Não | **Aplicada** | `booking_customer_internal_notes` |
| 023 | `023_phase2_harness_persistent_tracking.sql` | Não | **Aplicada** | schema `phase2_harness` |
| 024 | `024_booking_public_guest_manage.sql` | Não | **Aplicada** | `booking_public_get_guest_appointment`; `manage_token_hash` |
| 025 | `025_booking_public_create_idempotency_before_slot.sql` | **Sim** | **Aplicada** | ordem idempotency antes de slot em `booking_public_create_appointment` |
| 026 | `026_booking_service_role_member_role_helper_execute.sql` | **Sim** | **Aplicada** | `service_role` EXECUTE em `booking_normalize_member_role_text` |

**Dependências:** a cadeia Booking 012→026 é coerente nos probes (001–026 **applied** após correcção dos scripts de auditoria).

---

## B. Relatório DDL — schema real vs repositório

### `payments` / `invoices` e `deleted_at` (facto confirmado)

| Tabela | `deleted_at` na BD | Nas migrations repo |
|--------|-------------------|---------------------|
| `payments` | **Ausente** | **Nunca adicionada** (`001` cria tabela sem `deleted_at`; `003` adiciona `deleted_at` a companies, projects, documents, client_subscriptions — não payments/invoices) |
| `invoices` | **Ausente** | Idem |

**Conclusão:** a ausência na BD **não é drift** face ao repo; é **falso positivo** em `scripts/supabase-full-db-audit-readonly.mjs` e scripts admin que filtram `.is("deleted_at", null)` em entidades que **não** têm a coluna (consultas a `payments`/`invoices` em `src/lib/data/admin/queries.ts` **não** usam `deleted_at`; o audit script de fase 1 sim).

### Colunas (resumo)

- **`payments` (18 colunas):** `id`, `company_id`, `invoice_id`, `amount`, `currency`, `status`, `provider`, `provider_payment_id`, `paid_at`, `created_at`, `subscription_id`, `payment_method_id`, `provider_payment_intent_id`, `transaction_reference`, `refunded_amount`, `failure_*`, `metadata`, `updated_at`.
- **`invoices`:** estrutura alinhada ao modelo inicial + campos de billing (`discount`, `amount_paid`, `provider_invoice_id`, etc.) — detalhe completo em `phase3-audit-raw.json` → `payments_invoices`.

### RLS `payments` / `invoices` (facto confirmado)

| Política | Tabela | Cmd | Qual (USING) |
|----------|--------|-----|----------------|
| Company read payments | payments | SELECT | `company_id IN (SELECT user_company_ids())` |
| Staff manage payments | payments | ALL | `staff_can_access_company(company_id)` |
| Company read invoices | invoices | SELECT | `company_id IN (SELECT user_company_ids())` |
| Staff manage invoices | invoices | ALL | `staff_can_access_company(company_id)` |

**Funções SQL com referência a `payments.deleted_at` na BD:** nenhuma (`functions_referencing_payments_deleted_at: []`).

### Outras diferenças repo↔BD relevantes (herdadas de auditorias anteriores + esta fase)

- Histórico migrations incompleto (secção A).
- Dados de teste: negócios Booking sem `company_id` (fase 1) — **não recontado** nesta execução; permanece risco de modelo híbrido, não de RLS em si.

---

## C. Inventário RLS completo

**Total:** **205** políticas em `public` (**201**) e `storage.objects` (**4**).  
**Ficheiro:** `docs/audit/RLS_INVENTORY.json` — cada entrada inclui `schemaname`, `tablename`, `policyname`, `permissive`, `roles`, `cmd`, `qual` (USING), `with_check`.

**`phase2_harness`:** 0 políticas em `pg_policies` para esse schema; contudo **4 tabelas** com RLS activado e **sem políticas** (lista abaixo).

### Padrões funcionais (resumo; detalhe no JSON)

| Actor | Mecanismo típico |
|-------|------------------|
| Cliente empresa | `user_company_ids()`, `company_id IN (…)` em SELECT |
| Staff Artecium | `is_staff_member()`, `staff_can_access_company(id)`, `staff_can_access_project`, `staff_can_manage_subscriptions()` |
| Owner/admin plataforma | `is_owner_or_admin()` em tabelas globais (plans, roles, etc.) |
| Booking membro | `booking_can_access_business`, `booking_can_manage_business`, políticas por `business_id` |
| Público Booking | **não** via RLS directa — via RPC `SECURITY DEFINER` `booking_public_*` (secção D) |

### Tabelas com RLS activo **sem** políticas (facto confirmado)

| Schema | Tabela | Risco |
|--------|--------|-------|
| `public` | `google_oauth_tokens` | **Baixo (efectivo)** para anon/auth: sem grants PostgREST; só `service_role` |
| `public` | `google_oauth_authorization_states` | Idem |
| `phase2_harness` | `runs`, `deployment_guard`, `run_tracking`, `cleanup_audit_snapshots` | **Baixo:** sem grants a anon/authenticated; RLS denega tudo |
| `storage` | várias tabelas internas Supabase (`buckets`, `migrations`, …) | **Esperado** (infra); não expostas à app |

### Duplicados / contradições

- **Não identificados** duplicados exactos de nome+comando na amostra automatizada; o inventário completo permite revisão manual por tabela.
- Políticas **permissivas** dominantes; combinações AND de staff + company são consistentes com modelo «cliente vê só sua empresa; staff vê empresas atribuídas».

### Possível bloqueio legítimo

- Qualquer tabela só com políticas `authenticated` **bloqueia** `anon` — correcto para dados de cliente.
- `booking_member_invites`: só managers (`booking_can_manage_business`) — alinhado com 013.

---

## D. Auditoria SECURITY DEFINER

**Total inventariado (`public` + `storage`):** **39** funções (`phase3-audit-raw.json` → `security_definer`).

### Funções de atenção especial

| Função | Expõe anon | Expõe authenticated | search_path | Valida utilizador/tenant | Notas de risco |
|--------|------------|----------------------|-------------|--------------------------|----------------|
| `booking_public_*` (7 RPC) | **Sim** (EXECUTE) | Sim | `public` (+ `extensions` em create) | Lógica interna (slug, tokens, idempotency) | **Médio — desenho intencional:** superfície pública; risco depende de validação dentro da função (025 aplicada). **Não** re-auditado linha-a-linha nesta fase. |
| `booking_create_business_with_owner` | Não | Sim | `public` | Deve usar `auth.uid()` | **Médio:** criação de tenant; requer revisão de quotas/abuse em prod. |
| `booking_create_member_invite` | Não | Sim | `public` | Via `booking_can_manage_business` (inferência) | **Médio** |
| `booking_accept_member_invite` | Não | Sim | `public` | Token | **Médio** |
| `get_subscription_entitlements` | — | — | — | **Não listada como SECURITY DEFINER** | Provavelmente INVOKER; usada em RLS/lógica de features |
| `is_owner_or_admin` | Não* | Não* | `public` | Lê `user_roles` | *EXECUTE para role `PUBLIC` (PostgreSQL); usada **dentro** de políticas — padrão Supabase |
| `staff_can_access_company` | Não* | Não* | `public` | Staff assignments | Idem — **não** exposta a `anon` como RPC PostgREST típico |
| Helpers pagamentos | Triggers / internos | — | — | — | Pagamentos expostos via RLS, não via RPC públicas anon |

**Contorno RLS:** funções `SECURITY DEFINER` **podem** contornar RLS no corpo SQL; as `booking_public_*` são o caso deliberado. Helpers `booking_can_*` com `search_path=""` reduzem risco de hijacking.

**Distinção**

- **Comprovado:** grants `anon:EXECUTE` nas sete `booking_public_*` listadas no JSON.
- **Investigar (não comprovado como vulnerabilidade):** rate limiting, enumeração de slugs, robustez de `manage_token` em 024.

---

## E. OAuth e `phase2_harness`

### `google_oauth_tokens` / `google_oauth_authorization_states`

| Aspecto | Estado |
|---------|--------|
| RLS | **Activado** |
| Políticas | **0** → negação para roles sem BYPASS |
| Grants anon/authenticated | **Nenhum** (só `service_role` com DML completo) |
| PostgREST (inferência) | **Sem exposição efectiva** a clientes browser (`postgrest_exposure_risk: false`) |
| Linhas (contagens apenas) | tokens: **1**; states: **5** (valores **não** consultados) |
| Código | `src/lib/google/token-store.ts`, `oauth-state.ts` — uso server-side |

**Conclusão:** risco **potencial** se grants fossem alargados; **exposição efectiva actual:** baixa, desde que a app use sempre `service_role`/server e nunca exponha essas tabelas ao cliente.

### `phase2_harness.*`

| Tabela | RLS | Políticas | Grants anon/auth | Rows |
|--------|-----|-----------|------------------|------|
| `deployment_guard` | Sim | 0 | Nenhum | 1 |
| `runs` | Sim | 0 | Nenhum | 0 |
| `run_tracking` | Sim | 0 | Nenhum | 0 |
| `cleanup_audit_snapshots` | Sim | 0 | Nenhum | 0 |

**Uso no código app:** não encontrado em `src/` (harness operacional / scripts). **Exposição PostgREST:** negativa.

---

## F. Integridade Auth ↔ Profiles (facto confirmado)

| Métrica | Valor |
|---------|-------|
| Utilizadores `auth.users` | 15 |
| Linhas `public.profiles` | 14 |
| Auth sem perfil | **1** |
| Perfil sem Auth | **0** |

**Integridade referencial:** todos os perfis apontam para Auth existente; **uma** conta Auth não tem linha em `profiles`.

**Causas plausíveis (inferência):** utilizador criado antes do trigger `handle_new_user`; convite / OAuth sem backfill; conta de teste eliminada parcialmente; falha pontual no signup. **Não verificado:** qual `id` (sem PII).

---

## G. Matriz de riscos

| ID | Risco | Nível | Evidência | Consequência |
|----|-------|-------|-----------|--------------|
| R1 | Histórico `schema_migrations` só 025–026 | **Alto** (ops) | Query directa | Novo ambiente prod via CLI pode reaplicar ou falhar reconciliação |
| R2 | Três ficheiros `023` no repo | **Médio** | Glob repo | Risco de aplicar variante errada em migração limpa |
| R3 | Probe 013/021 mal calibrados | **Resolvido** | `AUDIT_SCRIPTS_CHANGELOG.md` | Probes corrigidos; reconciliação 26/26 |
| R4 | `payments`/`invoices` sem `deleted_at` mas scripts assumem | **Médio** | Fase 1 script + 003 migrations | Erros em relatórios admin / auditoria; não em queries TS principais |
| R5 | OAuth: RLS sem políticas | **Baixo** (estado actual) | Grants só service_role | Seguro hoje; regressão se alguém GRANT a authenticated |
| R6 | `phase2_harness` RLS sem políticas | **Baixo** | Sem grants cliente | OK para harness interno |
| R7 | RPC `booking_public_*` + anon | **Médio** | EXECUTE grants | Superfície aberta; depende de hardening interno (016–025) |
| R8 | 1 Auth sem profile | **Médio** (UX/ACL) | Count SQL | Utilizador pode falhar fluxos que assumem `profiles` |
| R9 | Dados teste Booking desalinhados de `companies` | **Médio** (modelo) | Auditoria fase 1 | Confusão billing↔booking em prod se replicado |
| R10 | Isolamento multi-tenant não re-testado nesta fase | **Médio** (governação) | Secção H | Lacuna de evidência temporal recente |

*Nenhum item R7 foi demonstrado como vulnerabilidade explorável nesta fase.*

---

## H. Plano de correção proposto (recomendações only)

1. **Produção nova:** aplicar migrations 001–026 em ordem numa BD vazia; registar histórico completo; **não** usar «repair» sem documentação; escolher **uma** versão 023.
2. **BD teste actual:** opcional `migration repair` 001–024 **só** após validar objectos (já alinhados); ou aceitar histórico parcial e manter apenas teste.
3. **Corrigir** `supabase-full-db-audit-readonly.mjs`: remover `.is("deleted_at")` em `payments`/`invoices` ou adicionar migration consciente de soft-delete (decisão de produto).
4. **Probe 021:** usar `has_function_privilege('public', …)`; **013:** usar `information_schema.tables` em vez de `SELECT` sujeito a RLS.
5. **OAuth:** manter política «zero grants anon/authenticated»; adicionar política deny explícita ou documentação runbook; rotação tokens via server only.
6. **Auth/profile:** job read-only para listar `auth.users` sem `profiles`; trigger/backfill único (fora desta fase).
7. **Isolamento:** re-executar suite documentada em `docs/booking/MEMBER_ROLE_INTEGRATION_TESTS.md` + scripts `booking-phase2-*` com `BOOKING_ALLOW_REMOTE_TESTS=1` no project allowlisted.
8. **Booking ↔ companies:** política de dados — preencher `company_id` em negócios antes de prod ou documentar excepção.

---

## I. Conclusão

| Critério | Avaliação |
|----------|-----------|
| **Consistência schema vs repo (objectos)** | **Boa** para **001–026** (probes); 023 canónico presente; histórico `schema_migrations` continua incompleto |
| **Consistência histórico migrations** | **Fraca** — bloqueio operacional para «fresh prod» |
| **Segurança RLS (cliente/staff)** | **Sólida** no padrão company-scoped + helpers definer; gaps OAuth/harness são «deny all» para clientes |
| **Superfície pública Booking** | **Intencional** via DEFINER; requer confiança nas migrations 015–025 (probes OK) |

**Pronto para preparação de produção?**  
**Condicional — não go pleno** até: (1) plano de migrations limpo em ambiente novo ou repair documentado; (2) resolver R1/R2; (3) corrigir ou aceitar R4 nos scripts de observabilidade; (4) revalidar isolamento (R10) com suites existentes; (5) política clara Booking/`company_id` (R9).

**Testes de isolamento (secção 8):** **não executados** nesta fase. Pré-requisitos: project `bwxhdoxesqtdqwd…`, credenciais `BOOKING_TEST_*` dos fixtures em `scripts/booking-integration-fixtures.mjs`, `BOOKING_ALLOW_REMOTE_TESTS=1`. Cenários: cross-tenant customer (P2-19), professional RLS (`verify-booking-professional-rls-phase2.mjs`), duas empresas cliente via `user_company_ids` — **recomendado** antes de prod, sem improvisar contas reais.

---

*Relatório produzido a partir de evidências em `docs/audit/phase3-audit-raw.json` e análise estática do repositório; separação facto / inferência / não verificado mantida ao longo do documento.*