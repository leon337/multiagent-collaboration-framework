# MCF → Control Bridge G2-B — preparation contract

Status: **PREPARATION ONLY — NO REAL NODE-01 WRITE AUTHORIZATION**

Original design baseline read on 2026-08-22, reconciled locally on 2026-08-23:

- MCF `main`: `87c7f24d0d0240207bd694ae3ebbfe2642e6a774`.
- original cloud-infrastructure G2-B PR #11 head used for the preparation:
  `fbef3d407dbd9b7947b6c100a63d098eaebe2b6a`;
- exact successful disposable Task 8 candidate:
  `570779b75ba41ac3725ef16bc65a163e01631a1c`;
- reconciled Cloud context/evidence head:
  `28b3894387b11580f8690293ff4a467f90d213cf`;
- Task 8 is `PASS_DISPOSABLE_NOTEBOOK_DOCKER` with 13/13 markers, while Tasks 9/10,
  MCF mutating transport, NODE-01 execution and production authorization remain closed.

This document consumes the existing G2-B contract. It does not modify, replace, approve, or reimplement the Control Bridge.

## Boundary

```text
MCF MissionRuntime
  -> Human Delegation Firewall / PermissionEngine
  -> ExternalActionDispatcher / durable attempt ledger
  -> future ControlBridgeG2bAdapter (not registered by this preparation)
  -> exact G2-B request envelope
  -> Control Bridge (execution boundary)
  -> exact G2-B public result
  -> correlation + EvidenceValidator policy
  -> MCF receipt / event ledger / handoff
```

Forbidden shortcuts: direct SSH, arbitrary shell, root, direct NODE-01 filesystem mutation, alternate VPS control channel, sudoers/helper bypass, hidden transport, production mutation, or treating dispatch input as authorization proof.

## Contract consumed from G2-B

Request protocol: `MCF_WORKSPACE_MUTATION_V1`.

Fixed bridge identity/boundary:

- `mission_id = CONTROL-BRIDGE-G2B-PILOT`;
- `declared_actor = MESTRE_MCF`;
- environments: `dev | staging`;
- operations: `workspace.write | rollback | status | revoke`;
- write requires `path`, UTF-8 `content` <= 65,536 bytes, and an `ABSENT` or SHA-256 precondition;
- rollback requires `original_request_id`;
- status/revoke have empty arguments;
- unexpected fields fail closed.

Result protocol: `MCF_WORKSPACE_MUTATION_RESULT_V1` with statuses `PASS`, `REFUSED`, `CONFLICT`, `FAILED`, `TIMEOUT`, `ROLLED_BACK`, `REVOKED`.

The MCF MUST NOT append mission/permission/SHA metadata to the bridge request because the G2-B parser rejects unexpected fields. MCF governance metadata is bound in a separate durable correlation record.

## MCF correlation binding

Before dispatch, MCF must bind:

- MCF mission id and phase id;
- MCF agent id;
- permission profile and durable permission reference;
- explicit permission decision and authorized scope;
- exact lowercase 40-character MCF source SHA;
- bridge request id;
- fixed bridge mission/declared actor;
- project/environment;
- operation.

`prepareControlBridgeG2bDispatch()` creates the exact bridge request plus `MCF_CONTROL_BRIDGE_CORRELATION_V1`. The preparation module has no transport and is not registered in `AdapterRegistry`.

A future live adapter should persist this correlation through the existing dispatcher mutation/reconciliation boundary before external mutation becomes possible.

## Response normalization

| G2-B status | MCF normalized outcome | success receipt eligible |
|---|---|---|
| `PASS` | `SUCCESS` | yes, after evidence validation |
| `REFUSED` | `REJECTED` | no |
| `CONFLICT` | `CONFLICT` | no |
| `FAILED` | `INFRA_ERROR` | no |
| `TIMEOUT` | `TIMEOUT` | no; reconcile before retry |
| `ROLLED_BACK` | `ROLLED_BACK` | yes, after evidence validation |
| `REVOKED` | `REVOKED` | yes, after evidence validation |

A transport exception must map to an external-action failure, not a synthetic successful bridge receipt. Timeout or an indeterminate provider effect must use the runtime's existing `UNKNOWN`/reconciliation semantics; blind retry is forbidden.

## Receipt/event eligibility

