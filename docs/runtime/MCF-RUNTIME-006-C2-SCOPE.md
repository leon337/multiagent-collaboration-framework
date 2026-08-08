# MCF-RUNTIME-006-C2 — Controlled GitHub PR collaboration write

Issue: #79

Base: `cd29bedef1b3ad08d88ecad21a6b66b7c6117ddf`

Este incremento continua o Gate C após C1, sem reexecutar A1, A2 ou C1.

## Operações permitidas

- `comment-pr`: adicionar comentário textual em PR aberto;
- `review-pr-comment`: registrar review exclusivamente informativo com evento GitHub `COMMENT`;
- `update-pr-text-metadata`: alterar somente `title` e/ou `body` do PR.

## Controles obrigatórios

- skill: `MCF-GIT-PR-RELEASE`;
- agente executor: owner autorizado da skill;
- provider: GitHub;
- resource em formato canônico `owner/repository`;
- `authorizedScope=true`;
- PR number positivo;
- HEAD esperado em SHA exato de 40 caracteres;
- idempotency key persistida pelo ledger;
- marcador de idempotência no corpo de comentários/reviews;
- read-back após mutação antes de receipt `SUCCEEDED`;
- receipt assinado e vinculado a mission/phase/version/agent/skill;
- `UNKNOWN` quando uma mutação puder ter ocorrido mas não puder ser reconciliada;
- segredo somente em ambiente protegido.

## Proibido

- `APPROVE`;
- `REQUEST_CHANGES`;
- merge;
- fechar ou reabrir PR;
- alterar base branch;
- alterar `maintainer_can_modify`;
- force push;
- branch protection;
- deletar branch;
- deploy;
- produção;
- usar LEANDRO como executor, agente ou destinatário técnico.

## Limite de provider deste incremento

Nenhuma escrita real GitHub pelo adapter C2 está autorizada neste incremento de implementação. Os caminhos mutáveis devem ser exercitados somente com provider/fetcher injetado em testes. Prova real de provider exige gate separado.

## Critérios de aceite

```yaml
permission_scope: PASS
canonical_repository: PASS
expected_head_sha_verified: PASS
comment_idempotency: PASS
review_comment_only: PASS
approve_forbidden: PASS
request_changes_forbidden: PASS
metadata_title_body_only: PASS
state_base_mutation_forbidden: PASS
read_back_verified: PASS
timeout_unknown_semantics: PASS
receipt_signature: PASS
ledger_persisted: PASS
no_real_provider_write_test: PASS
unit_tests: PASS
integration_tests: PASS
security_review: PASS
production: BLOCKED
```
