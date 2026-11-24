# Artecium — Master Architecture

**Versão:** 1.0 (Fase A — auditoria e documentação)  
**Data:** 2026-11-16  
**Âmbito:** website marketing, três áreas operacionais, Supabase único, preparação comercial **Website + Booking**.

Legenda: **✅** implementado · **🟡** parcial · **❌** não implementado · **⚠️** necessita correção · **❓** decisão pendente

**Auditorias preservadas:** `docs/audit/PHASE3_DEEP_AUDIT_REPORT.md`, `PHASE4_*`, `PHASE5_*`, `RLS_INVENTORY.json`.

**Ambiente de teste remoto protegido:** `bwxhdoxesqtdqwkxrmom` — não foi alterado nas fases 3–5.1 (excepto leituras audit).

---

## 1. Visão global

A Artecium é uma plataforma **multi-produto** num único **Postgres (Supabase)** e uma **app Next.js**:

- Vende e opera **websites** e serviços associados (manutenção, analytics, SEO).
- Oferece **Booking** (marcações) como produto paralelo, ligável a uma empresa cliente.
- Equipa interna opera em **admin**; clientes em **portal**; profissionais Booking em **booking**.

**Prioridade comercial imediata:** registar cliente → empresa → subscrição(ões) → portal → (opcional) negócio Booking ligado → marcações públicas → pagamentos/faturas visíveis.

**Não assumido como concluído:** impersonation, MFA obrigatório, isolamento cliente dual-company validado, produção Supabase limpa, `admin.artecium.com` / `app.artecium.com` como hosts finais.

---

## 2. Três áreas da plataforma

### 2.1 Administração

| Aspecto | Alvo comercial | Estado no código |
|---------|----------------|------------------|
| Host | `admin.artecium.com` | **❓** Hoje: rotas `/admin/*` no mesmo deploy que o site (`src/app/admin`) |
| Utilizadores | Platform Owner, Admin, Dev, Design, SEO, Support, Finance | **✅** roles 001 + UI admin extensa |
| Acesso | Exclusivo staff | **🟡** `proxy.ts` + `hasAnyStaffRole`; staff não entra em portal cliente por política `area-access-policy` |

Módulos admin presentes (amostra): dashboard, clients, projects, tasks, tickets, invoices, payments, services, documents, analytics, seo, meetings, notifications, settings.

### 2.2 Área de Cliente

| Aspecto | Alvo comercial | Estado no código |
|---------|----------------|------------------|
| Host | `app.artecium.com` (pedido) | **🟡** Implementado como `client.artecium.com` (`DEFAULT_PORTAL_HOSTNAME` em `portal-host.ts`) |
| Rotas internas | `/client/*` | **✅** + rewrites no host portal |
| Utilizadores | Dono/gestor empresa (contact roles) | **🟡** `company_users`; papéis «Manager/Member» não mapeados 1:1 |
| Produtos | Projetos, serviços, docs, pagamentos, SEO, analytics, suporte | **✅** páginas sob `src/app/client/` |

**Hub Booking no portal:** `src/app/client/booking/*` — UI para negócio associado à empresa (**🟡** depende de `company_id` no negócio).

### 2.3 Booking

| Aspecto | Estado |
|---------|--------|
| Host `booking.artecium.com` | **✅** `booking-host.ts`, proxy, paths públicos sem `/booking` prefix |
| Admin Booking | **✅** `/booking/admin/*` (interno); rewrites no host Booking |
| Público | **✅** RPC `booking_public_*` (anon) |
| Papéis | **✅** owner, manager, professional |
| Guest | **✅** marcação + gestão via token (024) |

**Preservar:** não remover flows 012–026; auditorias confirmam probes aplicados (Fase 3).

---

## 3. Core partilhado

| Componente | Função | Estado |
|------------|--------|--------|
| `companies` | Hub organizacional | **✅** |
| `profiles` | Perfil por `auth.users.id` | **✅**; **⚠️** 1 auth sem profile em teste |
| `company_users` | Membros do portal | **✅** |
| `roles` / `user_roles` | Staff vs client | **✅** |
| `staff_company_assignments` | Staff → empresas | **✅** |
| `services`, `service_plans`, `service_features` | Catálogo | **✅** |
| `client_subscriptions` | Subscrições por empresa | **✅** soft-delete |
| `subscription_entitlements` / overrides | Direitos | **🟡** UI + funções; **0 rows** entitlements em teste |
| `payments`, `invoices` | Ledger único | **✅** sem `deleted_at` (auditoria) |
| `booking_businesses` | Tenant Booking | **✅** `company_id` opcional (FK 012) |
| `booking_business_members` | Membership Booking | **✅** |

