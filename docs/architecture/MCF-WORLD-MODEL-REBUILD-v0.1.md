# World Model v0.1 — Rebuild and Convergence Specification

## Goal

Prove that World can be deleted and reconstructed without loss of operational truth.

## Rebuild inputs

A rebuild test MUST freeze:

1. source snapshots or immutable source revisions;
2. adapter versions;
3. WPP version;
4. World Model Contract version;
5. deterministic identity rules;
6. deterministic relation-derivation rules.

## Normalized output

Before comparison:

- sort objects by ref.id;
- sort relations by id;
- sort ContextEntries by id;
- normalize map/object key order;
- exclude generatedAt and explicitly non-semantic local timestamps from equality;
- preserve source revisions, provenance, trust, freshness and diagnostics.

## Equivalence assertion

Two rebuilds from identical semantic inputs MUST produce semantically equivalent:

- object identities;
- typed payload values;
- relation identities/types/endpoints/provenance;
- context entries;
- UNKNOWN/STALE classification;
- conflict diagnostics;
- revision vector.

## Required negative cases

### UNKNOWN

Input: required canonical value cannot be established.

Expected:
- no guessed value;
- projected state remains UNKNOWN;
- source/projection diagnostic preserved.

### STALE

Input: prior trustworthy observation exists but freshness policy is no longer satisfied.

Expected:
- value may remain visible;
- freshness = STALE;
- it MUST NOT be presented as current confirmed state.

### Conflict

Input: two competent sources disagree and no canonical reconciliation rule is available.

Expected:
- no silent winner;
- diagnostic records conflict;
- context packet preserves uncertainty.

### Untrusted external

Input: browser/provider text is observed but not authority/evidence.

Expected:
- trust = UNTRUSTED_EXTERNAL;
- content remains data;
- cannot grant authority or satisfy evidence by itself.

### Inferred relation

Input: relation inferred by a rule/heuristic without canonical assertion.

Expected:
- provenance.mode = INFERRED;
- relation MUST NOT be serialized/presented as canonical fact.

## Failure condition

If deletion of World projection storage prevents determining canonical mission truth after source recovery, World has become an invalid source of truth.

If rebuild failure affects only projection latency, cache warmup, graph layout or presentation preferences, the canonical boundary remains intact.
