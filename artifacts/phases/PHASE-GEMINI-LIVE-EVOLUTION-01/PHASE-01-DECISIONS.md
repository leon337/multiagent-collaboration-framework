# PHASE 01 — Decision record

2026-11-16 / LEANDRO explicit instruction: postpone revocation of the previously shared API key and begin F1 implementation.
Meaning: authorize local staged, reversible F1 work; NOT a risk acceptance for production, NOT key safety proof, NOT grant of merge/deploy.

2026-11-16 / MESTRE actual decisions:
- Preserve original application, use a second port for staging and a new isolated Git branch.
- Reuse the locally stored key through a protected symlink; never copy key data into Git, PRF or logs.
- Use AudioWorklet with fixed 40ms frames, provider VAD by default, local energy-based VAD optional.
- Limit incoming WebSocket buffer and outgoing playback backlog; aggressively clear on interruption.
- Retry only under bounded policy; do not resend prior user turns automatically.
- Add telemetry whitelist, unit and E2E tests and attestation hashes.
- Keep F0 and F1 gates separate; record unresolved hardware, long session and contextual resume gaps.

Emily official independent audit: PENDING (no agent execution receipt).
LÉO official gate: PENDING (no delegated decision receipt).
Release/deploy: NOT AUTHORIZED.
Human action later: revoke old shared key and enter replacement in the local app; no need to send it through chat.

2026-11-16: LEANDRO reported clipped/overlapping output. MESTRE corrected local F1 player, preferring complete ordered playback over low queued latency, and disabled local RMS echo barge-in by default. No new merge/deploy authorization.

2026-11-16 / LEANDRO requested all remaining F1.5 physical, F1.4 benchmark and F1.6, specifically Codex CLI running a distinct agent with the official LEO profile for the delegated gate. This authorizes a read-only external Codex execution after QA, not impersonation of a native authenticated runtime agent.

2026-11-16 / MESTRE: preserve original local server, use staging 18372, produce evidence without raw user media; keep external Emily RETORNAR_PARA_CORRECAO; apply high-priority fixes A1–A3 and submit them for independent LEO-profile evaluation. Unresolved key rotation and F0 gate remain explicit and cannot be overridden by test pass.

2026-11-16 / MESTRE: qualified a real 632-second Gemini Live audio session, successful natural GoAway/reconnect and a separate synthetic semantic memory check, retaining nine underruns as an open quality signal. Confirmed that physical speaker monitor and subjective audio remain unverified. Accepted no shortcuts on F0.8 or key rotation.

2026-11-16 / MESTRE: remediated independent audit medium finding of non-cancelable retry backoff; stop button now remains enabled when wantConnected is true. A fifth adversarial test confirmed a pending retry can be canceled. This patch happened after the long test and is explicitly distinguished in source hashes.

## Codex CLI external LEO-profile gate decision
On 2026-11-16 a distinct external Codex CLI process with LEO normative profile (thread 01a1e697-23c5-7af1-a68f-05d56083e38c) reviewed SHA 361a08b730b24b7fe0ba88e5917634dd3a947d64 and emitted RETORNAR_PARA_CORRECAO. It independently verified 12/12 offline tests, 24/24 source hashes, 26/26 PRF hashes. F1.1-F1.4 partial; F1.5 insufficient; F1.6 partial. This is NOT a native MCF Agent Session. F0.8 remains open and no merge/deploy is approved. Primary receipt in QA-F1-20261116/LEO-PROFILE-GATE.md.

2026-11-16 / MESTRE: in response to LEANDRO's request for phase advancement, repaired audio underrun measurement without suppressing true within-response gaps, added a 33-tap FIR antialias window and 3-frame ACK credit bound to the mic AudioWorklet. This avoids unbounded MessagePort growth but may drop input frames under UI congestion; those must be measured.
Declared the real 30-turn attempted benchmark incomplete at 19 attempts (18 with audio, 1 timeout). Chose not to fabricate a 30-sample p95 or to promote F2 while the normative F0/F1 gates remain open.

## F1 Q3 external audit remediation (cycle 2)
External Codex CLI under Emily normative profile evaluated SHA 4e5f331 and returned RETORNAR; its primary findings and MESTRE fixes are recorded in QA-F1-Q3-AUDIO-20261116/Q3-REMEDIATION-CYCLE2.md. Subsequent code introduced stale microphone packet rejection, count-accurate telemetry, turn-boundary reset and a 16s nonautomatic silent-response warning. In current staging, 19/19 offline, 17/17 real Gemini browser and 3/3 adversarial passed. A new real mic 60-second capture had no lost Worklet frames, with exact source SHA in the evidence. The old 19/18 benchmark is historical and does not attest these latest fixes. No native Emily or LEO gate was simulated. Future phase F2 is blocked by normative prerequisites.

## F1 Q3 cycle 3 clock origin
The external Codex CLI Emily-profile reviewer at ae9f76a found a P1 clock-domain mismatch causing fresh mic frames to be dropped after delayed worklet startup. MESTRE fixed Worklet timestamps to use AudioContext clock and added a VM delayed init test. 20/20 Node tests, 17/17 real Gemini browser E2E, and 60 frames/zero stale drops in a browser with deliberately delayed addModule passed with source hashes. The one previous real Google nonterminal turn in 19 attempts is NOT fixed by a 16s watchdog warning, and human voice/headset gate/F0.8 remain OPEN. Reports in QA-F1-Q3-AUDIO-20261116/Q3-CLOCK-REMEDIATION.md.

## Independent external LÉO-profile gate on Q3 clock-origin candidate
At LEANDRO's request, a separate read-only Codex CLI under the normative docs/agentes/LEO.md profile reviewed SHA c6f85b083837b297bd1bf04cba0e6582c5861afe. Codex thread 01a1e6e0-7292-71b1-8ff2-738d098e268c, explicit decision **RETORNAR_PARA_CORRECAO**. This is a real external profile-based executor receipt, but NOT a native authenticated MCF Agent Session.
Evidence and justification: QA-F1-Q3-AUDIO-20261116/LEO-PROFILE-GATE-Q3-CLOCK.md. F0.8 and public production key rotation remain open; this QA does not authorize merge/deploy. It does not claim 30 physical speech mouth-to-ear latency measurements or spontaneous barge-in evidence. F2 work remains planning-only unless all prerequisite gates formally approve.

## Evidência suplementar F1 — turnos de voz
QA-F1-RESPONSE-20261116/REPORT.md contém a correção para monitor de voz, recuperação exclusivamente manual, testes com API real/virtual e mic físico sem PCM salvo. O gate formal não foi emitido neste SHA e a latência física de 30 amostras não foi reivindicada.


## Auditoria pós-correção de turnos
O primeiro candidato 3aa foi devolvido por auditoria independente. Novo ciclo com correlação conservadora de turnos, reinício explícito e validação PCM está documentado em QA-F1-RESPONSE-20261116/REMEDIATION-CYCLE2.md. Gate ainda pendente.
