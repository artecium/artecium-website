# Ambiente de demonstração Artecium

Este documento descreve o ambiente de **teste/demonstração** da plataforma Artecium. Os dados são fictícios e não envolvem pagamentos reais, Stripe ou integrações Google reais.

## Pré-requisitos

1. Migrations `001`–`005` aplicadas no Supabase.
2. Catálogo de serviços/planos criado pela migration `002`.
3. Variáveis de ambiente configuradas (ver abaixo).
4. **Se o seed falhar com `permission denied for table roles`:** executar uma vez `scripts/grant-service-role-admin.sql` no SQL Editor do Supabase (restaura GRANTs da Data API para `service_role`; não altera RLS).
5. **Nunca** expor `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` no frontend.

## Variáveis de ambiente

Adicione ao `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Passwords para contas demo (escolha valores seguros; não commitar)
DEMO_CLIENT_PASSWORD=
DEMO_OWNER_PASSWORD=
DEMO_ADMIN_PASSWORD=
DEMO_STAFF_PASSWORD=
```

Opcionalmente, passwords individuais por staff:

```env
DEMO_DEVELOPER_PASSWORD=
DEMO_DESIGNER_PASSWORD=
# etc.
```

O script de seed usa `DEMO_STAFF_PASSWORD` para developer, designer, seo, support e finance, salvo override específico.

## Comandos

```bash
# Criar/atualizar dados demo (idempotente)
npm run db:seed:demo

# Verificar acesso com autenticação normal (RLS)
npm run db:verify:demo
```

## Contas demo

| Email | Função | Password env |
|-------|--------|--------------|
| `demo.client@artecium.test` | Cliente — área `/client/*` | `DEMO_CLIENT_PASSWORD` |
| `demo.owner@artecium.test` | Owner — acesso global back office | `DEMO_OWNER_PASSWORD` |
| `demo.admin@artecium.test` | Admin — staff com assignment à empresa demo | `DEMO_ADMIN_PASSWORD` |
| `demo.developer@artecium.test` | Developer — projetos e tarefas | `DEMO_STAFF_PASSWORD` |
| `demo.designer@artecium.test` | Designer | `DEMO_STAFF_PASSWORD` |
| `demo.seo@artecium.test` | SEO | `DEMO_STAFF_PASSWORD` |
| `demo.support@artecium.test` | Support — tickets | `DEMO_STAFF_PASSWORD` |
| `demo.finance@artecium.test` | Finance — faturas/pagamentos | `DEMO_STAFF_PASSWORD` |

**Nota:** As passwords não são documentadas aqui por segurança. Defina-as nas variáveis de ambiente antes de executar o seed.

## Empresa demo

- **Nome:** Artecium Demo Client
- **NIF:** `DEMO-PT-0001`
- **Website:** `https://demo.artecium.test`
- **Cliente principal:** `demo.client@artecium.test` com `contact_role = owner`

## Serviços e subscrições

O seed **reutiliza** o catálogo existente (migration 002). Não duplica serviços nem planos.

| Serviço | Plano / modelo | Notas |
|---------|----------------|-------|
| Maintenance | **Professional** (€100/mês) | Plano do catálogo com features e limites |
| Website | Subscrição one-time (€3500) | Serviço sem planos no catálogo — modelo `custom/one_time` |
| Analytics | Subscrição mensal demo (€49) | Override `analytics_access` para entitlements |
| SEO | Subscrição mensal demo (€79) | Override `seo_access` para entitlements |

**Importante:** “Website → Professional” no pedido original refere-se ao **nível do projeto**, não ao plano Maintenance Professional. O serviço Website não tem planos no catálogo; a subscrição demo regista o valor e tier em `config`.

Registo de utilização demo: **80 minutos** no feature `monthly_changes_minutes` (Maintenance Professional).

## Projeto demo

- **Nome:** Artecium Demo Website
- **Estado:** `development`
- **Histórico:** `analysis` → `development`
- **Milestones:** Discovery, Design, Development, Testing, Launch
- **Tasks:** requisitos, design, frontend, backend, auth, SEO, analytics, testing, review
- **Membro staff:** `demo.developer@artecium.test`

## Financeiro (demo)

- **DEMO-INV-001** — paga (`paid`), com pagamento demo (`provider: demo`)
- **DEMO-INV-002** — pendente (`issued`)
- Sem Stripe, sem cartões, sem cobranças reais

## Suporte

| Ticket | Estado | Notas |
|--------|--------|-------|
| Website — dúvida sobre desenvolvimento | `new` | Com mensagens cliente + support |
| Pedido de alteração | `in_progress` | Mensagem do cliente |

O cliente só vê tickets da própria empresa (RLS).

## Documentos

| Título | Visibilidade |
|--------|--------------|
| Project Brief | client_visible |
| Website Proposal | client_visible |
| Technical Specification | client_visible |
| Monthly Report | client_visible |
| Internal Delivery Notes | internal_only |

## Analytics e SEO

Conexões **fictícias** (sem Google real):

- Analytics: property `GA-DEMO-123456`, 7 dias de métricas (sessions, users, pageviews, conversions)
- SEO: site `https://demo.artecium.test`, 7 dias (clicks, impressions, CTR, position)

A UI em `/client/analytics` e `/client/seo` exige entitlements (`analytics_access` / `seo_access`) **e** conexão configurada. O seed cria ambos via overrides e conexões demo.

## Notificações, reuniões, reports, feedback

- 4 notificações para o cliente (projeto, fatura, documento, ticket)
- Reuniões: **Project Kickoff** (passada), **Monthly Review** (futura)
- Report: **Monthly Project Report** (client_visible)
- Feedback: rating 5 no projeto demo

## Staff assignments

Staff com assignment à empresa demo (exceto owner, que tem acesso global):

- admin, developer, designer, seo, support, finance

## Idempotência

O seed verifica existência por identificadores estáveis (`DEMO-PT-0001`, títulos, números de fatura, etc.) e não duplica dados em execuções repetidas. Utilizadores demo são atualizados (password/metadata) se já existirem.

## Verificação RLS

`npm run db:verify:demo` autentica com **anon key + password** (nunca service_role) e valida:

- Cliente: empresa, projeto, subscrições, faturas, tickets, documentos visíveis, notificações
- Cliente **não** vê documento `internal_only`
- Staff developer: empresa atribuída e projeto
- Owner: empresa, subscrições, faturas

Se um teste falhar por RLS, o script reporta o check falhado. **Não altere policies automaticamente** — investigue utilizador, tabela, operação e policy envolvida.

## Limpeza

Não há script de cleanup incluído. Para remover dados demo, elimine manualmente registos com `tax_id = DEMO-PT-0001` e utilizadores `@artecium.test` no Supabase Auth, ou use um projeto Supabase dedicado a demo.
