# PHASE-006-C2 — Relatório de remediação pós-write

## Estado acumulado

O PR #80 permanece em loop de remediação independente. Nenhum gate anterior foi apagado.

### Revisões independentes registradas

- `edaef62866aa1ff0af2985bfad20d1fe640c36cd`: FAIL/P1 — falha de `recordExecuted()` após receipt podia seguir para `recordFailed()` e liberar binding.
- `74fd45a57067eab5d0a61bfc91d1869249eee262`: FAIL/P2 — checkpoint não estava ligado ao próprio HEAD auditado.
- `60f069ee829b03cab93e484ef2782e00333c9377`, review `PRR_kwDOTnz-ks8AAAABI2moFA`: FAIL — `UNKNOWN` não persistível e ausência de tombstone global de fingerprint em falha pré-write.
- `17201725ad137dd3fd53542bd297708679556980`, review `PRR_kwDOTnz-ks8AAAABI2peDw`: FAIL/P2 — `assertReview()` aceitava qualquer fragmento da URL do PR, sem vincular `html_url` ao `review.id`.

## Remediação da rodada 3

`assertReview()` agora exige a URL canônica exata:

`https://github.com/<owner>/<repo>/pull/<pr>#pullrequestreview-<review.id>`

Além de manter as validações de:
- `review.id` inteiro positivo;
- body exato com marcador de idempotência;
- state `COMMENTED`;
- `commit_id` igual ao HEAD SHA esperado.

Uma resposta com `id=202` e URL `#pullrequestreview-999` é rejeitada antes de qualquer nova mutação.

Regressão dedicada:
`github-pr-collaboration.review-url-binding.test.ts`.

## Implementação validada da rodada 3

HEAD funcional: `67aa26331f3621ebb8e9149dbda1340f1828a1f7`.

CI do mesmo SHA:
- Documentation validation `31266313990`: PASS.
- Rede Social Container Smoke `31266314074`: PASS.
- Rede Social Foundation `31266313994`: PASS.
- format, lint, typecheck, migrations duas vezes, testes e build: PASS.
- server test files: 87/87 PASS.
- server tests: 358/358 PASS.
- regressão `review-url-binding`: 1/1 PASS.
- artifact `9024261045`.
- digest `sha256:c1f50cef818aba69b5230f3263b42e68e1e4448549e950c533377dccd830d4a7`.

## Limites preservados

- real provider write: NOT_AUTHORIZED;
- production: BLOCKED;
- merge: BLOCKED;
- PR permanece draft até gate;
- APPROVE, REQUEST_CHANGES, merge, state/base mutation, force-push e branch protection continuam FORBIDDEN.

## Próximo gate

O commit documental que contém este pacote usa `SELF = Git commit containing checkpoint`.
Os três workflows e a revisão independente devem apontar para esse mesmo SHA. Somente depois cabe decisão de Léo.
