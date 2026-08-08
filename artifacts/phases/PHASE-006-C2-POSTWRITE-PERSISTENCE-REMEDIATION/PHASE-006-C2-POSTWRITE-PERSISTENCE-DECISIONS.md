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
Comment e review exigem os fragmentos canônicos derivados do `mutationExternalId`; metadata exige a URL exata do PR.

## D7 — Fragmentos são case-sensitive
A tolerância de casing do repositório não pode atingir o fragmento. `mutationUrl.hash` deve ser exatamente:
- `#issuecomment-${mutationExternalId}`; ou
- `#pullrequestreview-${mutationExternalId}`.

## D8 — Regressões dedicadas
`github-pr-collaboration.evidence-url-binding.test.ts` cobre 5 casos, incluindo fragmentos em maiúsculas rejeitados.

## D9 — Evidência da rodada 5
HEAD `2323f7f0a0ea8900451313facbaa17c2bf35a4f1`:
- três workflows PASS;
- 88/88 arquivos e 363/363 testes server PASS;
- build PASS;
- regressões evidence-url-binding 5/5 PASS;
- artifact `9026344880`, digest `sha256:3823b747b9829b001e2f16cd38934d0cadf756e535c77ca18a310b4187c90bf7`.

## D10 — Gate
Real provider write, production e merge permanecem bloqueados. O próximo HEAD deve passar CI e revisão independente exata com zero P0/P1/P2 novos antes da decisão de Léo.
