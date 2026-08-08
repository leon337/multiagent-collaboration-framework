# PHASE-006-C2 — Decisões da remediação pós-write

## D1 — Aceitar o P1 como bloqueante

**Entrada:** revisão independente do HEAD `edaef62866aa1ff0af2985bfad20d1fe640c36cd`.

**Decisão:** `REMEDIATION_REQUIRED`. O PR #80 permanece draft e sem merge.

## D2 — Separar falhas pré-write e pós-write

`adapter.execute()` e `ledger.recordExecuted()` não podem compartilhar um catch que converta ambos em `FAILED`.

Quando o adapter já retornou receipt, uma falha posterior de persistência é `UNKNOWN`, não `FAILED`.

## D3 — Criar fronteira durável antes da mutação C2

O adapter `github-pr-collaboration-write-v1` persiste `EXECUTING` antes de poder iniciar mutação externa.

Se essa persistência falhar, o adapter não é chamado.

## D4 — Preservar binding na ambiguidade

`PARTIAL`, falha de `recordExecuted()` após receipt e expiração de `EXECUTING` usam semântica `UNKNOWN`. O binding não pode ser liberado por retry automático.

## D5 — Preservar recuperação pré-write

Falha definitivamente não aplicada continua em `FAILED`, permitindo a recuperação prevista para falha pré-write.

## D6 — Limitar impacto da nova barreira

Após a primeira rodada de testes revelar regressão de compatibilidade, a barreira `EXECUTING` foi limitada ao adapter C2 mutante. Adapters anteriores somente-leitura mantêm seu fluxo original.

## D7 — Migration 0027

A migration `0027_mcf_external_action_unknown_state.sql` formaliza `EXECUTING` e `UNKNOWN` e atualiza o índice de lease/trigger compatível com a nova máquina de estados.

## D8 — Provider real continua proibido

Nenhuma prova de escrita GitHub real foi realizada. `real_github_write_test=NOT_AUTHORIZED` e `production=BLOCKED` permanecem vigentes.

## D9 — Não reescrever o PRF de conformidade

O pacote `PHASE-006-C2-CONFORMANCE-RECOVERY` documenta uma fase anterior e permanece histórico. Esta remediação posterior recebe PRF próprio.

## D10 — Gate final

A implementação em `3fede0da1e5d50b2a339b5c2dc88bd5036753b6e` está tecnicamente verde, mas a fase só poderá avançar após:

1. CI do commit documental final;
2. revisão independente no HEAD final exato;
3. decisão de Léo.
