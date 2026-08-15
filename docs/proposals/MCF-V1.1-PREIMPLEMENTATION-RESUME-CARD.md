# MCF v1.1 — Implementation Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR A v1.1 DURANTE A IMPLEMENTAÇÃO.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO
- Preparação/autoridade branch: `planning/mcf-v1.1-preimplementation-conformance`
- Implementação branch: `feat/mcf-v1.1-project-intake-continuity`
- Executor técnico autorizado: `CODEX_LOCAL`

## Estado atual

```yaml
target_version: v1.1.0
discovery: COMPLETE_20_OF_20
preimplementation_preparation: COMPLETE
implementation_human_gate: APPROVED_OPTION_D_BY_LEANDRO

implementation_authorized: true
codex_implementation_authorized: true

I1: PASS
I1_accepted_head: 1d4bea35105b6014e036b4c8f1fd0a3a4312133e
I2: PASS
I2_accepted_head: 6de580c48d8617a4bf0688af09325225bf583f95

I3: CORRECTION_REQUIRED
I3_reviewed_candidate: 1fea1c863280c30758d89bbcc2e9d561a3b804b4
last_technical_gate: RETURN_FOR_CORRECTION
current_execution_window: I3_CORRECTION_001_HUMAN_DECISION_SUPERSESSION
I4_authorized: false

merge_to_main_authorized: false
release_authorized: false
production_authorized: false
prototype_product_path_authorized: false
```

Controlled fixtures, test harnesses and disposable qualification environments required by implementation/qualification remain authorized; this does not authorize a separate product prototype or production path.

## Latest live state verified by MESTRE

```yaml
main_live: b91823a947715e09d69c72999e2278523f2259be
implementation_branch_live: 1fea1c863280c30758d89bbcc2e9d561a3b804b4
I3_compare_from_I2:
  ahead_by: 2
  behind_by: 0
  changed_paths: 5
```

Codex MUST fetch live GitHub before every correction/execution window and record the exact current implementation HEAD.

## Canonical authorization

`docs/proposals/MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001.md`

LEANDRO selected **Option D**. The implementation mission I1→I10 is authorized inside the approved envelope, with local-first work, tests, commits, remote checkpoints/PR/CI/qualification according to phase gates.

Still blocked:

```text
DIRECT MAIN WRITE
MERGE
RELEASE
PRODUCTION
SILENT Q1-Q20 REDEFINITION
PARALLEL MISSION RUNTIME
PARALLEL PERMISSION/HDF SYSTEM
PARALLEL GENERIC CHECKPOINT ENGINE
NEW PROJECT-STATE DATABASE WITHOUT CONFORMANCE REASSESSMENT
```

## I1 — PASS

Accepted HEAD:

`1d4bea35105b6014e036b4c8f1fd0a3a4312133e`

History:

- initial candidate `89035db6...` returned for empty provenance arrays;
- correction required non-empty provenance for material PIP/PRR assertions;
- corrected candidate passed.

Gates:

- `MCF-V1.1-I1-TECHNICAL-GATE-001.md`
- `MCF-V1.1-I1-TECHNICAL-GATE-002.md`

## I2 — PASS

Accepted HEAD:

`6de580c48d8617a4bf0688af09325225bf583f95`

Accepted repository-backed project-artifact layer provides:

- canonical PIP/PRR/alignment-receipt paths;
- schema validation;
- deterministic SHA-256 digest;
- digest verification;
- aligned-PIP/PRR/receipt immutability semantics;
- local-uncheckpointed vs remote-verified distinction;
- exact-commit reader boundary;
- lock + atomic local-write behavior;
- no DB migration/table;
- no parallel runtime.

Gate:

`docs/proposals/MCF-V1.1-I2-TECHNICAL-GATE-001.md`

## I3 — candidate reviewed, correction required

I3 execution specification:

`docs/proposals/MCF-V1.1-I3-EXECUTION-WINDOW-001.md`

Reviewed candidate:

```yaml
start_head: 6de580c48d8617a4bf0688af09325225bf583f95
candidate_head: 1fea1c863280c30758d89bbcc2e9d561a3b804b4
candidate_reported_result: PASS
MESTRE_gate: RETURN_FOR_CORRECTION
```

Candidate behaviors already accepted by MESTRE inspection:

