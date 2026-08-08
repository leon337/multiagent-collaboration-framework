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

## D10 — Gate de auditoria funcional

A implementação `3fede0da1e5d50b2a339b5c2dc88bd5036753b6e` passou CI completa. O candidato documental `74fd45a57067eab5d0a61bfc91d1869249eee262` também passou CI completa, mas a revisão independente `PRR_kwDOTnz-ks8AAAABI2lSrg` retornou `FAIL` por P2 de proveniência do checkpoint.

## D11 — Eliminar autorreferência estática do checkpoint

Não será gravado no checkpoint um SHA “final” ou IDs de workflows que só passam a existir depois que o próprio commit é criado. Isso gera uma cadeia autorreferente em que toda atualização de proveniência muda o HEAD.

O checkpoint passa a usar:

- `checkpoint_head: SELF`;
- `SELF = Git commit que contém o checkpoint`;
- PR HEAD deve ser exatamente esse commit no gate;
- CI é consultada no GitHub Actions para esse mesmo SHA;
- revisão independente deve declarar esse mesmo SHA;
- nenhum P0/P1 novo é aceito.

O snapshot `74fd45a...` permanece como evidência histórica auditada, com CI PASS e review FAIL/P2.

## D12 — Próxima decisão

Após CI e revisão independente do novo HEAD self-bound, Léo aplica o gate. Merge, provider real e produção permanecem bloqueados até essa decisão.
