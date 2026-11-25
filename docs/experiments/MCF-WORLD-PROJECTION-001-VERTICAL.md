# MCF-WORLD-PROJECTION-001 — Vertical Experiment

**Status:** CANDIDATE  
**Scope:** READ-ONLY  
**Production:** NOT AUTHORIZED

## 1. Question

Can a structured projection reduce the time and error involved in resuming and understanding a branched MCF mission compared with the current linear workflow?

The experiment is not a test of visual novelty and does not assume 3D is better.

## 2. Initial user

Primary experimental user: **LEANDRO**, operating a real or representative MCF mission with enough branching to require context reconstruction.

The first vertical is intentionally narrow:

> Resume a branched MCF mission and correctly explain where it stopped, why, who acted/authorized, what is blocked, where the evidence is, and what the next step would be — without executing that next step.

## 3. Dataset

Use one mission with approximately:

- one parent mission;
- 3 phases/branches;
- 4–6 agents;
- several chats/sessions;
- at least one handoff;
- at least one HUMAN_GATE;
- at least one artifact;
- at least one receipt/evidence chain;
- one blocked/unknown/stale case;
- one checkpoint/resume point.

The same canonical data must feed both experimental conditions.

## 4. Conditions

### A — Linear baseline

Current-style navigation using chat/list/search/links.

### B — World Projection v0.1

- Cockpit;
- Timeline;
- Graph 2D (experimental).

No 3D requirement in this experiment.

## 5. Core tasks

The participant must answer or perform:

1. What is the current mission state?
2. Who is responsible for the current branch?
3. What was the last meaningful handoff?
4. Which HUMAN_GATE or blocker matters now?
5. Which evidence/receipt supports the relevant claim?
6. Did an external effect actually occur, or is it only requested/executed/UNKNOWN?
7. Where should work resume?
8. Switch views while preserving the same selected object/context.

## 6. UX rules

### Context recovery

The entry surface should answer quickly:

- current state;
- current actor;
- last significant event;
- blockers;
- pending human decision;
- recent evidence;
- next read-only inspection step.

A “What changed since I left?” summary is encouraged.

### Cockpit

Operational now-state. Avoid dumping complete logs.

### Timeline

Temporal and causal reconstruction. Critical events such as handoff, gate, failure, recovery, authority change, external effect and invalid evidence are never silently collapsed.

### Graph

Typed relationship subgraph. Default to focus mode; do not render every message/file/log.

### Selection

Switching Cockpit ↔ Timeline ↔ Graph preserves the selected `WorldRef`.

### States

Mandatory distinct states:

- LOADING
- EMPTY
- UNKNOWN
- STALE
- ERROR
- FRESH

UNKNOWN is not success or error. STALE is not UNKNOWN.

## 7. HUMAN_GATE representation

A projected HUMAN_GATE must show:

- gate identity;
- required authority;
- requested decision;
- why the human is needed;
- what would happen if approved/rejected;
- evidence available;
- current decision state.

In this read-only experiment, no approve/reject control may execute a real decision.

## 8. External-effect representation

Never collapse:

```text
REQUESTED
EXECUTED
OBSERVED/CONFIRMED
```

A receipt/evidence chain should make the distinction inspectable.

## 9. Progressive disclosure

Use four levels:

1. orientation;
2. operational detail;
3. explanation/causality;
4. proof/provenance.

Technical proof remains accessible but is not the default visual density.

## 10. Metrics

Primary metrics:

- task completion accuracy;
- time to correct mission-state understanding;
- time to locate blocker/HUMAN_GATE;
- time to locate supporting evidence/receipt;
- errors attributing actor vs authority;
- errors interpreting requested/executed/confirmed;
- number of context switches;
- context-recovery time.

Secondary metrics:

- structural comprehension;
- perceived confidence;
- perceived cognitive load;
- ability to preserve orientation after opening/returning;
- preference, measured only after objective tasks.

## 11. GO criteria

Proceed to a broader World experiment when:

- no competing source of truth is introduced;
- 100% of displayed operational entities resolve to canonical references;
- read model rebuild is semantically reproducible;
- 100% of represented mutations/effects have actor + authority + provenance when such data exists canonically;
- no silent divergence exists among views;
- World improves at least two task metrics materially without reducing correctness;
- target relational/resume tasks show approximately 20% improvement or equivalent material accuracy gain;
- users do not confuse UNKNOWN/STALE with success.

## 12. GO-HYBRID

A hybrid outcome is valid if structured projection helps orientation/causality but chat/search remain superior for detailed work.

Expected product form:

```text
List/Search/Chat
      +
Cockpit/Timeline/Graph for orientation
```

## 13. NO-GO

Do not expand the surface if:

- gains are mainly aesthetic;
- the structured condition is slower and less accurate;
- Graph adds no value beyond Cockpit;
- 3D is required just to make the concept interesting;
- the prototype requires an ontology engine, graph database, new event store or bidirectional sync before value is demonstrated;
- the read model cannot be rebuilt deterministically;
- users repeatedly misread authority, provenance or effect state.

A NO-GO for 3D is not automatically a NO-GO for structured projection.

## 14. Anti-goals

Not part of v0.1:

- 3D world;
- avatars/VR/AR;
- physics;
- multiplayer;
- universal editor;
- world-driven creation/mutation;
- autonomous agent rearrangement;
- universal device control;
- second event store;
- graph database requirement;
- full Context Fabric visualization;
- production deployment.

## 15. Required evidence before expansion

The mission may advance beyond read-only discovery only after capturing:

- exact canonical dataset/revision;
- baseline and structured task results;
- read-model rebuild proof;
- divergence/failure tests;
- usability observations;
- Emily audit against the tested revision.


## 16. Single-participant pilot methodology amendment

The original same-dataset A/B design is suitable for counterbalanced multi-participant testing, but it creates a practice/carryover confound when the same initial participant answers the same factual questions twice.

For the initial LEANDRO exploratory pilot:

- Condition A uses representative Experiment Fixture X.
- Condition B uses isomorphic representative Experiment Fixture Y.
- X and Y preserve the same structural complexity: 12 entities, 11 typed relations, 6 temporal fixture events, one current gate, one provider-observed artifact that is not a canonical receipt, one UNKNOWN evidence item and one STALE item.
- X and Y use factually different labels, states and expected answers.
- The two question sets exercise parallel competencies rather than reusing the same factual answers.
- Timing starts only after the condition and current question are visible.
- Results record condition, fixture ID, answer, expected answer, correctness and elapsedMs.
- Fixtures and answer keys are frozen before observing the human result.

This pilot is exploratory intra-individual evidence. It may support a statement about LEANDRO's observed performance in this controlled run; it must not be generalized into a population-level performance claim.

A later confirmatory experiment should counterbalance fixture/condition assignment across multiple participants or fresh matched fixture pairs to separate interface effect from fixture effect.
