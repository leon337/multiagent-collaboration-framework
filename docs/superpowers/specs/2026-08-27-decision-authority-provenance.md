# Decision Authority Provenance Remediation

**Status:** IMPLEMENTED_PENDING_COMMIT_AND_PR
**Finding:** `DECISION_AUTHORITY_PROVENANCE`
**Severity:** CRITICAL
**Base snapshot:** `a98cc9140c8b001135a8ce9cc37abab69c7165a6`
**Official release at start:** `v1.2.0`

## Problem

The authenticated mission phase route accepts `inputs` from the HTTP body and persists them as `phase.inputs`.
A caller can therefore provide `v11AuthorizationContext.humanGateDecision` including textual provenance such as `decidedBy: "leandro"` and `sourceRef`.
The authenticated session already exposes `authenticatedHuman.accountId`, but that identity is not currently bound to the reserved-human decision.

## Security invariants

1. Reserved human authority is bound to exactly one configured account ID.
2. `decidedBy` is never trusted from caller-controlled input.
3. `sourceRef` for a reserved-human decision is generated server-side.
4. A terminal human decision (`APPROVED` or `REJECTED`) must fail closed when the authenticated account is not the configured reserved authority.
5. Persisted approval provenance contains a canonical account ID and canonical `LEANDRO` authority.
6. Production authorization consumes a typed human-authority proof, not an untyped caller-shaped decision record.
7. Ordinary phases without a reserved-human decision remain backward compatible.
## Acceptance criteria

- Production configuration requires a valid reserved-human account UUID.
- The mission controller passes authenticated identity to the runtime separately from the request body.
- The runtime canonicalizes terminal human-gate provenance before execution and persistence.
- A different authenticated account attempting `decidedBy: "leandro"` receives HTTP 403.
- Caller-supplied `decidedBy`, `accountId`, and `sourceRef` cannot become canonical provenance.
- `HumanDelegationGuard` rejects approved reserved-human decisions without canonical account provenance.
- `ProductionAuthorizationService` validates an approved `HumanAuthorityProof` bound to the configured account ID.
- Relevant unit/integration tests pass, followed by server typecheck and broader verification.

## Out of scope

- Finding A (`HUMAN_CONTROL_RUNTIME_WIRING`) is not remediated in this branch.
- No merge to `main`, tag, release, or production deployment is authorized by this specification.
- No repair of unrelated corrupted local Git refs is included.
- Pre-patch persisted approvals without canonical `accountId` fail closed for production authorization after this remediation; no trust migration is performed.

## Evidence rule

The finding is not considered remediated until the negative-account test is observed failing before production changes, then passing after the fix, with regression tests green.