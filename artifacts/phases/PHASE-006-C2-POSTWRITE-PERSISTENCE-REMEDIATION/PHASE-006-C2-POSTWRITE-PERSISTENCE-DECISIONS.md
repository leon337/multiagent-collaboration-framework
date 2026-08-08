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
A tolerância de casing do repositório não pode atingir o fragmento.

## D8 — Regressões dedicadas de URL
`github-pr-collaboration.evidence-url-binding.test.ts` cobre 5 casos, incluindo IDs divergentes e fragmentos em maiúsculas rejeitados.

## D9 — Evidência da rodada 5
HEAD `2323f7f0a0ea8900451313facbaa17c2bf35a4f1`: três workflows PASS; 88/88 arquivos e 363/363 testes server PASS; artifact `9026344880`.

## D10 — Metadata evidence deve validar o patch atual
Ao menos um campo deve estar presente; título e body devem respeitar as mesmas regras do adapter; `body: ""` continua válido.

## D11 — Regressões dedicadas de metadata
`github-pr-collaboration.evidence-metadata-input.test.ts` cobre 6 casos.

## D12 — Evidência da rodada 6
HEAD `43961f78eadac6f33ddd96dbaf23df0f3f6e1d5d`: três workflows PASS; 89/89 arquivos e 369/369 testes server PASS; artifact `9027160954`.

## D13 — UNKNOWN só pode ser devolvido após persistência durável
A revisão `PRR_kwDOTnz-ks8AAAABI3JczA` encontrou P1 no thread `PRRT_kwDOTnz-ks6XgjKS`: o dispatcher podia retornar `UNKNOWN` mesmo se `recordUnknown` falhasse.

## D14 — Retry local de UNKNOWN não reexecuta o provider
`recordUnknown` pode ser repetido localmente até 3 vezes. `adapter.execute` não participa desse retry e permanece no máximo uma vez por dispatch.

## D15 — Falha persistente de UNKNOWN é fail-closed
Se a transição `UNKNOWN` não puder ser persistida, o dispatcher lança `LEDGER_FAILURE` não-retryable. Ele não devolve `UNKNOWN`, não converte pós-write para `FAILED` e preserva a reserva para reconciliação.

## D16 — Evidência da rodada 7
HEAD funcional formatado `dbd949aacc99911db0cbc7e7dab30cf92a91d560`:
- Documentation `31277467325`, Container Smoke `31277467328` e Foundation `31277467360` PASS;
- format, lint, typecheck, migrations duas vezes e build PASS;
- 89/89 arquivos e 374/374 testes server PASS;
- 9/9 regressões postwrite persistence PASS;
- artifact `9027431031`, digest `sha256:e5d12a743445ed83006306fd9748b667be4ce4d3ca083438d82072d2749e1d8f`.

## D17 — Gate
Real provider write, produção e merge permanecem bloqueados. O próximo HEAD documental deve passar CI e revisão independente exata com zero P0/P1/P2 ativos antes da decisão de LÉO.