**Princípio confirmado:** uma BD, uma entidade empresa — **não** criar segunda org entity.

---

## 4. Autenticação e sessões

| Requisito | Estado |
|-----------|--------|
| Supabase Auth único | **✅** |
| Sessão partilhada entre áreas | **🟡** Mesmo projeto Supabase; cookies SSR por host — **sem** `Domain=.artecium.com` explícito no código |
| Redirecionamento por área | **✅** `area-access-policy.ts`, `proxy.ts`, `login-redirect.ts` |
| Staff vs client vs booking | **✅** `resolveUserAreaAccess` |
| Logout global | **🟡** padrão Supabase; cross-subdomain não documentado como testado |
| MFA (Owner/privilegiados) | **❌** não imposto na app |
| Um auth, sem auto-acesso cross-área | **🟡** política app separa staff/client/booking; sessão JWT é a mesma identidade |

**⚠️ Risco:** utilizador staff autenticado não deve ver dados cliente só porque partilha sessão — depende de **não** usar rotas client e de RLS.

**Artefactos:** `src/lib/supabase/server.ts`, `client.ts`, `proxy.ts`, `src/lib/auth/session.ts`.

---

## 5. Autorização

- **BD:** RLS + `user_company_ids()`, `staff_can_access_company()`, helpers Booking (**205** políticas — Fase 3).
- **App:** `ROLE_PERMISSIONS` (TS) para staff UI.
- **Booking:** membership + RPC SECURITY DEFINER.

Detalhe: [`ARTECIUM_ROLES_AND_PERMISSIONS.md`](./ARTECIUM_ROLES_AND_PERMISSIONS.md).

---

## 6. Multi-tenancy e isolamento

| Domínio | Evidência |
|---------|-----------|
| Empresa (cliente) | RLS company-scoped; leitura cruzada com UUID sintético **PASS** (Fase 4, 1 empresa) |
| Duas empresas cliente | **NOT TESTED** — Fase 5.1 bloqueada (Docker); scripts prontos |
| Booking | **PASS** leitura A↔B (Fase 4) |
| Staff vê só empresas atribuídas | **🟡** RLS + assignments; validação limitada |

**Regra:** isolamento **tem** de estar na BD — **✅** desenho actual; validação cliente dual pendente.

---

## 7. Billing e produtos

| Capacidade | Estado |
|----------|--------|
| Catálogo serviços/planos | **✅** migrations 002 + admin |
| Subscrições por empresa | **✅** |
| Pagamentos e faturas | **✅** |
| Histórico subscrição | **✅** `subscription_history` |
| Stripe checkout | **🟡** `src/lib/stripe/*`, rotas portal payment success/cancel |
| Entitlements / features | **🟡** `get_subscription_entitlements`, merges TS; dados entitlements esparsos |
| Suspensão por produto | **🟡** status em `client_subscriptions`; sem motor global documentado |
| Segundo ledger | **❌** não duplicar — confirmado |

**Fluxo comercial desejado (10 passos — secção 12):** ver roadmap Fase G; vários passos **🟡** (onboarding cliente real, link empresa↔booking em prod).

---

## 8. Suporte e notificações

| Componente | Estado |
|------------|--------|
| `tickets` + staff policies | **✅** |
| Cliente cria/lê tickets | **✅** RLS |
| `notifications` | **✅** por `user_id` |
| Routing Cliente → Support → Dev/Finance | **🟡** UI parcial; sem workflow formal |
| Notificações contextuais (subscrição, pagamento falho, booking) | **🟡** seed demo; sem motor transversal |

---

## 9. Auditoria e segurança

| Componente | Estado |
|------------|--------|
| `activity_logs` | **✅** tabela + RLS staff; uso app **🟡** |
| Impersonation audit | **❌** |
| Proteção logs contra delete cliente | **🟡** via RLS staff |
| OAuth tokens (`google_oauth_*`) | **✅** sem exposição PostgREST (Fase 3) |
| `booking_public_*` anon | **✅** intencional; risco **médio** operacional |
| Auditorias Fase 3–5 | **✅** preservadas |

Estratégia: ver secção 16 e matriz de riscos herdada (`PHASE3` / `PHASE4`).

---

## 10. Integrações e operação

