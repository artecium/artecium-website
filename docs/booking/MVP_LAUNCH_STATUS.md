# Artecium Booking — MVP launch status

**Prioridade:** produto para clientes reais (barbearia + clínica harmonização). **Harness 023 v2.6:** congelado (validação fechada).

Atualizado: 2025-11-14

## Matriz funcional

| Área | Estado | Notas |
|------|--------|--------|
| Businesses, settings, timezone | **Implementado** | `booking_businesses` + painel settings |
| Membership / roles (owner, manager, professional) | **Implementado** | RLS 012–022 |
| Customers (CRM) | **Implementado** | Painel; notas internas manager-only (022) |
| Services (duração, preço, buffers) | **Implementado** | |
| Staff + staff_services | **Implementado** | |
| Working hours / breaks | **Implementado** | |
| Time off | **Implementado** | |
| Appointments + statuses | **Implementado** | pending/confirmed/rejected/cancelled |
| Overlap protection (DB) | **Implementado** | `EXCLUDE` gist + `blocked_starts_at` |
| Public página `/booking/b/[slug]` | **Implementado** | Wizard completo |
| Slots RPC (`booking_validate_public_slot`) | **Implementado** | 015 + 016 |
| Criação pública transacional | **Implementado** | `booking_public_create_appointment` |
| Idempotência pública | **Implementado** | 015/017 |
| Painel admin (`/booking/admin`, `/client/booking`) | **Implementado** | Calendário, CRUD, appointments |
| Guest cancel / reschedule | **Implementado** | Migration **024** aplicada (2025-11-14) — hash `c9f5c534a9bfb033f1e919cba9e54a4e6fd86d5b90730ba51d27d7ab34e4b0d8` |
| Email confirmação | **Parcial** | `notifications.ts` + Resend env; sem template rico |
| Embeds nos websites clientes | **Parcial** | Rota interna pronta; falta iframe/link produção |
| Pagamentos | **Em falta (fora MVP)** | Colunas existem; não expostas |
| Seeds produção barbearia/clínica | **Parcial** | Ver `DEMO_CLIENT_ONBOARDING.md` |

## Fluxo MVP cliente final

| # | Passo | Estado |
|---|--------|--------|
| 1–8 | Wizard público | OK |
| 9 | Confirmação (UI + email se Resend) | OK / configurar env |
| 10 | Consultar/cancelar/reagendar | OK após migration 024 |

## Fluxo proprietário

1–10 do briefing: **coberto** no painel existente (calendário, appointments, serviços, staff, horários, clientes, settings).

## Pré-requisitos para primeiro cliente online

**Autorização separada necessária:**

1. Aplicar migrations **012–026** no projeto Supabase de produção do cliente (não aplicar harness **023** em produção).
2. Variáveis `NEXT_PUBLIC_SUPABASE_*`, `RESEND_*`, `BOOKING_EMAIL_FROM`, host booking (`booking.artecium.com` ou subdomínio cliente).
3. Onboarding: criar negócio, slug, serviços, profissionais, horários.
4. Embed: `https://<booking-host>/<slug>` no site do cliente.

**Não autorizado neste repo automaticamente:** `db push`, deploy, DNS, dados reais.

## Caminho mais curto — barbearia

1. Apply **024** no ambiente alvo.
2. Owner cria negócio slug `demo-barbearia` (ou nome real) via onboarding.
3. 2+ staff, serviços 30/45 min, `allow_customer_reschedule=true`, `confirmation_mode=automatic`.
4. Link público no site.
5. Testar uma marcação real + cancelamento via link de gestão.

## Caminho mais curto — clínica

1. Idem com slug dedicado; serviços com `buffer_after_minutes` (intervalo entre marcações).
2. Formulário público: apenas nome/telefone/email (sem dados clínicos).
3. `confirmation_mode=manual` se quiserem aprovar cada pedido.

## Testes locais

```bash
npm run verify:booking-public-flow
npm run verify:booking-availability
npm run test:booking-unit
```

Integração com DB: `npm run db:seed:booking-integration` (ambiente allowlisted/local).