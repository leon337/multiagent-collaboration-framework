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

## Final execution of F1.4/F1.5 qualification, current cycle

The actual 632-second Gemini Live session ended with 10 completed turns, one genuine provider GoAway and one successful resumption. Compression and session resumption were enabled, a handle was available and all media/sockets/queues cleaned up at exit. There were nine numerical audio underruns. A separate synthetic keyword memory test passed after reconnect. Both results are stored with primary metadata under QA-F1-20261116.

Physical USB microphone and browser AudioWorklet capture passed the I/O route. Physical output audibility remained unverified: paplay accepted the tone while the analog sink monitor yielded zero samples. No recorded voice or image was retained.

Initial independent Emily-profile CLI audit returned RETORNAR on ea96781. The second audit returned RETORNAR on bef121c, acknowledged A1/A2/A3 remediated, and flagged medium inability to stop reconnect during backoff. MESTRE corrected that one-line UI state and verified 5/5 adversarial tests. These are external CLI reviews; no native Emily session has been authenticated.

Handoff: MESTRE -> Codex CLI separate LEO-profile executor for actual scoped gate output on exact final branch SHA, including unresolved F0.8 and physical headset QA. No automatic merge or deploy.

## Codex CLI external LEO-profile gate decision
On 2026-11-16 a distinct external Codex CLI process with LEO normative profile (thread 01a1e697-23c5-7af1-a68f-05d56083e38c) reviewed SHA 361a08b730b24b7fe0ba88e5917634dd3a947d64 and emitted RETORNAR_PARA_CORRECAO. It independently verified 12/12 offline tests, 24/24 source hashes, 26/26 PRF hashes. F1.1-F1.4 partial; F1.5 insufficient; F1.6 partial. This is NOT a native MCF Agent Session. F0.8 remains open and no merge/deploy is approved. Primary receipt in QA-F1-20261116/LEO-PROFILE-GATE.md.

## F1.4/5 — Q3 audio calibration and live benchmark (2026-11-16)

Continued at LEANDRO's request, with F1's original PR still draft, without merge/deploy. Revised AudioWorklet capture uses a 33-tap Blackman-windowed sinc anti-alias FIR (~7.1kHz cutoff, 64 fractional phases) and a three-frame credit bound on MessagePort. Browser ACK prevents unbounded audio capture messages on the main thread. Under overload, dropped input frames are observable but not misrepresented as lossless audio.
The old nine underruns from the 632-second Live run were not tied to turn IDs, so cannot be retrospectively classified. The prior code counted normal idle pauses as underruns; Q3 classifies gaps within active generation separately from normal between-turn idle (3/3 simulation). The original 632-second run remains historical evidence, not a replay with this SHA.
Q3 passed 17/17 Node unit tests, 17/17 browser real Gemini E2E/virtual media, and a physical mic AudioWorklet capture of 63 PCM frames (40,320 samples, no voice persistence). The human LEANDRO already confirmed the output functioning in conversation; subjective 30-60s quality and natural barge-in were not proved by that statement alone.
Real text-to-first-scheduled-audio benchmark attempted 19 turns (target 30) and completed 18 with audio. p50 1,324ms, p95 4,666ms over n=18, 0 classified intra-turn underruns and 17 normal inter-turn idles. On turn 19 no terminal response within 16s despite a connected socket; report as a quality failure, not as a successful 30-sample SLO. These latencies do not represent microphone end-of-speech to audible speaker output. Primary sanitized evidence in QA-F1-Q3-AUDIO-20261116/.
F0.8 still open, previously shared key rotation postponed by human, production/public deployment remains prohibited. New independent Emily and LEO-profile assessments are needed on this candidate before any phase closure or F2 start.

## Capture prolongada do microfone real (60 segundos)
Teste no mesmo codigo F1-Q3: 1.494 frames x 640 samples = 956.160 amostras a 16kHz (59,76s de PCM) em captura de ~60s, 0 drops no Worklet. Foi utilizado getUserMedia no Chrome com dispositivo padrao real e AudioWorklet FIR; o audio bruto e a transcricao nao foram salvos. JSON MIC-PHYSICAL-60S.json inclui SHA256 do app e do worklet, comparados com a branch. Esta evidência nao comprova eco/barge-in natural, nem qualidade de som nos alto-falantes.

## F1 Q3 external audit remediation (cycle 2)
External Codex CLI under Emily normative profile evaluated SHA 4e5f331 and returned RETORNAR; its primary findings and MESTRE fixes are recorded in QA-F1-Q3-AUDIO-20261116/Q3-REMEDIATION-CYCLE2.md. Subsequent code introduced stale microphone packet rejection, count-accurate telemetry, turn-boundary reset and a 16s nonautomatic silent-response warning. In current staging, 19/19 offline, 17/17 real Gemini browser and 3/3 adversarial passed. A new real mic 60-second capture had no lost Worklet frames, with exact source SHA in the evidence. The old 19/18 benchmark is historical and does not attest these latest fixes. No native Emily or LEO gate was simulated. Future phase F2 is blocked by normative prerequisites.

## F1 Q3 cycle 3 clock origin
The external Codex CLI Emily-profile reviewer at ae9f76a found a P1 clock-domain mismatch causing fresh mic frames to be dropped after delayed worklet startup. MESTRE fixed Worklet timestamps to use AudioContext clock and added a VM delayed init test. 20/20 Node tests, 17/17 real Gemini browser E2E, and 60 frames/zero stale drops in a browser with deliberately delayed addModule passed with source hashes. The one previous real Google nonterminal turn in 19 attempts is NOT fixed by a 16s watchdog warning, and human voice/headset gate/F0.8 remain OPEN. Reports in QA-F1-Q3-AUDIO-20261116/Q3-CLOCK-REMEDIATION.md.

## Independent external LÉO-profile gate on Q3 clock-origin candidate
At LEANDRO's request, a separate read-only Codex CLI under the normative docs/agentes/LEO.md profile reviewed SHA c6f85b083837b297bd1bf04cba0e6582c5861afe. Codex thread 01a1e6e0-7292-71b1-8ff2-738d098e268c, explicit decision **RETORNAR_PARA_CORRECAO**. This is a real external profile-based executor receipt, but NOT a native authenticated MCF Agent Session.
Evidence and justification: QA-F1-Q3-AUDIO-20261116/LEO-PROFILE-GATE-Q3-CLOCK.md. F0.8 and public production key rotation remain open; this QA does not authorize merge/deploy. It does not claim 30 physical speech mouth-to-ear latency measurements or spontaneous barge-in evidence. F2 work remains planning-only unless all prerequisite gates formally approve.
