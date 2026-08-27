# TEAM REVIEW RESUMPTION — GUI / Window Control — 2026-08-27

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`  
Authority: LEANDRO  
Coordinator: MESTRE successor  
Status: `INCOMPLETE — TEAM_CONSENSUS_PENDING`

## Scope

Resume the incomplete review recorded in commit `ccbeca7fd7fb9860570c2fd0dd60207adee7838e` after the additional field finding persisted in commit `9dffa205304fcbd9021b23d325c40182240b9f08` as `GUI_WINDOW_CONTROL_FINDING_20260827.md`.

The finding is incorporated only as `NEXT_RELEASE_SCOPE_CANDIDATE`. It is not an official protocol mutation and does not authorize merge, tag, release or a version number.

## Live source reconciliation

At review start and immediately before persistence:

- latest stable GitHub Release: `v1.2.0`;
- review branch: `ops/mcf-mestre-cross-chat-succession-001`;
- branch HEAD before this receipt: `9dffa205304fcbd9021b23d325c40182240b9f08`;
- `main` mutation requested/performed by this review: `NONE`;
- tag/release mutation requested/performed by this review: `NONE`.

## Previous valid opinions

### LÉO

- verdict: `APPROVE`;
- severity: `MEDIUM-HIGH`;
- retrospective position: the newly discovered surface-isolation invariant was not tested, therefore the earlier PASS is conceptually incomplete with respect to that new invariant;
- release direction: separate successor window, preserve predecessor, separate/gated predecessor close, visual assertion and regression tests.

### BEATRIZ

- verdict: `ADOPT_WITH_CONDITIONS`;
- severity: `MEDIUM`;
- retrospective position: do not invalidate the existing `CROSS_CHAT_SUCCESSION = PASS`;
- release direction: distinct surface identity, preserved predecessor, two-window assertion, close gate and regression/edge-case tests.

The earlier review correctly left `TEAM_CONSENSUS = NOT_REACHED` because RENATO, AUGUSTO and EMILY had not cast valid votes.

## Resumed runtime evidence

No missing opinion was inferred or simulated.

### RENATO — attempt history

1. Local DSH `leo-N43SM`: transport terminated with `agent_disconnected / read_loop_ended` before a review was produced. Result: `NO_VOTE`.
2. VPS DSH `vmi3506102`: headless route terminated with provider `API_KEY_INVALID` before a review was produced. Result: `NO_VOTE`.
3. Existing local 9Router route on the VPS was exercised without exposing its local key. `oc/laguna-s-2.1-free` smoke returned HTTP 200 and `ROUTE_OK`; observed cost field: `0`.
4. RENATO review through `oc/laguna-s-2.1-free`: valid output received.

RENATO result:

```text
VERDICT = ADOPT_WITH_CONDITIONS
SEVERITY = MEDIUM-HIGH
RETROSPECTIVE_CROSS_CHAT_PASS = MAINTAIN_WITH_GAP
```

RENATO rationale: the historical PASS remains valid against the acceptance criteria that existed when the experiment ran; the later finding introduces a previously absent window/surface invariant, therefore the correct test classification is to preserve the historical PASS while recording a coverage gap and adding explicit regression gates.

Minimum regression gates proposed by RENATO:

- two-window `VISUAL_ASSERTION`;
- `PRESERVE_PREDECESSOR` through equivalence + handoff;
- explicit `OPEN_NEW_WINDOW` operation;
- keyboard tiling verified through device-level input rather than equating it with synthetic X11 events;
- monitor-aware successor boot/placement behavior.

### AUGUSTO — attempt history

1. Independent route `oc/hy3-free`: HTTP-successful route but empty review content. Result: `NO_VOTE`.
2. Independent route `oc/mimo-v2.5-free`: valid output received; observed cost field: `0`.

AUGUSTO result:

```text
SEVERITY = MEDIUM
RETROSPECTIVE_CROSS_CHAT_PASS = MAINTAIN_WITH_GAP
```

AUGUSTO trace analysis distinguishes two dimensions that were previously conflated:

```text
logical/persistent succession != OS-window visual copresence
```

The cold-recovery, equivalence and authority handoff trace remains evidenced. The new finding proves a separate observability gap at the window/surface layer. AUGUSTO's reconciliation is that LÉO is correct about incompleteness relative to the newly discovered invariant, while BEATRIZ is correct that a criterion introduced after the experiment must not retroactively erase evidence that satisfied the criteria then in force.

AUGUSTO recommends explicit trace fields/gates for:

- predecessor surface available through handoff;
- successor logical session identity;
- successor OS-window/surface identity;
- explicit predecessor-close action;
- window placement/monitor identity;
- visual assertion tied to the trace.

### EMILY — attempt history

1. Previous independent DSH review: blocked by provider capacity (`429`) as recorded in the earlier review.
2. New VPS third-route preparation: interrupted by `agent_disconnected / read_loop_ended`. Result: `NO_VOTE`.
3. Local 9Router `auth/cli-secret` was tested only as an opaque local credential without returning its value; OpenAI-compatible endpoint returned `401 invalid_api_key`. No database-key extraction or bypass was attempted. Result: `NO_VOTE`.
4. Local DSH headless audit attempt: timed out without valid assistant output. Result: `NO_VOTE`.

EMILY result:

```text
STATUS = BLOCKED_BY_RUNTIME
VOTE = NOT_CAST
```

This is material because Emily's canonical contract requires independence limitations to be recorded and independent revalidation when independence is a gate criterion. MESTRE therefore does not substitute a same-session synthetic Emily opinion for an independent audit.

## LÉO × BEATRIZ reconciliation — provisional MESTRE synthesis

The disagreement can be resolved semantically without rewriting either original vote:

1. **Historical validity dimension:** BEATRIZ + RENATO + AUGUSTO are aligned that the original PASS should not be invalidated by a criterion that was not part of the original acceptance contract.
2. **Coverage/completeness dimension:** LÉO is correct that, once the new invariant is known, the old experiment does not prove predecessor-surface preservation or separate successor-window identity.
3. **Provisional common formulation:**

```text
CROSS_CHAT_SUCCESSION historical result = PASS
newly discovered GUI/window invariant coverage = GAP / NOT TESTED IN ORIGINAL RUN
future protocol/release candidate = MUST ADD EXPLICIT SURFACE REGRESSION CRITERIA IF TEAM+HUMAN GATES APPROVE
```

This formulation is a review synthesis only. It is not yet an official protocol rule or retrospective rewrite.

## Candidate next-release scope

The new field finding remains a candidate for the next release scope in these areas:

- explicit `OPEN_NEW_WINDOW` vs `OPEN_NEW_CHAT` distinction;
- predecessor surface preservation until equivalence + explicit handoff;
- separate governed predecessor-close action;
- successor session ID and OS-window/surface ID as distinct trace fields;
- two-window visual assertion;
- monitor-aware tiling/placement;
- truthfulness boundary: `X11_SYNTHETIC_EVENT != DEVICE_LEVEL_INPUT_EVENT`;
- observable/logged shortcut execution;
- regression test for simultaneous predecessor/successor copresence.

No version number is authorized by this receipt.

## Gate status

```text
FINDING_PERSISTED = PASS
NEXT_RELEASE_SCOPE_CANDIDATE = PASS
RENATO_REVIEW = VALID
AUGUSTO_REVIEW = VALID
EMILY_REVIEW = NOT_CAST_RUNTIME_BLOCKED
LEO_BEATRIZ_DIVERGENCE = PROVISIONALLY_RECONCILED_BY_DIMENSION
TEAM_CONSENSUS = PENDING
PROTOCOL_MUTATION = NOT_AUTHORIZED
MAIN_MUTATION = NONE
MERGE = NOT_AUTHORIZED
TAG = NOT_AUTHORIZED
RELEASE = NOT_AUTHORIZED
HUMAN_GATE = NOT_OPENED_YET
NEXT = obtain valid independent EMILY audit -> re-evaluate TEAM_CONSENSUS -> only then present HUMAN_GATE to LEANDRO
```

No secrets were persisted or exposed in this review.