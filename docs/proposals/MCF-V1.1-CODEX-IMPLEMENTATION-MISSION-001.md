# MCF v1.1 — Codex Implementation Mission 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Status:** `AUTHORIZED_READY_FOR_EXECUTION`  
**Human authority:** **LEANDRO**  
**Orchestrator:** **MESTRE**  
**Technical executor:** **CODEX_LOCAL**  
**Authorization:** `MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001` / Option D

## 1. Mission objective

Implement MCF v1.1 by extending the qualified v1.0 core according to the approved Q1–Q20 decisions, technical contracts, compatibility strategy, incremental implementation plan and qualification matrix.

The executor must not build a parallel architecture and must preserve v1.0 compatibility.

## 2. Source of truth and precedence

Before editing, read in this order:

1. live GitHub state;
2. `MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001.md`;
3. `MCF-V1.1-PREIMPLEMENTATION-RESUME-CARD.md`;
4. `MCF-V1.1-PREIMPLEMENTATION-CHECKPOINT-001.md`;
5. `MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001.md`;
6. `MCF-V1.1-TECHNICAL-CONTRACTS-001.md`;
7. `MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001.md`;
8. `MCF-V1.1-IMPLEMENTATION-PLAN-001.md`;
9. `MCF-V1.1-QUALIFICATION-PLAN-001.md`;
10. `MCF-V1.1-DISCOVERY-CHECKPOINT-020.md` and Decision Ledger;
11. applicable current MCF governance/runtime docs.

If a historical volatile-state value conflicts with live GitHub state, preserve history and use live state for the current fact.

## 3. Mandatory bootstrap — no code before this passes

Codex must first return/record:

```yaml
repository: leon337/multiagent-collaboration-framework
main_head_live: <sha>
preimplementation_branch_head_live: <sha>
working_tree_before: <clean|dirty + exact paths>
current_local_branch: <branch>
remote_status: <ahead/behind/diverged>
implementation_baseline_selected: <sha>
implementation_branch: <name>
implementation_branch_base: <sha>
preexisting_unrelated_changes: <none|list>
```

Rules:

- fetch live refs before choosing baseline;
- do not overwrite unrelated local work;
- do not work directly on `main`;
- preferred implementation branch name: `feat/mcf-v1.1-project-intake-continuity`, subject to collision check;
- the implementation branch should include the approved discovery/preimplementation artifacts; use the live approved preimplementation HEAD as the planning/contract base unless current GitHub state proves this invalid;
- if `main` has drifted materially since authorization, stop and report before implementation;
- if the suggested branch exists with unrelated history, choose a safe unambiguous alternative and record it.

## 4. Full authorized execution map

```text
I1  Contract and schema foundation
I2  Repository-backed canonical project artifact layer
I3  Activation, entry classification and Human Intent Discovery
I4  Intent Alignment boundary
I5  Existing-project reconnaissance / PRR pipeline
I6  Mission Runtime integration
I7  Standing Authorization + impact-based HUMAN_GATE
I8  Transferable continuity and recovery
I9  Observability and audit exposure
I10 Full qualification
```

LEANDRO has authorized this full mission. Normal technical choices inside this envelope are `TEAM_FIRST` and do not require repeated HUMAN_GATE.

MESTRE retains operational review between phases. A phase may proceed only after its evidence gate is satisfied. No technical gate may silently become authority to redefine Q1–Q20.

## 5. Current execution window — I1

This first execution window is limited to **I1 — Contract and schema foundation**.

### Required work

Implement the contract/schema foundation defined in `MCF-V1.1-TECHNICAL-CONTRACTS-001.md`:

- `McfArtifactRef`;
- PIP v1 types/schema;
- PRR v1 types/schema;
- Intent Alignment Receipt v1 type/schema;
- project entry mode and resume/recovery route types;
- additive optional v1.1 fields on `McfMissionContract`;
- `McfStandingAuthorization` contract;
- compatible v1.1 extension of CAF checkpoint schema;
- schema/contract validation fixtures and focused tests.

### Reuse constraints

