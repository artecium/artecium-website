# Phase 2 harness — prontidão operacional (proposta)

**Estado:** preparação apenas. **Nenhuma ativação** foi feita neste documento nem na execução de encerramento 2025-11-14.

Projeto de teste alvo: `bwxhdoxesqtdqwkxrmom`.

Referência de validação: `docs/booking/PHASE2_HARNESS_V2_6_FINAL_VALIDATION.md`.

---

## Pré-condições

| # | Pré-condição | Estado (2025-11-14) |
|---|--------------|---------------------|
| 1 | Validação local T1–T10 + C1 + T9 | **Cumprida** |
| 2 | Verificadores 114 + 49 PASS | **Cumprida** |
| 3 | Postcheck remoto sem divergências funcionais | **Cumprida** |
| 4 | Guard remoto desarmado | **Cumprida** |
| 5 | `runs` vazio / sem cleanup remoto inesperado | **Cumprida** |
| 6 | Permissões: cleanup só `postgres` | **Cumprida** (amostra postcheck) |
| 7 | Histórico Supabase CLI alinhado ou exceção formal | **Pendente** — `schema_migrations` ausente |
| 8 | Plano de rollback e critérios de abort escritos | **Cumprida** (este doc + runbook) |
| 9 | Aprovação explícita humana antes de cleanup real | **Obrigatória** — não cumprida até decisão |
| 10 | Fixtures dedicadas isoladas do resto do booking | **Pendente** na fase operacional |

---

## Critérios de abort (fail-closed)

Interromper imediatamente se:

- `deployment_guard.cleanup_armed` false quando se espera armado (ou o inverso no encerramento).
- `cleanup_execute` devolve razão inesperada (não documentada no runbook).
- Qualquer DELETE fora do conjunto de fixtures aprovado (`phase2-notes-fixture%` / plano UUID).
- Digest ou snapshot não coincide com aprovação.
- Divergência entre preview e contagens reais pós-abort.

---

## Plano de rollback (alto nível)

1. **Não** repetir `cleanup_execute` no mesmo run após abort — criar novo run ou rever estado em `phase2_harness.runs`.
2. Disarmar guard: `UPDATE phase2_harness.deployment_guard SET cleanup_armed = false, ...`.
3. Restaurar fixtures a partir de seed SQL documentado (apenas projeto de teste).
4. Se cleanup parcial ocorreu (não esperado com v2.6): repor linhas a partir de backup/pg_dump **autorizado** do projeto de teste.
5. Registar `failure_reason` e anexar ao relatório de incidente.

---

## Sequência futura proposta (requer autorização em cada passo)

1. Revisar `PHASE2_HARNESS_V2_6_FINAL_VALIDATION.md` e este checklist.
2. Decidir se executa `supabase migration repair --status applied --remote 023` (opcional administrativo).
3. Confirmar operador e janela de teste no projeto **apenas** `bwxhdoxesqtdqwkxrmom`.
4. Preparar fixtures dedicadas (script local adaptado; **não** partilhar com produção).
5. **Operação separada:** armar guard com operador identificado e `environment_tag` descritivo.
6. `run_start` → tracking → preview → approve (digest gravado).
7. Executar **apenas** cenários de cleanup pré-aprovados (um run de cada vez).
8. Verificar `cleanup_audit_snapshots` e contagens de negócio.
9. Desarmar guard no final da janela (procedimento aprovado).
10. Smoke read-only pós-op: postcheck scripts + confirmação `runs` / fixtures.

**Proibido** sem autorização: armar guard, seeds remotos, `cleanup_execute` em massa, `db push`, repair.

---

## Checklist operacional (copiar para run)

```
[ ] Validação v2.6 lida e aceite
[ ] Project ref = bwxhdoxesqtdqwkxrmom confirmado
[ ] Ligação como postgres confirmada (select current_user)
[ ] deployment_guard.cleanup_armed = false (pré-voo)
[ ] Histórico CLI: decidido (repair / exceção documentada)
[ ] Fixtures planeadas (UUIDs p15–p22 documentados)
[ ] Digest de approve anotado antes de execute
[ ] Autorização escrita para armar guard
[ ] Autorização escrita para cleanup_execute (run_id específico)
[ ] Pós-op: guard desarmado
[ ] Pós-op: postcheck read-only executado
[ ] Relatório de execução arquivado
```

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Histórico CLI ausente confunde futuros `db push` | Repair ou política “catálogo PG é verdade” |
| SQL directo vs CLI timestamps | Não reaplicar 023; usar repair ou aceitar exceção |
| cleanup em projeto errado | `BOOKING_EXPECTED_PROJECT_REF` + guards nos scripts |
| Armamento guard esquecido ligado | Checklist + desarmar obrigatório no fecho |
| Fixture email fora do padrão | Só `phase2-notes-fixture%@artecium.test` |

---

## Próximos passos sugeridos

1. **Decisão humana:** autorizar ou adiar `migration repair` remoto.  
2. **Decisão humana:** janela operacional de harness com operador nomeado.  
3. Manter guard **desarmado** até o passo 5 da sequência futura.

Nenhum passo acima foi executado na validação de encerramento 2025-11-14.