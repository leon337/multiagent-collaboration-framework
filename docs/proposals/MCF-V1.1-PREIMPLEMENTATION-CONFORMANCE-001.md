# MCF v1.1 — Pre-Implementation Conformance Analysis

**ID:** `MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001`  
**Status:** `PREIMPLEMENTATION_DESIGN`  
**Authority:** LEANDRO  
**Orchestrator:** MESTRE  
**Branch:** `planning/mcf-v1.1-preimplementation-conformance`

## 1. Purpose

Transform the approved v1.1 Discovery (`Q1–Q20`) into an implementation-ready technical boundary without writing implementation code.

This document satisfies the Q20 requirement `V1_0_IMPACT_AND_CONFORMANCE_ANALYSIS` and records the `NO_EQUIVALENT_TEST` for candidate new primitives.

```yaml
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

## 2. Exact baselines

```yaml
stable_v1_0_main_baseline: b91823a947715e09d69c72999e2278523f2259be
discovery_terminal_head: aef074f87b7356fe277f4cc92266605bf1dc410b
preimplementation_branch_base: aef074f87b7356fe277f4cc92266605bf1dc410b
```

The stable v1.0 release identity is historical and must not be rewritten. Implementation work, if later authorized, must target a new branch and preserve compatibility.

## 3. v1.0 primitives verified

The exact v1.0 baseline already contains:

- `MissionRuntimeService` with mission creation and governed phase execution;
- `McfMissionContract` and mission/phase/event/receipt/handoff DTOs;
- permission profiles `READ_ONLY`, `READ_AND_PROPOSE`, `SCOPED_WRITE`, `SENSITIVE_CONTROLLED`, `HUMAN_GATE`;
- `HumanDelegationGuard` with `TEAM_FIRST` and reserved human intervention triggers;
- durable tables `mcf_missions`, `mcf_phases`, `mcf_tool_receipts`, `mcf_handoffs`, `mcf_events` and idempotency/hierarchy support;
- mission hierarchy and parent checkpoint state;
- CAF flow checkpoint schema;
- skills `MCF-START-MISSION`, `MCF-RECOVER-CONTEXT`, `MCF-DEFINE-PRODUCT` and other executable runtime skills.

Therefore v1.1 MUST NOT create a second mission runtime, second event ledger, second handoff mechanism, second permission subsystem or second generic checkpoint engine.

## 4. Conformance matrix

| v1.1 capability | v1.0 equivalent | Decision |
|---|---|---|
| Activation / bootstrap | partial protocol only | `EXTEND_PROTOCOL`, no runtime clone |
| Project entry mode | no explicit typed field | `ADDITIVE_CONTRACT_EXTENSION` |
| Human Intent Discovery | `MCF-DEFINE-PRODUCT` is partial | `EXTEND_SKILL_OR_ORCHESTRATION` |
| Project Intent Package (PIP) | no equivalent durable project-level intent record | `NEW_DURABLE_CONTRACT_JUSTIFIED` |
| Intent Alignment Receipt | tool receipts are phase/mission-bound and not equivalent | `NEW_SMALL_ARTIFACT_FORMAT`, not new runtime subsystem |
| Project Reality Report (PRR) | runtime evidence/checkpoints are mission-state oriented | `NEW_DURABLE_CONTRACT_JUSTIFIED` |
| Gap Map | no need for independent authority | `DERIVED_REBUILDABLE_VIEW` |
| Completion / Recovery Plan | planning artifact | `WORKING_PROPOSED_ARTIFACT` |
| Mission Contract | exists | `ADDITIVE_VERSIONED_EXTENSION` |
| Standing Authorization | permission profiles + HDF exist | `EXTEND_PERMISSION_HDF_MODEL` |
| Transferable Checkpoint | checkpoint primitive exists | `EXTEND_VERSIONED_CHECKPOINT` |
| FAST_RESUME / RECONCILE / RECOVER | recover context + runtime/reconciliation foundations exist | `EXTEND_EXISTING_RECOVERY` |
| Resume Card | derived view | `NO_NEW_RUNTIME_STATE` |
| Evidence / receipts / events | exists | `REUSE_AND_EXTEND_EVENT_TYPES_WHEN_NEEDED` |
| Observability | exists in runtime | `REUSE_AND_EXTEND` |

## 5. NO_EQUIVALENT_TEST — Project Intent Package

### Candidate
`PROJECT_INTENT_PACKAGE`

### Existing candidates examined

1. `McfMissionContract`
2. `MCF-DEFINE-PRODUCT` outputs (`product_brief`, `mvp_scope`, `roadmap`)
3. CAF checkpoint
4. mission events / receipts
5. `MCF-RECOVER-CONTEXT` context package

### Why they are not equivalent

`McfMissionContract` is mission-scoped and optimized for executable scope, agents, skills, risk and acceptance criteria. It does not preserve the 20 human-intent dimensions, raw intent versus synthesis, provenance categories, superseded human decisions, assumptions, unknowns, conflicts, semantic readiness, immutable aligned revision or a lifecycle that can outlive a mission.

`MCF-DEFINE-PRODUCT` is an existing skill and should be reused, but its output is currently a product brief/roadmap rather than the canonical versioned human-intent memory required by Q12.

Checkpoint, event and receipt primitives preserve operational state/evidence, not the complete human-intent authority model.

### Verdict

```yaml
candidate: PROJECT_INTENT_PACKAGE
valid_equivalent_in_v1_0: false
new_durable_contract_justified: true
new_runtime_engine_required: false
preferred_persistence: VERSIONED_REPOSITORY_ARTIFACT
```

## 6. NO_EQUIVALENT_TEST — Project Reality Report

### Candidate
`PROJECT_REALITY_REPORT`

### Existing candidates examined

1. mission checkpoint
2. `MCF-RECOVER-CONTEXT` context package
3. mission events / evidence receipts
4. runtime observations
5. Product Brief / roadmap outputs

### Why they are not equivalent

PRR is a project-level `AS-IS` record bound to an exact repository baseline and evidence/provenance. It must remain explicitly separate from human `TO-BE` intent and from transient mission state. Existing runtime evidence can support a PRR but does not itself constitute this exact-baseline project reality contract.

### Verdict

```yaml
candidate: PROJECT_REALITY_REPORT
valid_equivalent_in_v1_0: false
new_durable_contract_justified: true
new_runtime_engine_required: false
preferred_persistence: VERSIONED_REPOSITORY_ARTIFACT
```

## 7. Persistence strategy

To preserve local-first operation and GitHub as institutional memory, v1.1 canonical project artifacts should initially be repository-backed versioned files, not a second database/runtime.

Proposed project artifact layout:

```text
.mcf/
├── intent/
│   └── pip-<revision-id>.json
├── reality/
│   └── prr-<revision-id>.json
├── receipts/
│   └── intent-alignment-<receipt-id>.json
└── continuity/
    └── checkpoint-<checkpoint-id>.json
