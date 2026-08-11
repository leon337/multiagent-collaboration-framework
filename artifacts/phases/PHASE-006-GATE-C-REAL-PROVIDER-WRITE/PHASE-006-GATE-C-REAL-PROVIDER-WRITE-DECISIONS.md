# PHASE-006-GATE-C-REAL-PROVIDER-WRITE — Decisions

## D-001 — Controlled real-provider proof authorized

Leandro authorized a controlled, reversible real GitHub provider proof to eliminate the Gate C debt before Gate E. Production and destructive actions remained out of scope.

## D-002 — C2 registry gap corrected

C2 existed in code but was absent from the live runtime registry. The adapter was wired and permanent composition regression coverage was added.

## D-003 — GitHub Actions policy HUMAN_GATE

C1 proved branch creation but GitHub Actions could not create a PR until the repository policy allowed Actions to create/approve pull requests. The HUMAN_GATE was directed only to Leandro, who enabled the policy.

## D-004 — Canonical mission lifecycle required

The real-provider proof was moved to `MissionRuntimeService` so phase persistence and mission version advancement matched the operational runtime.

## D-005 — Single-shot mutations, bounded read-back only

A real provider run exposed a post-write branch read-back weakness. The permanent rule is:

```yaml
mutation_post_retry: NEVER
read_back_retry: BOUNDED_GET_ONLY
unknown_when_unprovable: PRESERVED
```

Permanent regressions cover transient branch/PR read-back and authentication loss after successful writes.

## D-006 — Final real-provider proof accepted

Run `31537057206` on `f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4` passed full C1+C2. Artifact `9119190464` is `stage: COMPLETE`, with PR #117 and comment `5258957980`.

## D-007 — Independent audit and Léo technical gate

Emily/Júlia: `PASS`, zero blocking findings.

Léo: `APPROVE_TECHNICAL_GATE_C`.

## D-008 — Temporary proof infrastructure removed

The proof trigger, write-capable workflow and both live-provider harnesses were removed before technical merge. Permanent runtime code and regression tests remain.

## D-009 — Technical merge accepted

PR #112 was squash-merged as:

`0b060539eb152f0cf92bd146b853562407ab0a64`

Post-merge:
- Documentation validation `31538142320`: PASS.
- Governed staging `31538142312`: PASS_DEPLOYED.

Production remains `BLOCKED`.

## D-010 — Canonical synchronization is separate

The technical merge does not by itself rewrite stale canonical markers. This docs-only phase changes Gate C from `PARTIAL / NOT AUTHORIZED` to a canonical sync candidate based on verified evidence.

Gate C will be marked `COMPLETE/ENTREGUE` only after the canonical sync is merged and a final closeout is bound to the resulting `main` SHA.

## D-011 — Canonical sync validated and merged

PR #118 was validated on exact head `9ba3bee76ca6572848b3d95a71d109f4be10ff31` and squash-merged as `3feff116a3bf66427cfdfcb10894c0f76f79ee11`.

- Documentation validation `31539053960`: PASS.
- Post-merge Documentation validation `31539238013`: PASS.
- Carmem documentary review: PASS.
- Emily documentary audit: PASS.
- Léo documentary gate: `APPROVE_CANONICAL_SYNC`.

## D-012 — Closeout merge #119 required cleanup

PR #119 was merged as `303a4385aed51c531993613ca9d664d1599f538e`; post-merge Documentation validation `31540925137` passed. Validation then found that three one-shot closeout workflows had entered `main` while canonical markers were still stale.

This was treated as a CAF finding, not as a terminal success.

## D-013 — Final cleanup and Gate C completion

The cleanup removes the three temporary closeout workflows and reconciles README, plan and PRF terminal state.

```yaml
objective_met: true
blocking_findings: 0
pending_actions: 0
human_action_required: false
leo_final_decision: APPROVE
next_state: ENTREGUE
next_boundary: RELEASE_CANDIDATE_GATE_E
production: BLOCKED
```
