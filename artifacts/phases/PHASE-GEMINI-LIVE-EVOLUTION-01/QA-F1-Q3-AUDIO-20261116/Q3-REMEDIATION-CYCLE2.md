# Q3 remediation cycle 2 — audit findings and action verification

Source: first external Q3 Codex CLI under normative EMILY profile, reviewed source SHA 4e5f3310f11be36cdc8144ffe1a3e042ce725bef.
First verdict: RETORNAR_PARA_CORRECAO. Native MCF Agent Session was not authenticated.

## Changes on top of first Q3 SHA
1. BLOCKED-UI MIC: Worklet PCM messages include captureTimeSec with AudioContext sample time; main thread checks age against current mic AudioContext and drops stale frames over 350ms instead of transmitting outdated speech. One newer frame is sent after a stale packet; no unlimited backlog. Audio lost under a 600ms UI stall cannot be recovered magically: the app emits numeric loss counts and a user-facing repeat-warning, with no speech/media data saved. Remaining risk: actual sound loss under UI stalls requires in-person user testing and should not be labeled lossless.
2. DROPPED FRAME METRICS: telemetry aggregates count values, not the number of loss events. Test uses 12 plus 1 stale frame = 13 reported.
3. RECONNECT/TURN BOUNDARY: playbackTurnOpen is reset on disconnect and when a new text turn is sent. This avoids treating a new generation as a continuation of a disconnected previous response, while leaving already-received output free to drain.
4. SILENT/TIMED-OUT TURN: 16-second no-audio timer reports response_timeout, warns the user, and does not resend the turn (idempotency safety). Silent completed turns record response_no_audio. This does not fix Google provider failures or guarantee a response, and a text prompt could intentionally produce no audio.
5. BENCHMARK ACCEPTANCE: standalone harness now exits nonzero unless both attempted and completed-with-audio count reach target, and records playback drain timeout. Historical 19/18 report remains unchanged and is explicitly bound to previous Q3 app hash.

## Same-candidate QA after remediation
- Worklet+telemetry 19/19 offline PASS (FIR, bounded credits, privacy, drop aggregation and timeout).
- Real Gemini API + virtual media browser E2E 17/17 PASS and SHA binding.
- Stale frame, fresh frame with 12 lost, and silent timeout without automatic resend: 3/3 PASS. Artifact STALE-WATCHDOG.json.
- Real microphone 60s using Chrome AudioWorklet: 1493 frames / 955520 PCM samples, drops=0. Artifact MIC-PHYSICAL-60S.json with app and worklet SHA bindings.
- Human positive output feedback from LEANDRO belongs to previous corrected version. We have NOT witnessed new hardware audible 60s output, natural barge-in or headset echo.

## Still open before F2 transition
- One real 30-turn attempted benchmark on prior app SHA stopped after 19 attempts with 18 audio replies; n=18 p50 1324ms, p95 4666ms for TEXT -> scheduled audio. It cannot establish real voice mouth-to-ear latency or SLO.
- Repeated audit with independent Emily profile, then independent LEO profile, on exact new source/evidence SHA is required. F0.8 remains open and key rotation remains deferred per explicit human request.
- Source FIR stopband near 8.5kHz had only ~16dB attenuation in reviewer spectral probe; further quality characterization required for release. End-to-end real mic barge-in and external provider cost classification remain unknown.
- No merge, deploy or public exposure authorized.