An external G2-B execution may become a successful MCF receipt/event only when ALL applicable checks pass:

1. permission was accepted by the current MCF permission boundary before dispatch;
2. durable correlation exists before a mutation-capable call;
3. result protocol and public shape are valid;
4. result request id equals the prepared request id;
5. bridge mission and declared actor equal the frozen G2-B values;
6. project and operation equal the prepared request;
7. canonical `request_digest` is present;
8. current MCF source SHA equals the source SHA stored in correlation;
9. replay marker is explicit; replay may only reuse the identical correlated request identity;
10. terminal status is receipt-eligible (`PASS`, `ROLLED_BACK`, or `REVOKED`);
11. required bridge evidence can be verified and retained without secrets;
12. Evidence Validator accepts the provider-specific domain evidence;
13. ledger transition is persisted successfully.

Failure of any binding/evidence check MUST NOT produce a success receipt. Missing evidence, wrong SHA, inconsistent response, conflicting replay, or ledger uncertainty fail closed and require review/reconciliation.

## Failure handling

- **Rejection:** persist failure/rejection evidence; do not reclassify as success.
- **Timeout:** treat effect as potentially unknown when a request may have crossed the bridge boundary; reconcile using request id before retry.
- **Rollback:** only the bridge `rollback` operation against the exact original request id; validate `ROLLED_BACK` evidence.
- **Revoke:** only the bridge `revoke` operation; validate `REVOKED` evidence. Reissue is a separate governed authority flow and never implicit.
- **Unknown operation/payload:** reject locally before transport, then expect bridge fail-closed behavior independently.
- **Infrastructure error:** classify as infrastructure/external-action failure; never fabricate a bridge result.
- **Replay:** identical correlated replay can be evidence of idempotence; same request id with changed request must remain conflict/refusal.

## Future real-write gate

`PREPARATION_PASS` is NOT real-write authorization. Before the first future `workspace.write`, all of the following must be independently evidenced:

- applicable G2-B lab PASS at the exact candidate SHA plus the still-pending Tasks 9/10;
- exact operation explicitly permitted by the current bridge/grant;
- MCF identity/authority verifiable through Human Delegation Firewall + PermissionEngine;
- authorized scope/project/environment;
- exact MCF source SHA/context bound in durable correlation;
- bridge request id reserved against replay/conflict;
- audit/event ledger operational;
- evidence/receipt validation operational for this adapter;
- rollback and revoke paths applicable and tested;
- transport uses only the approved Control Bridge path;
- no root/arbitrary shell/sudoers/helper bypass;
- applicable human/central gate persisted for the exact boundary/SHA;
- central audit confirms no newer G2-B contract drift invalidates this preparation.

Green CI, adapter existence, a merged PR, or G2-B appearing functional are individually insufficient.

## Contract drift rule

Task 8 passed only in the exact disposable, network-isolated lab candidate above. Before any
activation, compare the future Tasks 9/10 result and final request/result protocol, operation
allowlist, public result fields, grant semantics, workflow transport, helper/sudoers boundary,
replay rules and evidence requirements against this preparation. Any material mismatch returns
the integration to `REQUIRES_REVIEW` until schemas/tests are updated.

## Risks

- **Contract drift after the Task 8 lab PASS:** mitigated by exact-SHA revalidation at Tasks 9/10.
- **Permission metadata not visible to G2-B:** intentional separation; mitigated by durable MCF correlation plus independent bridge grant validation.
- **Timeout/partial effect:** must use UNKNOWN/reconciliation semantics; no blind retry.
- **Replay ambiguity:** bind request id + digest + operation/project + source SHA; changed payload under same id is not success.
- **Evidence overclaim:** only terminal validated evidence becomes a success receipt.
- **Accidental activation:** preparation module has no network/SSH/shell transport and is not registered as a runtime adapter.

## Prepared artifacts

- runtime preparation module: `control-bridge-g2b.preparation.ts`;
- unit/contract tests: `control-bridge-g2b.preparation.test.ts`;
- request schema: `schemas/mcf-control-bridge-g2b-request.schema.json`;
- result schema: `schemas/mcf-control-bridge-g2b-result.schema.json`;
- operational runbook: `MCF-CONTROL-BRIDGE-G2B-RUNBOOK.md`.
