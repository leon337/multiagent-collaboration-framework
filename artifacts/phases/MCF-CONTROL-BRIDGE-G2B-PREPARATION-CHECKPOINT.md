# Checkpoint — MCF → Control Bridge G2-B preparation

Date: 2026-08-22

State at creation: `REQUIRES_REVIEW` pending CI and central audit.

## Objective

Prepare the MCF consumer side of the G2-B Control Bridge before G2-B final technical PASS, without performing or authorizing any real NODE-01 write.

## Live baselines inspected

- MCF `main`: `87c7f24d0d0240207bd694ae3ebbfe2642e6a774`.
- cloud-infrastructure `main`: `f2e01dfa1247d648a4c6e2ecf5ecc0f57ce0db8b`.
- active cloud G2-B PR #11 head during design: `fbef3d407dbd9b7947b6c100a63d098eaebe2b6a`.
- G2-B Task 8: in progress at inspection time; real write/grant/production gates not authorized.

## Prepared

- exact G2-B request/result contract documentation;
- separate MCF governance-correlation binding for mission, agent, permission reference, source SHA, project, operation and request id;
- fail-closed preparation/normalization module with no transport;
- negative/contract unit tests;
- request and result JSON schemas;
- future real-write gate;
- operational runbook;
- contract-drift rule requiring revalidation at the final G2-B PASS SHA.

## Explicit non-capabilities

- no adapter registered in `AdapterRegistry`;
- no SSH/network/shell transport;
- no NODE-01 access;
- no grant issuance/reissue;
- no root/sudoers/helper changes;
- no cloud-infrastructure changes;
- no production release;
- no merge.

## Acceptance semantics

This checkpoint may become `PREPARATION_PASS` only after the preparation branch is persisted, tests/checks are green or otherwise independently verified, the active G2-B state is re-read live, and no prohibited capability was introduced.

`PREPARATION_PASS != REAL_WRITE_AUTHORIZED`.

## Next gate after G2-B technical PASS

Reconcile this preparation against the exact approved G2-B SHA. If compatible, prepare a separate reviewed activation change for the real adapter/transport and its Evidence Validator integration. The first real mutation still requires the explicit real-write authority/gate; it is not inherited from this checkpoint.

## Post-preparation live audit — 2026-08-22 (historical, superseded below)

### MCF preparation evidence

The persisted preparation head `c22fc5aadd70ee2de2a38f1d5532f2400ab20700` completed all five observed pull-request workflows successfully:

- Documentation validation — run `32605416599` — `success`;
- Rede Social Container Smoke — run `32605416591` — `success`;
- Rede Social Foundation — run `32605416574` — `success`;
- MCF v1.1 Qualification — run `32605416558` — `success`;
- MCF Production Readiness — run `32605416594` — `success`.

This supports `PREPARATION_PASS` for the consumer-side preparation only.

### G2-B live reconciliation

The active cloud G2-B PR #11 still points to candidate `fbef3d407dbd9b7947b6c100a63d098eaebe2b6a` and remains draft/unmerged.

Newer PR evidence than the original checkpoint shows the disposable Task 8 attempt terminating with:

```text
TASK8_STATUS=2
G2B_DISPOSABLE_TEST_ABORTED stage=apply_g2b exit=2 cleanup=0
TASK8_ACCEPTANCE=FAIL_OR_NOT_TERMINAL
```

The resource update itself reported `RESOURCE_UPDATE_PASS`, but zero lifecycle acceptance markers were produced before the abort. The exact root cause of `apply_g2b exit=2` is **NÃO VERIFICADA** by this MCF-side audit and must not be invented.

The durable cloud state file on that same branch contains older Task 8 state than the later PR evidence. This audit therefore treats the later PR execution evidence as the current observational result while leaving cloud canonical-state reconciliation to the G2-B mission owner.

### Current decision

- MCF preparation: `PREPARATION_PASS`.
- G2-B technical acceptance: `NOT_PASS`.
- MCF live adapter/transport activation: `BLOCKED_G2B_TASK8`.
- NODE-01 real write: `NOT_AUTHORIZED`.
- real grant/reissue: `NOT_AUTHORIZED`.
- production mutation: `NOT_AUTHORIZED`.
- merge: not performed by this mission.

No executable integration capability is added by this audit update.

### Next allowed step

Wait for the G2-B mission to produce a terminal technical PASS on an exact candidate SHA. Then re-read the approved `protocol.py`, `state.py`, executor, workflow, grant/replay/rollback/revoke boundaries and evidence contract at that exact SHA. Any material drift from the preparation baseline requires `REQUIRES_REVIEW`; compatibility alone does not authorize a real write.

## Superseding local lab reconciliation — 2026-08-23

The Cloud reconciliation branch `codex/context-bridge-reconcile-20260823` at
`28b3894387b11580f8690293ff4a467f90d213cf` preserves the mature G1/G2-A lineage and
supersedes the failed Task 8 observation above for the exact disposable candidate
`570779b75ba41ac3725ef16bc65a163e01631a1c`.

The candidate completed the network-isolated Ubuntu 24.04 Docker harness on the developer
notebook with exit 0, cleanup PASS and all 13 ordered acceptance markers: identity, direct-write
refusal, bounded grant, write, replay, request-id conflict, concurrency, audit, rollback, final
state, revoke, post-revoke refusal and bounded cleanup. The reconciled Cloud worktree also passed
381/381 unit tests. Its aggregate historical scanner remains environmentally blocked before test
execution by two pre-existing zero-byte loose objects in the shared Git object database; that
database was deliberately left untouched.

### Current decision

- MCF preparation: `PREPARATION_PASS`.
- G2-B Task 8 local disposable acceptance: `PASS_13_OF_13`.
- G2-B lifecycle: `LAB_VALIDATED_INACTIVE`.
- Tasks 9/10: `NOT_STARTED`.
- Context-to-G2-B mutating transport: `NOT_IMPLEMENTED`.
- effective MCF use and real NODE-01 grant/write/rollback/revoke: `NOT_EXECUTED`.
- activation, NODE-01 access and production mutation: `NOT_AUTHORIZED`.

This newer lab result removes the historical Task 8 implementation blocker; it does not open the
activation gate. The next allowed work is the separate read-only local integration and future
Tasks 9/10 review. Any real mutation still requires exact-SHA contract review, durable MCF
governance correlation and a new explicit human authorization.
