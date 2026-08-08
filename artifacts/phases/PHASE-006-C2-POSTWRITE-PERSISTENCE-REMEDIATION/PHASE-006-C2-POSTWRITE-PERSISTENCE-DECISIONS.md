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

## D8 — Regressões dedicadas de URL
`github-pr-collaboration.evidence-url-binding.test.ts` cobre 5 casos, incluindo IDs divergentes e fragmentos em maiúsculas rejeitados.

## D9 — Evidência da rodada 5
HEAD `2323f7f0a0ea8900451313facbaa17c2bf35a4f1`:
- três workflows PASS;
- 88/88 arquivos e 363/363 testes server PASS;
- build PASS;
- regressões evidence-url-binding 5/5 PASS;
- artifact `9026344880`, digest `sha256:3823b747b9829b001e2f16cd38934d0cadf756e535c77ca18a310b4187c90bf7`.

## D10 — Metadata evidence deve validar o patch atual
A validação independente não pode transformar campos ausentes ou não-string em `null` e aceitar uma receipt sem mutação textual válida. As regras devem espelhar o adapter: ao menos um campo presente, título não vazio/trimado/<=256, body trimado/<=65000 e `body: ""` permitido.

## D11 — Regressões dedicadas de metadata
`github-pr-collaboration.evidence-metadata-input.test.ts` cobre 6 casos e passou 6/6 no HEAD funcional da rodada 6.

## D12 — Evidência da rodada 6
HEAD `43961f78eadac6f33ddd96dbaf23df0f3f6e1d5d`:
- Documentation `31276497591`, Container Smoke `31276497605` e Foundation `31276497601` PASS;
- format, lint, typecheck, migrations duas vezes e build PASS;
- 89/89 arquivos e 369/369 testes server PASS;
- 5/5 regressões evidence-url-binding PASS;
- 6/6 regressões evidence-metadata-input PASS;
- artifact `9027160954`, digest `sha256:87ae7f9d3c9d7f4c73c7f333f0eea490e4ec0451b4a6fde341a6007e709f309a`.

## D13 — Gate
Real provider write, production e merge permanecem bloqueados. O próximo HEAD deve passar CI e revisão independente exata com zero P0/P1/P2 ativos antes da decisão de Léo.
