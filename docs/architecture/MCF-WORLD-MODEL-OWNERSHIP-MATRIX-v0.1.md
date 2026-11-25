# World Model v0.1 — Ownership Matrix

| Projected field / concept | Canonical owner | World role | Authoritative in World? |
|---|---|---|---|
| Mission identity | MCF canonical mission record | Resolve/project WorldRef | No |
| Mission state/lifecycle | MCF Runtime / canonical mission state | Read/project | No |
| Mission objective | Canonical mission/project source | Read/project | No |
| Agent identity | MCF agent registry/contracts | Resolve/project | No |
| Agent execution state | Runtime/provider that owns execution state | Read/project | No |
| HUMAN_GATE decision | MCF authority/gate subsystem | Read/project | No |
| Actor / approver / authority | MCF governance records | Preserve distinctions | No |
| Artifact identity/revision | Artifact/provider canonical source | Resolve/project | No |
| Receipt/evidence validity | Runtime/evidence subsystem/provider | Link/project | No |
| Conversation identity | Canonical chat/provider | Resolve/project | No |
| Source revision | Owning source/provider | Preserve | No |
| Freshness assessment | Typed adapter policy | Derive + label | Cache only |
| Trust class | Adapter/security policy | Derive + preserve | Cache only |
| Relation EXPLICIT | Owning canonical source | Project | No |
| Relation DERIVED | Deterministic projection rule | Derive | Cache only |
| Relation INFERRED/PROPOSED | Inference/proposal producer | Label as non-fact | Never canonical |
| ContextEntry | Derived from canonical facts | Materialize context | No |
| ContextSlice | Derived read model | Materialize scope | No |
| AgentContextPacket | Derived handoff package | Generate | No |
| Selection / active view | User/session presentation state | Own locally | Presentation-only |
| Graph position / expanded panel | User/session presentation state | Own locally | Presentation-only |
| Experiment result | Experimental client/session | Own locally / capture as evidence | Never operational truth |
| Last-viewed checkpoint | User/session presentation state | Support since-I-left | Presentation-only |
| WorldRef.id | Deterministic key from kind + canonicalRef | Own technical key | Rebuildable only |
| World cache | World projection | Performance only | Disposable |

## Audit rule

For every operational field not listed as presentation-only, reviewers MUST identify a canonical owner outside World.

If the answer to “who owns this truth?” becomes “World”, implementation stops for architectural review.
