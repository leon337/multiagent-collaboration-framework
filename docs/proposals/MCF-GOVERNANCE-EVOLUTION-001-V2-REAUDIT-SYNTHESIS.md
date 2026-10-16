# MCF-GOVERNANCE-EVOLUTION-001 — v2 Dual Reaudit Synthesis

**Status:** `REAUDIT_SYNTHESIS — GOV_0_GOV_1_INPUT — NOT_CURRENT — NOT_IMPLEMENTATION_AUTHORIZED`  
**Repository:** `leon337/multiagent-collaboration-framework`  
**PR:** `#142`  
**Audited v2 target:** `4e4132a1041707840b4aab369d81f95a1f89899b`  
**Audited base:** `main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`  
**Prepared:** `2026-08-19`

> This document preserves the second independent audit round against the exact same v2 SHA. It is a design input only. It does not authorize runtime implementation, schema change, merge, release or production.

---

## 1. Target verification

Both independent auditors verified the same target before issuing their verdicts:

```text
main................................ 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
PR #142............................. OPEN / DRAFT / NOT MERGED
v2 HEAD............................. 4e4132a1041707840b4aab369d81f95a1f89899b
Issue #140.......................... OPEN
Issue #141.......................... OPEN / DISCOVERY_IN_PROGRESS
Documentation validation............ SUCCESS on exact HEAD
MCF Production Readiness............. SUCCESS on exact HEAD
baseline drift during reaudit........ NONE OBSERVED
```

The v2 proposal remained `NOT_CURRENT` and `NOT_IMPLEMENTATION_AUTHORIZED` throughout the reaudit.

---

## 2. Independent verdict convergence

The second audit round converged:

```yaml
claude_verdict: APPROVE_WITH_CHANGES
claude_next_human_gate: AUTHORIZE_GOV_0_GOV_1_DESIGN

gpt_verdict: APPROVE_WITH_CHANGES
gpt_next_human_gate: AUTHORIZE_GOV_0_GOV_1_DESIGN
```

The common interpretation is:

```text
ARCHITECTURAL_DIRECTION = ACCEPTED
WHOLE_SYSTEM_REDESIGN = NOT_REQUIRED
GOV_0_DESIGN = ALLOWED_AFTER_HUMAN_AUTHORIZATION
GOV_1_DESIGN = ALLOWED_AFTER_HUMAN_AUTHORIZATION
RUNTIME_IMPLEMENTATION = NOT_AUTHORIZED
SCHEMA_CHANGE = NOT_AUTHORIZED
MERGE = NOT_AUTHORIZED
RELEASE = NOT_AUTHORIZED
PRODUCTION = NOT_AUTHORIZED
```

LEANDRO subsequently authorized bounded **GOV-0 + GOV-1 DESIGN** only.

---

## 3. Reaudit closure of the original 13 findings

The two auditors used slightly different closure strictness: Claude marked more items `RESOLVED` at design level, while GPT reserved `RESOLVED` for defects whose enforcement was also materially closed. The disagreement is semantic, not architectural.

Conservative synthesis:

| Canonical ID | Reaudit synthesis | Design interpretation |
|---|---|---|
| `GEV-C001` | `PARTIALLY_RESOLVED` | Production boundary is correctly modeled, but Issue #140 enforcement remains open. |
| `GEV-C002` | `PARTIALLY_RESOLVED` | #141↔#142 relation is explicit; positive arbitration and material-state capture still need design precision. |
| `GEV-H001` | `PARTIALLY_RESOLVED` | Methodology identity contract is sound; executable verification is future work. |
| `GEV-H002` | `PARTIALLY_RESOLVED` | Silent-downgrade rule is sound; current runtime guard remains permissive. |
| `GEV-H003` | `PARTIALLY_RESOLVED` | Cold-start belongs in existing recovery; ambiguity representation requires an explicit contract decision. |
| `GEV-H004` | `PARTIALLY_RESOLVED` | Drift model improved; atomic integration protection remains future GOV-3 work. |
| `GEV-H005` | `PARTIALLY_RESOLVED` | Taxonomy exists; GOV-1 must remove all automation-facing `maybe` ambiguity. |
| `GEV-H006` | `RESOLVED_AT_DESIGN_LEVEL` | Global `CURRENT` was replaced by independent currentity axes. |
| `GEV-H007` | `PARTIALLY_RESOLVED` | Rollback compatibility is designed, not implemented. |
| `GEV-H008` | `PARTIALLY_RESOLVED` | GOV-5 strategy is correct; live current-state maps remain stale. |
| `GEV-M001` | `RESOLVED_AT_DESIGN_LEVEL` | Governance lifecycle is derived, not a new state engine. |
| `GEV-M002` | `PARTIALLY_RESOLVED` | Immutable evidence refs are designed, not implemented. |
| `GEV-M003` | `RESOLVED_AT_DESIGN_LEVEL` | Provider technical status is explicitly separated from governance readiness. |

No auditor found justification for discarding the v2 architecture or creating parallel MCF primitives.

---

## 4. New findings from the v2 reaudit

### `GEV-R2-H001` — Ambiguity outcome must not silently become a fourth recovery route

Claude verified that the current `McfResumeRoute` / `resumeRouteHint` contract contains only:

```text
FAST_RESUME
RECONCILE
RECOVER_MCF_PROJECT
```

