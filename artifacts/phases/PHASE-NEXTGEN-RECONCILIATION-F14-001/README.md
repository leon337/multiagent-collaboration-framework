# PHASE-NEXTGEN-RECONCILIATION-F14-001 — Pacote de rastreabilidade

Este PRF registra a fase Classe C que reconciliou o NextGen histórico com o MCF atual no lineage v1.2.0 e produziu a
arquitetura/roadmap/plano candidatos. Ele comprova planejamento e revisão; não comprova implementação,
execução cognitiva de 29 agentes, provider live, release/deploy NextGen ou produção.

A release `v1.2.0@5c7f983` é uma identidade preexistente reconciliada como baseline. O
`main@42d941b` contém ainda os deltas pós-release dos PRs #179/#181; este pacote não cria nova tag,
release ou promoção.

## Ordem de leitura

1. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-PLAN.md`](PHASE-NEXTGEN-RECONCILIATION-F14-001-PLAN.md)
2. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-DECISIONS.md`](PHASE-NEXTGEN-RECONCILIATION-F14-001-DECISIONS.md)
3. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-REPORT.md`](PHASE-NEXTGEN-RECONCILIATION-F14-001-REPORT.md)
4. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-VALIDATION.txt`](PHASE-NEXTGEN-RECONCILIATION-F14-001-VALIDATION.txt)
5. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-VALIDATION-FULL.txt`](PHASE-NEXTGEN-RECONCILIATION-F14-001-VALIDATION-FULL.txt)
6. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-SMOKE.txt`](PHASE-NEXTGEN-RECONCILIATION-F14-001-SMOKE.txt)
7. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-CHECKPOINT.yaml`](PHASE-NEXTGEN-RECONCILIATION-F14-001-CHECKPOINT.yaml)
8. [`PHASE-NEXTGEN-RECONCILIATION-F14-001-ARTIFACT-MANIFEST.sha256`](PHASE-NEXTGEN-RECONCILIATION-F14-001-ARTIFACT-MANIFEST.sha256)

## Entregas de domínio

- [Roadmap canônico](../../../docs/MCF-NEXTGEN-RECONCILIATION-ROADMAP.md)
- [Disposition Q1–Q16](../../../docs/proposals/MCF-NEXTGEN-ROUND-2-DISPOSITION-001.md)
- [Arquitetura formal F1.4 candidata](../../../docs/architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md)
- [Plano de implementação/checklist](../../../docs/superpowers/plans/2026-08-24-mcf-nextgen-reconciled-implementation-plan.md)

## Modelo de evidência

- o baseline Git é vinculado a SHA exato;
- GitHub live prevalece para estado mutável de Issue, PR e checks;
- checks/comentários do PR são receipts externos do HEAD exato e evitam autorreferência do commit;
- revisão por contexto/ferramenta independente não é renomeada como agente oficial;
- revisão interrompida não recebe PASS: o limite terminal desta fase permanece explícito no
  CHECKPOINT/DECISIONS;
- identidade managed sem task run/origin Receipt recebe `NOT_EXECUTED_NO_TASK_RUN_ORIGIN_RECEIPT`,
  nunca crédito simulado.

## Estado

```yaml
phase_package: PLANNING_COMPLETE_CANDIDATE_TRACEABILITY_OPEN
local_validation: PASS_WITH_DISCLOSED_BASELINE_TIMING_FLAKE
terminal_independent_review: INTERRUPTED_USAGE_LIMIT_NO_VERDICT
formal_architecture_approved: false
implementation_authorized: false
runtime_changes: none
provider_runtime_production_mutations: none
github_versioning_mutations: AUTHORIZED_BRANCH_PR_AND_MERGE_ONLY
procedural_conformance: MCF_PROCESS_VARIANCE_NAMED_CONTROLS_AND_ESEV_HANDOFFS_NOT_EXECUTED
next_gate: LEANDRO_REVIEWS_EXACT_MAIN_REVISION
```
