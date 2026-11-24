# Artecium — Fase 4: Testes de isolamento e segurança multi-tenant

**Project ref (único autorizado):** `bwxhdoxesqtdqwkxrmom`  
**Modo:** testes práticos **só leitura** (PostgREST `SELECT` / RPC de leitura); **nenhum** DML, migration, alteração RLS ou deploy.  
**Evidências brutas:** `docs/audit/phase4-isolation-results.json`  
**Script:** `scripts/supabase-phase4-isolation-readonly.mjs` (`PHASE4_ISOLATION_READONLY=1`)  
**Execução:** 2026-11-16T20:56:06Z  

**Confirmação:** não foi executada qualquer operação de escrita na base de dados ou na aplicação nesta fase.

---

## Resumo executivo (PASS / FAIL / NOT TESTED)

| Classificação | Quantidade |
|---------------|------------|
| **PASS** | 26 |
| **FAIL** | 0 |
| **NOT TESTED** | 3 |

**Conclusão de validação (critério da fase):**

| Domínio | Dois contextos distintos? | Evidência prática A↔B? | Estado |
|---------|---------------------------|-------------------------|--------|
| **Booking** | Sim (`integration-salon-a` / `integration-salon-b`) | Sim (14 leituras cruzadas + papéis) | **Isolamento de leitura validado** (neste projecto de teste) |
| **Área de Cliente (empresas)** | **Não** (1 empresa activa; 1 contexto de membership) | **Não** | **Validação incompleta** para isolamento entre duas empresas cliente |

---

## 1. Contas e dados de teste (anonimizado)

| Alias | Papel |Âmbito |
|-------|------|--------|
| `CLIENT_DEMO` | Utilizador área cliente (demo seed) | Empresa `COMPANY_1` (`id` prefixo `d28a6435…`) |
| `STAFF_DEMO_OWNER` | Staff Artecium (demo owner) | Plataforma / empresas atribuídas — **não** confundir com cliente Booking |
| `BOOKING_OWNER_A` | Owner negócio integração A | `integration-salon-a` (prefixo `b315d582…`) |
| `BOOKING_OWNER_B` | Owner negócio integração B | `integration-salon-b` (prefixo `4c83bd34…`) |
| `BOOKING_MANAGER_A` | Manager em A | Negócio A |
| `BOOKING_PROFESSIONAL_A` | Profissional (staff seed) em A | Negócio A |
| `BOOKING_PROFESSIONAL_UNLINKED_A` | Profissional sem `profile_id` ligado | Negócio A (cenário 022) |
| `ANON` | Sessão não autenticada | RPC públicas Booking |

**Inventário (catálogo read-only, sem PII):**

| Métrica | Valor |
|---------|-------|
| Empresas activas (`companies`) | 1 |
| Linhas `company_users` | 2 (dois membros na **mesma** empresa) |
| Negócios Booking `integration-*` | 3 (A, B, inactivo) |
| Membros Booking | 7 |

**Passwords / tokens:** obtidos apenas de variáveis de ambiente locais; **não** registados neste relatório.

---

## 2. Testes práticos — Área de Cliente

### 2.1 Leitura na própria empresa (`CLIENT_DEMO`)

| ID | Recurso | Esperado | Observado | HTTP | RLS / helper | Status |
|----|---------|----------|-----------|------|--------------|--------|
| CLIENT-READ-OWN-companies | `companies` | ≥1 empresa própria | count=1 | 200 | `user_company_ids()` | **PASS** |
| CLIENT-READ-OWN-projects | `projects` | dados visíveis | count=1 | 200 | company-scoped | **PASS** |
| CLIENT-READ-OWN-client_subscriptions | `client_subscriptions` | subscrições | count=4 | 200 | company-scoped | **PASS** |
| CLIENT-READ-OWN-payments | `payments` | pagamentos | count=4 | 200 | company-scoped | **PASS** |
| CLIENT-READ-OWN-invoices | `invoices` | faturas | count=4 | 200 | company-scoped | **PASS** |
| CLIENT-READ-OWN-documents | `documents` (client_visible) | documentos permitidos | count≥0 | 200 | visibility + company | **PASS** |

### 2.2 Tentativa de leitura com `company_id` estrangeiro (UUID sintético)

