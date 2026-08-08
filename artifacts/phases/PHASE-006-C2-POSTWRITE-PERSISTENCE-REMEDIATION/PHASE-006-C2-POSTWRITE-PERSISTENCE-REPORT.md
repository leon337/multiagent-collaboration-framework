# PHASE-006-C2 — Relatório de remediação pós-write

## Estado acumulado

O PR #80 permanece em loop de remediação independente. Nenhum gate anterior foi apagado.

### Revisões independentes registradas

- `edaef62866aa1ff0af2985bfad20d1fe640c36cd`: FAIL/P1 — falha de `recordExecuted()` após receipt podia seguir para `recordFailed()` e liberar binding.
- `74fd45a57067eab5d0a61bfc91d1869249eee262`: FAIL/P2 — checkpoint não estava ligado ao próprio HEAD auditado.
- `60f069ee829b03cab93e484ef2782e00333c9377`, review `PRR_kwDOTnz-ks8AAAABI2moFA`: FAIL — `UNKNOWN` não persistível e ausência de tombstone global de fingerprint em falha pré-write.
- `17201725ad137dd3fd53542bd297708679556980`, review `PRR_kwDOTnz-ks8AAAABI2peDw`: FAIL/P2 — `assertReview()` não vinculava `html_url` ao `review.id`.
- `fe227c6cf5e980d8017fb5b27b59de9e44d1a0e3`, review `PRR_kwDOTnz-ks8AAAABI2sLLA`: FAIL/P2 — o validador independente de receipts externos aceitava fragmentos de comment/review divergentes de `mutationExternalId`.

## Remediação da rodada 4

`verifyGitHubPrCollaborationEvidence()` agora exige vínculo exato entre `mutationExternalId` e o fragmento da URL de mutação:

- `comment-pr` → `#issuecomment-${mutationExternalId}`;
- `review-pr-comment` → `#pullrequestreview-${mutationExternalId}`;
- `update-pr-text-metadata` → URL exata do próprio Pull Request.

Assim, receipts assinados com ID e URL divergentes são rejeitados durante validação de evidência, mesmo que tenham sido construídos fora do adapter.

Regressão dedicada:
`github-pr-collaboration.evidence-url-binding.test.ts`.

Ela cobre:
1. comment e review válidos com URL/ID exatos;
2. comment com `mutationExternalId=202` e fragmento `#issuecomment-999`;
3. review com `mutationExternalId=202` e fragmento `#pullrequestreview-999`.

## Implementação validada da rodada 4

HEAD funcional: `527a6e5d65cfea03a55f625cd28d84cdc641db62`.

CI do mesmo SHA:
- Documentation validation `31272787242`: PASS.
- Rede Social Container Smoke `31272787240`: PASS.
- Rede Social Foundation `31272787241`: PASS.
- format, lint, typecheck, migrations duas vezes, testes e build: PASS.
- server test files: 88/88 PASS.
- server tests: 361/361 PASS.
- regressão `evidence-url-binding`: 3/3 PASS.
- artifact `9026128255`.
- digest `sha256:b3172d23577b2b8fb72fa8328741bd6c7ca826163145dc8264aabe321279e4a3`.

## Limites preservados

- real provider write: NOT_AUTHORIZED;
- production: BLOCKED;
- merge: BLOCKED;
- PR permanece draft até gate;
- APPROVE, REQUEST_CHANGES, merge, state/base mutation, force-push e branch protection continuam FORBIDDEN.

## Próximo gate

O commit documental que contém este pacote usa `SELF = Git commit containing checkpoint`.
Os três workflows e a revisão independente devem apontar para esse mesmo SHA. Somente depois cabe decisão de Léo.
