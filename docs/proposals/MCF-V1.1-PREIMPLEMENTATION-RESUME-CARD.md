# MCF v1.1 — Implementation Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR A v1.1 APÓS O HUMAN_GATE DE IMPLEMENTAÇÃO.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO
- Preparação/autoridade branch: `planning/mcf-v1.1-preimplementation-conformance`
- Executor técnico autorizado: `CODEX_LOCAL`

## Estado atual

```yaml
target_version: v1.1.0
discovery: COMPLETE_20_OF_20
preimplementation_preparation: COMPLETE
implementation_human_gate: APPROVED_OPTION_D_BY_LEANDRO

implementation_authorized: true
codex_implementation_authorized: true
current_execution_window: I1_CORRECTION_REQUIRED
last_codex_candidate: 89035db6bfc1022abcc622b1238c86033409180d
last_technical_gate: RETORNAR_PARA_CORRECAO
I2_authorized: false
merge_to_main_authorized: false
release_authorized: false
production_authorized: false
prototype_product_path_authorized: false
```

Controlled fixtures, test harnesses and disposable qualification environments required by implementation/qualification are allowed; this does not authorize a separate product prototype or production path.

## Live baselines at the authorization gate

```yaml
main_at_gate: b91823a947715e09d69c72999e2278523f2259be
preimplementation_before_authorization_record: 9496461213c2ee4019bb136b58c6695ac5c0c86f
```

The preimplementation branch advanced after the gate because the authorization record, implementation mission and later technical-gate receipts were persisted. Codex MUST fetch live GitHub before every new execution window and record the exact current implementation HEAD/baseline.

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

## Current Codex mission

`docs/proposals/MCF-V1.1-CODEX-IMPLEMENTATION-MISSION-001.md`

Mission:

```yaml
mission: MCF-V1.1-CODEX-IMPLEMENTATION-001
executor: CODEX_LOCAL
full_authorized_map: I1_TO_I10
current_window: I1_CORRECTION_REQUIRED
mestre_review_required_after_correction: true
new_leandro_gate_for_correction: false
```

## Latest technical gate

`docs/proposals/MCF-V1.1-I1-TECHNICAL-GATE-001.md`

MESTRE verified GitHub candidate:

```yaml
implementation_branch: feat/mcf-v1.1-project-intake-continuity
candidate_head: 89035db6bfc1022abcc622b1238c86033409180d
base: 5dc055cb7d402e5774b40b82723a8f008cd00e80
ahead_by: 3
behind_by: 0
changed_paths: 19
gate: RETORNAR_PARA_CORRECAO
```

Blocking I1 finding: current PIP/PRR schemas require the `provenance` property but allow empty provenance arrays in material assertion locations. The PIP valid fixture itself contains multiple `CLEAR`/`BLOCKING` dimensions with `provenance: []`. This violates the approved evidence/provenance boundary.

Required before I2:

- non-empty provenance for PIP dimension records;
- non-empty provenance for PIP technical delegations;
- non-empty provenance for PIP assumptions;
- non-empty provenance for PRR observations;
- corrected valid fixtures;
- negative tests for empty provenance;
- focused + relevant I1 regression rerun;
- successor commit/push and new exact-head receipt.

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
4. `docs/proposals/MCF-V1.1-DISCOVERY-CHECKPOINT-020.md`
5. `docs/proposals/MCF-V1.1-DECISION-LEDGER-001.md`
6. `docs/proposals/MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001.md`
7. `docs/proposals/MCF-V1.1-TECHNICAL-CONTRACTS-001.md`
8. `docs/proposals/MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001.md`
9. `docs/proposals/MCF-V1.1-IMPLEMENTATION-PLAN-001.md`
10. `docs/proposals/MCF-V1.1-QUALIFICATION-PLAN-001.md`
11. `docs/proposals/MCF-V1.1-PREIMPLEMENTATION-CHECKPOINT-001.md`

## Execution flow

```text
LEANDRO OPTION D APPROVED
        ↓
CODEX_LOCAL
        ↓
I1 candidate 89035db6
        ↓
MESTRE TECHNICAL REVIEW
        ↓
RETORNAR_PARA_CORRECAO
        ↓
I1 provenance correction
        ↓
focused + relevant regression
        ↓
commit + push + new receipt
        ↓
MESTRE technical gate
        ↓
PASS → I2
```

## HUMAN_GATE policy now

LEANDRO does **not** need to approve this correction or each normal technical phase. The implementation mission already has authorization inside the approved envelope.

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

`MCF-V1.1-PREIMPLEMENTATION-CHECKPOINT-001.md` correctly records the earlier state where implementation authorization was still pending. It remains immutable historical evidence and must not be rewritten to pretend the later gate had already happened.

A non-canonical empty auxiliary branch `planning/mcf-v1.1-preimplementation-conformance-tmp` also exists from a connector operation. It is not the source of truth and contains no authorized preparation work.

## Comando mínimo de retomada

> `Mestre, retome a v1.1 pelo Implementation Resume Card e pelo último technical gate. Verifique GitHub live. A Opção D já autorizou a implementação; I1 está em correção e I2 continua bloqueado até novo PASS.`
