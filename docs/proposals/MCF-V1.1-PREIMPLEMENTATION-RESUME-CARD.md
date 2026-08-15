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
current_execution_window: I2_REPOSITORY_BACKED_CANONICAL_PROJECT_ARTIFACT_LAYER
I2_authorized: true
I3_authorized: false
merge_to_main_authorized: false
release_authorized: false
production_authorized: false
prototype_product_path_authorized: false
```

Controlled fixtures, test harnesses and disposable qualification environments required by implementation/qualification are allowed; this does not authorize a separate product prototype or production path.

## Live baselines

At the latest I1 gate verification:

```yaml
main_live: b91823a947715e09d69c72999e2278523f2259be
implementation_branch_live: 1d4bea35105b6014e036b4c8f1fd0a3a4312133e
```

Codex MUST fetch live GitHub before every new execution window and record the exact current implementation HEAD/baseline.

## Canonical authorization

`docs/proposals/MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001.md`

LEANDRO selected **Option D**:

```text
FULL v1.1 IMPLEMENTATION MISSION AUTHORIZED
LOCAL_FIRST
I1 -> I10 AUTHORIZED INSIDE APPROVED ENVELOPE
REMOTE IMPLEMENTATION BRANCH/CHECKPOINTS AUTHORIZED BY PHASE GATES
PR AUTHORIZED WHEN PLAN/GATES ALLOW
CI + QUALIFICATION AUTHORIZED
MERGE != AUTHORIZED
RELEASE != AUTHORIZED
PRODUCTION != AUTHORIZED
```

## I1 history and result

Initial candidate:

```yaml
head: 89035db6bfc1022abcc622b1238c86033409180d
gate: RETORNAR_PARA_CORRECAO
reason: EMPTY_PROVENANCE_ALLOWED_FOR_MATERIAL_ASSERTIONS
```

Historical gate:

`docs/proposals/MCF-V1.1-I1-TECHNICAL-GATE-001.md`

Corrected candidate:

```yaml
head: 1d4bea35105b6014e036b4c8f1fd0a3a4312133e
correction_commit: fix(schemas): require provenance for material claims
result: PASS
blocking_findings: 0
```

Accepted gate:

`docs/proposals/MCF-V1.1-I1-TECHNICAL-GATE-002.md`

I1 is closed as PASS. The corrected schemas enforce non-empty provenance for PIP dimensions, technical delegations, assumptions and PRR observations while preserving human-decision and PRR FACT evidence requirements.

## Current window — I2

Canonical execution-window document:

`docs/proposals/MCF-V1.1-I2-EXECUTION-WINDOW-001.md`

I2 objective:

```text
Repository-backed canonical project artifact layer
```

Required boundary:

- canonical PIP/PRR/alignment-receipt paths;
- JSON-schema validation;
- deterministic SHA-256 digest and verification;
- aligned PIP immutability;
- PRR revision immutability;
- alignment receipt immutability;
- local-uncheckpointed vs remotely checkpointed distinction;
- exact revision load/verification;
- atomic local writes;
- no new DB table;
- no parallel runtime;
- no I3 implementation before technical gate.

Gate I2 requires:

```yaml
pip_round_trip: PASS
prr_round_trip: PASS
alignment_receipt_round_trip: PASS
aligned_revision_mutation_rejected: PASS
prr_revision_mutation_rejected: PASS
alignment_receipt_mutation_rejected: PASS
digest_mismatch_rejected: PASS
schema_invalid_write_rejected: PASS
local_uncheckpointed_not_remote: PASS
canonical_paths: PASS
atomic_local_write_behavior: PASS
legacy_I1_regression: PASS
new_database_state: NO
parallel_runtime_created: NO
```

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

## Arquivos obrigatórios de leitura

1. `docs/proposals/MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001.md`
2. `docs/proposals/MCF-V1.1-CODEX-IMPLEMENTATION-MISSION-001.md`
3. `docs/proposals/MCF-V1.1-I1-TECHNICAL-GATE-001.md`
4. `docs/proposals/MCF-V1.1-I1-TECHNICAL-GATE-002.md`
5. `docs/proposals/MCF-V1.1-I2-EXECUTION-WINDOW-001.md`
6. `docs/proposals/MCF-V1.1-DISCOVERY-CHECKPOINT-020.md`
7. `docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md`
8. `docs/proposals/MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001.md`
9. `docs/proposals/MCF-V1.1-TECHNICAL-CONTRACTS-001.md`
10. `docs/proposals/MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001.md`
11. `docs/proposals/MCF-V1.1-IMPLEMENTATION-PLAN-001.md`
12. `docs/proposals/MCF-V1.1-QUALIFICATION-PLAN-001.md`
13. `docs/proposals/MCF-V1.1-PREIMPLEMENTATION-CHECKPOINT-001.md`

## Execution flow

```text
LEANDRO OPTION D APPROVED
        ↓
I1 contracts/schemas
        ↓
initial I1 candidate
        ↓
MESTRE finding
        ↓
I1 correction
        ↓
I1 PASS @ 1d4bea35105b6014e036b4c8f1fd0a3a4312133e
        ↓
I2 AUTHORIZED
        ↓
repository-backed canonical artifact layer
        ↓
I2 tests + commit + push + receipt
        ↓
MESTRE technical gate
        ↓
PASS → I3
```

## HUMAN_GATE policy

LEANDRO does **not** need to approve each normal technical phase. The implementation mission is already authorized inside the approved envelope.

Return to LEANDRO only for a non-delegable HUMAN_GATE or material crossing of the approved boundary, including merge/release/production authority when reached.

## Hard boundaries

```text
NO DIRECT MAIN WRITE
NO MERGE WITHOUT NEW AUTHORITY
NO RELEASE
NO PRODUCTION DEPLOY
NO SILENT Q1-Q20 REDEFINITION
NO PARALLEL MISSION RUNTIME
NO PARALLEL PERMISSION/HDF
NO PARALLEL GENERIC CHECKPOINT ENGINE
NO NEW PROJECT-STATE DATABASE WITHOUT CONFORMANCE REASSESSMENT
TEAM_FIRST FOR ORDINARY TECHNICAL AMBIGUITY
```

## Historical note

`MCF-V1.1-PREIMPLEMENTATION-CHECKPOINT-001.md` correctly records the earlier state where implementation authorization was still pending. It remains immutable historical evidence.

A non-canonical empty auxiliary branch `planning/mcf-v1.1-preimplementation-conformance-tmp` exists from an earlier connector operation. It is not the source of truth and contains no authorized preparation work.

## Comando mínimo de retomada

> `Mestre, retome a v1.1 pelo Implementation Resume Card e pelo último technical gate. Verifique GitHub live. I1 passou no HEAD 1d4bea35105b6014e036b4c8f1fd0a3a4312133e e I2 está autorizado; merge/release/produção continuam bloqueados.`