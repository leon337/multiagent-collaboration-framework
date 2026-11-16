# F1.4 and F1.5 — Qualification and current blockers

**Status:** IMPLEMENTED/TESTED IN STAGING; GATE NOT SATISFIED.

## F1.5 Hardware
The real USB microphone was accessed by PipeWire and by the Chrome AudioWorklet. The browser observed 64 PCM frames / 40,960 samples at 16 kHz. Privacy: recorded PCM discarded immediately; no speech transcript, image or raw waveform saved.
The analog output sink accepted a 660 Hz short low-volume diagnostic tone, but both sink-monitor attempts returned 0 samples. This is not proof sound was audible through the speakers. No user-dependent 30–60 second speech-quality assessment or acoustic barge-in was performed.

## F1.4 Measured reliability
The first 180s benchmark had 3 attempts and only 2 generationComplete events; because the test ignored turnComplete, the 2/3 ratio is invalid as the provider completion rate. It measured 2,269–2,668 ms sendPrompt to first audio with n=3, exploratory only.
The corrected 6-turn diagnostic observed six terminal completions (generationComplete OR turnComplete); one was turnComplete-only, which explained the previous false negative. An intentional offline/close recovery reconnected using a resumable handle; no context-equivalence test was performed. There are insufficient end-of-speech-to-first-reproduced-audio measurements for p50/p95 or new cost estimates.
The additional long session test has been started but remains unverified until its terminal evidence is attached.

## Independent audit and fixes
A Codex CLI thread read the normative Emily contract as an independent external reviewer of PR SHA ea96781: RETORNAR_PARA_CORRECAO. It found A1 (audio controls disabled after socket close), A2 (no 12s token/15s setup watchdog), A3 (no cumulative reconnect budget) and A4 (missing quality gate evidence). A1–A3 were fixed in local staging: playback controls remain enabled while queue exists, token/setup timeouts are bounded and reconnects are limited to six in 120s. Four targeted adversarial tests passed. A4 remains partial by design.

## Gate caveats
F0.8 remains open. Previously shared key rotation was postponed by LEANDRO and is still a risk. Neither external profile-based Codex reviewer nor profile-based LEO session is an authenticated native MCF Agent Session. Real LEO-profile outcome must have an exact SHA, input evidence and final decision, not assumed approval. No merge/deploy/public release.
