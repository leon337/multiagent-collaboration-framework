# TEAM REVIEW — Predecessor Surface Preservation

**Mission:** `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`  
**Date:** 2026-08-27  
**Status:** `INCOMPLETE — CONSENSUS_NOT_REACHED`  
**Authority:** LEANDRO  
**Coordinator:** MESTRE

## Incident under review

During the successful cross-chat succession experiment, the successor conversation was created by reusing the same ChatGPT window/surface on the notebook. The predecessor therefore stopped being present as an open desktop window, although LEANDRO still had access to the predecessor from his phone. Persistent recovery, `SUCCESSION_EQUIVALENCE`, merge, post-merge qualification, tag and MCF v1.2.0 release remained successful.

The question is whether the protocol must require a physically distinct successor window while keeping the predecessor surface open and intact until equivalence + explicit handoff, with closing/replacing the predecessor treated as a separate governed action.

## Preliminary proposal submitted to reviewers

- successor opens in a **new window/surface**;
- predecessor remains open/intact in its own surface until `SUCCESSION_EQUIVALENCE = PASS` and explicit handoff;
- closing/replacing the predecessor is a separate action and may require a dedicated gate;
- candidate checks: `OPEN_NEW_WINDOW`, `PRESERVE_PREDECESSOR`, `PLACE_WINDOWS`, `VISUAL_ASSERTION`, `BOOT_SUCCESSOR`;
- candidate precondition: `PREDECESSOR_SURFACE_PRESERVED = PASS` before cold recovery.

No reviewer was instructed to accept the proposal.

## Panel

### LÉO — Continuity and Internal Gates

**Execution:** separate DSH headless context  
**Verdict:** `APPROVE`  
**Incident severity:** `MEDIUM-HIGH`  
**Existing cross-chat PASS:** considers the isolation invariant not actually tested and therefore conceptually compromised, while noting the release itself was not materially harmed.  
**Direction:** require new successor window, preserve predecessor, explicit/gated predecessor close, visual assertion and regression tests.  
**Version recommendation:** `v1.3.0`.

### BEATRIZ — Agent Evaluation

**Execution:** separate DSH headless context  
**Verdict:** `ADOPT_WITH_CONDITIONS`  
**Incident severity:** `MEDIUM`  
**Existing cross-chat PASS:** `NO` invalidation.  
**Direction:** require distinct surface ID, preserved predecessor, two-window visual assertion, explicit close gate, regression and edge-case tests.  
**Version recommendation:** `v1.3.0` for the protocol capability; `v2.0.0` only if bundled with broader successor-framework breaking changes.

### RENATO — Quality and Tests

**Status:** `BLOCKED_BY_PROVIDER_CAPACITY`  
Multiple independent attempts returned `429 RATE_LIMIT`, including a temporary isolated DSH model route.  
**Vote:** `NOT CAST`.

### AUGUSTO — Multiagent Observability

**Status:** `BLOCKED_BY_PROVIDER_CAPACITY`  
The independent Meta Muse attempt exceeded the bounded execution timeout and was not accepted as a review.  
**Vote:** `NOT CAST`.

### EMILY — Independent Audit

**Status:** `BLOCKED_BY_PROVIDER_CAPACITY`  
Initial independent DSH attempt returned `429 RATE_LIMIT`.  
**Vote:** `NOT CAST`.

## Independence limitation

The valid LÉO and Beatriz opinions were produced in separate contexts, but the available DSH default route was the same cognitive/model environment. Emily's contract explicitly requires this limitation to be recorded when authorship/review share a cognitive environment and independent revalidation is required by the gate.

Attempts were made to diversify providers without changing the global model or exposing credentials, but the remaining routes returned capacity errors/timeouts. No missing reviewer opinion has been inferred or simulated by MESTRE.

## Current convergence

The two valid reviewers agree on the architectural direction:

1. successor creation should not implicitly replace predecessor surface;
2. predecessor should remain available through the handoff boundary;
3. closing/replacing predecessor should be a separate governed action;
4. the condition must become testable rather than conversational.

## Current divergence

The key unresolved issue is classification of the completed experiment:

- Beatriz: existing `CROSS_CHAT_SUCCESSION = PASS` remains valid, with a new nonconformity/gap recorded.
- LÉO: the PASS is conceptually incomplete for the newly discovered surface-isolation invariant, although the release and persistent-recovery evidence remain valid.

This disagreement must be reviewed by Renato/Augusto/Emily before MESTRE consolidates a recommendation.

## Gate

```text
TEAM_CONSENSUS = NOT_REACHED
PROTOCOL_MUTATION = NOT_AUTHORIZED
MAIN_MUTATION = NONE
RELEASE_DECISION = NONE
NEXT = obtain remaining independent reviews -> consolidate disagreements -> present recommendation to LEANDRO -> HUMAN_GATE
```
