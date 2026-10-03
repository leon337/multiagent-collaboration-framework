# DECISIONS — MCF-CLINIC-SCHEDULING-001

## D-001 — Keep clinic scheduling changes isolated

The unrelated repository-wide production-readiness vulnerability gate is outside the clinic scheduling scope. No unrelated dependency remediation is introduced.

## D-002 — Demo authentication is explicit and opt-in

`MCF_DEMO_MODE=1` selects synthetic authentication and seed data. Normal operation still requires `MCF_AUTH_PROVIDER`. This prevents the demo path from silently becoming the production authentication mechanism.

## D-003 — UI remains a client of the existing API

Scheduling invariants remain in application/domain/database layers. The browser does not implement conflict guarantees.

## D-004 — No production deployment

The mission contract explicitly separates delivery from production publication.
