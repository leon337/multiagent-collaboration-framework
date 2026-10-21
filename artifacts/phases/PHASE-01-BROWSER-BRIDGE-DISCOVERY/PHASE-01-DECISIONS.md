# PHASE-01 DECISIONS — proposals, not authority gates

## 2026-10-21 — MESTRE architectural recommendations
1. REUSE-FIRST: extension is an adapter surface, not a new agent orchestrator, permission engine or ledger.
2. Use Native Messaging for local transport, with stronger host-side authentication, origin/extension ID verification and explicit pairing. It does not grant cloud ChatGPT access to the local machine by itself.
3. Prioritize Brave for future qualification because it is running and Chrome is deinstalled; keep Chrome MV3 compatibility as a later test.
4. MVP observation only on a benign authorized tab, with temporary permission and no real-account writes.
5. Classify risk by effect of action rather than verb (click may send, publish or delete). Default to deny.
6. Unknown external effect is NOT success and must not trigger blind automatic retry.
7. Follow MCF semantic target uniqueness and post-action validation; never rely on first-match or click alone.
8. No CAPTCHA/2FA/Cloudflare circumvention; no cookie/secret extraction; no unknown public listener.

## Decisions outstanding
- Select new provider/skill contract vs extend experimental MCF-WEB-INTERACT after policy review.
- Decide host mutual authentication/key rotation and remote transport (remote scope deferred).
- Decide evidence retention/PII redaction at browser boundary.
- Independent architecture/security review by real agents: NOT_YET_PERFORMED.
- LÉO operational gate: PENDING.
- LEANDRO reserved authority: preserved, not presumed.

## Handoff
MESTRE prepared documents; future agent assignments are recommendations only. No fictional handoffs, signatures or approvals.
