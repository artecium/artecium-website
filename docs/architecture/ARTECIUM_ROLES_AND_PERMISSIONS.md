# Artecium — Roles e permissões

**Estado:** Fase A — documentação de referência (2026-11-16)  
**Fontes:** `supabase/migrations/001_initial_schema.sql`, `src/types/platform.ts`, `src/lib/auth/permissions.ts`, `scripts/seed-demo-data.mjs`, auditorias Fase 3–5.

Legenda de implementação: **✅** implementado · **🟡** parcial · **❌** não implementado · **⚠️** necessita correção · **❓** decisão

---

## 1. Camadas de autorização (não confundir)

| Camada | Onde vive | O que controla |
|--------|-----------|----------------|
| **Platform role** | `public.roles` + `public.user_roles` | Staff Artecium vs cliente (`owner`…`client`) |
| **Company membership** | `public.company_users` | A que empresa(s) o utilizador pertence (portal cliente) |
| **Company contact role** | `company_users.contact_role` | Função de contacto na empresa (`owner`, `billing`, …) |
| **Staff assignment** | `staff_company_assignments` | Que empresas um membro da equipa pode ver na admin |
| **Booking membership** | `booking_business_members.role` | `owner` \| `manager` \| `professional` (Booking) |
| **RLS (Postgres)** | Políticas + funções `SECURITY DEFINER` | Isolamento real multi-tenant na BD |
| **App permissions** | `ROLE_PERMISSIONS` em TypeScript | UI e server actions (não substituem RLS) |

**❓ Decisão:** o pedido comercial fala em «Company Owner / Manager / Member». Na BD existe `contact_role` com valores **diferentes** (`owner`, `billing`, `technical`, `general`) — não há slug `manager`/`member` ao nível empresa.

---

## 2. Contas de demonstração (sem passwords)

Passwords: variáveis `DEMO_*_PASSWORD` / seed — **nunca** documentadas aqui.

| Email | Nome demo | Platform role (`user_roles`) | `company_users` | Staff assignment | Propósito |
|-------|-----------|------------------------------|-----------------|------------------|-----------|
| `demo.client@artecium.test` | Demo Client | `client` | Sim (`contact_role`: owner) | — | Portal cliente |
| `demo.owner@artecium.test` | Demo Owner | `owner` | — | — | Platform Owner (equipa) |
| `demo.admin@artecium.test` | Demo Admin | `admin` | — | Sim (`admin`) | Platform Admin |
| `demo.developer@artecium.test` | Demo Developer | `developer` | — | Sim | Desenvolvimento |
| `demo.designer@artecium.test` | Demo Designer | `designer` | — | Sim | Design |
| `demo.seo@artecium.test` | Demo SEO | `seo` | — | Sim | SEO |
| `demo.support@artecium.test` | Demo Support | `support` | — | Sim | Suporte |
| `demo.finance@artecium.test` | Demo Finance | `finance` | — | Sim | Financeiro |

**Notas factuais:**

- **Platform Owner** no modelo de código = role slug `owner` (`USER_ROLES.OWNER`), com todas as permissões TS em runtime (`ROLE_PERMISSIONS`).
- **demo.client** é o único demo com vínculo explícito a empresa (`seed-demo-data.mjs`).
- Contas staff **não** têm `company_users` no seed; o acesso a empresas cliente passa por **RLS staff** + `staff_company_assignments`.
- **Booking:** utilizadores de integração são **outros** emails (`booking-owner-a@artecium.test`, etc.) — ver `scripts/booking-integration-fixtures.mjs`.

---

## 3. Platform roles (catálogo BD)

Inseridas na migração **001** (`roles.slug`):

| Slug | Nome | Equipa interna? |
|------|------|-----------------|
| `owner` | Owner | ✅ Platform Owner |
| `admin` | Admin | ✅ |
| `project_manager` | Project Manager | ✅ |
| `developer` | Developer | ✅ |
| `designer` | Designer | ✅ |
| `seo` | SEO | ✅ |
| `analytics` | Analytics | ✅ |
| `support` | Support | ✅ |
| `finance` | Finance | ✅ |
| `client` | Client | ❌ (cliente empresa) |

**Múltiplas roles:** a tabela `user_roles` permite várias linhas por `user_id` — **🟡** a app assume frequentemente **uma** role principal via `fetchUserRolesFromSupabase`; combinações múltiplas não estão bem definidas na UI.

---

## 4. Permissões da aplicação (TypeScript)

Definidas em `src/types/platform.ts` (`PERMISSIONS`) e mapeadas em `src/lib/auth/permissions.ts` (`ROLE_PERMISSIONS`).

