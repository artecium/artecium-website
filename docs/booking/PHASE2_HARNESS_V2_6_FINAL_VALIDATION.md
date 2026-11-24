# Phase 2 harness 023 v2.6 — registo final de validação

**Data desta execução:** 2025-11-14  
**Projeto de teste:** `bwxhdoxesqtdqwkxrmom` (Artecium)  
**Classificação desta sessão:** ver secção 13 (veredicto de encerramento).

---

## 1. Identificação da migration e hashes

| Artefacto | Ficheiro | SHA-256 |
|-----------|----------|---------|
| Migration ativa 023 | `supabase/migrations/023_phase2_harness_persistent_tracking.sql` | `f9baa5724fff726df70a6635971eede93e9be891ae4cba20504ab2a64a6c6e36` |
| Baseline v2.5 (arquivo) | `023_phase2_harness_persistent_tracking_v2.5.sql` | `8d43cde043f14dca974b635001d8209f10387270f85b375c13bda1db83ae3e63` |
| Candidata v2.6 (arquivo) | `023_phase2_harness_persistent_tracking_v2.6.sql` | `f9baa5724fff726df70a6635971eede93e9be891ae4cba20504ab2a64a6c6e36` |
| Migration 022 | `022_booking_professional_rls_scope.sql` | `961bb64ae6c71b3d2d5d419682513c89083d1f06540cf82bc871ae05acf2dd99` |

**Evidência:** `node` SHA-256 sobre ficheiros locais nesta execução. Nenhuma alteração às migrations 022/023.

---

## 2. Estado da migration 022

- **Local:** ficheiro inalterado; hash confere.
- **Remoto:** não foi executado um diff dedicado à migration 022 nesta execução; indicador indirecto: `pg_policies` em `public` com **201** políticas (ligação `postgres` read-only, 2025-11-14).
- **Herdado:** 022 aplicada anteriormente no projeto de teste (não reaplicada).

---

## 3. Arquitetura do harness (resumo)

Schema `phase2_harness`:

- **Tabelas:** `runs`, `run_tracking`, `cleanup_audit_snapshots`, `deployment_guard`.
- **Ciclo de vida:** `run_start` → preparação/teste → `cleanup_preview` / `cleanup_approve` → `cleanup_execute` (com guard).
- **v2.6:** C1 `fixture_customers_incomplete`; segundo digest `digest_mismatch_before_delete` antes de DELETEs; locks em F ⊃ S.
- **Digest:** algoritmo versão **3** (`compute_cleanup_digest`).

---

## 4. Resultado T1–T10 (local)

**Evidência:** `npm run test:booking-phase2-harness-full` (2025-11-14) — embedded PostgreSQL, `scripts/booking-phase2-harness-pg-t1-t10.mjs`.

| ID | Resultado |
|----|-----------|
| T1 | PASS |
| T2 | PASS |
| T3 | PASS |
| T4 | PASS |
| T5 | PASS |
| T6 | PASS |
| T7 | PASS |
| T8 | PASS |
| T9 | PASS (script dedicado; SKIP no runner T1–T10) |
| T10 | PASS |

Detalhe: `docs/booking/PHASE2_HARNESS_PG_TWO_SESSION_TESTS.md`.

---

## 5. C1 isolado

**PASS** — seed 5/6 fixtures, approve válido, execute → `fixture_customers_incomplete`; zero DELETE; aprovação invalidada. Distinto de T2 (delete pós-approve → `snapshot_digest_invalid`).

---

## 6. T9 — nove vetores digest SQL/JS

**Evidência:** `scripts/booking-phase2-harness-digest-sql-parity.mjs` (9/9 `pass: true`).

| Vetor | Golden |
|-------|--------|
| `empty_records` | `e53ae63c1a31adcaf45da945b81dc80f703ea7aec218531d2ed7482489219177` |
| `p16_customer_only` | `e3a2a1c1757ef8c6a3a8dff6baf94046e359c359d312b5ef8e2635f737816b49` |
| `p17_full` | `d38709a5c5be4bd0ec34bf329ace4a53576619a20f3229fe7d76a4b2d26eba25` |
| `p17_note_mutated` | `3b1aaa2163befbb6c369ec88674d0ceafba03c59aefeb2ce766f805a0d0579e0` |
| `unicode_note` | (paridade only) |
| `email_normalization` | (paridade only) |
| `multiple_tracked_customers` | (paridade only) |
| `empty_string_note_ineligible` | (paridade only) |
| `json_escape_special_chars` | (paridade only) |

---

## 7. Verificadores estáticos (local)

| Comando | Resultado (2025-11-14) |
|---------|-------------------------|
| `npm run verify:booking-phase2-persistent-harness` | **114 passed, 0 failed** |
| `npm run verify:booking-phase2-incremental-fixtures` | **49 passed, 0 failed** |