- activation `NOT_ACTIVE -> ACTIVATING -> ACTIVE`;
- safe/evidence-aware NEW / ADOPT / RESUME / RECOVER routing;
- all 20 canonical intent dimensions;
- deterministic adaptive question selection;
- progressive read-back as derived view;
- readiness with blocking-unknown protection;
- machine-only inference cannot create a CLEAR human preference or direct human decision;
- incremental PIP revisions reuse I2 artifact store;
- I4 aligned/PASS boundary remains blocked;
- no DB state or parallel runtime introduced.

### Blocking I3 finding

Canonical Q9/Q12 require:

```text
OLD_HUMAN_DECISION -> SUPERSEDED
NEW_HUMAN_DECISION -> CURRENT
```

The current `createIncrementalIntentRevision()` appends new human-decision records but does not transition the replaced prior `CURRENT` decision to `SUPERSEDED`. A material replacement can therefore leave contradictory decisions simultaneously `CURRENT`.

Technical gate:

`docs/proposals/MCF-V1.1-I3-TECHNICAL-GATE-001.md`

Required correction:

- implement deterministic human-decision supersession inside incremental PIP working revisions;
- preserve old record/provenance as `SUPERSEDED`;
- replacement human decision becomes `CURRENT`;
- reject unknown/invalid supersedes targets;
- reject machine-only supersession;
- prevent contradictory duplicate CURRENT material decisions;
- add positive and negative tests;
- rerun focused + I1/I2 + v1.0 relevant regression;
- do not implement I4.

## Current flow

```text
LEANDRO OPTION D APPROVED
        ↓
I1 PASS @ 1d4bea35105b6014e036b4c8f1fd0a3a4312133e
        ↓
I2 PASS @ 6de580c48d8617a4bf0688af09325225bf583f95
        ↓
I3 candidate @ 1fea1c863280c30758d89bbcc2e9d561a3b804b4
        ↓
MESTRE REVIEW
        ↓
RETURN_FOR_CORRECTION
        ↓
I3-CORRECTION-001 — HUMAN DECISION SUPERSESSION
        ↓
focused + relevant regression
        ↓
commit + push + receipt
        ↓
MESTRE technical gate
        ↓
PASS → I4
```

## HUMAN_GATE policy

No new LEANDRO gate is required for this correction. It is technical work inside the already authorized Option D envelope.

Return to LEANDRO only for a non-delegable HUMAN_GATE or material crossing of the approved boundary, including merge/release/production authority when reached.

## Preparation results that remain binding

```yaml
PIP:
  no_equivalent_test: PASS_NEW_CONTRACT_JUSTIFIED
  persistence_design: VERSIONED_REPOSITORY_ARTIFACT
PRR:
  no_equivalent_test: PASS_NEW_CONTRACT_JUSTIFIED
  persistence_design: VERSIONED_REPOSITORY_ARTIFACT
Mission_Runtime: REUSE_AND_EXTEND
Mission_Contract: ADDITIVE_VERSIONED_EXTENSION
MCF_START_MISSION: EXTEND
MCF_RECOVER_CONTEXT: EXTEND
MCF_DEFINE_PRODUCT: REUSE_IN_INTENT_DISCOVERY
CAF_Checkpoint: EXTEND_COMPATIBLY
Permission_HDF: EXTEND_FOR_SCOPED_STANDING_AUTHORIZATION
Event_Ledger: REUSE_AND_EXTEND
Receipts_Handoffs: REUSE
new_parallel_database: NO_GO
```

## Mandatory sources on resume

1. `MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001.md`
2. `MCF-V1.1-CODEX-IMPLEMENTATION-MISSION-001.md`
3. `MCF-V1.1-I1-TECHNICAL-GATE-001.md`
4. `MCF-V1.1-I1-TECHNICAL-GATE-002.md`
5. `MCF-V1.1-I2-TECHNICAL-GATE-001.md`
6. `MCF-V1.1-I3-EXECUTION-WINDOW-001.md`
7. `MCF-V1.1-I3-TECHNICAL-GATE-001.md`
8. `MCF-V1.1-DISCOVERY-CHECKPOINT-020.md`
9. `MCF-V1.1-DECISION-LEDGER-001.md`
10. `MCF-V1.1-TECHNICAL-CONTRACTS-001.md`
11. `MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001.md`
12. `MCF-V1.1-IMPLEMENTATION-PLAN-001.md`
13. `MCF-V1.1-QUALIFICATION-PLAN-001.md`

## Comando mínimo de retomada

> `Mestre, retome a v1.1 pelo Implementation Resume Card e pelo último technical gate. Verifique GitHub live. I1 e I2 passaram; I3 está em correção por human-decision supersession; I4, merge, release e produção continuam bloqueados.`
