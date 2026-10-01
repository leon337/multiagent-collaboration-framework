# ADR — MCF Provider-Independent Agent Execution Boundary

Status: ACCEPTED FOR IMPLEMENTATION BY LEANDRO — 2026-10-01
Mission: MCF-AGENT-HARNESS-INTEROP-001
Scope: provider-independent agent execution contract

## Decision

MCF separates the semantic identity of an Agent Role from the concrete Execution Provider.

The MCF control plane owns mission identity, authority, requested capabilities, lifecycle interpretation and evidence reconciliation. A provider adapter owns translation to the provider's execution semantics.

## Implemented invariants

1. missionId and runId in the authority envelope must match the execution request.
2. The requested action must be explicitly present in allowedActions.
3. A provider outside providerScope is rejected.
4. Expired authority is rejected.
5. Human approval cannot be represented as a non-human issuer.
6. Requested provider capabilities must be explicitly advertised.
7. Provider execution receives durable missionId + runId.
8. Interrupt/cancel remain explicit lifecycle states.
9. Uncertain side effects are represented as EFFECT_UNKNOWN; they are not silently converted to success or failure.
10. Provider evidence carries provenance and is returned as evidence, not authorization.
11. Provider selection is deterministic: zero matches or multiple matches fail closed.

## Deliberately not implemented in this phase

- provider-specific Dots/Work/Codex adapters;
- production provider activation;
- automatic scheduling;
- persistent storage for the new provider-run handle;
- cross-provider migration of a live execution;
- bypass of existing Human Delegation Firewall / Permission Engine;
- production deployment.

## Rationale

The current MCF runtime already has action adapters, evidence validation, receipts, mission persistence and authority controls. The new boundary prevents those existing mechanisms from becoming coupled to one provider's agent-harness lifecycle.

The contract also treats cancellation as a reconciliation problem: a cancellation request is not proof that an external side effect did not occur.

## Verification plan

The contract tests cover role/provider separation, authority scope, expiration, capability matching, deterministic adapter resolution, interrupt/cancel semantics and evidence provenance. Full repository CI remains the release gate.

## References

- Mission research: artifacts/phases/PHASE-00-AGENT-HARNESS-INTEROP-001/PHASE-00-REPORT.md
- Addendum: artifacts/phases/PHASE-00-AGENT-HARNESS-INTEROP-001/PHASE-00-ADDENDUM-2026-10-01.md
- Alternatives: artifacts/phases/PHASE-00-AGENT-HARNESS-INTEROP-001/PHASE-00-ALTERNATIVES-NOTE.md
