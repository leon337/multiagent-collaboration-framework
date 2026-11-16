# PRF — Gemini Live Evolution, Phase 01 F1 Audio Reliability

State: EM_REVISAO_TECNICA / GATE_PENDENTE. All implementation is experimental in local staging and in a stacked draft PR.

Order of review:
1. PHASE-01-PLAN.md — Objective, source and scope.
2. PHASE-01-REPORT.md — Chronological implementation, recovery and decisions.
3. PHASE-01-VALIDATION.txt — Test matrix.
4. PHASE-01-VALIDATION-FULL.txt — Expanded technical evidence and source hashes.
5. PHASE-01-SMOKE.txt — Live API with virtual media.
6. PHASE-01-DECISIONS.md — Authority and restrictions.
7. PHASE-01-CHECKPOINT.yaml — Handoff / next steps.
8. EVIDENCE-F1-BROWSER.json — Sanitized primary browser test output.
9. PHASE-01-SOURCE-MANIFEST.sha256 — App/test checksums.
10. PHASE-01-AUDIO-INCIDENT.md - playback truncation issue and fix.
11. EVIDENCE-F1-PLAYBACK-REGRESSION.json - synthetic 20 second burst.
12. EVIDENCE-F1-AUDIO-DRAIN-25.json - real Gemini 2.5 41.48 second playback.
13. EVIDENCE-F1-AUDIO-DRAIN-38.json - real Gemini 3.8 37.68 second playback.
14. PHASE-01-ARTIFACT-MANIFEST.sha256 — PRF document integrity.

Live checklist: https://github.com/leon337/multiagent-collaboration-framework/issues/527
F1 draft PR: https://github.com/leon337/multiagent-collaboration-framework/pull/529
F0 draft PR: https://github.com/leon337/multiagent-collaboration-framework/pull/528

Independence boundaries: only MESTRE implementation and tests are recorded. No Emily or LÉO review receipt and no F0.8 gate. Hardware and key rotation remain pending. Do not merge, deploy or expose publicly.
