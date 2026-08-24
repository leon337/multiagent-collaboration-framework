# Runbook — MCF → Control Bridge G2-B

Status: **PREPARATION ONLY**. This runbook does not authorize or instruct a real NODE-01 write.

## Before any G2-B activation

1. Work only on the MCF preparation branch/PR.
2. Keep the preparation module unregistered from live `AdapterRegistry` transport.
3. Run unit/contract tests and schema checks in CI.
4. Bind the exact MCF source SHA and the Task 8 lab candidate
   `570779b75ba41ac3725ef16bc65a163e01631a1c` used for contract comparison.
5. Treat all real-write, grant/reissue, production, merge, and NODE-01 mutation gates as closed unless independently authorized in their own authority flow.

## Final contract reconciliation after Tasks 9/10

Task 8 has a 13/13 PASS only in a disposable, network-isolated local lab. At the exact future
Tasks 9/10 candidate SHA, compare:

- `control_plane/g2b/protocol.py` request constants/fields/operations;
- `control_plane/g2b/state.py` public receipt fields;
- `control_plane/g2b/executor.py` result statuses/error semantics;
- workflow transport and request identity binding;
- grant, replay, rollback and revoke behavior;
- installed helper and sudoers boundary;
- evidence/runbook acceptance sequence.

If any material contract changed, stop with `REQUIRES_REVIEW`; update MCF schemas/tests before any live adapter is activated.

## Live-adapter activation prerequisites

Activation is a separate change and must not be folded silently into this preparation PR. It must:

1. implement only the approved Control Bridge transport;
2. register a single adapter in the existing External Action Dispatcher path;
3. call the existing Permission Engine/Human Delegation Firewall before dispatch;
4. persist MCF correlation/reconciliation metadata before mutation-capable execution;
5. enforce exact request-id, mission, actor, project, operation and source-SHA binding;
6. convert bridge evidence to an MCF receipt only after Evidence Validator acceptance;
7. preserve `UNKNOWN` and reconciliation behavior for partial/timeout outcomes;
8. expose no arbitrary shell, root, direct SSH write, helper bypass or alternate VPS control path.

## Safe validation sequence

The first validation of an activated adapter should advance from least to most sensitive, with a fresh request id for each semantic request:

1. local preparation tests;
2. mock transport tests;
3. schema/fixture validation;
4. bridge `status` through the approved transport only after applicable read/transport gate;
5. verify request/result correlation and MCF ledger evidence;
6. verify `revoke`/rollback handling in the approved non-production pilot boundary when separately authorized;
7. only then consider the first bounded `workspace.write` under its explicit real-write gate.

Do not use a real write merely to prove connectivity.

## Incident/rejection handling

- `REFUSED` / permission denial: stop; persist evidence; do not retry by weakening scope.
- `CONFLICT`: treat as request-id/replay conflict; inspect correlation/digest before any new request.
- `TIMEOUT`: assume effect may be unknown; reconcile by the same request identity before retry.
- `FAILED`: classify infrastructure/provider error; do not synthesize success.
- missing evidence or inconsistent response: reject receipt and block progression.
- wrong MCF source SHA: reject receipt; re-establish an exact-SHA authorization/correlation.
- `ROLLED_BACK`: require exact original-request correlation and evidence of restored state.
- `REVOKED`: stop further mutation attempts; reissue is never implicit.

## Emergency boundary

The MCF side never performs NODE-01 emergency root actions. Emergency bridge shutdown/recovery remains owned by the Control Bridge runbook and its authority boundary. The MCF must surface the block and preserve evidence; it must not invent a second recovery channel.

## Audit checklist for MESTRE CENTRAL

- preparation branch/PR targets current MCF `main`;
- no cloud-infrastructure code changed by this mission;
- no live adapter registration/transport present;
- Task 8 exact lab SHA recorded and future Tasks 9/10 SHA re-read before activation;
- contract tests include negative and replay/SHA/evidence cases;
- Permission Engine and Human Delegation Firewall remain in the path;
- dispatcher/ledger/evidence model is reused, not duplicated;
- future write gate is explicit and still closed;
- merge and production remain independent gates.
