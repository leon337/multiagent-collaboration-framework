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
