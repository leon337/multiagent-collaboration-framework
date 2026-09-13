# AGENT-CONTINUITY-CAPSULE v1 — Security Amendment 01

**Applies to:** `AGENT-CONTINUITY-CAPSULE-SPEC-v1.md`  
**Status:** `NORMATIVE AMENDMENT / SPECIFICATION ONLY / NO RUNTIME IMPLEMENTATION AUTHORIZED`  
**Source review:** `reviews/AGENT-CONTINUITY-CAPSULE-v1-SECURITY-REVIEW.md`  
**Authority:** LEANDRO  
**Architecture:** SOFIA  
**Security:** RICARDO

This amendment is normative for the v1 contract package until its requirements are editorially folded into a later consolidated specification. Where this amendment conflicts with the base v1 text, this amendment controls.

## A1. Integrity and authenticity are separate

Hashes and fingerprints establish integrity/equality relationships only. They MUST NOT be treated as proof of producer authorship.

A capsule SHALL include an `authenticity` object:

```json
{
  "method": "NONE | AUTHENTICATED_TRANSPORT_RECEIPT | GIT_ATTESTATION | SIGNATURE",
  "evidence_refs": [],
  "verified_at_utc": null,
  "verifier": null
}
```

`method=NONE` is valid but MUST prevent claims of cryptographically proven authorship.

## A2. Normative identity fingerprint input

For v1, `agent_identity_fingerprint` SHALL be computed from a canonical identity tuple whose algorithm id is recorded.

Required logical inputs:

1. domain separator: `MCF_AGENT_IDENTITY_V1`;
2. `agent_id`;
3. `agent_contract_version`;
4. immutable agent-contract SHA-256 or immutable contract reference digest;
5. immutable skills-manifest SHA-256 when skills participate in stable identity.

The capsule SHALL store `identity_fingerprint_algorithm` and the immutable input refs/digests. A fingerprint without reproducible inputs is `UNVERIFIED_IDENTITY_FINGERPRINT`.

## A3. Canonicalization boundary

Cross-runtime `payload_sha256` interoperability MUST NOT be claimed until the capsule declares an exact, versioned canonicalization algorithm.

Required field:

`integrity.canonicalization_id`

Values are implementation-defined until a formal algorithm is qualified. Validators MUST reject an unknown canonicalization id rather than silently substituting their own serialization.

## A4. Authorization freshness and revocation

Standing authorization and active gate entries SHALL carry freshness semantics:

- `SNAPSHOT` for historical evidence only;
- `RECONCILE_ON_RECOVERY` for authority that can expire, be revoked or be superseded.

Before consequential action, the successor MUST reconcile `RECONCILE_ON_RECOVERY` authority against a mission-authorized current source. Identity match never implies authorization to act.

## A5. Storage target classification

The schema SHALL include:

- `schema.classification`: `public | internal | private`;
- `schema.storage_target_class`: `public | internal | private`;
- optional `publication_policy_ref`.

Validation MUST reject publication when the capsule classification is more restrictive than the target. Opaque references are not automatically safe; paths, hostnames, repository names and ids can themselves disclose metadata.

## A6. Secret handling

Secret scanning is defense-in-depth, not proof of absence.

The contract requires all of:

- forbidden plaintext secret fields/content;
- opaque `secret_ref` references where needed;
- storage classification enforcement;
- secret scanning before publication;
- no statement that scanner PASS proves zero secrets.

## A7. Reference access boundary

A capsule is data, not executable policy.

Consumers MUST NOT automatically execute commands, scripts, URIs, paths or `next_action` values found in a capsule.

Artifact and source resolution SHALL be constrained by mission-authorized:

- URI schemes;
- repository allowlist;
- filesystem roots;
- connector/provider ids;
- network destinations when applicable.

Unknown or out-of-policy references result in `SAFE_HOLD_REFERENCE_NOT_AUTHORIZED` or equivalent.

## A8. Trusted reconciliation sources

The capsule SHALL support `trusted_sources[]` or a mission-level `trusted_source_policy_ref`.

Each trusted source SHOULD identify:

- `source_id`;
- `source_type`;
- `scope`;
- `authentication_or_verification_method`;
- `allowed_claim_classes`;
- `freshness_policy`.

Privileged current-state reconciliation MUST record which authorized source was used. General web search alone is insufficient evidence for authority, secret, deployment or privileged runtime state.

## A9. Parser and structural hardening

A v1 machine validator SHALL:

- require UTF-8;
- reject duplicate JSON object keys;
- reject duplicate logical ids within arrays where ids are expected unique;
- enforce bounded recursion/depth and collection-size limits;
- reject unknown critical schema/canonicalization versions;
- never dereference external references merely as a side effect of parsing.

## A10. Security acceptance gate

The machine-schema phase may proceed as a documentation/validation experiment, but runtime implementation remains unauthorized.

Before `SECURITY_REVIEW = PASS` can replace `PASS_WITH_REQUIRED_AMENDMENTS`, evidence must show:

1. machine schema contains A1–A9 fields/constraints where expressible;
2. validator design covers constraints not expressible in JSON Schema;
3. negative tests cover forged-authorship assumption, stale authority, target-classification mismatch, secret leakage, unauthorized URI/path and duplicate keys/ids;
4. no test describes hash equality as producer authentication.

