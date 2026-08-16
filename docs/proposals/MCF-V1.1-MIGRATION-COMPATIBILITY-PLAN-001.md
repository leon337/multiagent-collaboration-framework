# MCF v1.1 — Migration & Compatibility Plan

**ID:** `MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001`  
**Status:** `PREIMPLEMENTATION_DESIGN`

## 1. Objective

Introduce v1.1 capabilities without invalidating v1.0 projects, rewriting historical artifacts, duplicating runtime primitives or silently changing a project's pinned methodology.

```yaml
implementation_authorized: false
mass_migration: false
silent_upgrade: false
```

## 2. Compatibility modes

```text
V1_0_PINNED
  existing behavior remains valid

V1_1_NATIVE
  project was created/aligned under v1.1 contracts

V1_0_TO_V1_1_UPGRADE_PENDING
  project requests v1.1 capability but has not completed upgrade boundary

V1_0_COMPATIBILITY_MODE
  safe continuation under v1.0 when migration is unnecessary or unsafe
```

## 3. Legacy detection

Resolution order:

1. valid project/methodology pin;
2. explicit artifact `schemaVersion`;
3. Mission Contract v1.1 extension metadata when present;
4. absence of v1.1 metadata is treated as legacy, not corruption;
5. unknown/conflicting version data routes to reconciliation, never silent inference.

## 4. No mass migration

Existing v1.0 projects and missions are not rewritten merely because v1.1 exists.

A v1.0 mission may continue using the current `McfMissionContract` and runtime semantics. Migration is considered only at a safe project/mission boundary when a v1.1 capability is actually required or explicitly selected.

## 5. Upgrade boundary

A project moves from v1.0 to v1.1 only through:

```text
DETECT PIN / LEGACY STATE
        ↓
ASSESS LIVE PROJECT STATE
        ↓
CREATE/VALIDATE v1.1 PROJECT CONTEXT
        ↓
PIP DISCOVERY + ALIGNMENT
        ↓
PRR IF ENTRY MODE REQUIRES IT
        ↓
CREATE NEW v1.1 MISSION CONTRACT
        ↓
VALIDATE COMPATIBILITY
        ↓
ACTIVATE v1.1 FOR NEW WORK
```

Old Mission Contracts, checkpoints, receipts and historical events are preserved.

## 6. Artifact migration rules

### PIP

No v1.0 PIP exists. Migration creates a first v1.1 PIP revision from verified human-intent sources. Machine reconstruction may propose synthesis but cannot silently become human intent. Alignment by LEANDRO is required before implementation authority.

### PRR

For `ADOPT_EXISTING_PROJECT`, create PRR from a fresh exact baseline. Do not transform old documentation into PRR facts without evidence.

### Mission Contract

Do not mutate a historical v1.0 contract into v1.1. Create a new mission/contract at the applicable boundary and reference the aligned PIP.

### Checkpoint

Legacy checkpoint remains valid. New checkpoints may use additive v1.1 metadata. Legacy missing fields are reconstructed only from authoritative sources and written to a new checkpoint, never backfilled into historical checkpoint records.

## 7. Runtime/database compatibility

The initial v1.1 design does not require a parallel database or replacement of existing runtime tables.

Canonical PIP/PRR/alignment artifacts are repository-backed. Existing mission tables keep storing mission state and the Mission Contract JSON. v1.1 references can be carried in additive Mission Contract fields and event payloads.

A new database table is therefore **not approved by this preparation**. If implementation proves that repository-backed artifacts cannot satisfy a blocking contract, the executor must stop that design path and return a `NO_EQUIVALENT/CONFORMANCE` finding for review before introducing new persistent runtime state.

## 8. Compatibility dimensions

### Document compatibility

- old docs/artifacts remain readable;
- historical files are not rewritten to look v1.1-native;
- derived views identify their authoritative inputs.

### Contract compatibility

- current required `McfMissionContract` fields remain unchanged;
- v1.1 fields are optional/additive for legacy readers;
- explicit version metadata is required on new v1.1 artifacts.

### Runtime compatibility

- existing v1.0 mission creation/execution tests must remain green;
- legacy mission without PIP reference must still execute when methodology pin is v1.0;
- v1.1 implementation mission must fail closed if required aligned PIP reference is missing/invalid.

## 9. Migration failure behavior

```text
MIGRATION ATTEMPT
   ↓
VALID?
 ┌─┴─┐
YES  NO
 │    │
activate new boundary
      preserve original
      do not activate partial successor
      compatibility mode if safe
      otherwise fail closed
```

Required guarantees:

- original artifacts preserved;
- no partial v1.1 activation;
- no silent fallback that claims v1.1 semantics;
- failure evidence recorded;
- retry is idempotent.

## 10. Rollback/downgrade

A v1.1-native project is not silently downgraded to v1.0 because v1.0 cannot represent PIP/PRR/standing-authorization semantics completely.

Rollback of implementation code may restore runtime binaries, but methodology/project semantics remain pinned and must be reconciled explicitly.

## 11. Compatibility test gates

Before implementation can be qualified:

```yaml
legacy_v1_0_mission_contract: PASS
legacy_checkpoint_read: PASS
v1_0_runtime_regression: PASS
v1_1_optional_contract_fields: PASS
v1_1_missing_aligned_pip_fail_closed: PASS
v1_0_to_v1_1_upgrade_success: PASS
v1_0_to_v1_1_upgrade_failure_preserves_original: PASS
no_historical_rewrite: PASS
no_parallel_runtime: PASS
```

## 12. Migration verdict

```yaml
strategy: EXPLICIT_BOUNDARY_MIGRATION
mass_migration: FORBIDDEN_BY_DEFAULT
historical_rewrite: FORBIDDEN
legacy_support: REQUIRED
initial_new_database_state: NOT_JUSTIFIED
repository_backed_project_artifacts: RECOMMENDED
implementation_authorized: false
```
