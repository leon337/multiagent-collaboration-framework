# MCF-WORLD-PROJECTION-001 — Context Recovery Dry-Run

Date: 2026-09-26
Mission: MCF-WORLD-PROJECTION-001
Boundary: read-only
Production: not authorized
Mutation: not authorized

## Purpose

Validate the experiment mechanics and semantic equivalence of the two conditions before treating any result as human-product evidence.

This dry-run does not satisfy the final LEANDRO context-recovery product gate.

## Dataset

Both conditions used the same representative fixture:

- fixture role: MATERIALIZED_PROJECTION_FIXTURE
- source revision label: github:leon337/multiagent-collaboration-framework:mission/mcf-world-projection-001@44ed701b
- 12 entities
- 11 typed relations
- 6 fixture-sequence events
- UNKNOWN and STALE explicitly represented
- Draft PR #380 represented as provider-observed artifact, not canonical receipt

## Independent surface dry-run

Condition A was delivered to the RENATO - MCF ChatGPT project pane.
Condition B was delivered to the EDUARDO - MCF ChatGPT project pane.

The panes were used as independent evaluation surfaces. The team3 agent identity lifecycle was not fully reconciled at execution time, so these observations are not authoritative MCF Agent Mission receipts and must not be represented as such.

Each surface received the same eight factual questions:

1. current mission state;
2. orchestrator;
3. auditor;
4. current prototype gate;
5. whether Draft PR #380 is a canonical receipt;
6. UNKNOWN evidence;
7. STALE item;
8. event immediately before Draft PR #380 in fixture temporal order.

Observed answers:

- Condition A / linear: 8 of 8 correct.
- Condition B / structured: 8 of 8 correct.

Interpretation:

- semantic facts survived both representations;
- neither condition showed an accuracy advantage in this one-pass dry-run;
- the first timing attempt was invalid because the completion marker also appeared in the user prompt;
- no response-time comparison is claimed from the agent-surface run.

This result does not support GO_WORLD, GO_HYBRID or NO_GO.

## Instrumented local harness

A local read-only harness was added at:

    apps/mcf-world-projection/experiment.html

It presents the same fixture under two conditions:

- A — Linear
- B — Structured Cockpit + Timeline + focused relations

The harness:

- asks the same eight objective questions;
- records per-task elapsed time;
- records accuracy;
- keeps results only in browser memory;
- displays a result JSON for evidence capture;
- does not persist automatically;
- does not call Dual Browser;
- does not contain a mutation route;
- does not require 3D.

## Harness smoke

A clean headless Google Chrome target loaded the harness from the existing local server.

Automated control smoke:

    baseline   correct=8 total=8
    structured correct=8 total=8
    HARNESS_SMOKE PASS

Automation elapsed values were intentionally excluded from UX/product analysis because they measure scripted browser control, not human cognition.

## Claims boundary

Proven:

- both conditions are runnable from the same fixture;
- answer scoring works;
- per-task timing instrumentation executes;
- both conditions can reach the final result;
- the harness remains within the current read-only boundary.

Not proven:

- structured projection is faster for LEANDRO;
- structured projection reduces cognitive load;
- Graph adds value over Cockpit/Timeline;
- canonical-source-to-read-model rebuild;
- product GO, HYBRID or NO-GO;
- 3D value.

## Remaining product gate

Run the instrumented A/B with a human participant using the same dataset and record:

- task accuracy;
- time per task;
- total context-recovery time;
- interpretation errors;
- navigation/backtracking;
- confidence/cognitive-load observations.

Do not expand to mutation, production or 3D before that evidence is captured and independently reviewed.
