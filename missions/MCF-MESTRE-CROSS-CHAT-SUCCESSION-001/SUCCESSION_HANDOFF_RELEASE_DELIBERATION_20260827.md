# SUCCESSION HANDOFF — RELEASE DELIBERATION — 2026-08-27

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Trigger: LEANDRO requested Mestre succession because predecessor chat became too long.
Status: `PREDECESSOR_HANDOFF_IN_PROGRESS`

## Durable repository state

- `main`: `a98cc9140c8b001135a8ce9cc37abab69c7165a6`
- latest stable release: `v1.2.0`
- PR #179: `MERGED`
- PR #179 candidate head: `3a2545237ca1449b4ac2ba44d781c3e4e01be339`
- post-merge documentation validation: `PASS`
- post-merge production readiness: `PASS`
- audit branch before this checkpoint: `576583c222e7a9ec8848cb22b513c73091350f2d`
- PRF integrity: `PASS`
- historical classification: `MAINTAIN_WITH_GAP`

## Governance boundary

- formalization gate: `APPROVED_AND_CONSUMED`
- merge gate PR #179: `APPROVED_AND_CONSUMED`
- version: `NOT_DECIDED`
- tag: `NOT_AUTHORIZED`
- release: `NOT_AUTHORIZED`
- no new tag/release/version action may be taken by the predecessor during handoff.

## Release deliberation already performed

### LÉO — isolated project/window

Observed conclusion: `v1.3.0` is the preferred SemVer direction.

- `OPEN_BLOCKERS=NONE_FOR_SEMVER_RECOMMENDATION`
- tag/release remain blocked until explicit LEANDRO HUMAN_GATE and revalidation of the final SHA.
- no merge/tag/release/versioning authorization was issued by LÉO.

### RENATO — execution by MCF role in predecessor session

Measured delta `v1.2.0 -> main`:

- 9 commits ahead;
- 7 changed files;
- new GUI/window succession protocol;
- trace schema + valid/invalid fixtures;
- automated GUI/window qualifier;
- unified protocol reference update;
- no breaking API removal identified in this delta.

Assessment: `v1.3.0` is technically stronger than `v1.2.1`; `v2.0.0` is not justified by the observed backward-compatible change.

### AUGUSTO — execution by MCF role in predecessor session

Release trace must preserve that the GUI/window invariant was discovered after `v1.2.0`; release notes must keep `MAINTAIN_WITH_GAP` and must not claim that v1.2.0 already proved the new invariant.

### EMILY — isolated project/window

- `PREFERRED_SEMVER=v1.3.0`
- `EVIDENCE_SUFFICIENCY=SUFFICIENT_FOR_SEMVER_DECISION_INSUFFICIENT_FOR_TAG_RELEASE`
- `HUMAN_GATE_READINESS=NOT_READY`
- non-blocking known limits: `MAINTAIN_WITH_GAP` and `NO_UNIVERSAL_RUNTIME_ENFORCEMENT`.

Two blocking findings before tag/release:

1. The protocol now present on `main` still contains stale candidate/pre-merge status language such as `REGRA_NORMATIVA_CANDIDATA`, `NOT_RELEASED`, `MAIN_MUTATION=NONE`, `MERGE=NOT_AUTHORIZED`, `VERSION_NUMBER=NOT_DECIDED`; that text no longer matches the post-merge state and must not enter a release contradictorily.
2. The GUI/window qualification workflow was evidenced on candidate push/PR, but no evidence was yet presented that the same qualifier ran against the exact release target (`a98cc914...` at the time of this checkpoint).

Emily explicitly did NOT authorize publication, tag, release or versioning.

## Successor mission

1. Boot in a distinct ChatGPT window/session while preserving this predecessor surface.
2. Read and verify this checkpoint plus live GitHub state before claims.
3. Confirm `main` has not moved and latest stable is still `v1.2.0`.
4. Resolve/reconcile Emily blockers in a non-main candidate path first; do not silently rewrite history.
5. Ensure GUI/window qualifier is executed and evidenced on the exact final release target SHA.
6. Re-run LÉO/RENATO/AUGUSTO/EMILY release deliberation only as needed after blocker remediation.
7. If team consensus becomes PASS, open a separate HUMAN_GATE to LEANDRO for version/tag/release.
8. Do not create tag/release without that gate.

## Succession invariants

- `SUCCESSOR_SESSION_CREATED != SUCCESSOR_WINDOW_CREATED`
- `OPEN_NEW_WINDOW=REQUIRED`
- `PRESERVE_PREDECESSOR=REQUIRED`
- predecessor close is a separate governed action after successful handoff.
- `PREDECESSOR_SURFACE_PRESERVED` must be visually asserted.
