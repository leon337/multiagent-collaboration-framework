# MCF-HUMAN-AUTHORITY-BOOTSTRAP-PR-REMEDIATION-005

Status: implementation candidate for Codex review; PR #189 remains Draft.

## Reconciled lineage

- PR: `#189`, stacked on PR `#188`.
- Base branch: `feat/chat-mission-control-bridge-20260828`.
- Base SHA observed at mission start: `a7b2016cd7705f37acb949ba77de31833cf62521`.
- Pre-remediation PR HEAD: `4db31f8d87bcf5f0ea80789c07c1513ffd2e1ffa`.
- `main` observed at mission start: `cddd4f2531b4a7769e06273915d267783296a058`.
- No retarget, merge, force-push, release, staging mutation, Render mutation, or VPS action is part of this remediation.

## Live read-only provider facts

- GitHub Environment `mcf-human-authority-staging`: absent (`404`) at mission start. The workflow now performs a metadata GET in a prerequisite job that has no `environment:` binding; a missing/unprotected environment fails before the protected job can start.
- Repository creation date: 2026-07-30. GitHub documents immutable default OIDC subjects for repositories created after 2026-07-15, so the bootstrap policy pins owner ID + repository ID in `sub` and independently pins `repository`, `repository_id`, `repository_owner_id`, `ref`, `workflow_ref`, `environment`, and `workflow_dispatch`.
- JWT verification independently pins issuer `https://token.actions.githubusercontent.com`, configured audience, and `RS256`.
- Render documents `PUT /v1/services/{serviceId}/env-vars/{envVarKey}` as add-or-update, with no conditional create/CAS precondition documented. Environment changes are not automatically deployed.

## State machine after remediation

```text
UNBOUND
  -> PENDING
  -> APPLYING
  -> PROVIDER_APPLIED
  -> VERIFYING
  -> RUNTIME_VERIFIED
  -X-> BOUND   (intentionally unavailable in this PR; requires future authorized behavioral E2E verifier)

APPLYING|PROVIDER_APPLIED|VERIFYING|RUNTIME_VERIFIED
  -> RECONCILIATION_REQUIRED   (provider ambiguity/drift; fail closed)
  -> CONFLICT | FAILED

Any active state + intent expiry
  -> FAILED / INTENT_EXPIRED + SYSTEM audit
```

## Finding-to-remediation matrix

| Review finding | Remediation | Proof |
|---|---|---|
| `BOUND` accepted a digest without runtime/E2E proof | Removed `BOUND` from the exposed result/service finalization contract. Runtime evidence is now gathered server-side by the Bootstrap Issuer. No current transition can produce `BOUND`; behavioral E2E remains a later human-gated capability. | controller evidence-boundary tests; repository integration stops at `RUNTIME_VERIFIED` |
| VERIFYING recovery broke an APPLYING-only runner | Claim schema accepts recovered `APPLYING`, `PROVIDER_APPLIED`, `VERIFYING`, `RUNTIME_VERIFIED`; later states never reapply provider mutation. | control-plane recovery test + Postgres lease recovery integration |
| Expired intent could be completed and expiry lacked audit | Every claim/transition checks `expires_at`; claim of an expired active intent atomically moves it to `FAILED/INTENT_EXPIRED` and emits SYSTEM audit. | Postgres expiry integration |
| Render GET→PUT race could overwrite another binding | Automatic PUT was removed. Existing same value is read-only `PROVIDER_APPLIED`; different value is `CONFLICT`; absent value is `RECONCILIATION_REQUIRED/PROVIDER_ATOMIC_CREATE_UNAVAILABLE`. | Render client tests assert zero PUT calls |
| OIDC policy disagreed with immutable live identity | Policy uses immutable owner/repository IDs and strict repo/ref/workflow/environment/event claims; JWT verifier pins issuer/audience/RS256. | 1 allow + deny matrix; static issuer/audience governance gate |
| Protected GitHub Environment absent | Workflow precondition performs GET only and fails closed on non-200 or missing protection rules before the job that references the environment. | governance test; live read returned 404 |
| Lineage could be confused with `main` | PR remains stacked on #188; base/main snapshots are explicit and no retarget/force-push is used. | git/GitHub read-back before push and after push |
| Render behavior was assumed | Implementation now matches documented add-or-update/no-CAS semantics and does not promise atomicity. | provider docs + no-PUT adapter tests |
| Missing E2E/recovery/redaction coverage | Added state recovery, runtime observation, expiry audit, no-PUT race, strict OIDC, caller-evidence rejection, and output/body redaction assertions. | focused test matrix and full verification |

## Residual risks / deliberate blocks

1. **Provider mutation is deliberately blocked when the env var is absent.** Render's documented individual-variable API has no atomic create-only/CAS contract. This PR therefore cannot guarantee a race-free automatic first write and refuses to perform one.
2. **`BOUND` is deliberately unreachable.** A future gate must introduce an authorized behavioral E2E verifier; a caller-supplied digest is not accepted as proof.
3. **The protected GitHub Environment does not exist yet.** This PR does not create it. The workflow fails closed until a separately authorized gate provisions and protects it.
4. The parent PR #188 remains a dependency. PR #189 must not be merged independently of its parent lineage.

## Next gate

Codex review should validate the exact new HEAD, the no-PUT provider boundary, the absence of a BOUND route, the protected-environment precondition, and all local/remote checks. No operational G2+ action is consumed by this document or remediation.
