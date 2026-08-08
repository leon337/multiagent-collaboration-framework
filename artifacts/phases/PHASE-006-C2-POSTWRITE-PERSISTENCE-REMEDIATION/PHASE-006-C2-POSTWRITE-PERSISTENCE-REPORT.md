# PHASE-006-C2 — Relatório de remediação pós-write

## Estado acumulado

O PR #80 permanece em loop de remediação independente. Nenhum gate anterior foi apagado.

### Revisões independentes registradas

- `edaef62866aa1ff0af2985bfad20d1fe640c36cd`: FAIL/P1 — falha pós-write podia liberar binding.
- `74fd45a57067eab5d0a61bfc91d1869249eee262`: FAIL/P2 — checkpoint sem proveniência do próprio HEAD.
- `60f069ee829b03cab93e484ef2782e00333c9377`, review `PRR_kwDOTnz-ks8AAAABI2moFA`: FAIL — `UNKNOWN` não persistível e tombstone ausente.
- `17201725ad137dd3fd53542bd297708679556980`, review `PRR_kwDOTnz-ks8AAAABI2peDw`: FAIL/P2 — URL de review não vinculada ao `review.id`.
- `fe227c6cf5e980d8017fb5b27b59de9e44d1a0e3`, review `PRR_kwDOTnz-ks8AAAABI2sLLA`: FAIL/P2 — receipt externo aceitava fragmento divergente do `mutationExternalId` (`PRRT_kwDOTnz-ks6XfO9O`).
- `fa2705981bf3438568e13696fe44d0af3dbcf1c8`, review `PRR_kwDOTnz-ks8AAAABI29_-Q`: FAIL/P2 — o fragmento era comparado de forma case-insensitive (`PRRT_kwDOTnz-ks6XgECQ`).
- `90bed0814f62fc3bfcf1875f626241e007ff031d`, review `PRR_kwDOTnz-ks8AAAABI2_6VA`: FAIL/P2 — metadata evidence aceitava patch textual inválido (`PRRT_kwDOTnz-ks6XgJb2`).
- `887e1f808c937c21ef7218217518f44b28226922`, review `PRR_kwDOTnz-ks8AAAABI3JczA`: FAIL/P1 — dispatcher podia retornar `UNKNOWN` sem a transição `UNKNOWN` estar duravelmente persistida (`PRRT_kwDOTnz-ks6XgjKS`).

## Remediações preservadas

O validador independente continua exigindo:
- `comment-pr` → `#issuecomment-${mutationExternalId}`;
- `review-pr-comment` → `#pullrequestreview-${mutationExternalId}`;
- `update-pr-text-metadata` → URL exata do Pull Request;
- fragmento canônico case-sensitive;
- patch de metadata com ao menos `title` ou `body` válido;
- `body: ""` válido para limpeza;
- valores não-string rejeitados.

## Remediação da rodada 7 — P1 de UNKNOWN não durável

O dispatcher agora só devolve `UNKNOWN` depois que `ledger.recordUnknown(...)` confirma a persistência.

- retry local limitado: até 3 tentativas somente de `recordUnknown`;
- o adapter externo não é reexecutado durante esse retry;
- falha não-retryable encerra imediatamente;
- se `UNKNOWN` continuar sem persistência durável, o dispatcher lança `LEDGER_FAILURE` fail-closed com `retryable: false`;
- nesse caso não há retorno `UNKNOWN`, não há `FAILED` pós-write e a reserva permanece bloqueando reexecução até reconciliação;
- o caminho pre-write `FAILED` permanece inalterado.

A regressão `external-action-dispatcher.postwrite-persistence.test.ts` passou com 9/9 casos.

## Validação funcional da rodada 7

Correção funcional: `473082d7fd0af6f3a058a262adae20326abff960`.
Esse SHA teve Documentation `31277318116` PASS e Container Smoke `31277318146` PASS, mas Foundation `31277318139` FAIL somente em formatting.

HEAD funcional formatado: `dbd949aacc99911db0cbc7e7dab30cf92a91d560`.

CI desse SHA:
- Documentation validation `31277467325`: PASS.
- Rede Social Container Smoke `31277467328`: PASS.
- Rede Social Foundation `31277467360`: PASS.
- format, lint, typecheck, migrations duas vezes, testes e build: PASS.
- server test files: 89/89 PASS.
- server tests: 374/374 PASS.
- web tests: 5/5 PASS.
- ops tests: 15/15 PASS.
- regressão `external-action-dispatcher.postwrite-persistence`: 9/9 PASS.
- regressão `evidence-url-binding`: 5/5 PASS.
- regressão `evidence-metadata-input`: 6/6 PASS.
- artifact `9027431031`.
- digest `sha256:e5d12a743445ed83006306fd9748b667be4ce4d3ca083438d82072d2749e1d8f`.

## Limites preservados

- real provider write: NOT_AUTHORIZED;
- production: BLOCKED;
- merge: BLOCKED até gate;
- APPROVE, REQUEST_CHANGES, merge runtime, state/base mutation, force-push e branch protection continuam FORBIDDEN.

## Próximo gate

O commit documental que contém este pacote usa `SELF = Git commit containing checkpoint`.
Os três workflows e a revisão independente devem apontar para esse mesmo SHA. Somente depois cabe decisão de LÉO.
