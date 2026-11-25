# MCF — OX Correction Notification Receipt — 2026-08-26

**Authority:** LEANDRO  
**From:** MESTRE  
**To:** OX successor session `session-89dedcc5-a283-4b88-a42e-2f5281318f17`  
**Status:** `MESSAGE_ACCEPTED_BY_DSH / OX_ACK_NOT_YET_VERIFIED`

## 1. Purpose

Preserve the factual correction requested by LEANDRO so MESTRE and OX maintain a coherent chronology outside any single chat surface.

Correction: LEANDRO's earlier phrase about an instruction “na pasta do projeto” referred to **ChatGPT Project Settings -> Instruções**, not to a newly uploaded file or repository folder. MESTRE's earlier attempt to locate a new Project file was therefore based on a misunderstanding and must not be attributed to a failure by LEANDRO.

## 2. Human evidence relayed to OX

Artifact A:
- dimensions: `1366x768`
- size: `207139 bytes`
- SHA-256: `ac4e460fc3a3042a80650ce81bd824f2a5a5b05c81e55fadbff5ae468de0b7bc`
- OX classification: `INDIRECT_VISUAL_EVIDENCE` via MESTRE hash + structured description.

Artifact B:
- dimensions: `1366x768`
- size: `265069 bytes`
- SHA-256: `824cf6fcfcea2ae07b5ef39e663ce96db26e405229b1bf25b4e15397cbdf56f1`
- OX classification: `INDIRECT_VISUAL_EVIDENCE` via MESTRE hash + structured description.

The correction and visual-evidence record already exists at:
`docs/continuity/MCF-CONTINUITY-CORRECTION-AND-HUMAN-EVIDENCE-2026-08-26.md`.

## 3. Delivery attempts and correction of evidence status

### GUI attempt

MESTRE entered the correction message through the already-authenticated Cloud Workstation window for `vmi3506102`.

Subsequent canonical `session.history` search found **zero hits** for the two artifact hashes / correction wording.

Therefore the GUI attempt is classified:

- `GUI_INPUT_ATTEMPTED = YES`
- `DSH_DELIVERY_VIA_GUI = NOT_PROVEN`
- it is NOT counted as successful notification evidence.

### Canonical DSH delivery

MESTRE then used the documented DSH RPC channel on the SAME successor session:

- method: `session.prompt`
- session: `session-89dedcc5-a283-4b88-a42e-2f5281318f17`
- mode: `queue`
- rpc id: `mestre-notify-ox-project-instructions-20260826`

Observed server response:

```json
{
  "type": "server-response",
  "rpcId": "mestre-notify-ox-project-instructions-20260826",
  "result": {
    "ok": true,
    "value": {"accepted": true}
  }
}
```

Canonical status:

- `MESSAGE_TO_OX_ACCEPTED_BY_DSH = YES`
- `OX_ACK_OF_CORRECTION = NOT_VERIFIED`

Reason ACK remains unverified: SentinelX observability of `vmi3506102` disconnected during the post-prompt history read. The host did not reconnect during the immediate retry window.

## 4. Additional continuity facts relayed in the same prompt

OX was informed that:

- its post-migration receipt was recovered from the VPS;
- runtime SHA-256: `5510da3418726d88061b2a0a0cab622a44803afbf70e0a31223618e5c034ba51`;
- receipt was transported to PR #174 at commit `d0a0c609eb33a4b427016f228d53ba0ff0d4c6ae`;
- independent GitHub read-back produced the same SHA-256 / `BYTE_MATCH=YES`;
- `OX_SESSION_HANDOFF = PASS` was persisted at commit `e17a369c104e567ae85bd134146ab7b531080f95`;
- LEANDRO authorized continuity;
- merge, deploy, release, model/provider change and deferred vision implementation remain unauthorized unless separately gated.

## 5. Boundary

`accepted:true` proves DSH accepted the prompt for the target session. It is not treated as proof that OX cognitively processed or acknowledged the correction.

The next read of a fresh `assistant/message` from the same session may upgrade the status to `OX_ACK_OF_CORRECTION = VERIFIED` if its content explicitly recognizes the correction.

No new OX session shall be created merely to obtain this ACK.
