# MCF World Semantic Discrimination Microtest S — Instrument Proof

Mission: MCF-WORLD-PROJECTION-001
Scope: one targeted human validation of Semantic Visual Language v0.1
Human evidence: not yet collected

## Frozen visual variable

The tested visual prototype is the already-gated Semantic Visual Language v0.1 at:

    34c68563907027b166543b9e7d296fd61a0094bd

Fixture:

    S
    fixture:world-projection-semantic-visual-s:v1

The completed Findability R instrument and evidence are not modified.

## Test-specific instrumented surface

The human test loads:

    apps/mcf-world-projection/semantic-visual-world-test-s.html

This file is generated from semantic-visual-world.html with only one explicitly bounded telemetry block between:

    TEST-INSTRUMENTATION-START
    TEST-INSTRUMENTATION-END

The static verifier removes that block and requires the remainder to equal the gated visual prototype exactly.

The telemetry block records only presentation interactions:
- view changes;
- entity selections.

It does not alter entity data, relations, freshness, state, trust, answers or expected values.

## Human tasks

Six open-interface tasks:

1. UNKNOWN object — expected: Signature receipt
2. STALE/revalidation object — expected: Runtime snapshot
3. provider-observed artifact that is not canonical receipt/evidence — expected: Build #1142
4. object-type reading — select Control Matrix v3; expected type: ARTIFACT
5. current mission state — expected: BLOCKED
6. selection/focus semantics — select Rafael; expected label: Selecionado

The World remains visible throughout. This is not a memory test.

## Per-task metrics

The harness records:
- correct;
- elapsedMs;
- expectedEntityId;
- activeSurfaceAtAnswer;
- firstTargetCorrect;
- wrongObjectOpens;
- surfaceSwitches;
- interactionCount;
- complete interaction path.

## Qualitative feedback

Collected separately from the score:
- legend_helpful;
- visual_language_easy_to_learn;
- confusing_signals.

Qualitative answers do not change correctness.

## Result capture

The local server binds only to 127.0.0.1 and accepts POST /result.

It validates:
- schema;
- Fixture S;
- exact gated prototype revision;
- exact fixture revision;
- six tasks with task IDs 1..6.

The result is written atomically through a temporary file followed by replace.

The browser also stores a localStorage copy as fallback; server-side capture is the primary evidence path.

## Negative server test

A payload with a wrong prototype revision returned HTTP 400 and created neither final result nor temporary result.

Result:

    SEMANTIC_DISCRIMINATION_SERVER_NEGATIVE PASS

## Automated control

The control is instrumentation verification only, not human evidence.

Results:

    SEMANTIC_DISCRIMINATION_TEST_STATIC PASS
    SEMANTIC_DISCRIMINATION_BROWSER_CONTROL PASS
    SEMANTIC_DISCRIMINATION_SERVER_CAPTURE PASS

The automated control completed 6/6.

A deliberate navigation error was introduced on task 1:

    Graph
      -> wrong object: Approval Gate
      -> correct object: Signature receipt

Captured metrics:

    firstTargetCorrect = false
    wrongObjectOpens = 1
    surfaceSwitches = 1
    interactionCount = 3

Other targeted object opens in the control registered firstTargetCorrect=true.

## Claims boundary

The control run is not evidence of human usability or product value.

If gated, the instrument is suitable only for one targeted intra-participant human semantic-discrimination session.

It cannot by itself establish:
- general usability;
- causal improvement over the prior UI;
- reduced cognitive load;
- accessibility universality;
- Product GO;
- 3D value.

## Pre-human UX gate remediation

Laura identified lexical answer leakage in the original task 4: the question asked which object was a Gate and one answer label was Approval Gate. That could be solved by word matching without reading the visual type encoding.

Only task 4 was changed. It now asks the participant to open Relations, select Control Matrix v3, and report the type assigned by the interface. Expected answer: ARTIFACT. Alternatives: ARTIFACT / GATE / EVIDENCE / MISSION.

Control Matrix v3 does not lexically expose its object type. The frozen visual prototype and Fixture S are unchanged.
