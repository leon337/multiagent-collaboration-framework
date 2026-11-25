# MCF-AGENT-WORKSPACE-001 — E1 Real-Experiment Candidate Reconciliation

Date: 2026-09-26

Decision:

CANDIDATE_PREPARED_PENDING_EXACT_SHA_GATE

Product SHA:

7823927100edc3ef5af0f219510978d74d60f24b

## Accepted current state

- design package exists;
- aggregate design decision is conditional;
- implementation-candidate preparation is authorized;
- exact candidate is hard-disabled against the real ChatGPT target;
- clean-SHA regression passes;
- synthetic HTTP and WebSocket containment passes;
- normal product remains disconnected from experimental/e1-real.

## Open gate

The design gate contains one Medium:

NON_HTTP_SEND_CONTAINMENT_MUST_BE_CLOSED_BEFORE_REAL_EXPERIMENT_AUTHORIZATION

The exact-SHA implementation/authorization gate must determine whether the candidate's session egress seal and synthetic/adversarial evidence close this Medium.

## No effect authority

This reconciliation does not authorize:
- real E1 mutation;
- real execCommand;
- effect-authorizing modal against Patrícia;
- automatic retry;
- E2;
- Enter/Send;
- production or cutover.
