# AGENT-CONTINUITY-CAPSULE v1 — Schema Qualification — 2026-08-26

**Scope:** documentation/validation prototype only  
**Orchestrator:** MESTRE  
**Architecture:** SOFIA  
**Quality:** BEATRIZ  
**Security inputs:** RICARDO Security Review + Security Amendment 01  
**Runtime implementation:** NOT AUTHORIZED

## 1. Artifacts under qualification

- `schemas/continuity/continuity_capsule_v1.schema.json`
- `schemas/continuity/fixtures/OX-continuity-normalized-fixture.json`
- `docs/continuity/AGENT-CONTINUITY-CAPSULE-SPEC-v1.md`
- `docs/continuity/AGENT-CONTINUITY-CAPSULE-SPEC-v1-SECURITY-AMENDMENT-01.md`

Remote GitHub read-back confirmed the schema and fixture exist on branch `docs/continuity-agent-bodies-20260826` after publication.

## 2. Structural validation environment

Validation used a Draft 2020-12 JSON Schema validator against a locally materialized prototype equivalent to the published schema/fixture content before publication.

The prototype explicitly treats `MCF_FIXTURE_SORTED_JSON_V0` as a test-only canonicalization id. It is NOT a production/interoperability canonicalization standard.

## 3. Positive test

### QP-01 — normalized OX fixture

Input: normalized OX continuity fixture derived from the proven OX migration evidence.

Result: `PASS` — zero structural schema errors.

Boundary: fixture-only `agent_contract_sha256`, `skills_manifest_sha256` and derived identity fingerprint are synthetic test anchors. They are explicitly not canonical OX identity facts.

## 4. Negative structural tests

### QN-01 — required identity field removed

Mutation: remove `identity.agent_id`.

Expected: schema rejection.  
Observed: `REJECTED` — required-property failure.

### QN-02 — classification/target mismatch

Mutation: `classification=private` + `storage_target_class=public`.

Expected: publication-incompatible schema rejection.  
Observed: `REJECTED`.

### QN-03 — unknown canonicalization id

Mutation: replace prototype canonicalization id with `UNKNOWN_CANON`.

Expected: reject instead of silently selecting a serializer.  
Observed: `REJECTED`.

### QN-04 — invalid artifact digest shape

Mutation: replace a 64-hex SHA-256 with `abc`.

Expected: schema rejection.  
Observed: `REJECTED`.

### QS-01 — payload mutation after seal

Mutation: alter `mission.current_state` after computing the fixture `payload_sha256` and recompute the digest independently for comparison.

Expected: stored payload hash no longer equals recomputed payload hash.  
Observed: `INTEGRITY_MISMATCH_DETECTED`.

This is a semantic integrity check, not a pure JSON Schema capability.

## 5. Controls intentionally NOT claimed as JSON Schema-complete

The following remain validator/runtime semantics and are not considered solved by the machine schema:

- duplicate JSON object-key rejection at parser boundary;
- duplicate logical ids across arrays;
- canonical payload hashing in a production algorithm;
- producer authenticity/signature semantics;
- agent identity fingerprint recomputation from canonical contracts;
- authority revocation/freshness reconciliation;
- trusted-source policy evaluation;
- secret leakage policy/scanning;
- path/URI/repository allowlists;
- prohibition on automatic execution of `next_action`/URI/script values;
- current-state network/provider reconciliation.

## 6. Gate result

`Q-SCHEMA = PASS_FOR_PROTOTYPE`

This means the machine contract can represent the continuity model and reject several important structural failures. It does NOT mean:

- validator implementation is complete;
- security review is fully PASS;
- generalized multi-agent continuity is proven;
- runtime implementation is authorized;
- PR #174 may be merged without LEANDRO gate.

Remaining gates:

- `Q-VALIDATOR` — pending;
- `Q-GENERALIZATION` / T22 second-agent fixture — pending;
- RICARDO final security PASS — pending implementation-aware evidence;
- OX independent fixture review — dispatched/pending at time of this report.