---

## 8. Runner completo (local)

`npm run test:booking-phase2-harness-full` → **PASS** (T1–T10 + C1 + T9 parity + ambos verificadores).

---

## 9. Postcheck remoto (read-only, 2025-11-14)

**Executado nesta sessão** (sem Smart Mode block).

Scripts:

- `scripts/booking-migration-023-postcheck-readonly.mjs`
- `scripts/booking-migration-023-schema-migrations-readonly.mjs`
- `scripts/booking-migration-023-postcheck-supplement-readonly.mjs` (complemento read-only)

| Verificação | Resultado |
|-------------|-----------|
| Project ref | `bwxhdoxesqtdqwkxrmom` |
| `current_user` | `postgres` (ligação read-only configurada) |
| Schema `phase2_harness` | Presente |
| Tabelas | 4 (`runs`, `run_tracking`, `cleanup_audit_snapshots`, `deployment_guard`) |
| Funções | **22** |
| Índices / constraints | Conforme postcheck JSON (PKs, FKs, checks) |
| `cleanup_execute` contém C1 | **true** |
| `cleanup_execute` contém `digest_mismatch_before_delete` | **true** |
| Digest v3 no SQL | **true** |
| `runs` count | **0** |
| `deployment_guard.cleanup_armed` | **false**; `armed_at` / `armed_by` / `environment_tag` **null** |
| Clientes `phase2-notes-fixture%` | **0** (sem fixtures harness remotas) |
| `cleanup_execute` EXECUTE | `postgres`: **true**; `anon` / `authenticated` / `service_role`: **false** |
| `supabase_migrations.schema_migrations` | **Inexistente** na ligação directa; query 023 falha |

**Nota:** confirmação de hash do corpo da função remota vs ficheiro local não foi feita byte-a-byte nesta execução; validação funcional via snippets + testes locais contra o mesmo SQL de repo.

---

## 10. Permissões e segurança

- Funções sensíveis de cleanup **não** expostas a `anon`, `authenticated`, `service_role` (postcheck remoto).
- Harness pensado para operação como `postgres` / SQL Editor autorizado.
- **Herdado:** funções `SECURITY DEFINER` com `search_path` restrito na migration (verificador local 114 asserts).

---

## 11. Deployment guard

Remoto: **desarmado** (evidência 2025-11-14). Nenhum armamento remoto nesta ou na sessão de encerramento.

---

## 12. Divergência histórico CLI

- Apply 023 via **SQL directo**, não `supabase db push`.
- Tabela `supabase_migrations.schema_migrations` **ausente** na sessão `postgres` usada pelos scripts.
- CLI: `npx supabase` **3.1.0**; projeto ligado `bwxhdoxesqtdqwkxrmom` (`supabase/.temp/linked-project.json`).
- Comando **preparado, não executado:**

```bash
supabase link --project-ref bwxhdoxesqtdqwkxrmom
supabase migration repair --status applied --remote 023
```

**Efeito esperado:** marca 023 como aplicada no histórico gerido pela CLI **sem** reexecutar DDL.  
**Riscos:** requer credenciais com permissão de escrita no histórico; confirmar que a versão `023` corresponde ao timestamp/nome local; não usar se existir outra fonte de verdade conflitante.  
**Não afecta** outras migrations se só se passar `023`.

---

## 13. Limitações conhecidas

- Concorrência PG demonstrada em embedded com timings curtos (não stress 24/7).
- Histórico CLI desalinhado até `migration repair` autorizado.
- Postcheck remoto não substitui auditoria formal de cada `pg_get_functiondef` vs git.
- Windows: clusters embedded com `persistent: true`; dirs temp podem permanecer até limpeza OS.

---

## 14. Critérios para fase operacional

Ver `docs/booking/PHASE2_HARNESS_OPERATIONAL_READINESS.md`.

**Cumprido nesta validação técnica:**

- Bateria local integral PASS.
- Postcheck remoto sem divergências funcionais.
- Guard desarmado; runs vazio; sem fixtures harness remotas.

**Pendente de autorização separada:**

- Alinhar histórico CLI (`migration repair`).
- Qualquer armamento de guard, seeds remotos, `cleanup_execute` real.

---

## Linha temporal de evidências

| Tipo | Descrição |
|------|-----------|
| **Local (esta execução)** | Full runner, verifiers, SHA-256, digest 9/9 |
| **Remoto (esta execução)** | Postcheck + supplement + schema_migrations probe |
| **Herdado** | Apply SQL directo inicial, alguns smoke reports anteriores |
| **Não verificado nesta execução** | Diff remoto migration 022 vs ficheiro; contagem exacta grants em todas as 22 funções |