| Integração | Estado |
|------------|--------|
| Google OAuth (Analytics/Search Console) | **🟡** tabelas + `token-store.ts`; server-only |
| Stripe | **🟡** |
| Email transacional | **❓** Resend/plugins — não inventariado nesta fase |
| Storage documentos | **✅** bucket `platform-documents` |
| Monitorização / alertas / backups | **❌** produto; depender Supabase/Vercel |
| Feature flags | **❌** |
| IA / automações | **❌** roadmap |

---

## 11. Arquitetura de produção (alvo vs actual)

| Tema | Actual (teste) | Alvo |
|------|------------------|------|
| Supabase project | `bwxhdoxesqtdqwkxrmom` allowlist | Projeto **prod** novo, migrations 001–026 limpas |
| `schema_migrations` | Só 025–026 listados | Histórico completo ou BD vazia + reset |
| Hosts | client.* + booking.* no código | **❓** `app.*` vs `client.*`, `admin.*` subdomínio |
| Deploy | Vercel (docs booking prod) | **🟡** guards scripts; sem deploy nesta fase |
| Local Supabase | `config.toml` criado Fase 5; Docker ausente | Necessário para Fase 5 + dev |

Docs: `docs/booking/SUPABASE_PRODUCTION_SETUP.md`.

---

## 12. Fluxo comercial prioritário (Website + Booking)

| # | Passo | Estado |
|---|-------|--------|
| 1 | Registo utilizador | **✅** Auth + `handle_new_user` |
| 2 | Empresa associada | **🟡** admin `clients/new` ou manual |
| 3 | Contratar website/Booking | **🟡** admin subscriptions; Stripe parcial |
| 4 | Subscrição activa | **✅** modelo BD |
| 5 | Acesso portal | **✅** `/client` |
| 6 | Negócio Booking ↔ empresa | **🟡** `company-link`; dados teste sem link |
| 7 | Config serviços/staff/horários | **✅** Booking admin |
| 8 | Marcações públicas | **✅** RPC |
| 9 | Operação diária | **🟡** |
| 10 | Pagamentos/faturas no portal | **✅** RLS + páginas |

---

## 13. Impersonation (desenho — não implementado)

Requisitos do negócio: sem password alvo, sessão temporária, banner, audit trail, sem escalada, bloqueio em finanças críticas.

**Proposta Fase E (❌ não implementada):**

1. Tabela `impersonation_sessions` (operator_id, target_user_id, started_at, ended_at, reason).
2. Cookie/JWT claim **app-level** `impersonating_as` — **não** alterar `auth.users` do alvo.
3. Server actions recusam operações na allowlist (`payments`, `user_roles`, delete audit) se `impersonating_as`.
4. Middleware injeta banner; `activity_logs` com `actor_id` = operator, `on_behalf_of` = target.
5. Terminar sessão limpa claim; registo fim em audit.

**❓** Alternativa Supabase «sign in as» — rejeitada por requisito explícito.

---

## 14. Preparação IA / automações

**❌** Sem agentes produtivos. Dados estruturados (projetos, tickets, booking) adequados para fase futura. Feature flags e audit central recomendados antes de automatizar ações com side-effects.

---

## 15. Inconsistências e riscos (síntese auditoria)

| ID | Tema | Severidade |
|----|------|------------|
| R1 | Histórico migrations remoto incompleto | Alto (ops) |
| R2 | Duas variantes 023 arquivadas no repo | Médio |
| R4 | Scripts assumiam `deleted_at` em payments (corrigido) | Baixo |
| R5–R7 | OAuth / public RPC / booking create | Médio |
| R9 | `company_id` null em negócios teste | Médio |
| P5 | Isolamento 2 empresas cliente não validado | Alto (governação) |

---

## 16. Estratégia de execução (Fases A–G)

### Fase A — Auditoria e documentação ✅ (esta entrega)

- Master architecture + roles doc.
- Plano abaixo.

**Ficheiros novos:** `docs/architecture/ARTECIUM_PLATFORM_MASTER_ARCHITECTURE.md`, `ARTECIUM_ROLES_AND_PERMISSIONS.md`.

**Testes:** nenhum código alterado; **NOT TESTED** novos.

---

### Fase B — Identidade, auth, roles (estimativa **M–L**, 2–4 semanas)

| Entrega | Esforço | Dependências |
|---------|---------|--------------|
| Decisão hosts (`app` vs `client`, `admin` subdomain) | S | DNS/Vercel |
| Cookies cross-subdomain + testes sessão | M | Fase B |
| MFA obrigatório Owner (Supabase + UI) | M | |
| Proteger role `owner` (BD ou policy) | S | |
| Alinhar `contact_role` / convites empresa | M | ❓ produto |
| `hasPermission` em actions críticas | L | inventário actions |

