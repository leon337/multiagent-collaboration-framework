# MCF World Projection — Human Findability R Review

Audited evidence SHA:

    bdf326d5bbff997445ce4bf74fa21babe8acb420

## Human result

Instrument: Open-Interface Findability R
Fixture: R
Participant: LEANDRO

Observed result:

    3 / 5 = 60%
    total answer time = 403.977 s

Per-task result:

1. Mission state = BLOCKED
   - correct
   - 17.488 s
   - active surface: Agora
   - 0 recorded interactions

2. Item not yet confirmed
   - answer: Review Gate
   - expected: Signature receipt
   - incorrect
   - 91.857 s
   - path included Timeline -> Cockpit -> Timeline

3. Item that may have changed and needs revalidation
   - answer: Runtime snapshot
   - expected: Runtime snapshot
   - correct
   - 253.721 s
   - 8 recorded interactions
   - path included Graph exploration and return to Cockpit

4. Provider-observed artifact that is not a canonical receipt
   - answer: Signature receipt
   - expected: Build #908
   - incorrect
   - 16.911 s
   - active surface: Agora
   - 0 recorded interactions

5. Independent auditor
   - answer: Marcos
   - expected: Marcos
   - correct
   - 24.000 s
   - path included Timeline -> Graph -> agent inspection

## Laura / UX

Verdict on current findability hypothesis:

    CONDITIONAL

Interpretation:

- there is real signal that the structured interface supports some operational jobs;
- current findability is not yet consistent enough for PASS;
- the errors and long path on task 3 indicate semantic discriminability and orientation cost;
- the qualitative proposal for stronger semantic visual differentiation is coherent with the observed pattern.

## Leonardo / Product

Interpretation:

- the result supports the context-recovery JTBD partially;
- current state, STALE/revalidation and auditor identity were recoverable;
- the interface cannot yet be called efficient, intuitive or solved;
- the error cluster is more consistent with weak semantic discriminability than with total information absence;
- recommended next step is an experimental Semantic Visual Language plus minimal onboarding/legend before a broader controlled comparison.

No claim of superiority over linear UI, generalized usability, reduced cognitive load, Product GO or 3D value is supported.

## Emily / Independent Evidence Review

Evidence gate:

    PASS — exploratory human evidence with bounded claims

Functional decision:

    PARTIAL LIFT — UX iteration only

The evidence is valid for an exploratory single-participant claim.

Limitations:
- result was recovered after execution from Brave Local Storage rather than captured through an independent immutable browser receipt;
- participant had prior exposure to World iterations;
- the result does not represent a new-user population;
- task 3 demonstrates eventual findability, not efficiency.

Authorized narrow continuation:

    Evidence-driven read-only UX iteration

Specifically allowed:
- semantic visual encoding;
- stronger differentiation of state, object type, freshness/trust and observed-vs-canonical semantics;
- redundant encoding with text/icon/shape/emphasis in addition to color;
- minimal legend/onboarding;
- later human evaluation of the revised interface.

Not authorized:
- Product GO;
- 3D;
- mutation/write-back;
- persistent World service;
- production.

## Qualitative feedback

Participant reported:
- interface felt significantly better;
- overall experience was very good;
- there is still a learning curve;
- current uniform color treatment makes visual audit harder;
- differentiated colors/visual semantics across Cockpit, Timeline and Graph may improve orientation and audit-at-a-glance.

This qualitative feedback is preserved separately from the quantitative score.

## Decision

    PRODUCT_VALUE_GATE = CONDITIONAL
    NONHUMAN_FUNCTIONAL_EXPANSION = PARTIAL_HOLD_LIFT_FOR_EVIDENCE_DRIVEN_READONLY_UX_ITERATION_ONLY
    NEXT_EXPERIMENT = SEMANTIC_VISUAL_LANGUAGE_V0_1
    PRODUCT_GO = NOT_AUTHORIZED
    3D = DEFERRED
    MUTATION = NOT_AUTHORIZED
