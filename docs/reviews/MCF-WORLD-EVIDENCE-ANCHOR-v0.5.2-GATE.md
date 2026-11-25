# MCF World Evidence Anchor v0.5.2 — Schema/Runtime Alignment Gate

Audited SHA: daf94d2fdae90c04c96dfc7d84b3c92757aabf28

## Sofia

Verdict: PASS.

The runtime now matches the already-gated JSON Schema boundary.

Verified:
- exact document shape;
- exact schema identifier;
- exact anchor property set;
- sourceRef restricted to repo-file;
- exact declaredBy shape;
- non-empty strings;
- true integer line ranges;
- specific diagnostics before generic documentShape;
- no product semantic expansion.

## Emily

Verdict: PASS — defensive contract alignment only.

Critical: none.
High: none.
Medium blocking: none.

Existing protections remain:
- supported_by eligibility;
- Evidence not UNKNOWN;
- anchor identity conflict fail-closed;
- source equality;
- repository containment;
- same-buffer digest;
- range validation;
- no search/discovery/inference.

Functional expansion remains HOLD_PENDING_HUMAN_VALIDATION.

## Authorization boundary

This gate authorizes no new feature.

Allowed:
- hardening;
- regression;
- security;
- documentation.

Not authorized:
- Product GO;
- new product functionality;
- persistent service;
- mutation;
- production;
- 3D.