- extend `packages/contracts/src/mcf-runtime.ts`; do not create a second runtime contract universe;
- preserve all existing required v1.0 Mission Contract fields and semantics;
- preserve existing checkpoint compatibility;
- new v1.1 artifact contracts must carry explicit schema versioning;
- use repository conventions and existing validation tooling where adequate;
- do not introduce a new database table in I1;
- do not implement I2 runtime/artifact service behavior early unless a minimal compile/test helper is strictly required and clearly documented.

## 6. I1 acceptance gate

I1 may be reported `PASS` only if evidence proves:

```yaml
legacy_contract_tests: PASS
new_pip_schema_validation: PASS
new_prr_schema_validation: PASS
alignment_receipt_schema_validation: PASS
standing_authorization_contract_validation: PASS
legacy_checkpoint_validation: PASS
v1_1_checkpoint_extension_validation: PASS
legacy_v1_0_contract_compile_or_runtime_regression: PASS
no_runtime_behavior_change_beyond_contract/schema_boundary: VERIFIED
no_parallel_contract_runtime: VERIFIED
working_tree_scope: EXPLAINED
```

Run the focused relevant suite and then the full relevant package/schema regression available for the changed boundary.

## 7. Commit policy for I1

After tests pass:

- create one or more small auditable local commits for I1;
- commit messages must describe the v1.1 contract/schema foundation;
- do not squash evidence away locally;
- remote push of the implementation branch is authorized by Option D once I1 gate passes;
- if pushed, verify local HEAD == remote branch HEAD and report exact SHA;
- do not open the final implementation PR merely because I1 passes unless current implementation plan/governance gives a concrete reason; the normal expectation is to continue through subsequent phases with controlled remote checkpoints.

## 8. Required I1 return receipt to MESTRE

Return exactly enough evidence for independent orchestration review:

```yaml
MISSION: MCF-V1.1-CODEX-IMPLEMENTATION-001
WINDOW: I1
RESULT: PASS | FAIL | BLOCKED

LIVE_BASELINE:
  main: <sha>
  preimplementation: <sha>
  implementation_base: <sha>

BRANCH:
  name: <branch>
  head: <sha>
  remote_head: <sha|null>

CHANGED_PATHS:
  - <path>

CONTRACTS_ADDED_OR_EXTENDED:
  - <item>

TESTS:
  - command: <command>
    result: PASS|FAIL
    summary: <count/details>

COMPATIBILITY:
  v1_0_contracts: PASS|FAIL
  legacy_checkpoint: PASS|FAIL
  new_database_state: NO|YES
  parallel_runtime_created: NO|YES

FINDINGS:
  blocking: []
  non_blocking: []

COMMITS:
  - <sha> <message>

NEXT_RECOMMENDED_WINDOW: I2 | STOP_FOR_REASSESSMENT
```

Also include concise `git status`, exact final HEAD, and whether push occurred.

## 9. Automatic stop conditions

Stop I1 and return `BLOCKED` rather than improvising if:

- approved preimplementation artifacts are missing or inconsistent;
- current main drift materially changes the implementation assumptions;
- existing dependencies cannot validate the approved schemas without a material architecture change;
- checkpoint compatibility would require breaking v1.0 readers;
- contracts require a second runtime/type authority;
- a new DB subsystem appears necessary;
- implementation requires redefining human decisions;
- any non-delegable HUMAN_GATE is reached.

## 10. Explicitly forbidden in this window

```text
NO DIRECT MAIN WRITE
NO MERGE
NO RELEASE
NO PRODUCTION DEPLOY
NO TAG
NO I2-I10 IMPLEMENTATION BEFORE I1 GATE
NO SILENT BREAKING CHANGE
NO HISTORICAL REWRITE
NO PARALLEL MISSION RUNTIME
NO PARALLEL PERMISSION/HDF
NO NEW PROJECT-STATE DATABASE
```

## 11. Orchestration after I1

MESTRE reviews the I1 receipt against the exact implementation HEAD.

If I1 passes, MESTRE may authorize the next technical window I2 without asking LEANDRO again, because Option D already authorizes the full implementation mission inside the approved envelope.

A new LEANDRO HUMAN_GATE is required only if execution crosses the approved human boundary or later reaches merge/release/production authority.
