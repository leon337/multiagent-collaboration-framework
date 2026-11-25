# MCF MESTRE Cross-Chat Succession — Source Manifest

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`

The successor MUST reconstruct current state from persistent sources instead of trusting conversational memory.

## Primary sources

1. Succession mission branch: `ops/mcf-mestre-cross-chat-succession-001`
2. Draft audit PR: `#176`
3. Release candidate PR: `#175`
4. Live `main` branch
5. Candidate HEAD: `43b0cccab4b29a2ed4c77abd824b652521c2b8c1`
6. Candidate tree: `262289cdf54ed4024aad24482ad18e8e1cdccf4e`

## Read order for cold recovery

1. `HANDOFF.md`
2. `ROADMAP.md`
3. `CHECKPOINT.yaml`
4. `SUCCESSION_CAPSULE.yaml`
5. live PR #175 metadata
6. live `main` SHA
7. canonical workflow results for candidate HEAD
8. `FINAL_REVIEW_GATE.md`
9. produce `RECOVERED_STATE.yaml`
10. ONLY AFTER step 9, compare with `EXPECTED_STATE.yaml`

## Anti-copy rule

The successor should not read `EXPECTED_STATE.yaml` before writing its own `RECOVERED_STATE.yaml`. The purpose is recovery, not copying.

## Source precedence

For values that can change, live GitHub state outranks the frozen capsule. Divergence must be reported, not silently reconciled.

## Required reconstruction fields

- identity / role
- final human authority
- mission ID
- succession branch and PR
- release PR and target version
- live main SHA
- release candidate HEAD and tree
- test/CI qualification
- final release gate status
- human authorizations
- blocking vs nonblocking pending work
- next action

## PASS rule

`SUCCESSION_EQUIVALENCE = PASS` only when the independently recovered state matches the expected state for immutable/frozen fields and explicitly explains any legitimate drift in live fields.
