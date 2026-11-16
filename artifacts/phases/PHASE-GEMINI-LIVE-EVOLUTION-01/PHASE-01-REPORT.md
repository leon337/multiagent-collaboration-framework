# PHASE 01 — Execução e recuperação

Date: 2026-11-16. Status: EM_REVISAO_TECNICA / GATE_PENDENTE.

## Evidence-linked chronology
1. Recovered live Issue #527, PR #528 (draft SHA a8ffca392ba24dd1202866da1c24ece2f75b6a49), applicable roadmap and protocol.
2. Verified authorized host leo-N43SM online. Inspected actual server/app JavaScript and found ScriptProcessorNode 4096 samples, output 24kHz scheduling and previous resume/backoff behavior.
3. Confirmed Google Live official 16kHz PCM input, 24kHz PCM output, 20-40ms chunk recommendation, VAD, interrupted, audioStreamEnd, GoAway and resumption.
4. Copied non-secret application source to isolated local staging /home/leo/Projetos/gemini-live-studio-f1, preserving original 18371. A local protected symlink was used to access the existing credential, never added to the repository.
5. Implemented capture-worklet.js, port transfers, resampling, client RMS and hybrid VAD, bounded playback, queue backpressure, interrupted clear, retry with limited exponential backoff, handle updates and proactive GoAway path.
6. Recovery CAF: first patch script failed because exact old WebSocket close handler differed; inspected the actual line, corrected match, re-ran. JavaScript syntax then passed.
7. Started staging server only on 127.0.0.1:18372. Verified /api/status and worklet HTTP 200; original /api/status stayed HTTP 200.
8. Executed F0 strong multi-modal regression against staging: 13/13 PASS, confirming no breakage of camera, screen, image, function call, transcriptions and three model handshakes with synthetic devices and real Google API.
9. Implemented six offline AudioWorklet resampling tests (48kHz and 44.1kHz), six privacy-first telemetry tests. 12/12 passed.
10. Browser tests initially reported no resume handle within test window. Separated fresh reconnect from context-resumption claims; after retest the server produced a handle and a real WebSocket reconnect succeeded without duplicate user turns.
11. Extended browser assertions for playback backlog and generationComplete. Last E2E run 17/17 PASS, 0 errors with five source SHA-256 digests and test-script digest embedded in result JSON.
12. Versioned application and tests in separate branch feat/gemini-live-audio-f1-20261116, base F0 draft branch. Opened stacked draft PR #529. No merge or production promotion.
13. Prepared F1 PRF and evidence bundle, with unresolved device and gate requirements explicit.

## Verified changes and observed outputs
AudioWorklet produced 38-39 audio frames in about 1.55 s with virtual microphone and 48kHz input. Manual VAD produced one activityStart, one activityEnd and 22 PCM frames in synthetic test. Backpressure rejected congested writes; playback bounded test dropped old queue twice and ended at 1.04 seconds. WebSocket reconnect used a real provider session, without duplicating a user turn. No runtime JavaScript exceptions observed.

## Defects, limitations, decisions
A short test without resume handle cannot certify historical continuity; later handle availability confirms only the mechanism was offered, not semantic equivalence. No real GoAway deadline, long 10-minute session, degraded physical network, echo cancel, human interruption performance, p50/p95 robustly sampled, headset latency or audible sound quality was validated.
Client RMS-VAD may false-trigger. Queue cap may omit delayed speech by design; tuning required with hardware.
Key rotation explicitly postponed by human, not a claim of remediation; do not widen network exposure.

## Handoff
MESTRE -> QA/Emily (pending real independent agent execution): review source, tests and residual risks. Then -> LÉO decision. Until receipts exist, phase not closed.

## F1 playback incident correction
LEANDRO reported incomplete, overlapping voice. Removed destructive playback-backlog threshold and made local fast barge-in opt-in. Two real-provider playback drains (2.5 and 3.8) and synthetic 20-second burst verified no scheduling gaps or unsolicited stops. See PHASE-01-AUDIO-INCIDENT.md.

## Continuation: F1.4/F1.5 and profile-based gate request, 2026-11-16

MESTRE reconciled Issue #527, draft PR #529 SHA ea96781, normative contracts LEO.md and EMILY.md and MCF-DEC-017/050. User explicitly authorized F1.5 physical audio tests, F1.4 reliability benchmark and LEO gate via an isolated Codex CLI agent with the official profile. User retained earlier decision to postpone key rotation, not a waiver for release.

Physical QA used the USB LifeCam microphone and analog output path. No speech or PCM media persisted. System capture returned 32,000 real samples in 2 seconds; Chrome AudioWorklet returned 64 frames and 40,960 samples from a real input track. PipeWire analog sink accepted a low-volume synthetic tone, but sink-monitor capture yielded no samples, so audible physical playback is not certified.

Initial 180-second reliability test provided 3 first-audio responses, 2 generationComplete events and an eventual disconnect. The harness incorrectly interpreted only generationComplete as terminal, despite the provider's separate turnComplete signal. An independent short diagnostic using either completion signal finished 6/6 turns and successfully reconnected with handle present after a network interruption.

Independent external Codex CLI with Emily contract on SHA ea96781 issued RETORNAR_PARA_CORRECAO: high issues A1 (cannot stop playing after socket close), A2 (missing token/open/setup deadlines), A3 (unbounded repeated reconnect cycles) and A4 (incomplete physical/long session/gates). MESTRE corrected A1-A3 locally with minimal fixes and 4/4 adversarial tests, without mixing this executor with native Emily identity. A4 remains pending/partially qualified.

A real connection over 10 minutes with compression/resumption is running under separate test process; do not mark it successful until a terminal report exists. Next independent gate: Codex CLI with the official LEO profile, explicitly external and not a native Agent Session. It must consider this entire history, unresolved F0.8 and eventual long-session evidence. No automatic merge/deploy.
