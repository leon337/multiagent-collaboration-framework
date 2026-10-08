# Phase Plan — GUI / Window Control Formalization

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Phase: `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION`
Class: B
Authority: LEANDRO
Coordinator: MESTRE
Status: EXECUTED — awaiting internal LÉO gate

## Objective

Formalize the team-approved `MAINTAIN_WITH_GAP` GUI/window-control candidate behavior on a non-main branch, implement machine-readable trace/schema/tests, qualify the clean candidate, preserve governance boundaries, and return evidence before any merge/tag/release/version action.

## Acceptance criteria

1. Dedicated protocol extension exists on a non-main clean candidate branch.
2. Session identity and OS-window/surface identity are separate testable invariants.
3. Predecessor surface is preserved through equivalence + explicit handoff.
4. Predecessor close/replacement is separately governed.
5. Trace distinguishes X11 synthetic events from device-level/physical input.
6. Window placement is monitor-aware and observable.
7. Machine-readable schema + valid/invalid fixtures exist.
8. Qualification includes positive acceptance and negative regressions.
9. Unified operational protocol references the candidate extension.
10. Canonical CI and Production Readiness pass on one exact candidate HEAD.
11. Candidate payload is clean relative to `main`.
12. No main mutation, merge, tag, release or version selection occurs.

## Authorized boundaries

Authorized by LEANDRO:
- formalize on non-main branch;
- implement tests/schema/trace;
- qualify and audit;
- persist evidence.

Not authorized:
- merge into `main`;
- tag;
- release;
- choose/announce next version.

## Validation method

TDD + CI + independent audit:
- RED before implementation;
- GREEN on clean candidate;
- 15 negative invariant regressions;
- documentation validation;
- production readiness;
- independent Emily audit/revalidation;
- LÉO internal gate;
- return to LEANDRO.
