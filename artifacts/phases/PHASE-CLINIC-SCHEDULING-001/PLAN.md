# PLAN — MCF-CLINIC-SCHEDULING-001

- Mission: Issue #393
- Class: C
- Goal: executable clinic scheduling MVP with persistence, conflict protection, auditability, tests and local smoke.
- Current implementation line: backend R2 candidate + executable web UI.
- No production deployment in this phase.

## Acceptance map

1. local execution — verified by live server smoke.
2. persistence — verified against PostgreSQL.
3. essential CRUDs — professional/patient/service list/create routes implemented.
4. appointment creation — verified.
5. conflict rejection — verified with HTTP 409 / SCHEDULE_CONFLICT.
6. availability and blocks — backend implemented and tested at domain/integration level.
7. rescheduling — verified.
8. cancellation/history — verified; cancelled row remains queryable.
9. schedule query — verified.
10. automated tests — 11/11 pass.
11. smoke E2E — live HTTP smoke pass.
12. UI states/errors — implemented.
13. architecture/docs — implementation follows versioned architecture; this PRF records evidence.
14. evidence before success — maintained.
15. no production/publication — maintained.

## Required MCF gates

Architecture/audit, engineering, QA/regression and final independent audit remain explicit mission gates. No terminal ENTREGUE state is asserted until those gates have current evidence.
