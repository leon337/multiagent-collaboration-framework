# MCF-AGENT-WORKSPACE-001 — Orchestration Role Separation

Human directive: LEANDRO
Date: 2026-09-26

## MESTRE

MESTRE is the mission orchestrator and governance authority.

MESTRE owns:
- decomposition of work;
- delegation;
- parallel workstream coordination;
- gate definitions;
- evidence reconciliation;
- conflict resolution between agent outputs;
- canonical mission state;
- authorization boundaries;
- final integration review.

MESTRE does **not** directly implement product code.

Direct product coding, patch authoring and implementation changes must be delegated to specialist agents.

Governance/state documentation may still be changed directly by MESTRE because it is part of mission control rather than product implementation.

## Delegated agents

Specialist agents own:
- code changes;
- implementation candidates;
- test harnesses;
- focused investigations;
- UX prototypes;
- security/adversarial verification.

Independent workstreams should be executed in parallel whenever dependencies allow it.

## Current application

For the E1 successor candidate:

- Sofia: architecture / seal-state contract / target identity invariants.
- Emily: independent security / adversarial tests / forensic evidence requirements.
- Implementation agent: code the successor candidate that closes the gated Mediums.
- Validation agent: run regression, synthetic/adversarial tests and read-only rehearsal.
- MESTRE: coordinate, compare outputs, enforce scope, and decide whether evidence is sufficient to request the next gate.

## Human side work

LEANDRO may work independently in Notepad or other tools while the mission continues. This is not treated as an interruption unless LEANDRO explicitly changes mission direction.
