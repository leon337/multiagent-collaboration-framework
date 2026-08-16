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
I3: PASS
I3_accepted_head: 1b78235524ff93a1b93c3f5b50e6c96d29d5bf29
I4: PASS
I4_accepted_head: 162c25c4aff9c96b85ce16ebf1083c83ef906fab

current_execution_window: I5_I6_COMBINED
I5_authorized: true
I6_authorized_after_I5_self_gate_pass: true
I7_authorized: false

merge_to_main_authorized: false
release_authorized: false
production_authorized: false
```

## Important clarification

The canonical implementation plan contains I1 through I10. Therefore after I4 there are six phases remaining. LEANDRO's latest instruction is interpreted and recorded as authorization for the **next two phases, I5 and I6, to run sequentially without a MESTRE return between them**.

I7–I10 remain pending after this combined window.

Canonical combined authorization:

`docs/proposals/MCF-V1.1-I5-I6-COMBINED-EXECUTION-AUTHORIZATION-001.md`

## Latest verified implementation baseline

```yaml
main_live: b91823a947715e09d69c72999e2278523f2259be
implementation_branch_live_and_I4_accepted: 162c25c4aff9c96b85ce16ebf1083c83ef906fab
```

Codex must reverify GitHub live before editing.

## Combined execution rule

```text
I5
↓
I5 SELF-GATE
↓ PASS ONLY
COMMIT + PUSH + LOCAL_HEAD == REMOTE_HEAD
↓
I6
↓
I6 SELF-GATE
↓
COMMIT + PUSH + LOCAL_HEAD == REMOTE_HEAD
↓
STOP
↓
COMBINED RECEIPT TO MESTRE
```

If I5 is FAIL/BLOCKED, I6 must not start.

## I5 controlling specification

`docs/proposals/MCF-V1.1-I5-EXECUTION-WINDOW-001.md`

I5 covers Existing Project Reconnaissance, confirmed immutable PRR, Reality Confirmation, derived Gap Map and working Completion/Recovery Plan while preserving:

```text
READ_ONLY_FIRST
AS_IS != TO_BE
PRR != PIP
PRR != PLAN
FACT != INFERENCE
HUMAN_TECHNICAL_ASSERTION != AUTOMATIC_MACHINE_EVIDENCE
PERSISTED_PRR_REVISION = IMMUTABLE
GAP_MAP = DERIVED_REBUILDABLE_VIEW
PLAN_EXISTS != IMPLEMENTATION_AUTHORIZED
```

## I6 scope

I6 is Mission Runtime integration by extending the existing v1.0 core only:

- aligned PIP exact-pair validation for applicable v1.1 implementation missions;
- methodology pin validation;
- project entry metadata propagation;
- applicable PRR reference preservation;
- reuse of existing event ledger for project artifact references;
- trace/recovery visibility;
- legacy v1.0 mission creation/runtime path unchanged;
- no parallel runtime, event ledger or project-state DB.

## Persistent hard boundaries

```text
NO DIRECT MAIN WRITE
NO MERGE
NO RELEASE
NO PRODUCTION
NO SILENT Q1-Q20 REDEFINITION
NO PARALLEL MISSION RUNTIME
NO PARALLEL PERMISSION/HDF SYSTEM
NO PARALLEL GENERIC CHECKPOINT ENGINE
NO NEW PROJECT-STATE DATABASE WITHOUT CONFORMANCE REASSESSMENT
```

## Historical accepted gates

- I1: `MCF-V1.1-I1-TECHNICAL-GATE-002.md`
- I2: `MCF-V1.1-I2-TECHNICAL-GATE-001.md`
- I3: `MCF-V1.1-I3-TECHNICAL-GATE-002.md`
- I4: `MCF-V1.1-I4-TECHNICAL-GATE-001.md`

## Mandatory sources for the current combined run

1. `MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001.md`
2. `MCF-V1.1-CODEX-IMPLEMENTATION-MISSION-001.md`
3. `MCF-V1.1-I4-TECHNICAL-GATE-001.md`
4. `MCF-V1.1-I5-EXECUTION-WINDOW-001.md`
5. `MCF-V1.1-I5-I6-COMBINED-EXECUTION-AUTHORIZATION-001.md`
6. `MCF-V1.1-TECHNICAL-CONTRACTS-001.md`
7. `MCF-V1.1-MIGRATION-COMPATIBILITY-PLAN-001.md`
8. `MCF-V1.1-IMPLEMENTATION-PLAN-001.md`
9. `MCF-V1.1-QUALIFICATION-PLAN-001.md`
10. `MCF-V1.1-DECISION-LEDGER-001.md`

## Next return point

After I6, Codex must stop. MESTRE will inspect the combined receipt and exact remote HEAD before I7 is authorized.
