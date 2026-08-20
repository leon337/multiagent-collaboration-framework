# PHASE V1.2 — Critical Review Plan

- Mission: `MCF-V1.2-CRITICAL-REVIEW-001`
- Class: `C`
- Status: `IN_REVIEW`
- Human authority: `LEANDRO`
- Coordinator: `MESTRE`
- Branch: `audit/mcf-v1.2-critical-review-001`
- Source branch: `main@439da7b6479718f6545144954937b8c4358d7c46`
- Candidate v1.1 technical baseline: `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`

## Objective

Critically review the post-v1.1 draft architecture before any v1.2 implementation or canonicalization.

## Scope

- ZRCL v0.3
- Context Fabric
- Truth Contracts
- Capability Registry
- Validation Suite
- Architectural Checkpoint 004
- documentation/runtime parity
- v1.1 rollback baseline
- decision presentation behavior requested by LEANDRO

## Acceptance criteria

1. Separate implemented v1.1 facts from post-v1.1 drafts.
2. Identify contradictions, unsafe assumptions, maturity mismatches and documentation drift.
3. Classify each proposed block as APPROVE, APPROVE_WITH_CORRECTIONS, DEFER or REJECT.
4. Define prerequisites for a reversible v1.2 implementation.
5. Preserve HUMAN_GATE and HDF boundaries.
6. No runtime implementation during this phase.

## Prohibitions

- no merge to `main`;
- no production change;
- no canonicalization of draft architecture;
- no v1.2 runtime implementation;
- no assumption that a document or capability is live without evidence.
