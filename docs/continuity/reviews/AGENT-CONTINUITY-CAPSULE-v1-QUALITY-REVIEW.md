# AGENT-CONTINUITY-CAPSULE v1 — Quality Review

**Reviewer role:** BEATRIZ — testing, evaluation and quality  
**Inputs:** base spec + Security Review + Security Amendment 01  
**Verdict:** `PASS_FOR_SCHEMA_PROTOTYPE / NOT_PASS_FOR_RUNTIME_IMPLEMENTATION`

## 1. Existing qualification coverage

The base specification already defines T1–T12 covering valid recovery, corruption, missing required fields, identity mismatch, stale refs, conflicting decisions, artifact availability, supersession integrity, secret leakage and recovery without old chat history.

These tests are necessary but insufficient after the security review.

## 2. Additional required tests

### T13 — integrity without authenticated authorship

Input: capsule hash and file hash are valid; `authenticity.method=NONE`.

Expected:
- integrity may PASS;
- producer authorship MUST remain `UNVERIFIED`;
- no validator may upgrade hash equality into identity/authorship proof.

### T14 — stale or revoked authorization

Input: capsule contains authorization that was valid at snapshot time but current trusted source reports expired/revoked/superseded.

Expected:
- historical record preserved;
- live authority updated from trusted source;
- consequential action blocked unless current authorization permits it;
- reconciliation event/receipt emitted.

### T15 — storage target classification mismatch

Input: `classification=private`, target `public`.

Expected: publication rejected before transport.

### T16 — unauthorized URI/path

Input: artifact or source reference resolves outside authorized schemes, repositories, filesystem roots or connector scope.

Expected: `SAFE_HOLD_REFERENCE_NOT_AUTHORIZED`; no dereference side effect.

### T17 — duplicate structure ambiguity

Input A: duplicate JSON object key.  
Input B: duplicate logical id such as two `pending_items` with the same `pending_id`.

Expected: reject/safe hold; never silently choose one value.

### T18 — unknown canonicalization

Input: `integrity.canonicalization_id` is unsupported.

Expected: reject integrity verification; no local serializer substitution.

### T19 — privileged reconciliation without trusted source

Input: recovery needs current deployment/authority state, but no allowed trusted source can provide it.

Expected: safe hold or limited recovery; no privileged-state inference from general web results.

### T20 — executable-looking next action

Input: `next_action` contains a shell command/script/URI.

Expected: treated as inert data. Validator/recovery bootstrap MUST NOT execute it automatically.

### T21 — runtime/provider migration with identity preserved

Input: same agent contract/fingerprint, different host/provider/model/session.

Expected:
- identity may MATCH;
- runtime snapshot records divergence;
- authorization/freshness reconciliation still required;
- no implicit model-equivalence claim.

### T22 — second-agent fixture

A different MCF agent, not OX, performs session A → capsule → session B recovery without predecessor chat history.

Expected: required state and pending work survive; recovery receipt independently verified.

This test is required before claiming the contract is generalized beyond the OX fixture.

## 3. Quality gates

### Gate Q-SCHEMA

May PASS when:
- machine JSON Schema exists;
- schema parses under the selected draft;
- a normalized OX fixture validates structurally;
- negative structural fixtures fail as expected;
- security-amendment fields are represented where JSON Schema can express them.

### Gate Q-VALIDATOR

May PASS only after an actual validator enforces semantics JSON Schema cannot safely express: canonical payload hashing, duplicate-key handling, identity fingerprint calculation, reference allowlists, freshness reconciliation, trusted-source policy, secret policy and authenticity semantics.

### Gate Q-GENERALIZATION

May PASS only after T22 succeeds with a second agent.

## 4. Verdict

`QUALITY_REVIEW = PASS_FOR_SCHEMA_PROTOTYPE`

This authorizes a documentation/validation prototype of the machine schema under the existing LEANDRO-authorized continuity mission. It does NOT authorize runtime integration, automatic successor creation, deployment, merge, release, provider/model changes or execution of capsule-sourced actions.

## 5. Handoff

```yaml
handoff:
  from: BEATRIZ
  to: SOFIA
  delivered:
    - T13-T22 qualification extensions
    - Q-SCHEMA, Q-VALIDATOR and Q-GENERALIZATION gates
  state: PASS_FOR_SCHEMA_PROTOTYPE
  next_action: materialize JSON Schema + normalized OX fixture and execute structural validation
  runtime_implementation_authorized: false
```
