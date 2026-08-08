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
latest_reviewed_head: fa2705981bf3438568e13696fe44d0af3dbcf1c8
latest_review_id: PRR_kwDOTnz-ks8AAAABI29_-Q
latest_review_verdict: FAIL_P2_MUTATION_FRAGMENT_CASE_INSENSITIVE
round_5_implementation:
  head: 2323f7f0a0ea8900451313facbaa17c2bf35a4f1
  ci: PASS
  server_test_files: 88_PASS
  server_tests: 363_PASS
  evidence_url_binding_regressions: 5_PASS
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
