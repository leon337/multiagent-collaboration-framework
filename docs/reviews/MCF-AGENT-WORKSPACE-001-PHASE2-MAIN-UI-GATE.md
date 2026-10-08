# MCF-AGENT-WORKSPACE-001 — Phase 2 Main-UI Gate

Date: 2026-09-26

Decision: PASS_EXACT_LEGACY_SCOPE_ONLY

## Architecture

PASS.

Mandatory invariant:
OperationalSurface lifecycle and Session Store Lease lifecycle remain separate.

INACTIVE_IN_WORKSPACE is not RELEASED.

Return to Dual Browser semantics:
handoff -> RELEASING -> Workspace exit -> external zero-handle verification -> fallback launch.

## Independent audit

PASS.

No blocking Critical, High or Medium finding for the exact notebook-team2 / Patrícia + Rafael scope after the supervised process-lineage correction.

## Product boundary

The evidence supports experimental product integration for the exact audited legacy scope.

It does not support:
- production;
- cutover;
- generic agent/provider support;
- automatic messaging;
- removal of Dual Browser fallback.

## Next allowed work

Design and gate a narrow Phase 3 Agent Operations slice.

No execution capability expansion is implied by this PASS.
