# Phase 5.1 — Runbook Supabase Cloud Sandbox (sem Docker)

**Objetivo:** correr seed + testes de isolamento multi-tenant (Área de Cliente) **sem** tocar no projeto protegido `bwxhdoxesqtdqwkxrmom`.

**Pré-requisitos:** conta Supabase, organização com permissão para criar projeto, ~15 min, disco mínimo (sem Docker).

---

## 1. Princípios de segurança

| Regra | Implementação |
|-------|----------------|
| Nunca usar ref protegida | `scripts/phase5-isolation-guards.mjs` bloqueia `bwxhdoxesqtdqwkxrmom` |
| Sandbox dedicado | Novo projeto; credenciais só em `.env.client-isolation.local` (gitignored) |
| Escrita remota | **Apenas** no ref sandbox declarado em `PHASE5_SANDBOX_PROJECT_REF` |
| Confirmação dupla | URL `https://<ref>.supabase.co` deve igualar `PHASE5_SANDBOX_PROJECT_REF` |

---

## 2. Criar projeto sandbox (manual)

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project** (nome sugerido: `artecium-phase5-sandbox`).
2. Guardar: **Project ref** (20 caracteres), **database password**, **anon** e **service_role** keys.
3. **Não** importar dados do projeto de produção/integração.

Alternativa CLI (se tiver `SUPABASE_ACCESS_TOKEN`):

```bash
npx supabase@2 projects create artecium-phase5-sandbox --org-id <SUA_ORG_ID> --db-password "<SENHA_FORTE>" --region eu-west-1
```

---

## 3. Configurar ambiente local de testes

Copiar `.env.client-isolation.local.example` → `.env.client-isolation.local`:

```env
PHASE5_CLIENT_ISOLATION=1
PHASE5_SANDBOX_PROJECT_REF=<ref-do-sandbox>
NEXT_PUBLIC_SUPABASE_URL=https://<ref-do-sandbox>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service_role — só seed>
```

Carregar antes dos comandos (PowerShell):

```powershell
Get-Content .env.client-isolation.local | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() }
}
```

---

## 4. Aplicar schema no sandbox (migrations 001–026)

**Atenção:** `supabase link` grava ref em `supabase/.temp/`. Antes de `db push`, verificar que o link aponta **só** para o sandbox.

```bash
npx supabase@2 link --project-ref <PHASE5_SANDBOX_PROJECT_REF>
npx supabase@2 db push
```

Checklist pós-push:

- Uma única migração `023` em `supabase/migrations/` (v2.5/v2.6 estão em `migrations_archive/`).
- Dashboard → Database → confirmar tabelas `companies`, `company_users`, RLS ativo.

**Proibido nesta fase:** `db push` / seed com ref `bwxhdoxesqtdqwkxrmom`.

---

## 5. Seed duas empresas fictícias

```bash
node scripts/seed-client-multi-tenant.mjs
```

Saída esperada: `docs/audit/phase5-seed-context.json` (IDs, passwords de teste `@multitenant-test.local`).

Usa `service_role` **apenas** no sandbox para criar auth users; os testes de isolamento usam JWT anon.

---

## 6. Executar matriz de isolamento

```bash
node scripts/supabase-phase5-client-isolation-readonly.mjs
```

Evidência: `docs/audit/phase5-client-isolation-results.json`

Critério de sucesso (alinhado Fase 4):

- **P5-OWN-***: PASS (cada cliente vê só a sua empresa).
- **P5-CROSS-*** / **P5-DIRECT-ID-***: PASS (0 linhas ou 403).
- **P5-WRITE-***: PASS (INSERT/UPDATE cruzados bloqueados).

Atualizar `docs/audit/PHASE5_CLIENT_MULTI_TENANT_REPORT.md` secção 7 com contagens.

---

## 7. Operação segura do `supabase link`

O ficheiro `supabase/.temp/linked-project.json` pode ainda referir o projeto histórico de auditoria.

| Antes de | Ação |
|----------|------|
| `db push` / `db reset --linked` | `cat supabase/.temp/linked-project.json` — ref ≠ protegida |
| Voltar ao dia-a-dia | Não é obrigatório re-linkar o projeto integração; evitar push acidental |

---

## 8. Limpeza (opcional)

Após validação, pode **pausar** ou **apagar** o projeto sandbox no dashboard (dados descartáveis).

Não apagar o projeto protegido sem plano de backup explícito.

---

## 9. Package scripts

| Comando | Uso |
|---------|-----|
| `npm run db:seed:client-multi-tenant` | Seed (requer env + guards) |
| `npm run test:phase5-client-isolation` | Testes JWT |
| `npm run phase5:local-pipeline` | Só com Docker (`supabase start`) |

Para sandbox cloud: passos 4–6 deste runbook (não usar pipeline Docker).