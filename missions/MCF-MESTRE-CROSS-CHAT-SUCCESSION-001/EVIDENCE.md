# Evidence Ledger — MCF-MESTRE-CROSS-CHAT-SUCCESSION-001

This file is append-oriented. A task may be marked PASS only after evidence exists.

## E-001 — Human Control behavior

Validated in field: `HUMANO NO CONTROLE` caused suspension of new actions, state preservation, checkpointing, and wait for explicit human resumption. The behavior was later confirmed by LEANDRO as intentional and desired.

## E-002 — Visible GUI copresence

Validated round-trip in the authorized ChatGPT GUI:

1. focus input box;
2. type `hello word` without sending;
3. repeat and press Enter;
4. message arrived in chat.

Result: PASS.

## E-003 — v1.2.0 qualified candidate

- PR: #175
- HEAD: `43b0cccab4b29a2ed4c77abd824b652521c2b8c1`
- tree: `262289cdf54ed4024aad24482ad18e8e1cdccf4e`
- focused tests: 34/34 PASS
- canonical CI: 5/5 SUCCESS
- tree local tested == tree remote candidate: PASS

## E-004 — Final review gate

- LÉO: PASS_WITH_NONBLOCKING_NOTES
- RENATO: PASS_WITH_NONBLOCKING_NOTES
- EMILY: PASS
- CRITICAL/HIGH blockers: NONE
- release gate: PASS

## E-005 — Human authorization

LEANDRO authorized merge and completion of the v1.2.0 release after validation, and then authorized using a successor chat to continue the mission as a continuity/persistence test.

## E-006 — Persistent succession branch

Branch: `ops/mcf-mestre-cross-chat-succession-001`

Purpose: preserve mission state independently of the local computer and predecessor chat.

Further evidence must be appended with task ID, timestamp, source/receipt, hashes or GitHub SHAs where applicable.