| ID | Recurso | Esperado | Observado | Status |
|----|---------|----------|-----------|--------|
| CLIENT-READ-OTHER-projects | `projects` | 0 linhas | count=0 | **PASS** |
| CLIENT-READ-OTHER-payments | `payments` | 0 linhas | count=0 | **PASS** |
| CLIENT-READ-OTHER-invoices | `invoices` | 0 linhas | count=0 | **PASS** |
| CLIENT-READ-OTHER-client_subscriptions | `client_subscriptions` | 0 linhas | count=0 | **PASS** |

**Nota:** não substitui Cliente A vs Cliente B real com duas empresas distintas.

### 2.3 Isolamento entre duas empresas cliente

| ID | Motivo | Status |
|----|--------|--------|
| CLIENT-CROSS-TENANT-* | Apenas **1** empresa e **1** `company_id` com membros de teste; não existe segundo cliente empresa no projecto | **NOT TESTED** |

---

## 3. Testes práticos — Booking

### 3.1 Owner A → negócio B (leitura cruzada)

| ID | Tabela | Esperado | Observado | RLS | Status |
|----|--------|----------|-----------|-----|--------|
| BOOKING-A-TO-B-booking_businesses | `booking_businesses` | 0 | count=0 | `booking_can_access_business` | **PASS** |
| BOOKING-A-TO-B-booking_services | `booking_services` | 0 | count=0 | idem | **PASS** |
| BOOKING-A-TO-B-booking_staff | `booking_staff` | 0 | count=0 | idem | **PASS** |
| BOOKING-A-TO-B-booking_working_hours | `booking_working_hours` | 0 | count=0 | idem | **PASS** |
| BOOKING-A-TO-B-booking_appointments | `booking_appointments` | 0 | count=0 | idem | **PASS** |
| BOOKING-A-TO-B-booking_customer_internal_notes | `booking_customer_internal_notes` | 0 | count=0 | idem | **PASS** |

### 3.2 Leitura legítima e papéis

| ID | Actor | Cenário | Status |
|----|-------|---------|--------|
| BOOKING-A-READ-OWN-SERVICES | Owner A | Serviços em A >0 | **PASS** |
| BOOKING-ROLE-MANAGER-A-SERVICES | Manager A | Serviços em A >0 | **PASS** |
| BOOKING-ROLE-PROF-A-TO-B-SERVICES | Professional A | Serviços em B =0 | **PASS** |
| BOOKING-B-TO-A-SERVICES | Owner B | Serviços em A =0 | **PASS** |
| BOOKING-ROLE-PROF-UNLINKED-APTS | Prof. unlinked A | Marcações em A (leitura permitida; âmbito fino não medido linha-a-linha) | **PASS** (limitado) |

### 3.3 Staff vs cliente

| ID | Resultado |
|----|-----------|
| STAFF-NOT-CLIENT-COMPANIES | Staff demo consegue `SELECT` em `companies` no âmbito staff (`count=1`); separação de modelo cliente/staff confirmada como caminhos distintos — **PASS** |

---

## 4. Funções públicas Booking (práticos, só leitura)

| ID | RPC / recurso | Esperado | Resultado | Status |
|----|---------------|----------|-----------|--------|
| PUBLIC-RPC-GET-BUSINESS-A | `booking_public_get_business` slug A | Metadados públicos; sem chaves PII | Sem `guest_email` / `manage_token` na resposta | **PASS** |
| PUBLIC-RPC-DAY-SLOTS-A | `booking_public_list_day_slots` | Slots ou vazio | Resposta 200 | **PASS** |
| PUBLIC-RPC-INACTIVE-HIDDEN | slug inactivo | Vazio | 0 linhas | **PASS** |
| PUBLIC-TABLE-ANON-APPOINTMENTS | `booking_appointments` directo | 0 / RLS | count=0 | **PASS** |

**Não testado nesta fase (por regra):** cancelamento/reagendamento guest, adivinhação de `manage_token`, criação de marcações.

---

## 5. Análise estática — permissões de escrita

*Classificação **estática**; não são testes práticos.*

| Pergunta | Mecanismo principal | Avaliação |
|----------|---------------------|-----------|
| Cliente alterar outra empresa? | RLS `WITH CHECK` + `company_id IN (user_company_ids())` em tabelas financeiras / projetos | **Risco baixo** se políticas não forem relaxadas |
| Cliente alterar permissões de membros? | `company_users` / roles — políticas staff-heavy; cliente não é staff | **Risco baixo** |
| Profissional alterar marcações fora do âmbito? | Migração **022**: políticas com `booking_staff_ids_for_auth_user`, `booking_can_read_full_appointment` | **Médio-investigação** — requer testes write em harness (bloqueados nesta fase) |
| Profissional gerir serviços/horários sem autorização? | INSERT em `booking_services` condicionado a `booking_can_manage_business` (RLS) | **Risco baixo** para papel professional típico |
| Auto-adicionar a outro negócio? | **014**: insert directo em `booking_business_members` negado; convites via RPC | **Risco baixo** |
| Criar negócios sem gate? | `booking_create_business_with_owner` — `GRANT authenticated` (012/013); validação comercial na app / produto, não só RLS | **Risco médio** (abuso de quota) — governação produto |

