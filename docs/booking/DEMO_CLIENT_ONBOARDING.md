# Onboarding — primeiros clientes (demonstração)

Slugs sugeridos (substituíveis antes de produção):

| Cliente tipo | Slug sugerido | Notas |
|--------------|---------------|--------|
| Barbearia (demo) | `demo-barbearia-artecium` | Vários barbeiros; serviços corte/barba/combo |
| Clínica harmonização (demo) | `demo-clinica-harmonizacao-artecium` | Buffers entre consultas; sem campos clínicos no público |

## Barbearia — checklist configuração

1. **Negócio:** timezone `Europe/Lisbon`, `slot_interval_minutes=15`, `confirmation_mode=automatic`, `allow_customer_reschedule=true`, `cancellation_notice_minutes=120`.
2. **Serviços (exemplo demo):**
   - Corte — 30 min
   - Barba — 20 min
   - Corte + barba — 45 min
3. **Profissionais:** 2+ staff, cada um com `accepts_online_bookings=true`, horários seg–sáb, pausa almoço opcional.
4. **Ligações:** cada staff aos serviços que executa (`booking_staff_services`).
5. **URL pública:** `/booking/b/<slug>` ou rewrite no host booking.

## Clínica — checklist configuração

1. **Negócio:** `confirmation_mode=manual` ou `automatic` conforme política; `buffer_after_minutes` nos serviços longos.
2. **Serviços (exemplo demo):**
   - Consulta inicial — 45 min, buffer 15
   - Tratamento — 60 min, buffer 20
3. **Profissionais:** disponibilidade individual; time-off para formações.
4. **Formulário público:** apenas contacto; sem histórico médico.

## Integração no website

```html
<a href="https://booking.artecium.com/demo-barbearia-artecium">Marcar hora</a>
```

Ou iframe (testar CSP/altura no site do cliente).

## O que não fazer

- Não usar fixtures `phase2-notes-fixture` em produção.
- Não armar `deployment_guard` do harness de testes.