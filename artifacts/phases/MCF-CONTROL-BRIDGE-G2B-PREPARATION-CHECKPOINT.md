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
