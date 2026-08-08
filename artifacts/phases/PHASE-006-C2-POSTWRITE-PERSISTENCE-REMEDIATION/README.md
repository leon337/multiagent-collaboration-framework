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
latest_reviewed_head: 90bed0814f62fc3bfcf1875f626241e007ff031d
latest_review_id: PRR_kwDOTnz-ks8AAAABI2_6VA
latest_review_verdict: FAIL_P2_METADATA_EVIDENCE_INVALID_TEXT_PATCH
latest_review_thread: PRRT_kwDOTnz-ks6XgJb2
round_6_implementation:
  head: 43961f78eadac6f33ddd96dbaf23df0f3f6e1d5d
  ci: PASS
  server_test_files: 89_PASS
  server_tests: 369_PASS
  evidence_url_binding_regressions: 5_PASS
  evidence_metadata_input_regressions: 6_PASS
current_gate:
  checkpoint_head: SELF
  resolution: GIT_COMMIT_CONTAINING_CHECKPOINT
  ci_source: GITHUB_ACTIONS_FOR_SAME_SHA
  review_source: CODEX_REVIEW_FOR_SAME_SHA
real_provider_write: NOT_AUTHORIZED
production: BLOCKED
```

## Próximo gate

Resolver `SELF` para o Git HEAD que contém este pacote → validar os três workflows nesse SHA → revisão independente nesse SHA → decisão de Léo.