**Riscos:** regressão redirect; testes manuais 3 hosts.

---

### Fase C — Consolidação três áreas (estimativa **L**, 3–5 semanas)

| Entrega | Esforço |
|---------|---------|
| Unificar mapa rotas proxy ↔ hosts finais | M |
| Staff nunca cai em client data por URL | M |
| Booking onboarding só sem portal | S (já existe) |
| UI «empresa sem Booking» / link guidado | M |
| Documentação operador | S |

**Testes:** `verify-booking-routing`, `verify-area-access`, E2E smoke.

---

### Fase D — Billing, empresas, produtos (estimativa **L–XL**, 4–6 semanas)

| Entrega | Esforço |
|---------|---------|
| Fluxo venda: lead → empresa → subscrição(ões) | L |
| Stripe prod + webhooks completos | L |
| Popular `subscription_entitlements` de forma determinística | M |
| Suspender produto sem afectar outros | M |
| Associação obrigatória Booking↔company em prod | M |

**Dependências:** Fase B hosts; Supabase prod vazio.

---

### Fase E — Segurança, isolamento, impersonation (estimativa **L–XL**)

| Entrega | Esforço |
|---------|---------|
| Completar Fase 5.1 (Docker local + dual company PASS) | M |
| Supabase prod preflight (docs existentes) | S |
| Impersonation conforme secção 13 | XL |
| Hardening audit logs | M |
| Re-run Booking integration allowlist | M |

**Bloqueio comercial até:** Fase 5 PASS + migrations prod limpas.

---

### Fase F — Suporte, notificações, integrações (estimativa **M–L**)

| Entrega | Esforço |
|---------|---------|
| Workflow tickets entre roles | M |
| Notificações event-driven (pagamento, ticket, booking) | L |
| Google OAuth prod (rotas, RLS) | M |
| Runbooks monitorização | S |

---

### Fase G — Preparação comercial e lançamento (estimativa **M**)

| Entrega | Esforço |
|---------|---------|
| Checklist 10 passos comercial | S |
| Seed prod mínimo (sem demo junk) | M |
| CI: lint, build, phase4/5 scripts | M |
| Go-live Vercel + Supabase prod | M | **Autorização explícita** |

---

## 17. Plano priorizado (resumo executivo)

```
A (feito) → B (auth/hosts/MFA) → E-parcial (Fase 5 PASS) → D (billing comercial)
         ↘ C (áreas) paralelo a D
         → F (ops) após D estável
         → G (launch)
```

**Não atrasar lançamento por:** impersonation, feature flags, IA — mover para pós-MVP se necessário.

**Não avançar deploy prod sem:** (1) BD prod migrations limpas; (2) Fase 5 PASS; (3) política `company_id` Booking.

---

## 18. Ficheiros de referência rápida

| Área | Caminho |
|------|---------|
| Proxy / routing | `src/lib/supabase/proxy.ts`, `src/lib/routing/` |
| Area access | `src/lib/auth/area-access-policy.ts`, `area-access-resolve.ts` |
| Permissions | `src/lib/auth/permissions.ts` |
| Admin data | `src/lib/data/admin/queries.ts` |
| Client entitlements | `src/lib/services/entitlements.ts` |
| Booking actions | `src/lib/actions/booking/` |
| Migrations | `supabase/migrations/001–026` |
| Seeds | `scripts/seed-demo-data.mjs`, `seed-client-multi-tenant.mjs` |
| Audit | `docs/audit/*` |

---

## 19. Conclusão Fase A

A Artecium **já possui** uma base sólida: schema único, três superfícies de produto no mesmo deploy, RLS madura, Booking avançado (026), portal e admin extensos.

**Gaps críticos para comercialização segura:**

1. Validar isolamento **cliente** com duas empresas (Fase 5.1 local).
2. Produção Supabase **nova** com histórico migrations coerente.
3. Sessão multi-host e nomes DNS finais (**❓** `app` vs `client`).
4. Fluxo comercial ponta-a-ponta (venda → subscrição → portal → booking link) com evidência, não só demo.

**Fase A não alterou código de produto** (excepto documentação e arquitectura). Próximo passo autorizado: **Fase B** ou completar **Fase 5.1** com Docker instalado.

---

*Documento vivo — actualizar ao fechar cada fase B–G com PASS/FAIL de testes e lista de ficheiros modificados.*