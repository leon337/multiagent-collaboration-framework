# F1 - Incident: output speech truncated

Date: 2026-11-16. Reported by LEANDRO during F1 user test.
Status: corrected and tested on localhost staging, formal gate pending.

## Demonstrated causes

1. Before the hotfix, playAudio cleared all scheduled sources when queue duration exceeded 1.6 seconds, truncating the model speech if chunks arrived faster than realtime playback.
2. The local RMS microphone detector interrupted playback on just two speech-energy frames, even if the energy came from the speakers (echo).
3. The old regression test expected chunks to be discarded in a 5-second burst, which incorrectly rewarded truncation.

## Fix

- PCM16 output at 24kHz is scheduled along a strictly monotonic timeline. No queue-pressure cancellation or silent drop.
- Initial buffering is 120ms after idle. generationComplete and turnComplete do not cancel queued chunks; they are drained naturally.
- Cancellation is reserved for user mute/disconnect or API-confirmed serverContent.interrupted.
- Local fast barge-in is opt-in and OFF by default, with explicit experimental label and stricter consecutive-frame threshold.
- Prime AudioContext from user gesture to avoid autoplay suspension.
- Server 2.5 and 3.8 Live responses tested without physical microphone, camera or screen capture.

## Evidence

- EVIDENCE-F1-PLAYBACK-REGRESSION.json: 7/7 PASS, 200 chunks x 100ms = 20 seconds and 480,000 samples, zero gaps, overlaps, stops or unintended cancellation, including echo simulation.
- EVIDENCE-F1-AUDIO-DRAIN-25.json: real Gemini 2.5 response, 41.48 s / 1,014 nodes: every node started and ended, zero stop calls, gap or overlap.
- EVIDENCE-F1-AUDIO-DRAIN-38.json: real Gemini 3.8 Live response, 37.68 s / 112 nodes: every node started and ended, zero stop calls, gap or overlap.
- EVIDENCE-F1-BROWSER.json: 17/17 PASS after replacing the old truncation expectation with an intact 5.12-second buffered queue.
- EVIDENCE-F1-ADVERSARIAL.json: 6/6 PASS for earlier microphone, WebSocket, VAD and retry race fixes.
- Node worklet and telemetry contract tests: 12/12 PASS.

## Limitations and governance

These are numerical scheduling, audio-source callback and cleanup checks in Chrome headless. Human physical listening, headset echo, quality and real-time latency evaluation remain pending. No output audio or private transcript recorded in Git.
The previously disclosed key rotation was explicitly postponed by the user; no release, merge or public exposure is authorized.
Official Emily audit and LEO gate remain pending; F0.8 remains open.
