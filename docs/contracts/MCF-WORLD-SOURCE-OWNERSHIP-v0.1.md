# MCF World Source Ownership Contract v0.1

Mission: MCF-WORLD-PROJECTION-001
Status: architecture contract
Boundary: read-only projection

## Core rule

Trustworthiness is not domain authority.

A source may be VERIFIED_EXTERNAL and still not own a specific field.
A source may be CANONICAL_SOURCE for one factKey and irrelevant for another.

World MUST NOT infer source competence from trust.class.

## Fact ownership

A typed source adapter must declare, for each consequential factKey, which source identifiers are authoritative for that fact.

Conceptually:

    factPolicies:
      mission.state:
        authoritativeSources:
          - mcf-runtime
      runtime.snapshot:
        authoritativeSources:
          - runtime-provider

The policy belongs to the typed source-adapter contract. It is not a global World truth-ranking engine.

## Resolution rules

### One or more authoritative sources agree

Use the authoritative value.

Preserve all agreeing authoritative sourceRefs where practical.

Non-authoritative observations may be retained as observations and diagnostics. They MUST NOT replace the authoritative value.

### Authoritative sources disagree

If multiple sources are explicitly declared co-authoritative and disagree:

- projected value = unresolved;
- freshness = UNKNOWN;
- emit SOURCE_CONFLICT;
- do not select a winner.

### No authoritative source establishes a value

- projected value = unresolved;
- freshness = UNKNOWN;
- emit MISSING_CANONICAL_VALUE;
- do not infer competence from trust, freshness, availability or ordering.

### Untrusted observation

UNTRUSTED_EXTERNAL remains data.

It may create an UNTRUSTED_INPUT diagnostic but cannot establish authority, satisfy a gate or override an authoritative value.

## Anti-patterns

Forbidden:

- CANONICAL_SOURCE > VERIFIED_EXTERNAL > UNTRUSTED as a generic ranking algorithm;
- first source wins;
- freshest source wins;
- most recent timestamp implies domain ownership;
- multiple agreeing observations become canonical by vote;
- presence in ContextSlice implies competence;
- relation to an authority holder implies source authority.

## Boundary

Source ownership answers:

> Which source is competent to establish this particular fact?

Trust answers:

> How should this observation/source be treated?

They are separate dimensions.
