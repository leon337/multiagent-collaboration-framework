# PHASE-006-GATE-C-REAL-PROVIDER-WRITE — Plan

## Mission contract

```yaml
mission_id: MCF-RUNTIME-006-GATE-C-REAL-PROVIDER-WRITE
issue: 111
technical_pr: 112
risk_class: C
objective: Close Gate C with a governed, reversible real GitHub provider write proof.
expected_outcome: C1 and C2 real writes proven through the MCF Runtime with read-back, receipts, ledger and idempotency.
current_state: ENTREGUE
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
- Remove temporary real-write proof infrastructure before merge.

## Out of scope

- Production enablement.
- Public release.
- Merge of any proof PR.
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
8. Successful writes followed by unprovable read-back remain `PARTIAL/UNKNOWN`.
9. Foundation, complete test suite, build and Container Smoke pass.
10. Temporary proof workflow/trigger/harnesses do not enter `main`.
11. Independent audit passes with zero blocking finding.
12. Léo approves the technical gate before merge.
13. Production remains blocked.

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

- Normal Foundation CI and Container Smoke on each promoted technical candidate.
- Dedicated governed provider proof with bounded permissions while the proof harness exists.
- External GitHub read-back of branch, proof PR and proof comment.
- Artifact digest and exact attempt/receipt identifiers.
- Regression tests for transient read-back and post-write auth loss.
- Independent audit of permanent runtime changes.
- Removal of temporary proof infrastructure.
- Léo gate.
- Technical merge followed by separate canonical documentation sync on the resulting `main`.

## Final canonical closeout

```yaml
canonical_pr: 118
canonical_merge: 3feff116a3bf66427cfdfcb10894c0f76f79ee11
canonical_post_merge_documentation_run: 31539238013
canonical_post_merge_documentation: PASS
closeout_pr: 119
closeout_merge: 303a4385aed51c531993613ca9d664d1599f538e
closeout_post_merge_documentation_run: 31540925137
closeout_post_merge_documentation: PASS
state: ENTREGUE
gate_c: COMPLETE
next_boundary: RELEASE_CANDIDATE_GATE_E
production: BLOCKED
```

The three temporary closeout workflows accidentally merged by PR #119 are removed by the final cleanup before Issue #111 is closed.
