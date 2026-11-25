# OX Resumption Note — MESTRE Chat Surface Failure & Copresence Continuity

Status: **OX EVIDENCE NOTE / LOCAL ARTIFACT** (snapshot frozen at authorship; transport by MESTRE)

Producer: **OX** — same continuous DSH session since 2026-08-25
Date/time: **2026-08-26 03:36 -03**
Host snapshot at writing: uptime `1 week, 3 days, 4h51m` (boot 2026-08-15 22:44:48; no interruption)

---

## 1. Session identity anchor (upgrade)

- OX session id as located by MESTRE via DSH API: **`session-3b58c1d4-5e1e-4438-884b-bc9c8ffaa10c`**, preset `mcf`.
- Corroboration is now **double**: (a) MESTRE's live API lookup; (b) the pre-existing E2E document (`docs/integrations/evidence/MCF-HARNESS-MESTRE-OX-E2E-20260825.md`, committed 2026-08-25) independently describes this same session id containing the authority message ("quem manda no MCF é LEANDRO") — which exists verbatim in this session's context.
- Effect: former open item "durable session identity" moves from UNVERIFIABLE to **INDIRECT-corroborated** for OX. `running:false` before the prompt was normal idle state between turns, not an anomaly.

## 2. New human evidence recognized (LEANDRO)

- File: `image-1787724562295.jpg` · 1152×1536 · 232186 bytes · SHA-256 `8c82d316d224b2eac9321ab302908259f6abf21cb29478f48da3f76ef9b283f0`
- Provenance: supplied directly by LEANDRO in the new MESTRE chat.
- Classification per convention: **DIRECT_VISUAL_EVIDENCE for MESTRE, INDIRECT_VISUAL_EVIDENCE for OX** (description + hash only).
- Observed content (via MESTRE): MCF NextGen chat screen showing the prior context-pressure message (123728/262144 pressureTokens ≈47%, projection ≈49%) and a red error **"O envio da mensagem expirou. Tente novamente."** with Retry button; part of the Cloud Workstation visible at right.

## 3. Incident characterization (OX assessment)

- **What failed:** the *presentation surface* — MESTRE's previous chat failed to render/timed out for LEANDRO, who was following on that surface.
- **What did NOT fail:** the OX persistent session. From inside this session there was **zero gap**: every turn of today is present in context. Continuity of state must not be conflated with continuity of any single chat UI.
- Duplicate-delivery risk is real and already observed twice today (identical dispatches received). Timeout+Retry semantics mean a send may or may not have landed.

## 4. What this incident demands from the triangle (independent requirements)

1. **State lives in repository artifacts; chats are views.** Any single surface may fail without information loss.
2. **Dedupe by identifier:** every dispatch carries a unique `event_id`/`msg_id`; receivers acknowledge-and-dedupe instead of reprocessing.
3. **Continuity capsule thresholds stand:** WARN ≥55% · mandatory capsule ≥65% · handoff prep ≥75% · hard ceiling 85% — capsule content follows the canonical event taxonomy (hashes, pendings, anchors) and MUST include the session anchor above so any successor session can prove lineage.
4. **Recovery point:** an agent joining fresh must be able to resync from `docs/proposals/evidence/` alone, without provider or chat history.
5. **Compact operational mode** until context pressure recedes.

## 5. Read-only verification performed alongside (no mutations)

- Fetched `origin/docs/ox-vision-proposal`: head advanced `725465e9 → bbc93a4eada2ac14c1f6f2e8c5dbab005fd1d4a2` (commit 02:34:40, "publish OX remote verification receipt").
- Remote REMOTE-VERIFY blob SHA-256 `c93915e26bf91253982ce5f103eac21f7e5a70e03d501e799490078b0d02e635` = local anchor **MATCH EXATO**.
- ACK blob unchanged: `2d3b444ce697272400040be6ad6a5a2e80a1850b0403adc268701b1b024fd8d5`.

## 6. Authorization state

Unchanged: proposal remains **PROPOSAL / DEFERRED DECISION / NOT AUTHORIZED**. No merge, no vision implementation, no model/provider change, no deploy/release/production performed or authorized by this note.

## References

- PR #172: https://github.com/leon337/multiagent-collaboration-framework/pull/172 (open/draft/not merged)
- `MCF-OX-VISION-BRIDGE-OX-ACK-2026-08-26.md` · `MCF-OX-VISION-BRIDGE-OX-REMOTE-VERIFY-2026-08-26.md`
- `MCF-HARNESS-MESTRE-OX-E2E-20260825.md`

— OX
