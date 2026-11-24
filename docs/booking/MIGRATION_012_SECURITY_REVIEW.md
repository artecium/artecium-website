# Migration 012 — security review (Etapa A)

## Verdict

**Aplicável com 013 + 014** (`013_booking_security_invites.sql`, `014_booking_membership_hardening.sql`). Não aplicar 012 isolada; ver `SECURITY_AUDIT_REPORT.md`.

## Findings & fixes

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| 1 | Public RPC `booking_public_create_appointment` não valida horários de trabalho | Medium | Phase 3 slot RPC; min/max notice enforced in 012 |
| 2 | Overlap EXCLUDE usava só `starts_at`/`ends_at` sem buffers | High | **013**: `blocked_starts_at`/`blocked_ends_at` + trigger + EXCLUDE atualizado |
| 3 | `booking_create_business_with_owner` sem validação SQL de slug | Low | **013**: regex + trim |
| 4 | Membros só via managers (RLS OK) mas sem fluxo de convite | Medium | **013**: `booking_member_invites` + RPCs invite/accept |
| 5 | Qualquer `authenticated` pode criar negócio (onboarding aberto) | Product | Aceite para **proprietário inicial**; gestores adicionais só por convite (013) |
| 6 | `booking_public_get_business` não expõe PII | OK | — |
| 7 | Anon sem GRANT em tabelas | OK | Revoke + RLS |
| 8 | Idempotency replay devolve slot existente a quem tem a key | Low | Client must use random UUID key |
| 9 | Platform `is_owner_or_admin` lê todos os negócios | Intentional | Artecium ops only |
| 10 | Staff booking role read-only (no write appointments) | OK Phase 2 | Managers confirm/reject |
| 11 | `company_id` opcional sem FK policy extra | OK | Explicit optional link |
| 12 | Subscriptions não bloqueiam features | Product | `status default inactive` — no app checks in dev |

## Isolation model (theoretical — **not executed on remote DB**)

- Tenant boundary: `business_id` + `booking_business_members`.
- RLS `booking_can_access_business` / `booking_can_manage_business` em todas as tabelas filhas.
- Utilizador A membro de business 1 **não** satisfaz `booking_can_access_business(id_2)` → 0 rows.
- **RLS não foi testada** neste ambiente (sem Supabase local ligado ao agente).

## Public surface

- Anon: apenas `EXECUTE` em RPCs públicas; sem SELECT em `booking_appointments` / `booking_customers`.
- Sem RPC de UPDATE/DELETE público em marcações.

## Overlap states

`pending` e `confirmed` participam no EXCLUDE; `rejected` e `cancelled` libertam o slot.