**Actions / RPC relevantes (repo):** `booking_create_business_with_owner`, `booking_create_member_invite`, `booking_accept_member_invite`; fluxos Stripe/server usam service role no servidor — fora do âmbito “cliente PostgREST”.

---

## 6. Problemas encontrados

**Nenhum FAIL** nos testes práticos executados.

**Lacunas (não são falhas de RLS comprovadas):**

1. **Sem segundo contexto empresa cliente** — não há evidência Cliente A vs Cliente B.
2. **Profissional unlinked** — leitura de marcações passou; granularidade “só staff_id=X” não validada exaustivamente nesta corrida.
3. **Escrita / RPC mutáveis** — apenas análise estática.

---

## 7. Testes não realizados e razões

| Área | Razão |
|------|--------|
| Cliente ↔ Cliente (2 empresas) | Dados: 1 empresa activa |
| Guest cancel/reschedule | Proibido nesta fase (operações mutáveis + tokens) |
| Enumeração attacks em massa | Fora do scope; sem brute-force |
| Integração completa `booking-phase2-p2-remote-readonly` | Não invocado nesta corrida (script irmão read-only existente); opcional na fase operacional |
| Staff Artecium vs todas empresas reais | Apenas demo staff vs dados demo |

---

## 8. Matriz de riscos

| ID | Risco | Nível | Evidência | Consequência |
|----|-------|-------|-----------|--------------|
| P4-1 | Isolamento cliente 2 empresas não demonstrado | **Alto (governação)** | Prep: 1 empresa | Bloqueio “go” se prod tiver multi-empresa sem 2º seed |
| P4-2 | Booking cross-tenant read | **Baixo** | 12× PASS A↔B | Fuga de dados entre negócios improvável via PostgREST |
| P4-3 | Superfície RPC `anon` | **Médio** | RPC PASS sem PII óbvia | Depende de hardening contínuo 015–025 |
| P4-4 | Criação negócios authenticated | **Médio** | Estático 012 | Spam / custo se sem rate limit prod |
| P4-5 | Profissional scope write | **Médio** | Estático 022; read PASS parcial | Requer testes write autorizados noutra fase |

---

## 9. Recomendações (sem implementação)

1. **Seed de produção / staging:** duas empresas cliente + dois utilizadores cliente antes de repetir Fase 4 em cliente.
2. **CI:** `PHASE4_ISOLATION_READONLY=1` após `db:seed:booking-integration` e demo seed.
3. **Complementar:** `BOOKING_PHASE2_P2_REMOTE=1` para matriz professional (read-only remota já existente).
4. **Antes de prod:** rate limits + política comercial em `booking_create_business_with_owner`.

---

## 10. Critério de conclusão (reavaliação)

- **Booking:** critério **cumprido** — dois negócios, leituras cruzadas **PASS** em ambas as direcções (owner A/B, professional, manager).
- **Área de Cliente multi-empresa:** critério **não cumprido** — falta segundo contexto empresa; testes marcados **NOT TESTED**.

**Isolamento global “validado”:** **parcial** — Booking sim; cliente multi-tenant **incompleto**.

---

## Apêndice — Tabela completa de casos

Ver `docs/audit/phase4-isolation-results.json` → array `cases` (26 entradas com `id`, `actor`, `resource`, `status`, `rls_or_fn`).

**Reexecução:**

```powershell
$env:PHASE4_ISOLATION_READONLY='1'
$env:BOOKING_ALLOW_REMOTE_TESTS='1'
$env:BOOKING_EXPECTED_PROJECT_REF='bwxhdoxesqtdqwkxrmom'
node scripts/supabase-phase4-isolation-readonly.mjs
```

Requer: `BOOKING_TEST_PASSWORD`, `DEMO_CLIENT_PASSWORD`, `DEMO_OWNER_PASSWORD` (carregados via `booking-load-test-env.mjs` / ficheiros locais — não commitar).