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
- `90bed0814f62fc3bfcf1875f626241e007ff031d`, review `PRR_kwDOTnz-ks8AAAABI2_6VA`: FAIL/P2 — a validação independente de metadata aceitava ausência de patch válido ou campos não-string normalizados para `null` (`PRRT_kwDOTnz-ks6XgJb2`).

## Remediação das rodadas 5 e 6

O validador de evidência mantém tolerância de casing no caminho do repositório, mas exige o fragmento (`URL.hash`) exatamente canônico e case-sensitive:

- `comment-pr` → `#issuecomment-${mutationExternalId}`;
- `review-pr-comment` → `#pullrequestreview-${mutationExternalId}`;
- `update-pr-text-metadata` → URL exata do Pull Request.

A regressão `github-pr-collaboration.evidence-url-binding.test.ts` possui 5 casos, cobrindo bindings válidos, IDs divergentes e fragmentos em maiúsculas rejeitados.

A rodada 6 também alinhou a validação independente de metadata às regras do adapter:

- ao menos `title` ou `body` deve estar realmente presente;
- `title`, quando presente, deve ser string não vazia, trimada e ter no máximo 256 caracteres;
- `body`, quando presente, deve ser string trimada e ter no máximo 65.000 caracteres;
- `body: ""` permanece válido para limpar a descrição;
- valores não-string não são normalizados silenciosamente para `null`.

A regressão `github-pr-collaboration.evidence-metadata-input.test.ts` possui 6 casos e passou integralmente.

## Implementação validada da rodada 6

HEAD funcional: `43961f78eadac6f33ddd96dbaf23df0f3f6e1d5d`.

CI desse SHA:
- Documentation validation `31276497591`: PASS.
- Rede Social Container Smoke `31276497605`: PASS.
- Rede Social Foundation `31276497601`: PASS.
- format, lint, typecheck, migrations duas vezes, testes e build: PASS.
- server test files: 89/89 PASS.
- server tests: 369/369 PASS.
- web tests: 5/5 PASS.
- regressão `evidence-url-binding`: 5/5 PASS.
- regressão `evidence-metadata-input`: 6/6 PASS.
- artifact `9027160954`.
- digest `sha256:87ae7f9d3c9d7f4c73c7f333f0eea490e4ec0451b4a6fde341a6007e709f309a`.

## Limites preservados

- real provider write: NOT_AUTHORIZED;
- production: BLOCKED;
- merge: BLOCKED;
- PR permanece draft até gate;
- APPROVE, REQUEST_CHANGES, merge, state/base mutation, force-push e branch protection continuam FORBIDDEN.

## Próximo gate

O commit documental que contém este pacote usa `SELF = Git commit containing checkpoint`.
Os três workflows e a revisão independente devem apontar para esse mesmo SHA. Somente depois cabe decisão de Léo.
