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

## D6 — Aceitar revisão de 17201725 como FAIL

A review `PRR_kwDOTnz-ks8AAAABI2peDw` encontrou P2 em `assertReview()`: URL de evidência não estava vinculada ao `review.id`.

## D7 — Vincular review.id à URL canônica

`assertReview()` exige:
`https://github.com/<repository>/pull/<pr>#pullrequestreview-<review.id>`.

A igualdade é feita sobre a URL canônica completa. Body, state `COMMENTED` e `commit_id` continuam obrigatórios.

## D8 — Regressão dedicada

`github-pr-collaboration.review-url-binding.test.ts` injeta `id=202` com URL `#pullrequestreview-999` e exige rejeição antes de qualquer POST.

## D9 — Evidência da rodada 3

HEAD `67aa26331f3621ebb8e9149dbda1340f1828a1f7`:
- três workflows PASS;
- 87/87 arquivos e 358/358 testes server PASS;
- build PASS;
- regressão review-url-binding 1/1 PASS;
- artifact `9024261045`, digest `sha256:c1f50cef818aba69b5230f3263b42e68e1e4448549e950c533377dccd830d4a7`.

## D10 — Gate

Real provider write, production e merge permanecem bloqueados. O próximo HEAD deve passar CI e revisão independente exata com zero P0/P1/P2 novos antes da decisão de Léo.
