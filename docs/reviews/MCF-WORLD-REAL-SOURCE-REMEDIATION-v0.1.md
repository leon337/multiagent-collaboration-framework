# MCF World Real-Source Integration v0.1 — Remediation Summary

This document prepares the exact-SHA re-gate after the initial Sofia/Emily CONDITIONAL review.

## Initial findings

Sofia:
- mission-record facts incorrectly used local Git HEAD as mission-record revision.

Emily:
- captured GitHub/local-Git snapshot facts were always marked FRESH, regardless of snapshot age.

Additional executed smoke:
- human ContextSlice exposed STALE refs, while AgentContextPacket did not explicitly carry UNKNOWN/STALE attention refs.

## Remediation

1. Source revisions are source-specific byte digests.
2. Snapshot freshness is deterministic from observedAt + TTL + explicit evaluationTime.
3. AgentContextPacket now carries attention.unknownRefs and attention.staleRefs.
4. Attention refs mirror ContextSlice uncertainty refs.
5. No networking, polling, backend, DB or background refresh was introduced.

## Regression

PASS:
- World Model contract verifier;
- JSON Schema examples/negative inference;
- adapter v0.1;
- consumer v0.2 consistency;
- full architecture pipeline;
- real-source adapter nominal + negative cases;
- fresh/stale generated schema validation;
- stale human/MESTRE browser consistency.

## Boundary

Findability R remains frozen and NOT_STARTED_DEFERRED.

This remediation does not authorize Product GO, persistent World service, mutation, production or 3D.
