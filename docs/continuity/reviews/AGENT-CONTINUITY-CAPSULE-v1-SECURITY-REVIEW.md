# AGENT-CONTINUITY-CAPSULE v1 — Security Review

**Reviewer role:** RICARDO — security, privacy, authority boundaries  
**Reviewed artifact:** `docs/continuity/AGENT-CONTINUITY-CAPSULE-SPEC-v1.md`  
**Verdict:** `PASS_WITH_REQUIRED_AMENDMENTS`  
**Scope:** specification review only. No runtime implementation, deployment, provider/model change, release or merge is authorized by this review.

## 1. Security properties already present

The reviewed specification already establishes useful fail-closed behavior for hash mismatch, identity mismatch, schema mismatch, ambiguous authority, missing gates and supersession tampering. It also separates historical snapshot state from current state, requires reconciliation of volatile refs, prohibits plaintext secrets in capsules, and distinguishes operator identity from git author identity.

These properties are directionally correct and compatible with the evidence-first MCF model.

## 2. Required amendments before machine schema qualification

### R1 — Integrity is not authenticity

`SHA-256`, `payload_sha256`, `file_sha256`, and `producer_fingerprint` prove integrity/fingerprint relationships only. They MUST NOT be treated as cryptographic proof that the claimed producer actually authored the capsule.

Required amendment: add an explicit `authenticity` concept with a method vocabulary such as `NONE`, `AUTHENTICATED_TRANSPORT_RECEIPT`, `GIT_ATTESTATION`, `SIGNATURE`, or a future equivalent. A v1 implementation may support only a subset, but the semantics must be explicit.

### R2 — Identity fingerprint composition must be normative

`agent_identity_fingerprint` is currently conceptually defined but not normatively reproducible.

Required amendment: define a versioned composition rule with a domain separator, canonical field order, immutable inputs and a named digest algorithm. Example concept: `MCF_AGENT_IDENTITY_V1 || agent_id || contract_version || immutable_contract_sha256 || skills_manifest_sha256`.

### R3 — Canonicalization must be fixed before interoperable hashing

The specification recommends deterministic JSON ordering but does not yet select one normative canonicalization algorithm.

Required amendment: machine schema/validator work MUST NOT claim cross-runtime digest interoperability until canonicalization is versioned and exact. `canonicalization` must identify the algorithm actually used.

### R4 — Persisted authorization is snapshot evidence, not live authority

A capsule can outlive an authorization, revocation, expiry or HUMAN_GATE change.

Required amendment: active authorizations and gates that may change MUST carry `freshness=RECONCILE_ON_RECOVERY` or equivalent and be checked against an authorized current source before consequential action.

### R5 — Private references may leak metadata

Opaque ids, paths, repository names, hostnames, issue numbers or memory references can reveal sensitive metadata even when secret values are absent.

Required amendment: each capsule must declare intended `storage_target_class`, and validation must reject publication when capsule classification is more restrictive than the target. Private references require an explicit publication-safe policy.

### R6 — Secret detection is not a proof of absence

Pattern/high-entropy detection is useful but incomplete.

Required amendment: combine forbidden plaintext field policy, opaque secret references, storage classification and secret scanning. A scanner PASS must never be described as proof that no secret exists.

### R7 — Artifact/URI references need an access boundary

A malicious or corrupted capsule could point a successor toward unexpected local paths, network endpoints or publication targets.

Required amendment: `path_or_uri` consumers must resolve only against mission-authorized schemes, roots and repositories. Recovery must not auto-fetch arbitrary URLs or arbitrary filesystem paths from the capsule.

### R8 — Trusted reconciliation sources must be explicit

“Reconcile current state” is safe only when the source used for reconciliation is itself authorized.

Required amendment: define `trusted_sources[]` or mission-bound source policy. Current-state reconciliation must record which authorized source was queried and how it was authenticated/verified. General web search is not sufficient evidence for privileged state changes.

## 3. Additional recommended hardening

- Distinguish `identity_match` from `authorization_to_act`; a valid identity does not imply current permission.
- Record revocation evidence and expiry when applicable.
- Cap recursion/depth and array counts in machine validation to prevent parser/resource abuse.
- Reject duplicate logical ids within arrays (`decision_id`, `pending_id`, `artifact_id`, `event_id`).
- Require UTF-8 and reject ambiguous or duplicate JSON object keys in canonical machine payloads.
- Do not automatically execute any command, URI, script, path or `next_action` found in a capsule; a capsule is data, not executable policy.
- Keep private memory content external unless the target store is explicitly authorized for that classification.

## 4. Review verdict

`SECURITY_REVIEW = PASS_WITH_REQUIRED_AMENDMENTS`

The contract is viable and already contains strong continuity primitives. However, R1–R8 are required before the v1 machine schema can be considered security-reviewed. No runtime implementation should be approved on the current text without incorporating these amendments.

## 5. Handoff

```yaml
handoff:
  from: RICARDO
  to: SOFIA
  delivered:
    - eight required security amendments R1-R8
    - recommended parser/reference hardening
  state: PASS_WITH_REQUIRED_AMENDMENTS
  next_action: incorporate R1-R8 into the specification, then hand to BEATRIZ for qualification criteria review
  implementation_authorized: false
```