```

The runtime stores references/digests to these artifacts where mission execution requires them. Git/GitHub supplies immutable history once checkpointed remotely. Local copies may exist during work but do not become remote durable truth until committed/pushed according to the applicable boundary.

## 8. Compatibility rules

```text
V1_1_EXTENDS_V1_0
REUSE_BEFORE_NEW_PRIMITIVE
EXTEND_BEFORE_REPLACE
VERSION_BEFORE_BREAK
NO_SILENT_LEGACY_REWRITE
NO_SILENT_METHODOLOGY_UPGRADE
OLD_PROJECT != INVALID_PROJECT
```

Legacy mission contracts with no v1.1 extension fields remain valid under their methodology pin. New fields must be optional/additive at the TypeScript contract boundary until a project explicitly adopts v1.1.

## 9. Team-review lenses used during preparation

These are review lenses applied by MESTRE in this preparation, not claims of separately running independent agents.

- **Sofia lens — architecture:** no parallel runtime; keep PIP/PRR project-level and repository-backed.
- **Rafael lens — runtime/persistence:** extend DTOs/services and reference canonical artifacts; avoid unnecessary DB tables in the first compatible implementation.
- **Emily lens — evidence/audit:** exact artifact revision, baseline SHA, provenance and digest must be mandatory for material claims.
- **Security lens:** standing authorization extends the existing permission/HDF boundary; never treat authorization scope as an open-ended grant.

## 10. Conformance verdict

```yaml
v1_0_impact_understood: PASS
parallel_architecture_required: false
pip_no_equivalent_test: PASS_NEW_CONTRACT_JUSTIFIED
prr_no_equivalent_test: PASS_NEW_CONTRACT_JUSTIFIED
mission_runtime_reuse: REQUIRED
mission_contract_extension: REQUIRED
checkpoint_extension: REQUIRED
permission_hdf_extension: REQUIRED
implementation_authorized: false
next_document: MCF-V1.1-TECHNICAL-CONTRACTS-001
```