The v2 text uses `AMBIGUOUS_CONTINUITY` as a cold-start result. GOV-1 therefore adopts the following design rule:

```text
AMBIGUOUS_CONTINUITY
= discovery/resolution outcome
!= current McfResumeRoute
```

Until a future explicit contract/schema change is separately authorized, an ambiguous cold-start MUST NOT persist `AMBIGUOUS_CONTINUITY` into `resumeRouteHint`. It must stop before selecting a resume route and return the competing candidates/evidence through the existing authority handoff surface.

If future implementation requires serializing this value into a typed contract, that is an additive protocol/schema change and must receive its own version classification and authorization.

### `GEV-R2-H002` — Partial v1.1 silent downgrade exists in the current runtime

Both audits converge that the current guard only invokes v1.1 validation when:

```text
contractSchemaVersion === '1.1'
```

while v1.1-exclusive metadata may be present with the discriminator absent. This is a real technical bug/risk, not merely a future governance concern.

It remains outside the current GOV-0/GOV-1 design authorization and is carried forward for GOV-2 or an independently authorized remediation.

### `GEV-R2-H003` — Identity validity is distinct from methodology eligibility

GPT found that a cryptographically valid repository/SHA/path/digest can still identify a methodology superseded for new work.

GOV-1 therefore separates:

```text
IDENTITY_VALID
!=
METHODOLOGY_ELIGIBLE
```

Eligibility must be derived from existing activation/supersession decisions plus project pin context. No parallel methodology registry is authorized.

### `GEV-R2-H004` — TOCTOU recheck is not atomic integration

A live re-read immediately before merge reduces risk but does not eliminate:

```text
reconciled base = B
main moves to C
merge executes against stale assumption B
```

This is accepted as a GOV-3 design requirement: integration must eventually bind to an expected/reconciled base SHA or equivalent atomic provider primitive. It is not implemented or authorized here.

### `GEV-R2-H005` — Material mission state cannot live only in Issue comments

GPT observed that Issue #141 has material Q1–Q12 decisions in comments while its branch artifact may lag them.

GOV-0 therefore adopts:

```text
Issue / PR comments = conversation and discovery surface
material decision = must be captured in canonical versioned artifact or immutable evidence ref
```

Cold-start may inspect comments as evidence, but comments alone must not become the only durable material-state checkpoint.

### `GEV-R2-H006` — HUMAN_GATE freshness/replay semantics remain open

Matching only a target SHA does not prove an authorization is fresh for the intended release, environment, action and boundary.

Future governance must bind sensitive HUMAN_GATE evidence to at least:

```text
target SHA
release identity
environment
action/boundary
issuance identity/time
consumption or expiry semantics
```

This is carried to later GOV-2/GOV-6 design and must reuse existing HDF/standing authorization/publication-lock concepts rather than create a second permission engine.

### `GEV-R2-M001` — External Effect Closure evidence has freshness requirements

A provider/workflow inventory can become stale after settings change.

GOV-0 source mapping therefore classifies provider configuration as volatile evidence. Future GOV-6 qualification must invalidate/requalify External Effect Closure when relevant provider/workflow settings change or become unavailable.

### `GEV-R2-M002` — Audit synthesis must not become a second source of truth

Claude noted that a synthesis can accidentally outlive or replace the original audit evidence.

Rule adopted:

```text
audit synthesis = derived index / interpretation
audit originals = evidence inputs
live repository/provider = higher-precedence volatile truth
```

Future blocking audit references should use immutable identities when practical.

### `GEV-R2-M003` — Concurrency needs a positive fallback authority

The v2 correctly forbids precedence by branch name or recency, but absence of an objective ordering criterion needs an explicit fallback:

```text
no objective precedence
→ no automatic winner
→ LÉO decides within delegated boundary
→ escalate to LEANDRO when material/reserved
```

This is incorporated into GOV-0.

---

## 5. Scope allocation after reaudit

```text
GOV-0
→ exact baseline/source map
→ volatile vs immutable evidence
→ #141/#142 concurrency
→ material decision checkpointing from comments
→ positive human fallback when no objective precedence
→ provider evidence freshness classification

GOV-1
→ axis-specific currentity
→ deterministic version-impact classifier
→ remove automation-facing `maybe`
→ identity validity vs methodology eligibility
→ classify AMBIGUOUS_CONTINUITY representation without silently changing schema

GOV-2+
→ methodology resolver enforcement
→ v1.1 fail-closed runtime guard
→ HUMAN_GATE freshness/replay

GOV-3
→ atomic baseline/integration binding

GOV-4
→ repository-only cold-start implementation contract

GOV-5
→ current-state map reconciliation

GOV-6 / GOV-P0
→ External Effect Closure qualification
→ Issue #140 production boundary remediation
```

---

## 6. Human authorization record

LEANDRO authorized **Option A** after both v2 auditors independently returned `APPROVE_WITH_CHANGES` and `AUTHORIZE_GOV_0_GOV_1_DESIGN`.

Authorized boundary:

```yaml
gov_0_design: authorized
gov_1_design: authorized
runtime_implementation: false
schema_change: false
skill_contract_change: false
merge_pr_142: false
release: false
production: false
issue_140_bypass: false
```

The corresponding design artifacts are:

- `MCF-GOVERNANCE-EVOLUTION-001-GOV-0-DESIGN.md`
- `MCF-GOVERNANCE-EVOLUTION-001-GOV-1-DESIGN.md`
