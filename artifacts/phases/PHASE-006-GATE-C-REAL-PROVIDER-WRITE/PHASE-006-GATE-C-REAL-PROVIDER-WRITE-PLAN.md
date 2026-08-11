# PHASE-006-GATE-C-REAL-PROVIDER-WRITE — Plan

## Mission contract

```yaml
mission_id: MCF-RUNTIME-006-GATE-C-REAL-PROVIDER-WRITE
issue: 111
technical_pr: 112
risk_class: C
objective: Close Gate C with a governed, reversible real GitHub provider write proof.
expected_outcome: C1 and C2 real writes proven through the MCF Runtime with read-back, receipts, ledger and idempotency.
current_state: VALIDATED_AWAITING_AUDIT
decision_authority: Leo
human_authority: Leandro
production: BLOCKED
```

## Scope

- Prove `create-branch-pr` through the governed runtime path.
- Prove PR collaboration (`comment-pr`) through the governed runtime path.
- Verify exact SHA/base binding, read-back and provider evidence.
- Verify C1 compatible replay does not duplicate a pull request.
- Verify C2 duplicate replay is blocked before a second mutation.
- Preserve canonical external-action ledger and trusted receipts.
- Correct defects discovered by the real-provider proof.

## Out of scope

- Production enablement.
- Public release.
- Merge of the proof PR.
- Direct write to `main`.
- Destructive external actions.
- Expansion of GitHub permissions beyond the controlled proof boundary.

## Acceptance criteria

1. C1 creates a real branch and PR through MCF Runtime.
2. C1 read-back is verified against exact head/base SHA and MCF idempotency marker.
3. Compatible C1 replay resolves to the same PR and creates no duplicate PR.
4. C2 creates exactly one real controlled PR comment.
5. C2 read-back is verified.
6. Duplicate C2 replay is rejected before a second external attempt.
7. Ledger attempts and receipts are persisted and evidence-validated.
8. Foundation, complete test suite, build and Container Smoke pass on the technical candidate.
9. Production remains blocked.
10. Independent audit and Léo gate complete before phase closeout.

## Selected agents and control roles

- Mestre — orchestration, contract, CAF and checkpoint.
- Gabriel — GitHub/provider boundary and release traceability.
- Renato — implementation, test evidence and smoke.
- Júlia — Class C governance/security review.
- Augusto — mission trace, failure/recovery chronology.
- Carmem — PRF consistency.
- Emily — independent audit.
- Léo — internal gate decision.

## Human authorization

Leandro authorized a controlled, reversible real-provider write specifically to eliminate the open Gate C debt before Gate E. During execution, a HUMAN_GATE was raised only for the repository Actions policy required to let `GITHUB_TOKEN` create pull requests. Leandro enabled the policy and confirmed completion. No production authorization was granted.

## Validation plan

- Normal PR Foundation CI on exact candidate SHA.
- Normal Container Smoke on exact candidate SHA.
- Dedicated governed provider-proof workflow with bounded permissions.
- External GitHub read-back of branch, proof PR and proof comment.
- Artifact digest and exact attempt/receipt identifiers.
- Independent audit of PR #112 and this PRF.
- Léo gate after audit.
