# MCF World Real-Source Integration v0.1 — Final Gate

Audited SHA: c26cbe8261d8fdc791ea00103fa807d1c6fb83d3

## Sofia — PASS

Closed:
- mission-record and project-registry no longer borrow local Git revision;
- each captured source has an independent revision identity;
- provider/local snapshot freshness is deterministic from observedAt + TTL + explicit evaluationTime;
- AgentContextPacket uncertainty attention mirrors ContextSlice UNKNOWN/STALE refs.

No Critical/High/Medium blocker remains.

Non-blocking future note:
- evaluationTime earlier than observedAt should eventually diagnose clock skew instead of clamping age to zero.

## Emily — PASS

Verified:
- FRESH/STale boundary is deterministic and tested on both sides;
- STALE values remain inspectable;
- source-specific revisions remain independent;
- input-set digest is technical and not presented as a canonical source revision;
- packet attention carries machine-readable UNKNOWN/STALE without duplicating evidence payloads;
- no polling, backend, database, event store, write-back or authority engine;
- owner unavailable and cross-source divergence remain explicit;
- Findability R remains NOT_STARTED_DEFERRED and isolated.

## Authorized continuation

Read-only operational-context integration with additional real MCF sources and richer real mission context.

Must preserve:

    owned/canonical sources
      -> captured observations
      -> ephemeral typed adapters
      -> disposable read model
      -> human + agent read-only consumers

Still not authorized:
- Product GO;
- persistent World service;
- World-owned lifecycle;
- mutation/write-back;
- production;
- Dual Browser actuation;
- 3D.
