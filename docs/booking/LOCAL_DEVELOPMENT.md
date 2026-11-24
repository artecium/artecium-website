# Booking — desenvolvimento local (Supabase de teste)

## Variáveis de ambiente (nomes apenas)

No `.env.local` (não commitar):

- `NEXT_PUBLIC_SUPABASE_URL` — URL do projecto de **teste**
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — chave pública anon/publishable
- `SUPABASE_SERVICE_ROLE_KEY` — **apenas** scripts servidor; nunca no browser

Opcional: `NEXT_PUBLIC_BOOKING_HOSTNAME` se usar host dedicado em produção.

## Arrancar

```powershell
npm install
npm run dev
```

Abrir **http://localhost:3000** (site principal).

## URLs locais (sem subdomínio booking)

| Área | URL |
|------|-----|
| Marcação pública (demo) | http://localhost:3000/booking/b/artecium-demo |
| Admin Booking | http://localhost:3000/booking/admin/dashboard |
| Login (com retorno admin) | http://localhost:3000/login?next=%2Fbooking%2Fadmin%2Fdashboard |
| Serviços / staff / horários | `/booking/admin/services`, `staff`, `schedules`, `appointments` |

Com subdomínio `booking.artecium.com` configurado no hosts file, o proxy reescreve `/artecium-demo` → `/booking/b/artecium-demo`.

## Dados de teste (Supabase)

- Slug público: **artecium-demo**
- Negócio, serviço, profissional e horários conforme seed no projecto de teste (IDs no pedido de implementação — não duplicar em docs públicos).

## Fluxo E2E manual

1. Abrir `/booking/b/artecium-demo` — escolher serviço, profissional (ou automático), data, horário RPC, dados, confirmar.
2. Anotar `public_reference` e estado (`pending` / `confirmed`).
3. Iniciar sessão: ir a `/booking/admin/dashboard` → redirect login com `?next=…` → credenciais de um utilizador **membro** do negócio Booking.
4. Ver marcação em **Appointments** / dashboard.
5. Tentar segundo slot igual (outro browser) — deve falhar com indisponibilidade.

## Conta admin Booking

Não existem credenciais no repositório. Criar utilizador no Supabase Auth (teste) e associar em `booking_business_members` como `owner` ou `manager`, ou concluir onboarding em `/booking/admin/onboarding`.

## Testes automatizados (sem BD)

```powershell
npx tsc --noEmit
npm run test:booking-unit
npm run verify:portal-routing
npm run lint
npm run build
```

Integração PostgreSQL: ver `INTEGRATION_TESTING.md`.