| Permissão | Owner | Admin | PM | Dev | Design | SEO | Analytics | Support | Finance | Client |
|-----------|:-----:|:-----:|:--:|:---:|:------:|:---:|:---------:|:-------:|:-------:|:------:|
| clients.view/edit | ✅ | ✅/✅ | view | — | — | — | — | view | view | — |
| projects.* | ✅ | ✅ | ✅ | partial | partial | view | view | view | — | — |
| payments/invoices | ✅ | ✅ | — | — | — | — | — | — | ✅ | — (RLS) |
| analytics/seo | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — | entitlements |
| support | ✅ | ✅ | view | — | — | — | — | ✅ | — | portal |
| users/settings | ✅ | ✅ | — | — | — | — | — | — | — | — |
| leads/proposals/contracts | ✅ | ✅ | — | — | — | — | — | — | — | — |
| integrations.manage | ✅ | ✅ | — | — | — | — | — | — | — | — |

**⚠️** `role_permissions` existe na BD (001) mas a UI usa principalmente o mapa **estático TS** — alinhamento BD ↔ app **🟡**.

**❌** Enforcement universal de `PERMISSIONS` em todas as server actions — **não verificado**; muito depende de RLS + layouts staff/client.

---

## 5. Platform Owner vs Platform Admin (requisitos vs realidade)

| Requisito | Estado |
|-----------|--------|
| Owner gere toda a equipa | 🟡 Admin UI + roles; sem MFA obrigatório |
| Owner gere todos os clientes/empresas | ✅ RLS staff + admin queries |
| Admin não retira owner | **❌** Não há trigger/policy dedicada; depende de processo + quem tem `users.manage` |
| Owner exclusivo em operações críticas | **❌** Não distinguido no código de `admin` para finanças/impersonation |
| MFA Owner | **❌** Supabase Auth suporta MFA; projeto teste: 0 `mfa_factors` (auditoria) |

---

## 6. Roles Booking

| Papel | BD / RPC | Implementação |
|-------|----------|-----------------|
| Booking Owner | `booking_business_members.role = owner` | ✅ |
| Booking Manager | `manager` | ✅ + invites (013+) |
| Booking Professional | `professional` (antes `staff`) | ✅ 020/022 |
| Guest | sem auth; RPC `booking_public_*` | ✅ |
| Client (marcação) | dados guest em appointments | ✅ |

Helpers: `booking_can_access_business`, `booking_can_manage_business`, `booking_is_professional_member`, etc.

**Isolamento:** ✅ prático entre negócios A/B (Fase 4, projecto teste). **🟡** `booking_businesses.company_id` muitas vezes null em dados de teste (Fase 3).

---

## 7. Matriz granular — recursos × contexto

| Recurso | Cliente empresa | Staff admin | Booking membro | Anon público |
|---------|-----------------|-------------|----------------|--------------|
| `companies` | próprias (`user_company_ids`) | atribuídas / todas (owner) | — | ❌ |
| `projects`, `documents` | company-scoped | staff policies | — | ❌ |
| `client_subscriptions` | leitura própria | staff manage | — | ❌ |
| `payments`, `invoices` | leitura própria | staff manage | — | ❌ |
| `tickets` | criar/ler próprios | staff manage | — | ❌ |
| `notifications` | `user_id = auth.uid()` | staff insert | — | ❌ |
| `booking_*` | — (except UI em `/client/booking` ligada a empresa) | platform admin indirect | membership | RPC only |
| Storage `platform-documents` | path company folder | staff | — | ❌ |

Fonte RLS: `docs/audit/RLS_INVENTORY.json` (205 políticas).

---

## 8. Impersonation

| Requisito | Estado |
|-----------|--------|
| Sem password do alvo | — |
| Sessão temporária auditável | **❌** Não implementado |
| Banner de impersonation | **❌** |
| Log dedicado | **🟡** `activity_logs` existe; 0 linhas em teste; não cobre impersonation |
| Sem alterar `auth.users` do alvo | — |

Proposta arquitectural na master doc (Fase E).

---

## 9. Auditoria de permissões (testes)

| Teste | Resultado | Evidência |
|-------|-----------|-----------|
| Booking cross-tenant read | **PASS** | `PHASE4_TENANT_ISOLATION_REPORT.md` |
| Cliente dois `company_id` | **NOT TESTED** | Fase 5 bloqueada (Docker); tooling pronto |
| Dashboard stats RLS | **PASS** (script) | `verify-admin-dashboard-stats-rls.mjs` quando env demo |

---

## 10. Recomendações (Fase B)

1. **❓** Alinhar nomenclatura empresa (Manager/Member) com `contact_role` ou novos valores + RLS.
2. **⚠️** Proteger role `owner` na BD (policy ou trigger) contra remoção por `admin`.
3. Unificar enforcement: `hasPermission()` em actions críticas + RLS.
4. Completar Fase 5 local para matriz cliente A↔B.
5. Documentar por utilizador: platform roles **+** `company_users` **+** booking memberships.

---

*Este documento não substitui políticas RLS; em conflito, a BD prevalece.*