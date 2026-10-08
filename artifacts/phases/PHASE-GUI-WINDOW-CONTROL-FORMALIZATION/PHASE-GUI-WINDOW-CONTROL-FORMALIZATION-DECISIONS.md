# PHASE GUI / WINDOW CONTROL FORMALIZATION — DECISIONS

Date: 2026-08-27
Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`

## D-01 — Retrospective classification

Decision: preserve historical `CROSS_CHAT_SUCCESSION=PASS` while recording the newly discovered GUI/window invariant as `GAP_NOT_TESTED` in the original run.

Consolidated classification: `MAINTAIN_WITH_GAP`.

This does not retroactively claim the original run tested separate OS window surfaces.

## D-02 — Human authorization scope

LEANDRO authorized formalization, implementation, tests and qualification in a non-main branch.

Explicitly outside that authorization: merge, tag, release and version-number selection.

## D-03 — Candidate ancestry hygiene

PR #178 was rejected as a release candidate because its ancestry included succession/release ledger material unrelated to the bounded candidate payload.

Decision: close #178 unmerged and rebuild from verified `main` base `5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`.

## D-04 — Clean candidate boundary

PR #179 is the clean candidate. Final qualified HEAD: `3a2545237ca1449b4ac2ba44d781c3e4e01be339`.

Expected payload: 7 files only — qualifier script, qualifier workflow, unified-protocol reference, GUI/window succession protocol, trace schema, valid fixture and invalid fixture.

## D-05 — Negative regression coverage

BEATRIZ identified that the first negative fixture proved only three failure modes.

Decision: expand the qualifier to 15 independent negative regressions without relaxing prior acceptance criteria. Final PR/push qualification passed on the updated HEAD.

## D-06 — Independent audit

EMILY independent technical audit/revalidation returned `PASS`, `SUFFICIENT`, `BLOCKING_FINDINGS=NONE`, `CANDIDATE_QUALIFICATION=QUALIFIED` after Production Readiness completed successfully on the unchanged HEAD.

The isolated EMILY project later returned `PASS_WITH_CONDITIONS` for phase closure because the Class B PRF was incomplete.

## D-07 — LÉO gate

The isolated LÉO project returned `LEO_GATE=PASS_WITH_NOTES`, `SEVERITY=LOW`, `OPEN_BLOCKERS=NONE` and recommended keeping the candidate `QUALIFIED` in `DRAFT` and forwarding it to LEANDRO's next human gate.

LÉO did not authorize merge, tag, release or versioning.

## D-08 — PRF closure requirement

Before HUMAN_GATE, complete and persist: `SMOKE`, `CHECKPOINT`, `DECISIONS`, `MISSION-TRACE`, `README` and `ARTIFACT-MANIFEST.sha256` in the audit branch.

`MISSION-TRACE` must be produced through AUGUSTO's observability competence. Same-session role execution must be labeled as such and must not be misrepresented as independent runtime execution.

## Current boundary

```text
MAIN_MUTATION=NONE
PR_179_STATE=DRAFT
MERGE_AUTHORIZED=NO
TAG_AUTHORIZED=NO
RELEASE_AUTHORIZED=NO
VERSION_NUMBER=NOT_DECIDED
```