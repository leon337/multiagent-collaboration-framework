# PHASE-006-C2-POSTWRITE-PERSISTENCE-REMEDIATION

Pacote de Rastreabilidade da Fase para as remediações independentes do PR #80.

## Objetivo

Impedir duplicidade, perda de estado ou evidência incorreta quando o MCF executa colaboração controlada em Pull Requests.

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
latest_reviewed_head: 887e1f808c937c21ef7218217518f44b28226922
latest_review_id: PRR_kwDOTnz-ks8AAAABI3JczA
latest_review_verdict: FAIL_P1_UNKNOWN_NOT_DURABLY_PERSISTED_BEFORE_RETURN
latest_review_thread: PRRT_kwDOTnz-ks6XgjKS
round_7_implementation:
  functional_fix: 473082d7fd0af6f3a058a262adae20326abff960
  formatted_head: dbd949aacc99911db0cbc7e7dab30cf92a91d560
  ci: PASS
  server_test_files: 89_PASS
  server_tests: 374_PASS
  postwrite_persistence_regressions: 9_PASS
current_gate:
  checkpoint_head: SELF
  resolution: GIT_COMMIT_CONTAINING_CHECKPOINT
  ci_source: GITHUB_ACTIONS_FOR_SAME_SHA
  review_source: CODEX_REVIEW_FOR_SAME_SHA
real_provider_write: NOT_AUTHORIZED
production: BLOCKED
```

## Próximo gate

Resolver `SELF` para o Git HEAD que contém este pacote → validar os três workflows nesse SHA → revisão independente nesse SHA → decisão de LÉO.
