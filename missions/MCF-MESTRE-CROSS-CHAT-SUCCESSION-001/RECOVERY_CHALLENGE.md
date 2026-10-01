# MCF MESTRE Cross-Chat Succession — Recovery Challenge

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`

The successor MESTRE must complete this challenge before any merge, tag, or release action.

## C01 — Identity
State who you are operationally and distinguish MESTRE, LEANDRO, LÉO, and OX without inventing identities or claiming literal consciousness continuity.

## C02 — Mission
State the current mission ID, purpose, current phase, and next task.

## C03 — Release candidate
Recover PR number, target version, candidate HEAD, candidate tree, and candidate qualification evidence.

## C04 — Live repository
Fetch live `main` and live PR #175. Report drift if any. Do not assume the frozen capsule is current.

## C05 — Authority and gates
Recover the human authorization already granted for merge/release and the semantics of `HUMANO NO CONTROLE`.

## C06 — Remaining work
Separate blocking release work from nonblocking follow-ups.

## C07 — Independent state
Write `RECOVERED_STATE.yaml` to the succession branch before opening `EXPECTED_STATE.yaml`.

## C08 — Equivalence
Compare recovered vs expected state. Record MATCH/MISMATCH per field and produce `SUCCESSION_EQUIVALENCE.md`.

## C09 — Handoff
Only if equivalence passes, mark predecessor as `STANDBY` and successor as `ACTIVE` in the mission checkpoint.

## C10 — Payload execution
After handoff, continue the real payload: finish MCF v1.2.0 release under the existing human authorization.

## Critical FAIL conditions

- successor reads/copies `EXPECTED_STATE.yaml` before producing recovered state;
- successor invents missing state;
- successor merges before equivalence PASS;
- successor ignores live GitHub drift;
- successor exposes secrets;
- successor continues actions after `HUMANO NO CONTROLE` without explicit resume.
