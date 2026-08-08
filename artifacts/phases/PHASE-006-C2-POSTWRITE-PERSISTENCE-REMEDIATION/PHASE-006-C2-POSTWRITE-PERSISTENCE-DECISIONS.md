# PHASE-006-C2 — Decisões da remediação pós-write

## D1 — Falha pós-write não é FAILED

Após receipt do adapter, erro de persistência local é `UNKNOWN`, nunca `FAILED`.

## D2 — Fronteira EXECUTING e recuperação

O adapter C2 persiste `EXECUTING` antes da mutação. `EXECUTING` expirado vira `UNKNOWN` com binding preservado.

## D3 — UNKNOWN deve ser persistível

A missão/fase pode entrar em `RECOVERING` a partir de attempt `UNKNOWN`; o ponteiro ativo é limpo sem liberar o binding global.

## D4 — Tombstone de fingerprint pré-write

`FAILED` preserva scope+fingerprint. Retry compatível pode substituir o tombstone no BEFORE INSERT; payload incompatível permanece bloqueado.

## D5 — Proveniência self-bound

`SELF` significa o Git commit contendo o checkpoint. CI e revisão independente são avaliadas externamente nesse mesmo SHA.

## D6 — Revisões de URL em duas fronteiras

A validação de URL não pode existir apenas no adapter. Tanto o read-back do adapter quanto o validador de receipt externo devem vincular o ID da mutação à URL canônica.

## D7 — Vincular receipts externos ao mutationExternalId

`verifyGitHubPrCollaborationEvidence()` exige:

- comment: `#issuecomment-${mutationExternalId}`;
- review: `#pullrequestreview-${mutationExternalId}`;
- metadata: URL exata do PR.

## D8 — Regressões dedicadas

`github-pr-collaboration.evidence-url-binding.test.ts` cobre 3 casos e rejeita fragmentos divergentes para comment e review.

## D9 — Evidência da rodada 4

HEAD `527a6e5d65cfea03a55f625cd28d84cdc641db62`:
- três workflows PASS;
- 88/88 arquivos e 361/361 testes server PASS;
- build PASS;
- regressões evidence-url-binding 3/3 PASS;
- artifact `9026128255`, digest `sha256:b3172d23577b2b8fb72fa8328741bd6c7ca826163145dc8264aabe321279e4a3`.

## D10 — Gate

Real provider write, production e merge permanecem bloqueados. O próximo HEAD deve passar CI e revisão independente exata com zero P0/P1/P2 novos antes da decisão de Léo.
