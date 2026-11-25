# HUMAN GATE — Formalization Authorization — 2026-08-27

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Authority: LEANDRO
Coordinator: MESTRE successor

## Human decision

LEANDRO explicitly authorized continuation after the GUI/window-control team consensus gate.

Authorized scope:

- formalize the agreed GUI/window-control candidate rules on a non-main branch;
- implement trace/schema/test requirements;
- qualify the resulting candidate;
- persist evidence and return a checkpoint.

Not authorized by this gate:

- mutation of `main`;
- merge into `main`;
- tag creation or retargeting;
- release publication;
- selecting or announcing a new version number.

## Preconditions already satisfied

```text
TEAM_CONSENSUS = PASS
CONSENSUS_CLASSIFICATION = MAINTAIN_WITH_GAP
EMILY_INDEPENDENT_AUDIT = VALID
HUMAN_GATE_FORMALIZATION = APPROVED
```

## Required return gate

After formalization, implementation and qualification, MESTRE must return to LEANDRO with evidence before any merge/tag/release/version action.
