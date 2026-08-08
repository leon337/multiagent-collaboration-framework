# PHASE-006-C2 — Decisões da remediação pós-write

## D1 — Falha pós-write não é FAILED
Após receipt do adapter, erro de persistência local é `UNKNOWN`, nunca `FAILED`.

## D2 — Fronteira EXECUTING e recuperação
O adapter C2 persiste `EXECUTING` antes da mutação. `EXECUTING` expirado vira `UNKNOWN` com binding preservado.

## D3 — UNKNOWN deve ser persistível
A missão/fase pode entrar em `RECOVERING` a partir de attempt `UNKNOWN`; o ponteiro ativo é limpo sem liberar o binding global.

## D4 — Tombstone de fingerprint pré-write
`FAILED` preserva scope+fingerprint. Retry compatível pode substituir o tombstone; payload incompatível permanece bloqueado.

## D5 — Proveniência self-bound
`SELF` significa o Git commit contendo o checkpoint. CI e revisão independente são avaliadas externamente nesse mesmo SHA.

## D6 — URL de evidência deve vincular ID e tipo
Comment e review exigem fragmentos canônicos derivados do `mutationExternalId`; metadata exige a URL exata do PR.

## D7 — Fragmentos do validador de evidência são case-sensitive
A tolerância de casing do repositório não pode atingir o fragmento.

## D8 — Regressões de evidência
`github-pr-collaboration.evidence-url-binding.test.ts` cobre 5 casos e `github-pr-collaboration.evidence-metadata-input.test.ts` cobre 6 casos.

## D9 — Metadata evidence deve validar o patch atual
Ao menos um campo deve estar presente; título e body respeitam as mesmas regras do adapter; `body: ""` continua válido.

## D10 — UNKNOWN só pode ser devolvido após persistência durável
A revisão `PRR_kwDOTnz-ks8AAAABI3JczA` encontrou P1 no thread `PRRT_kwDOTnz-ks6XgjKS`; a rodada 7 passou a exigir persistência durável antes do retorno `UNKNOWN`.

## D11 — Retry local de UNKNOWN não reexecuta o provider
`recordUnknown` pode ser repetido localmente até 3 vezes. `adapter.execute` não participa desse retry.

## D12 — Falha persistente de UNKNOWN é fail-closed
Se a transição `UNKNOWN` não puder ser persistida, o dispatcher lança `LEDGER_FAILURE` não-retryable, sem pós-write `FAILED`.

## D13 — O adapter deve aplicar a mesma case-sensitivity do validador
A revisão `PRR_kwDOTnz-ks8AAAABI3PZYg` encontrou P2 no thread `PRRT_kwDOTnz-ks6XgvtO`: `assertComment` e `assertReview` ainda comparavam a URL inteira em lowercase.

## D14 — Base e fragmento são validados separadamente
A base esperada do PR continua case-insensitive para preservar compatibilidade de owner/repository; o fragmento é exato e case-sensitive:
- `#issuecomment-${comment.id}`;
- `#pullrequestreview-${review.id}`.

## D15 — Regressão dedicada do adapter
`github-pr-collaboration.adapter-url-fragment-case.test.ts` cobre 4 casos: dois canônicos aceitos e dois fragmentos em maiúsculas rejeitados.

## D16 — Evidência funcional da rodada 8
HEAD `65ed8e1722c3f616ab7f010baaa6dd6b3ea0c1bb`:
- Documentation `31278735695`, Container Smoke `31278735714` e Foundation `31278735727` PASS;
- format, lint, typecheck, migrations duas vezes e build PASS;
- 90/90 arquivos e 378/378 testes server PASS;
- regressão adapter fragment case 4/4 PASS;
- artifact `9027787068`;
- digest `sha256:6732dc654d7ee5c175523abe9dba9b96e400c4c645bcb7fefdc647c92720d4ff`.

## D17 — Gate
Real provider write, produção e merge permanecem bloqueados. O próximo HEAD documental deve passar CI e revisão independente exata com zero P0/P1/P2 ativos antes da decisão de LÉO.
