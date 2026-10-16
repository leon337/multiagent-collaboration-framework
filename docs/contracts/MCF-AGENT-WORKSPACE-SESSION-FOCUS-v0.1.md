# MCF Agent Workspace — Session Focus Contract v0.1

Status: PROPOSED FOR GATE
Mission: MCF-AGENT-WORKSPACE-001

The product copy is maintained at:

    leon337/mcf-agent-workspace:docs/SESSION-FOCUS-CONTRACT.md

## Core rule

AgentIdentity is not AgentSession.

An AgentSlot must never silently turn a recent observation into canonical session identity.

## Candidate session binding

A binding must carry at least:

- agentIdentityRef
- sessionRef
- providerRef
- legacyInstanceRef
- paneRef
- profilePartitionRef
- observedAt
- revision / freshness
- lifecycle
- selected
- bindingProvenance
- diagnostics

## Ambiguity

Multiple observations may represent:
- the same session observed more than once;
- legitimate concurrent sessions;
- stale duplicate state;
- recovery/replacement session.

If authoritative session identity cannot resolve them:

    AMBIGUOUS_BINDING

The Operational Surface must fail closed and remain unattached.

## Coverage

Unreadable/missing registry:

    PARTIAL / UNKNOWN coverage

It does not mean:
- no agent;
- no mission;
- no session.

Observed mission counts remain observed counts unless declared source coverage is complete.

## Operational Surface presentation lifecycle

    UNMATERIALIZED
      -> MATERIALIZING
      -> ACTIVE
      -> DETACHED | SUSPENDED
      -> ACTIVE
      -> DESTROYED

Failure states:

    UNAVAILABLE
    CRASHED
    STALE_BINDING
    AMBIGUOUS_BINDING

These are Workspace presentation/materialization states.

SUSPENDED does not mean provider session paused.

DESTROYED does not mean provider session deleted.

## Profile / partition isolation

A shared visual Operational Surface must not imply a shared browser profile.

The correct provider/profile partition must be resolved per attached session.

Forbidden:
- silent cookie copying;
- silent localStorage copying;
- Agent B mounted using Agent A partition;
- stale partition reuse after session identity change.

## Focus switch

Selection:
1. re-observe candidate bindings;
2. check coverage/freshness;
3. require unambiguous session identity;
4. resolve correct provider/profile partition;
5. materialize/reattach;
6. mark presentation selection only.

A -> B -> A must preserve the underlying correct session identities without spawning new desktop windows.

## Resume

Resume must revalidate:
- session binding;
- freshness/revision;
- provider availability;
- profile/partition identity.

## Fail closed

No automatic attachment if:
- binding ambiguous;
- sessionRef missing;
- profile/partition unknown;
- provider unavailable;
- binding stale.

Dual Browser remains fallback throughout migration.
