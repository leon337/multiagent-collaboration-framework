# MCF-WORLD-PROJECTION-001 — Test Validity Reassessment

Date: 2026-09-26
Trigger: human v0.2.2 object-state microtest = 1/5 in 46.207 s

## Evidence

The hidden-interface recall test showed poor memory retention of arbitrary object-state bindings after the interface was removed.

This is valid negative evidence about recall.

It is not valid negative evidence about assisted context recovery while the World surface remains available.

## Laura — UX

Verdict: the explore -> hide -> recall microtest is misaligned with the primary product job.

The product job is:

    return to a mission
    -> use the interface
    -> locate the relevant state
    -> interpret it
    -> continue work

The microtest instead measured:

    inspect labels
    -> remove interface
    -> remember labels
    -> recall their states

The remaining valid UX question is findability + comprehension with the interface present.

## Leonardo — Product

The v0.2.2 result invalidates the hypothesis that explicit binding creates durable interface-independent recall.

It does not invalidate:

- the context-recovery problem;
- the structured-surface value hypothesis;
- prior improvement in state semantics;
- findability, because findability has not yet been tested;
- navigation support, because navigation has not yet been tested.

Corrected JTBD:

> When returning to a complex mission, LEANDRO wants to quickly locate the current state, uncertainties, stale information, relevant evidence and next operational step using the interface as an external cognitive aid, without rereading the full linear history.

## Emily — Independent Audit

Verdict: CONSTRUCT_MISMATCH.

PRODUCT_VALUE_GATE remains BLOCKED until a human findability/task-completion test is run with the interface continuously available.

The next valid instrument must measure:

- correctness / task completion;
- time per task;
- navigation path;
- unnecessary surface changes;
- interpretation errors;
- evidence/provenance findability.

The interface must remain visible and navigable throughout the task.

## Canonical decision

The v0.2.2 recall result remains preserved as negative memory evidence.

It must not be used to conclude that the 2D structured interface fails the primary JTBD.

Next experiment: OPEN_INTERFACE_FINDABILITY_TEST.

No Product GO, 3D, mutation or production is authorized.
