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
