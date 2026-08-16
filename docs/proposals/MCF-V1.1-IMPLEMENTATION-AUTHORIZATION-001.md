# MCF v1.1 — Implementation Authorization

**ID:** `MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001`  
**Status:** `APPROVED_BY_LEANDRO`  
**Decision:** `OPTION_D`  
**Human authority:** **LEANDRO**  
**Orchestrator:** **MESTRE**  
**Target:** `v1.1.0`

## 1. Human decision

LEANDRO explicitly selected **Option D** at the separate post-preimplementation HUMAN_GATE.

The authorized choice is:

> Authorize the complete MCF v1.1 implementation mission under the approved MCF process. Codex works `LOCAL_FIRST`, executes phases I1 through I10, tests and creates local commits, publishes remote checkpoints/branch/PR according to the approved gates, executes CI and prepares qualification. Merge, release and production remain blocked for later decisions.

## 2. Live state verified at authorization

```yaml
main_sha: b91823a947715e09d69c72999e2278523f2259be
preimplementation_branch: planning/mcf-v1.1-preimplementation-conformance
preimplementation_head_before_authorization_record: 9496461213c2ee4019bb136b58c6695ac5c0c86f
```

The implementation executor MUST verify GitHub live again before creating/editing an implementation branch and MUST record a fresh exact implementation baseline.

## 3. What is now authorized

```yaml
implementation_authorized: true
codex_implementation_authorized: true
local_code_changes: true
local_tests: true
local_commits: true
remote_implementation_branch: true
remote_checkpoints: true
pull_request_when_phase_gates_allow: true
ci_execution: true
qualification_preparation: true
qualification_execution_on_candidate_head: true
```

## 4. What remains blocked

```yaml
direct_write_to_main: false
merge_to_main: false
release_authorized: false
production_authorized: false
production_deployment: false
release_tag_creation: false
silent_methodology_change: false
material_redefinition_of_Q1_Q20: false
parallel_runtime: false
parallel_permission_system: false
parallel_generic_checkpoint_engine: false
new_project_state_database_without_new_conformance_finding: false
```

Prototype work is not separately authorized as a product/release path. Controlled fixtures, test harnesses and disposable qualification environments required by I1–I10 are allowed as implementation/testing artifacts.

## 5. Authoritative implementation package

The implementation mission is bounded by the following artifacts:

1. `MCF-V1.1-DISCOVERY-CHECKPOINT-020.md`
2. `MCF-V1.1-DECISION-LEDGER-001.md`
3. `MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001.md`
4. `MCF-V1.1-TECHNICAL-CONTRACTS-001.md`
5. `MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001.md`
6. `MCF-V1.1-IMPLEMENTATION-PLAN-001.md`
7. `MCF-V1.1-QUALIFICATION-PLAN-001.md`
8. `MCF-V1.1-PREIMPLEMENTATION-CHECKPOINT-001.md`
9. this authorization record
10. `MCF-V1.1-CODEX-IMPLEMENTATION-MISSION-001.md`

If current GitHub reality conflicts with a historical volatile-state statement, live state governs the current volatile fact while historical records remain unchanged.

## 6. Execution authority

### LEANDRO

Remains final human authority and sole authority for non-delegable HUMAN_GATE decisions.

### MESTRE

Orchestrates the mission, interprets the approved contracts, reviews Codex receipts, protects scope and issues the next bounded step when needed.

### LÉO

Retains delegated operational authority within the approved envelope under current MCF governance.

### Codex local

Acts as technical executor. It may choose engineering details inside the approved envelope, but cannot silently redefine human intent, architectural constitutional boundaries or release authority.

## 7. Required stop/escalation conditions

Codex MUST stop the affected path and return evidence to MESTRE if it encounters:

- material baseline drift that invalidates the plan;
- need for a breaking change to v1.0 compatibility;
- need for a second Mission Runtime, permission/HDF subsystem or generic checkpoint engine;
- need for new persistent project-state DB tables not justified by current conformance;
- inability to preserve legacy v1.0 behavior;
- ambiguity that would materially alter approved Q1–Q20 intent;
- an action crossing a non-delegable HUMAN_GATE;
- any requirement to merge, release or deploy to production.

Ordinary technical ambiguity inside the approved envelope remains `TEAM_FIRST` and does not automatically escalate to LEANDRO.

## 8. Phase authority

The executor is authorized to execute the planned phases:

```text
I1  Contract and schema foundation
I2  Repository-backed canonical artifact layer
I3  Activation, entry classification and Human Intent Discovery
I4  Intent Alignment boundary
I5  Existing-project reconnaissance / PRR pipeline
I6  Mission Runtime integration
I7  Standing Authorization + impact-based HUMAN_GATE
I8  Transferable continuity and recovery
I9  Observability and audit exposure
I10 Full qualification
```

Each phase remains subject to its own tests/evidence gates. `PHASE_STARTED` never implies `PHASE_PASSED`.

## 9. Constitutional invariants

```text
IMPLEMENTATION_AUTHORIZED != MERGE_AUTHORIZED
IMPLEMENTATION_AUTHORIZED != RELEASE_AUTHORIZED
IMPLEMENTATION_AUTHORIZED != PRODUCTION_AUTHORIZED
LOCAL_FIRST
EDIT != COMMIT != PUSH != PR != MERGE
REUSE_BEFORE_NEW_PRIMITIVE
EXTEND_BEFORE_REPLACE
VERSION_BEFORE_BREAK
TEAM_FIRST_BEFORE_HUMAN_INTERRUPTION
HUMAN_SILENCE != APPROVAL
MACHINE_INFERENCE != HUMAN_DECISION
```

## 10. Next action

MESTRE may now issue `MCF-V1.1-CODEX-IMPLEMENTATION-MISSION-001` to the local Codex executor.

The first Codex action is **not code editing**. It is to verify repository live state, read the authoritative package, record the exact implementation baseline, verify branch collision/worktree status and only then begin I1.
