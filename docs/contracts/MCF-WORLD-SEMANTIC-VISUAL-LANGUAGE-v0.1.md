# MCF World Semantic Visual Language v0.1

Mission: MCF-WORLD-PROJECTION-001
Scope: evidence-driven read-only UX iteration
Product GO: not authorized

## Goal

Improve semantic discriminability and audit-at-a-glance without changing canonical meaning.

The language must remain consistent across Cockpit, Timeline, Graph, Inspector and the linear/reference view.

## Channel 1 — State / freshness

State/freshness is encoded redundantly.

### FRESH

- semantic color: green;
- icon: ✓;
- text: FRESH · confirmado;
- border/background reinforcement.

### STALE

- semantic color: amber;
- icon: ↻;
- text: STALE · revalidar;
- double border where spatially useful.

### UNKNOWN

- semantic color: violet;
- icon: ?;
- text: UNKNOWN · não confirmado;
- dashed border where spatially useful.

### BLOCKED

- semantic color: red;
- icon: ⛔;
- text: BLOCKED · bloqueado;
- strong mission-state treatment.

BLOCKED is operational mission state, not freshness.

## Channel 2 — Object type

Object type is not encoded by freshness color.

Types use icon + explicit label:

- Project: ◇ PROJECT
- Mission: ⬢ MISSION
- Agent: ● AGENT
- Artifact: ▣ ARTIFACT
- Human Gate: ⬡ GATE
- Evidence: ◈ EVIDENCE
- Action: → ACTION

## Channel 3 — Operational position / focus

Current selection/focus uses cyan border/halo plus explicit text when explained; it uses no icon reserved for an object type and does not replace freshness state.

Timeline is visually receded to communicate historical position while preserving each object's freshness/type encoding.

## Cross-view invariant

A semantic signal must not change meaning between Cockpit, Timeline and Graph.

Examples:

    violet + ? + UNKNOWN
        always means not yet confirmed

    amber + ↻ + STALE
        always means needs revalidation

    green + ✓ + FRESH
        always means confirmed in the represented snapshot

## Accessibility boundary

Color is never the only signal.

Every semantic state must have at least color + text and, where implemented, color + icon + text + border/form.

## Product boundary

This language changes presentation only.

It must not infer new state, change freshness, change trust, change authority, create relations, mutate canonical state or create external effects.
