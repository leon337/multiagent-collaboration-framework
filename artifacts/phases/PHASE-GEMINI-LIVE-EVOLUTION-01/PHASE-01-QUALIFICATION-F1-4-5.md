# F1.4 and F1.5: qualification observations

## Actual session stability
A live Gemini 2.5 Native Audio WebSocket remained connected during a verified 632-second session (10m32s) with compression and sessionResumption enabled. It completed 10 short turns and received one genuine provider GoAway; reconnection succeeded once with a resume handle available. There were no disconnected heartbeats among 43 checks. End cleanup: no socket, microphone, screen, camera, playback queue or retry timer.
This test recorded 9 audio underrun events. A counter does not independently verify audible stutter, but it precludes claiming perfect audio quality.
The long test source-app SHA is 7b41ed8a2c94e7d11f6e7edfdd8e55fa41b26ce74d42c2ec5f953b05f2d6483b, while the final candidate after a one-line backoff stop-button correction is 11666aabc15b690c560d0e72b33d34dd7386e839c6eab16371db55e712296eeb. This distinction is retained deliberately, without claiming the complete final SHA had a 632-second replay.

## Semantic context resumption
After provider-issued resume handle and a deliberate WebSocket close, Gemini was asked to recall a purely fictional diagnostic word previously supplied in the same session. It returned the expected word using new model transcription fragments after reconnection. Result: semanticResumeConfirmed true, reconnected true. The test does not prove arbitrary conversation/memory retention, just this case.

## Reliability and p50/p95
A flawed initial 180-second harness counted only generationComplete; it reported 2/3 and should not be used as the actual provider completion rate. A corrected six-turn diagnostic used either generationComplete or turnComplete, obtained 6/6, and induced a successful reconnect. The first exploratory run sampled sendPrompt-to-first-audio about 2.3–2.7s on only three turns. There is no validated 30+ sample voice-to-first-playback p50/p95, nor comparable before/after headset measurement. Cost is not independently metered by modality.
The new long test duration does not in itself establish p95 performance or guarantee low-latency speech.

## Physical I/O
The Microsoft USB camera microphone and physical default ALSA/PipeWire sink were investigated. PipeWire direct capture returned 32,000 samples/2s, browser real getUserMedia + AudioWorklet returned 64 PCM16 frames (40,960 samples) with live media track. No raw PCM or transcript was persisted.
Paplay successfully submitted a low-volume test tone to the analog sink, but capture from the sink monitor yielded zero samples. Audibility through a physical headset or loudspeaker is therefore NOT VERIFIED. Human natural barge-in, intelligibility and echo still require a supervised physical acceptance test.

## Audiovisual and security QA
17/17 browser E2E against the corrected code, 8/8 playback and 12/12 offline capture/telemetry tests passed; five targeted adversarial tests passed for post-close playback control, token watchdog, setup watchdog, cumulative reconnect budget and backoff cancellation.
An independent read-only Codex CLI under the Emily normative profile first returned RETORNAR on SHA ea96781. A second external review on SHA bef121c confirmed the three high issues fixed and identified a medium backoff-button issue. That issue was corrected and included in the 5/5 tests. Neither external reviewer is an authenticated native Emily agent.

## Gate state
F0.8 remains open. Physical output is unverified. Other medium findings include anti-alias filtering, UI Worklet port backlog controls and a statistically adequate latency/cost benchmark. LEANDRO postponed old-key rotation; that risk is recorded but not waived for public production. These constraints must be visible to the LEO-profile Codex gate.
