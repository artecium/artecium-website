# Phase 5.1 — Security findings (client multi-tenant)

**Status:** execução prática **bloqueada** (Docker indisponível nesta máquina).  
**Remote `bwxhdoxesqtdqwkxrmom`:** **não alterado** (sem migrations, seeds, DML remoto).

## Problemas bloqueantes de execução

| ID | Severidade | Descrição | Impacto |
|----|------------|-----------|---------|
| P5-ENV-01 | **Operacional** | Docker/Podman ausente do PATH | Impossível `supabase start` → sem testes práticos nesta corrida |
| P5-ENV-02 | **Operacional** | `supabase/.temp/linked-project.json` ainda aponta para ref remota | Risco humano de `db push` remoto — **não executado** nesta fase |

## Alterações no repositório (não são vulnerabilidades)

| Alteração | Justificação |
|-----------|--------------|
| `023` v2.5/v2.6 → `supabase/migrations_archive/` | Evitar tripla aplicação em `db reset` local; canónica mantida em `migrations/` |
| `supabase/config.toml` via `supabase init` | Configuração local Supabase (porta 54321) |

## Achados de segurança da aplicação

*Nenhum FAIL prático* — testes de isolamento cliente **não correram**.

### Análise estática prévia (herdada Fase 4 + RLS inventory)

| Área | Avaliação | Evidência |
|------|-----------|-----------|
| Leitura cross-company | **Provável OK** | Políticas `company_id IN (user_company_ids())` em payments, invoices, projects, tickets |
| Notificações | **Provável OK** | `user_id = auth.uid()` |
| Escrita cross-company | **Provável OK** | `WITH CHECK` em tickets; inserts project-scoped |
| membership hijack | **Investigar** | Teste prático `P5-WRITE-INSERT-company_users-B` planeado — **NOT RUN** |

Quando o ambiente local existir, **qualquer FAIL** nos scripts `supabase-phase5-client-isolation-readonly.mjs` deve ser registado aqui numa actualização.

## Correções propostas (não aplicadas)

1. Instalar Docker Desktop; re-executar pipeline.
2. Optional: script que **falha** se `supabase link` + `db push` detectar ref `bwxhdoxesqtdqwkxrmom` sem flag explícita.
3. Após PASS local, replicar seed sandbox cloud **opcional** para CI.

---

*Atualizar este ficheiro após corrida com `summary.FAIL > 0` ou falhas confirmadas.*