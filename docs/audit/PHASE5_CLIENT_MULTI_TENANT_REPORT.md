# Artecium — Fase 5.1: validação multi-tenant Área de Cliente

**Opções:** A — Supabase local · **B — Cloud Sandbox** (recomendada sem Docker / disco limitado)  
**Project ref remoto protegido:** `bwxhdoxesqtdqwkxrmom`  
**Data desta corrida:** 2026-11-16  

---

## 1. Objetivo e âmbito

Validar isolamento entre **duas empresas** com utilizadores cliente independentes, via PostgREST + JWT (sem `service_role` como cliente).

**Escopo desta corrida:** tooling completo + guards sandbox; **execução prática bloqueada** por ausência de Docker **e** ausência de projeto sandbox dedicado (só existe o ref protegido na conta CLI visível).

Runbook sandbox: `docs/audit/PHASE5_SANDBOX_RUNBOOK.md`.

---

## 2. Ambiente utilizado

| Item | Estado |
|------|--------|
| Supabase local em execução | **Não** — Docker indisponível |
| URL alvo planeado | `http://127.0.0.1:54321` |
| CLI | `npx supabase@2` (v2.122.1) |
| `supabase init` | Executado (criou `supabase/config.toml` local) |
| BD remota auditada | **Não utilizada** |

Detalhe: `docs/audit/PHASE5_LOCAL_ENVIRONMENT_REPORT.md`

---

## 3. Confirmação de isolamento do ambiente remoto

| Verificação | Resultado |
|-------------|-----------|
| Migrations remotas | **Não executadas** |
| Seeds remotos | **Não executados** |
| `supabase db push` remoto | **Não executado** |
| `supabase link` nesta fase | **Não executado** |
| Operações de escrita remota | **Nenhuma** |
| `service_role` remoto para simular clientes | **Não usado** |

**Nota:** `supabase/.temp/linked-project.json` ainda contém ref histórica `bwxhdoxesqtdqwkxrmom` — tratar como **armadilha operacional**.

**Confirmação técnica de destino:** `scripts/phase5-isolation-guards.mjs` → rejeita sempre o ref protegido; aceita **local** ou cloud **somente** se `PHASE5_SANDBOX_PROJECT_REF` coincidir com a URL.

---

## 4. Migrations (preparação)

| Aspeco | Detalhe |
|--------|---------|
| Ficheiros em `supabase/migrations/` | **26** (001–026, uma única 023 canónica) |
| 023 canónica | `023_phase2_harness_persistent_tracking.sql` |
| 023 arquivadas | `migrations_archive/023_*_v2.5.sql`, `*_v2.6.sql` (evita reset triplo) |
| Aplicação local | **Pendente** — `npx supabase db reset` após `supabase start` |
| Histórico remoto incompleto (025–026 only) | Documentado nas fases 3–5; **não reparado** no remoto |

---

## 5. Dados sintéticos (preparação)

Script criado: `scripts/seed-client-multi-tenant.mjs`

| Entidade | Empresa A | Empresa B |
|----------|-----------|-----------|
| Nome | Artecium Test Company A | Artecium Test Company B |
| `tax_id` | ISO-TEST-A-0001 | ISO-TEST-B-0001 |
| Utilizador | `client-a@multitenant-test.local` | `client-b@multitenant-test.local` |
| Papel | `client` | `client` |

Inclui: `company_users`, `projects`, `client_subscriptions`, `payments`, `invoices`, `documents`, `tickets`, `notifications` (idempotente, marcador `artecium-client-iso-v1`).

**Execução:** **NOT RUN** (sem API local). Contexto esperado: `docs/audit/phase5-seed-context.json`.

---

## 6. Matriz de testes (desenho + estado)

Script: `scripts/supabase-phase5-client-isolation-readonly.mjs`

| Bloco | Cobertura | Tipo |
|-------|-----------|------|
| P5-OWN-* | Leitura própria (9 tabelas × 2 clientes) | Prático |
| P5-CROSS-* | Leitura `company_id` / `id` da outra empresa | Prático |
| P5-DIRECT-ID-* | Acesso por UUID conhecido | Prático |
| P5-WRITE-* | INSERT/UPDATE cruzados (projetos, tickets, `company_users`) | Prático (local) |
| P5-STATIC-* | RLS notifications | Estático |

---

## 7. Resultados PASS / FAIL / NOT TESTED

| Classificação | Contagem |
|---------------|----------|
| PASS | 0 |
| FAIL | 0 |
| NOT TESTED | **Matriz completa** (bloqueio Docker) |

Evidências: `docs/audit/phase5-client-isolation-results.json` (placeholder `blocked_prerequisites`).

---

## 8. Problemas encontrados

1. **Docker Desktop ausente** — bloqueia Opção A nesta máquina.
2. **Nenhuma falha RLS demonstrada** — testes práticos não correram.

---

## 9. Riscos

Ver `docs/audit/PHASE5_SECURITY_FINDINGS.md`.

---

## 10. Recomendações

### Opção B (preferida neste ambiente)

1. Criar projeto Supabase sandbox (dados descartáveis) — ver runbook.
2. `npx supabase@2 link --project-ref <sandbox>` + `db push` **somente** no sandbox.
3. Configurar `.env.client-isolation.local` com `PHASE5_SANDBOX_PROJECT_REF`.
4. `npm run db:seed:client-multi-tenant` e `npm run test:phase5-client-isolation`.

### Opção A (se Docker disponível)

1. Instalar [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (WSL2).
2. Executar:

```powershell
cd C:\Users\rodri\Documents\Artecium\artecium-website
npx supabase@2 start
npx supabase@2 db reset
copy .env.client-isolation.local.example .env.client-isolation.local
# preencher keys: npx supabase@2 status
$env:PHASE5_RUN_FULL='1'
node scripts/phase5-run-local-pipeline.mjs
```

Ou manual:

```powershell
$env:PHASE5_CLIENT_ISOLATION='1'
npm run db:seed:client-multi-tenant
npm run test:phase5-client-isolation
```

3. Actualizar este relatório com contagens reais e conclusão go/no-go cliente.

---

## 11. Conclusão sobre maturidade do isolamento cliente

**Inconclusiva nesta corrida.** O desenho e os scripts estão prontos; **falta evidência prática** A↔B.

**Booking (Fase 4):** validado no remoto de teste.  
**Cliente multi-empresa:** validar após sandbox cloud **ou** pipeline local com Docker.

---

## 12. Verificação final obrigatória

| Ponto | Confirmado? |
|-------|-------------|
| BD remota `bwxhdoxesqtdqwkxrmom` não alterada | **Sim** |
| Sem migrations remotas | **Sim** |
| Sem seeds remotos | **Sim** |
| Sem deploy | **Sim** |
| Dados criados só no local | **N/A** — nenhum dado criado (local não arrancou) |
| Testes com JWT independentes | **Pendente** |
| Distinguir prático vs estático | **Sim** (campo `kind` nos casos) |

---

## Artefactos Fase 5.1

| Ficheiro |
|----------|
| `scripts/phase5-isolation-guards.mjs` |
| `docs/audit/PHASE5_SANDBOX_RUNBOOK.md` |
| `scripts/seed-client-multi-tenant.mjs` |
| `scripts/supabase-phase5-client-isolation-readonly.mjs` |
| `scripts/phase5-run-local-pipeline.mjs` |
| `.env.client-isolation.local.example` |
| `docs/audit/PHASE5_LOCAL_ENVIRONMENT_REPORT.md` |
| `docs/audit/PHASE5_SECURITY_FINDINGS.md` |
| `docs/audit/phase5-client-isolation-results.json` |