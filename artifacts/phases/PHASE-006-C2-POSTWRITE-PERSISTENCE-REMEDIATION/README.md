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
latest_reviewed_head: 6d35b8ffd21cd183f48e2d5c4abc4d75113b04a4
latest_review_id: PRR_kwDOTnz-ks8AAAABI3PZYg
latest_review_verdict: FAIL_P2_ADAPTER_MUTATION_FRAGMENT_CASE_INSENSITIVE
latest_review_thread: PRRT_kwDOTnz-ks6XgvtO
round_8_implementation:
  adapter_fix: 398ec5c833d54f5db49f6a724568f1b11b3ed267
  functional_head: 65ed8e1722c3f616ab7f010baaa6dd6b3ea0c1bb
  ci: PASS
  server_test_files: 90_PASS
  server_tests: 378_PASS
  adapter_fragment_case_regressions: 4_PASS
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
