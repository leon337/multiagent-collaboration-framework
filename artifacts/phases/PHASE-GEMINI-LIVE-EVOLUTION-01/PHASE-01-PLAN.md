# PHASE 01 — Plano F1: Audio Reliability V1.1

Mission ID: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
Phase ID: PHASE-01-AUDIO-RELIABILITY
Risk: Class C
Authority: LEANDRO (human final)
Coordinator: MESTRE
Decision authority: LÉO (operational gate)
Previous phase: F0 remains EM_CORRECAO, F0.8 pending.

## Explicit user decision and authority limit
LEANDRO instructed to postpone rotation of the previously exposed key and proceed with F1. This authorizes scoped, reversible development/testing in an isolated staging environment. It does not waive F0 gates, allow merge, public access, new billing, credential exposure, or production deploy.

## Objective and expected outcome
Replace legacy microphone capture with AudioWorklet, build reliable 16kHz PCM streaming and bounded 24kHz playback, handle natural interruptions and server/client VAD, retry/reconnect safely with context handle when available, and produce measurable low-latency diagnostics.

## Inputs and source of truth
- Canonical MCF Issue #527, F1 roadmap and protocol in main.
- F0 PR #528 and findings; F1 PR #529 stacked on the F0 branch.
- Staging code in apps/gemini-live-studio of the F1 branch; local staging at 127.0.0.1:18372.
- Google Gemini Live capabilities, best practices and session management API docs.
- Source hashes and raw sanitized test result in EVIDENCE-F1-BROWSER.json.

## Acceptance by checklist
F1.1 AudioWorklet PCM16 with deterministic resampling: code + VM tests + E2E.
F1.2 Hybrid VAD, barge-in and pending playback cleanup: browser assertions and physical tests.
F1.3 Playback order, jitter/backpressure and transcript/turn reconciliation: browser tests + device benchmark.
F1.4 GoAway, resume handle, exponential retry and long session stability: real network-induced reconnect and long-duration tests.
F1.5 Real headset/microphone and before/after latency report: hardware test.
F1.6 PRF, regression, independent audit Emily and internal gate LÉO.

## Safety, isolation and boundaries
Original 127.0.0.1:18371 remains untouched; staging local 127.0.0.1:18372 only. A protected local symlink points to the original key file to avoid copying it; it is ignored from Git. No key, audio, video, transcript or access token goes to the repository.
Tests use fake microphone/camera and mock screen, except live Google model connectivity.
No external control tools or destructive actions. Tokens are not logged.
F0.8 and key rotation remain unresolved; release must fail closed.

## Method and agents
MESTRE performed scoped implementation and technical validation with the remote authorized computer, plus GitHub commits. Other MCF agent names are not claimed as executed or audited in F1. Independent Emily review and LÉO gate must produce real receipts after technical verification.

## Required quality gates
PRF integrity; source hash attestation; test matrix; physical-device signoff; independent review; operational gate. CI green alone does not close phase or approve merge/deploy.
