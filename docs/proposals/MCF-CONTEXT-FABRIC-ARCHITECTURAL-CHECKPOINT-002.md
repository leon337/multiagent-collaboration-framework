# MCF Context Fabric — Architectural Checkpoint 002

Status: DRAFT_ARCHITECTURE_CHECKPOINT
Canonical: false
Implementation authorized: false

## Purpose

Preserve the reviewed architectural direction for Context Fabric, Project Registry, Project Capsules, Freshness, Provenance, Truth Contracts and Context Recovery Receipts.

## Decisions Under Review

- Project Registry is the MCF ecosystem catalog.
- Project Capsule belongs with the project repository as a lightweight machine-readable identity/state summary.
- GitHub account leon337 is a discoverable project ecosystem source.
- Project identity must be separated from repository naming.
- Aliases require confidence and ambiguity handling.
- DISCOVERABLE -> CANDIDATE -> REGISTERED lifecycle is maintained.
- Context information requires ownership, source, freshness and provenance.
- Truth must be classified by claim type: IDENTITY, NORMATIVE, OPERATIONAL, DERIVED.
- Freshness requires class, refresh policy and health state.
- Conflicts must create reconciliation obligations, not silent merges.
- Capability state should be multi-axis rather than a single status.

## Adversarial Findings Incorporated

- Repository rename must not break project identity.
- Live operational state must not override normative decisions.
- Stale documentation must become detectable drift.
- Aliases may collide and require entity resolution.
- Inference must not replace evidence.
- Capability existence must not imply runtime availability.

## New Candidate Concepts

- Truth Contract
- Context Recovery Receipt
- Stable Project Identity
- Context Health State
- Documentation Drift Reconciliation

## Next Review

Before canonicalization, define:

1. Project Registry schema.
2. Project Capsule schema.
3. Truth Contract schema.
4. Context Recovery Receipt schema.
5. Capability Registry integration.
6. Human authority boundaries.

This document records architectural discovery only and does not modify runtime behavior.
