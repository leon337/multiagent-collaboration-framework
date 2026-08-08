# PHASE-006-C2-POSTWRITE-PERSISTENCE-REMEDIATION

Pacote de Rastreabilidade da Fase para as remediações independentes do PR #80.

## Objetivo

Impedir duplicidade, perda de estado ou evidência cruzada quando o MCF executa colaboração controlada em Pull Requests.

## Ordem de leitura

1. `PHASE-006-C2-POSTWRITE-PERSISTENCE-PLAN.md`
2. `PHASE-006-C2-POSTWRITE-PERSISTENCE-DECISIONS.md`
3. `PHASE-006-C2-POSTWRITE-PERSISTENCE-REPORT.md`
4. `PHASE-006-C2-POSTWRITE-PERSISTENCE-VALIDATION.txt`
5. `PHASE-006-C2-POSTWRITE-PERSISTENCE-VALIDATION-FULL.txt`
6. `PHASE-006-C2-POSTWRITE-PERSISTENCE-SMOKE.txt`
7. `PHASE-006-C2-POSTWRITE-PERSISTENCE-CHECKPOINT.yaml`
8. `PHASE-006-C2-POSTWRITE-PERSISTENCE-ARTIFACT-MANIFEST.sha256`

## Estado técnico

```yaml
latest_reviewed_head: fe227c6cf5e980d8017fb5b27b59de9e44d1a0e3
latest_review_id: PRR_kwDOTnz-ks8AAAABI2sLLA
latest_review_verdict: FAIL_P2_EXTERNAL_RECEIPT_URL_BINDING
round_4_implementation:
  head: 527a6e5d65cfea03a55f625cd28d84cdc641db62
  ci: PASS
  server_test_files: 88_PASS
  server_tests: 361_PASS
  evidence_url_binding_regressions: 3_PASS
current_gate:
  checkpoint_head: SELF
  resolution: GIT_COMMIT_CONTAINING_CHECKPOINT
  ci_source: GITHUB_ACTIONS_FOR_SAME_SHA
  review_source: CODEX_REVIEW_FOR_SAME_SHA
real_provider_write: NOT_AUTHORIZED
production: BLOCKED
```

## Relação com fases anteriores

`PHASE-006-C2-CONFORMANCE-RECOVERY` permanece histórico. Este pacote registra todas as remediações posteriores encontradas pelas revisões independentes.

## Próximo gate

Resolver `SELF` para o Git HEAD que contém este pacote → validar os três workflows nesse SHA → revisão independente nesse SHA → decisão de Léo.
