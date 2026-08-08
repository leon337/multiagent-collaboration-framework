# PHASE-006-C2 — Relatório de remediação pós-write

## Estado acumulado

O PR #80 permanece em loop de remediação independente. Nenhum gate ou achado anterior foi apagado.

### Revisões independentes registradas

- `edaef62866aa1ff0af2985bfad20d1fe640c36cd`: FAIL/P1 — falha pós-write podia liberar binding.
- `74fd45a57067eab5d0a61bfc91d1869249eee262`: FAIL/P2 — checkpoint sem proveniência do próprio HEAD.
- `60f069ee829b03cab93e484ef2782e00333c9377`, review `PRR_kwDOTnz-ks8AAAABI2moFA`: FAIL — `UNKNOWN` não persistível e tombstone ausente.
- `17201725ad137dd3fd53542bd297708679556980`, review `PRR_kwDOTnz-ks8AAAABI2peDw`: FAIL/P2 — URL de review não vinculada ao `review.id`.
- `fe227c6cf5e980d8017fb5b27b59de9e44d1a0e3`, review `PRR_kwDOTnz-ks8AAAABI2sLLA`: FAIL/P2 — receipt externo aceitava fragmento divergente do `mutationExternalId` (`PRRT_kwDOTnz-ks6XfO9O`).
- `fa2705981bf3438568e13696fe44d0af3dbcf1c8`, review `PRR_kwDOTnz-ks8AAAABI29_-Q`: FAIL/P2 — o fragmento era comparado de forma case-insensitive no validador de evidência (`PRRT_kwDOTnz-ks6XgECQ`).
- `90bed0814f62fc3bfcf1875f626241e007ff031d`, review `PRR_kwDOTnz-ks8AAAABI2_6VA`: FAIL/P2 — metadata evidence aceitava patch textual inválido (`PRRT_kwDOTnz-ks6XgJb2`).
- `887e1f808c937c21ef7218217518f44b28226922`, review `PRR_kwDOTnz-ks8AAAABI3JczA`: FAIL/P1 — dispatcher podia devolver `UNKNOWN` antes da persistência durável (`PRRT_kwDOTnz-ks6XgjKS`).
- `6d35b8ffd21cd183f48e2d5c4abc4d75113b04a4`, review `PRR_kwDOTnz-ks8AAAABI3PZYg`: FAIL/P2 — `assertComment`/`assertReview` ainda aceitavam fragmentos em maiúsculas no adapter (`PRRT_kwDOTnz-ks6XgvtO`).

## Remediação da rodada 8 — fragmento canônico também no adapter

O adapter de colaboração agora separa a URL da mutação em base e fragmento:

- a base continua comparada case-insensitive, preservando a tolerância histórica de casing do owner/repository;
- o fragmento é comparado exatamente e case-sensitive;
- `comment-pr` exige `#issuecomment-${comment.id}`;
- `review-pr-comment` exige `#pullrequestreview-${review.id}`;
- host, protocolo, path, query, credentials e porta continuam presos à URL base esperada;
- o validador independente de receipt mantém a mesma regra canônica.

Foi adicionada a regressão `github-pr-collaboration.adapter-url-fragment-case.test.ts` com 4 casos:
1. comment canônico aceito;
2. `#ISSUECOMMENT-101` rejeitado;
3. review canônico aceito;
4. `#PULLREQUESTREVIEW-202` rejeitado.

## Implementação e validação funcional da rodada 8

- correção funcional: `398ec5c833d54f5db49f6a724568f1b11b3ed267`;
- o primeiro CI desse SHA chegou a formatting/lint PASS, mas typecheck falhou exclusivamente na tipagem do mock do novo teste;
- ajuste de teste: `65ed8e1722c3f616ab7f010baaa6dd6b3ea0c1bb`;
- nenhum comportamento do adapter mudou no segundo commit.

CI funcional final em `65ed8e1722c3f616ab7f010baaa6dd6b3ea0c1bb`:
- Documentation validation `31278735695`: PASS;
- Rede Social Container Smoke `31278735714`: PASS;
- Rede Social Foundation `31278735727`: PASS;
- formatting: PASS;
- lint: PASS;
- typecheck: PASS;
- migrations 0000–0028 em duas passagens: PASS;
- server test files: 90/90 PASS;
- server tests: 378/378 PASS;
- web tests: 5/5 PASS;
- ops tests: 15/15 PASS;
- regressão `adapter-url-fragment-case`: 4/4 PASS;
- regressão `postwrite-persistence`: 9/9 PASS;
- regressão `evidence-url-binding`: 5/5 PASS;
- regressão `evidence-metadata-input`: 6/6 PASS;
- build: PASS;
- artifact `9027787068`;
- digest `sha256:6732dc654d7ee5c175523abe9dba9b96e400c4c645bcb7fefdc647c92720d4ff`.

## Limites preservados

- real provider write: NOT_AUTHORIZED;
- production: BLOCKED;
- merge: BLOCKED até gate;
- APPROVE, REQUEST_CHANGES, merge runtime, state/base mutation, force-push e branch protection continuam FORBIDDEN.

## Próximo gate

O commit documental que contém este pacote usa `SELF = Git commit containing checkpoint`.
Os três workflows e a revisão independente devem apontar para esse mesmo SHA. Somente com `P0=0`, `P1=0`, `P2=0` cabe decisão do agente LÉO.
