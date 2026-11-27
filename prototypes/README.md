# Artecium Lab

Protótipos isolados em `/prototypes` no site (rotas `src/app/prototypes/*`).

## Arranque

1. Copiar `.env.prototype.local.example` → `.env.prototype.local`
2. `npm run dev:prototype` (usa `scripts/run-lab-dev.mjs` e sobrepõe credenciais remotas)
3. Abrir http://localhost:3000/prototypes

Se `ARTECIUM_RUNTIME=prototype` com Supabase de produção no ambiente, o Lab mostra um ecrã de erro em vez de abrir rotas inseguras.

Staging: `.env.staging.local` a partir de `.env.staging.local.example` → `npm run dev:staging`

## Novo protótipo

1. Adicionar entrada em `prototypes/registry.ts`
2. Criar `src/app/prototypes/<slug>/page.tsx`
3. Dados mock em `prototypes/<slug>/`
4. Validar: `npm run verify:lab-guards`

**Nota:** rotas do Lab retornam 404 em builds de produção (`NODE_ENV=production`).