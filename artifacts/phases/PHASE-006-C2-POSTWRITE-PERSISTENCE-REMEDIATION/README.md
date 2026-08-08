# PHASE-006-C2-POSTWRITE-PERSISTENCE-REMEDIATION

Pacote de Rastreabilidade da Fase para as remediações independentes do PR #80.

## Objetivo

Impedir duplicidade ou perda de estado quando uma mutação externa pode ter ocorrido e preservar compatibilidade global da chave de idempotência em retries pré-write.

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
source_p1_head: edaef62866aa1ff0af2985bfad20d1fe640c36cd
prior_self_bound_review:
  head: 60f069ee829b03cab93e484ef2782e00333c9377
  verdict: FAIL
  findings:
    - P1_UNKNOWN_NOT_PERSISTABLE
    - P2_PREWRITE_FINGERPRINT_TOMBSTONE_MISSING
round_2_implementation:
  head: 3f68a97c25af742566e618ae6838d7d3cf4224fd
  ci: PASS
  migration_0028: PASS
  server_test_files: 86_PASS
  server_tests: 357_PASS
current_gate:
  checkpoint_head: SELF
  resolution: GIT_COMMIT_CONTAINING_CHECKPOINT
  ci_source: GITHUB_ACTIONS_FOR_SAME_SHA
  review_source: CODEX_REVIEW_FOR_SAME_SHA
real_provider_write: NOT_AUTHORIZED
production: BLOCKED
```

## Relação com fases anteriores

`PHASE-006-C2-CONFORMANCE-RECOVERY` permanece histórico. Este pacote registra as remediações posteriores encontradas pelas revisões independentes.

## Próximo gate

Resolver `SELF` para o Git HEAD que contém este pacote → validar os três workflows nesse SHA → revisão independente nesse SHA → decisão de Léo.
