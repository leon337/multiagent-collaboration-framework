# Precondition checklist for F2 (planning only; no implementation authorization)
F2 is the V1.2 Multimodal Intelligence phase in docs/missions/gemini-live-evolution-20261116/ROADMAP.md. The roadmap orders F0 gate -> F1 gate -> F2, and explicitly bars starting the next phase before gates are approved.

Current safeguards:
- F0.8 is open. F0 source/credentials audit still unresolved; key rotation postponed by LEANDRO. Do not deploy or broaden exposure.
- F1 code and tests exist in draft PR #529; new Q3 quality package is inspectable but awaiting independent external Emily-profile and LEO-profile gate review of exact SHA.
- F1 output is functional according to LEANDRO; unsupervised hardware measures only confirm microphone data, not headphone acoustic test.
- Voice-end to audible playback p95 and natural barge-in remain unqualified. 19-turn text benchmark did not reach 30 attempts and one turn timed out.
- Phase F2 must not be implemented or merged until required gates pass.

On approval, scope F2 to opt-in camera/screen consent and capability inventory first. Keep tool execution, cross-model auto switching, and persistent memory outside MVP; require policy, privacy and cost plans. Do not call existing prototype camera functions equivalent to consent-grade F2 acceptance.

## F1 response watchdog — candidate
QA-F1-RESPONSE-20261116/REPORT.md includes 10/10 adversarial, 17/17 real API virtual-media E2E, 22/22 offline, ~60s physical mic no Worklet drop. Audible output and 30 speech-end→ear measurements remain unverified; F0.8/F1.6 gates are still pending. Only preparation of F2 is authorized under prior scoped LEO profile gate.

## F1 response watchdog — candidate
QA-F1-RESPONSE-20261116/REPORT.md includes 13/13 adversarial, 17/17 real API virtual-media E2E, 23/23 offline, ~60s physical mic no Worklet drop. Audible output and 30 speech-end→ear measurements remain unverified; F0.8/F1.6 gates are still pending. Only preparation of F2 is authorized under prior scoped LEO profile gate.

## F1 turn reconciliation after external audit
The earlier Codex CLI Emily-profile review returned for correction. The latest candidate serializes text/image client turns through turnComplete, fixes VAD/manual interruptions, and validates audio MIME/length. 18/18 browser adversarial and 17/17 real Gemini virtual-media E2E passed, with 23/23 offline tests. Evidence and limitations in QA-F1-RESPONSE-20261116/REMEDIATION-CYCLE3.md. F0/F1 gates and human acoustic QA remain open; F2 not started.
