# PHASE-05 — Plano de teste E2E

Mission: MCF-20261022-AGENT-STUDIO-MVP-001
Date: 2026-10-23T01:58:52-03:00
Risk: Class B

Objective: prove that a request in the Studio UI changes the real Hello World Agent in a new DSH session and that the prior profile is restored.
Scope: DSH interpretation, UI diff, draft, local preview, publication gate, runtime verification, rollback, mobile widths, no impact to user main draft, native conversational preview.
Out of scope: arbitrary plugin execution, public deployment, merge to main, key extraction, unsupported models.
Acceptance: native DSH response exactly MCF E2E 2026 OK, whole profile restored byte-for-byte, main user draft unchanged.
Authority: explicit request by Leandro to test and deliver an operational end-to-end app.
