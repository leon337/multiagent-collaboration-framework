# MCF-AGENT-WORKSPACE-001 — Phase 3 Operation Intent v0.1 Proof

Date: 2026-09-26

Product implementation SHA:
da96dae8398f119fbffdc91a3d1fb5742a6997bf

Product evidence SHA:
11283eec3549b207617f7b38bfed03895f009463

Final product docs SHA:
ea736b4cd704c7c219f3b41b6a07a6368b3544c0

Decision:
PASS_PREVIEW_ONLY_ZERO_EXECUTION_AUTHORITY

## Evidence accepted

- 50/50 regression tests PASS.
- Real Patrícia attachment.
- Two validations of one renderer-only draft.
- Distinct intentIds, same digest.
- executionAuthorized=false.
- Main rederived binding/freshness/store/revision/attachmentEpoch.
- Renderer could not supply session/partition claims.
- ChatGPT real composer unchanged before/after validation.
- Payload marker absent from ChatGPT body.
- Detach invalidated preview by attachment epoch.
- Plaintext marker absent from persisted Workspace state/config, both physical stores, repo and log while alive and after exit.
- Supervised handoff/fallback remained correct.

## Architecture gate

Sofia: PASS.

No execution/send capability authorized.

## Independent audit

Emily: PASS.

Critical: none.
High: none.
Blocking Medium: none.

## Boundary

Authorized:
- renderer draft memory;
- preview validation;
- digest + metadata;
- invalidation on context change.

Not authorized:
- typing;
- paste;
- Enter;
- Send/click;
- DOM composer mutation;
- mutating network operation;
- automatic message;
- execution capability/token;
- payload persistence;
- Voice Hub payload;
- other agents/providers;
- production;
- cutover.

## Next allowed slice

Operation Intent v0.2 design/contract only.

Any mutating implementation requires a new architecture and independent evidence gate before a real effect.
