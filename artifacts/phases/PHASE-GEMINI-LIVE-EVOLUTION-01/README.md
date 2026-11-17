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
\nFurther acceptance evidence (hardware, latency, external audit and gated return): QA-F1-20261116/README.md. It does NOT replace the original PRF acceptance gates.\n

## LEO-profile gate
On 2026-11-16 a distinct external Codex CLI process with LEO normative profile (thread 01a1e697-23c5-7af1-a68f-05d56083e38c) reviewed SHA 361a08b730b24b7fe0ba88e5917634dd3a947d64 and emitted RETORNAR_PARA_CORRECAO. It independently verified 12/12 offline tests, 24/24 source hashes, 26/26 PRF hashes. F1.1-F1.4 partial; F1.5 insufficient; F1.6 partial. This is NOT a native MCF Agent Session. F0.8 remains open and no merge/deploy is approved. Primary receipt in QA-F1-20261116/LEO-PROFILE-GATE.md.

## Audio Q3 requalification
Read QA-F1-Q3-AUDIO-20261116/F1-Q3-REPORT.md and JSON files. F1 is not closed, and prior LEO-profile return decision remains historical until a new gate on the updated SHA.

## Gate Q3 external LÉO profile
Decision: RETORNAR_PARA_CORRECAO. Reviewed SHA c6f85b083837b297bd1bf04cba0e6582c5861afe. Codex thread 01a1e6e0-7292-71b1-8ff2-738d098e268c. Primary report in QA-F1-Q3-AUDIO-20261116/LEO-PROFILE-GATE-Q3-CLOCK.md. Native Agent Session FALSE. F0.8 still open; no merge/deploy.
