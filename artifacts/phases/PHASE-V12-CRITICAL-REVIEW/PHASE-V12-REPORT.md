# PHASE V1.2 — Critical Review Report

## Executive verdict

`GO_WITH_CORRECTIONS` for continued design work. `NO_GO` for v1.2 runtime implementation or canonicalization at this checkpoint.

## Evidence baseline

- Current `main`: `439da7b6479718f6545144954937b8c4358d7c46`.
- Functional v1.1 merge candidate: `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`.
- `main` is nine commits ahead of that v1.1 merge baseline.
- Those nine commits add documentation and `schemas/capability.schema.yaml`; they do not modify runtime code.
- `docs/MCF-CURRENT-STATE.md` still describes the reconciled v1.0.0 state and therefore has documentation drift relative to the current repository history.
- The latest architecture documents explicitly remain non-canonical and implementation-not-authorized.

## Findings

### F-01 — Current-state documentation drift

Severity: `HIGH`

`docs/MCF-CURRENT-STATE.md` does not represent the current post-v1.1 repository state. Any v1.2 work that consumes it without live reconciliation can misclassify the system.

Required correction: reconcile the current-state map before canonical v1.2 design is approved.

### F-02 — v1.1 rollback baseline is technically identifiable but not yet a proven stable release identity

Severity: `HIGH`

`5d79f48` is the merge commit for the exact qualified v1.1 candidate and is the merge base of all nine later draft commits. It is a strong technical rollback candidate. However, stable v1.1.0 publication/tag/release identity is not established by the current main release documentation.

Required correction: establish and verify an immutable v1.1 baseline reference before v1.2 implementation.

### F-03 — ZRCL is directionally sound but must remain two-sided

Verdict: `APPROVE_WITH_CORRECTIONS`

Strengths:
- reduces recoverable burden on LEANDRO;
- distinguishes recovery, verification, inference and authority;
- explicitly forbids inference replacing material evidence;
- preserves HDF/HUMAN_GATE.

Risk:
- a poorly implemented ZRCL can suppress necessary clarification and convert uncertain inference into silent machine assumption.

Required correction:
- measurable uncertainty thresholds;
- mandatory provenance for material decisions;
- regression tests for both unnecessary questions and missed HUMAN_GATE.

### F-04 — Context Fabric core is useful, but the current draft is too broad for a single implementation increment

Verdict: `APPROVE_WITH_CORRECTIONS`

Recommended v1.2 core:
1. Project Registry;
2. Project Capsule contract/pointer;
3. alias/entity resolution;
4. freshness classes;
5. provenance;
6. Context Recovery Receipt;
7. conflict/reconciliation obligations.

Defer until later maturity:
- materialized Project/Capability/Knowledge Graph infrastructure;
- Concept Memory as a broad new subsystem;
- complex cross-project indexing beyond the minimum needed for recovery.

Reason: minimize duplicated mutable state, stale graph risk and implementation surface.

### F-05 — Truth Contracts are valuable but incomplete as an operational contract

Verdict: `APPROVE_WITH_CORRECTIONS`

Current claim types (`IDENTITY`, `NORMATIVE`, `OPERATIONAL`, `DERIVED`) are useful.

Missing before implementation:
- machine-readable schema;
- explicit precedence rules by claim type;
- conflict lifecycle;
- evidence reference;
- observed/verified timestamps;
- invalidation/supersession rules.

### F-06 — Capability Registry foundation solves a real problem but the schema is insufficient

Verdict: `APPROVE_WITH_CORRECTIONS`

Existing multi-axis separation is correct: implementation, connection, authorization, runtime, verification, provenance and freshness must not collapse into a boolean.

Required additions before runtime use:
- provider/tool identity;
- scope/resource boundary;
- evidence reference;
- verified_at / expires_at;
- risk/profile;
- allowed operations;
- degraded reason;
- lifecycle transition rules.

`FULL_WRITE` must never imply unrestricted production authority.

### F-07 — Validation Suite is currently a checklist, not a validation system

Verdict: `DEFER_IMPLEMENTATION_UNTIL_SPECIFIED`

The current 26-line foundation correctly names target behavior, but it has no executable scenarios, pass/fail thresholds, fixtures, evidence binding or CI contract.

Required correction: convert it into a versioned scenario suite with negative tests and exact evidence.

### F-08 — Architectural Checkpoint 004 mixes components with different maturity levels

Severity: `MEDIUM`

It presents ZRCL, Context Fabric, Capability Registry, Artifact System and Validation Suite as a consolidated architecture, but these components are not equally specified. Canonicalizing the checkpoint as a single package would overstate maturity.

Required correction: canonicalize by independently qualified blocks, not by the checkpoint document wholesale.

### F-09 — Decision presentation behavior is not sufficiently enforced in the repository

Severity: `HIGH`

Current explicit LEANDRO instruction requires decision points to present three continuation options and clearly mark the MESTRE recommendation. This behavior is not found as an explicit enforced contract in the reviewed canonical operating instructions/decision ledger.

Required v1.2 rule candidate:

```text
MATERIAL_DECISION_POINT
→ present Option A
→ present Option B
→ present Option C
→ mark exactly one as ⭐ RECOMENDAÇÃO DO MESTRE
→ explain recommendation concisely
→ do not treat silence/advance as approval
→ persist material human choice with provenance
```

Constraint: options must be genuinely viable; artificial unsafe options must not be invented merely to reach a count of three.

### F-10 — Rollback must be a release acceptance criterion, not an afterthought

Severity: `CRITICAL`

v1.2 must not be considered deliverable until the team proves a controlled return to the v1.1 baseline for code and compatible persisted state.

Required controls:
- immutable v1.1 reference;
- isolated v1.2 branch/PR;
- reversible or backward-compatible migrations;
- pre-migration backup;
- feature flags for new behavior where practical;
- explicit `v1.1 -> v1.2 -> v1.1` recovery test;
- no destructive state transformation without a tested restore path.

## Block verdict matrix

| Block | Verdict |
|---|---|
| ZRCL v0.3 | APPROVE_WITH_CORRECTIONS |
| Context Fabric core | APPROVE_WITH_CORRECTIONS |
| Context graphs / broad Concept Memory | DEFER |
| Truth Contracts | APPROVE_WITH_CORRECTIONS |
| Capability Registry | APPROVE_WITH_CORRECTIONS |
| Validation Suite foundation | DEFER_IMPLEMENTATION_UNTIL_SPECIFIED |
| Architectural Checkpoint 004 wholesale canonicalization | REJECT_AS_WHOLE; qualify blocks independently |
| Three-options + MESTRE recommendation contract | ADD_TO_V1.2_REQUIREMENTS |
| v1.1 rollback guarantee | MANDATORY_ACCEPTANCE_CRITERION |

## Recommended v1.2 design boundary

The first v1.2 candidate should focus on:

1. correct current-state reconciliation;
2. stable project identity and Project Registry;
3. minimal Project Capsule contract;
4. freshness + provenance + Truth Contract schema;
5. capability awareness with evidence and authorization scope;
6. Context Recovery Receipt;
7. decision presentation contract (A/B/C + marked recommendation);
8. executable validation scenarios;
9. rollback qualification to the fixed v1.1 baseline.

Everything else should remain deferred until this boundary passes validation.
