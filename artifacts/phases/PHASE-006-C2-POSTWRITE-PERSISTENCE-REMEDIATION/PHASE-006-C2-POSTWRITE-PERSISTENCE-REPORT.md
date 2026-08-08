# PHASE-006-C2 — Relatório de remediação pós-write

## Estado acumulado

O PR #80 permanece em loop de remediação independente. Nenhum gate anterior foi apagado.

### Revisões independentes registradas

- `edaef62866aa1ff0af2985bfad20d1fe640c36cd`: FAIL/P1 — falha pós-write podia liberar binding.
- `74fd45a57067eab5d0a61bfc91d1869249eee262`: FAIL/P2 — checkpoint sem proveniência do próprio HEAD.
- `60f069ee829b03cab93e484ef2782e00333c9377`, review `PRR_kwDOTnz-ks8AAAABI2moFA`: FAIL — `UNKNOWN` não persistível e tombstone ausente.
- `17201725ad137dd3fd53542bd297708679556980`, review `PRR_kwDOTnz-ks8AAAABI2peDw`: FAIL/P2 — URL de review não vinculada ao `review.id`.
- `fe227c6cf5e980d8017fb5b27b59de9e44d1a0e3`, review `PRR_kwDOTnz-ks8AAAABI2sLLA`: FAIL/P2 — receipt externo aceitava fragmento divergente do `mutationExternalId`.
- `fa2705981bf3438568e13696fe44d0af3dbcf1c8`, review `PRR_kwDOTnz-ks8AAAABI29_-Q`: FAIL/P2 — o fragmento era comparado de forma case-insensitive.

## Remediação da rodada 5

O validador de evidência mantém tolerância de casing no caminho do repositório, mas exige o fragmento (`URL.hash`) exatamente canônico e case-sensitive:

- `comment-pr` → `#issuecomment-${mutationExternalId}`;
- `review-pr-comment` → `#pullrequestreview-${mutationExternalId}`;
- `update-pr-text-metadata` → URL exata do Pull Request.

A regressão `github-pr-collaboration.evidence-url-binding.test.ts` possui 5 casos:
1. comment/review canônicos válidos;
2. ID divergente em issue-comment rejeitado;
3. ID divergente em review rejeitado;
4. `#ISSUECOMMENT-${id}` rejeitado;
5. `#PULLREQUESTREVIEW-${id}` rejeitado.

## Implementação validada da rodada 5

HEAD funcional: `2323f7f0a0ea8900451313facbaa17c2bf35a4f1`.

CI desse SHA:
- Documentation validation `31273552368`: PASS.
- Rede Social Container Smoke `31273552168`: PASS.
- Rede Social Foundation `31273552189`: PASS.
- format, lint, typecheck, migrations duas vezes, testes e build: PASS.
- server test files: 88/88 PASS.
- server tests: 363/363 PASS.
- regressão `evidence-url-binding`: 5/5 PASS.
- artifact `9026344880`.
- digest `sha256:3823b747b9829b001e2f16cd38934d0cadf756e535c77ca18a310b4187c90bf7`.

## Limites preservados

- real provider write: NOT_AUTHORIZED;
- production: BLOCKED;
- merge: BLOCKED;
- PR permanece draft até gate;
- APPROVE, REQUEST_CHANGES, merge, state/base mutation, force-push e branch protection continuam FORBIDDEN.

## Próximo gate

O commit documental que contém este pacote usa `SELF = Git commit containing checkpoint`.
Os três workflows e a revisão independente devem apontar para esse mesmo SHA. Somente depois cabe decisão de Léo.
