# F1 Q3 cycle 3 — Timestamp origin correction

Mission MCF-GEMINI-LIVE-EVOLUTION-20261116-001. Status: EM_CORRECAO, no F2 phase transition.

## Defect and independent finding
Codex CLI Emily-profile read-only audit on SHA ae9f76add213d545d848b1fd0360ea46e581affc found a P1: Worklet produced capture timestamps measured from processor construction, while the UI compared them to AudioContext.currentTime. With a 600ms delayed module initialization, 24 fresh frames could be discarded as stale.

## Fix and primary evidence
A Worklet frame now carries a timestamp measured from the *same AudioContext clock* as the UI via AudioWorkletGlobalScope.currentTime plus sample offset. See apps/gemini-live-studio/public/capture-worklet.js.
- 20/20 offline tests (clock-origin unit, windowed sinc, bounded credits, private telemetry).
- Chrome integration test with injected 650ms addModule delay: context already ~405ms advanced on mic start, **60 PCM frames forwarded through the actual app.processAudioFrame and mocked WebSocket, zero stale packet drops, zero Worklet credit drops**. No external Google call, no voice PCM stored. SHA-256 for app and worklet stored in CLOCK-ORIGIN-CHROME.json and matched.
- Real Google Live browser E2E on the updated code: 17/17 PASS (virtual media), hashes bound in BROWSER-REAL-API-FINAL.json.
- A previous actual Gemini 2.5 output drain of 36.96s / 901 source nodes completed with zero overlap/gaps/stops, but it predates the Worklet clock change; it only supports the independent playback portion and does not establish latest SHA's capture stability.
- Real microphone 60s capture on earlier Q3 code: 1493 frames and zero drops. Because this precedes the Worklet clock correction, do NOT call it a final SHA 60s physical qualification. New integrated browser capture is 60 PCM frames with startup delay.

## Open issues and launch restrictions
The 16sec nonterminal real provider turn in the historical 19-attempt benchmark is not proven fixed by a watchdog warning. Need per-turn correlation/recovery without blind automatic replay.
Voice-origin silence watchdog incomplete (current warning is only for sendPrompt); requires scope/qualification.
Human feedback said output works on an earlier version. No supervised physical user voice-to-sound p95 with >=30 valid measurements; no full live headset interruption and echo QA.
F0.8 still open; user chose to defer API key rotation, a known blocker to public production, not a waiver. Independent review and external LEO-profile gate needed on current candidate. No merge, deployment, nor implementation of F2 until protocol gates pass.
