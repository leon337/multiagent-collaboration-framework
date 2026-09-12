# EMILY — Independent Audit — GUI / Window Control — 2026-08-27

**Mission:** `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`  
**Authority:** LEANDRO  
**Coordinator:** MESTRE successor  
**Role contract:** `docs/agentes/EMILY.md`  
**Status:** `VALID_INDEPENDENT_AUDIT`

## Audit scope

Audit the persisted GUI/window-control finding, the prior LÉO × BEATRIZ divergence, the resumed RENATO/AUGUSTO opinions, and the provisional `MAINTAIN_WITH_GAP` reconciliation. This audit does **not** authorize protocol mutation, merge, tag, version number, or release.

## Independent execution evidence

The previous Emily attempts were invalid because they ended in provider capacity/transport failures. No vote was inferred from them.

A new independent one-shot route was qualified on 2026-08-27:

```text
provider = NVIDIA NIM
model    = minimaxai/minimax-m3
smoke    = HTTP 200 / EMILY_NVIDIA_ROUTE_OK
audit    = HTTP 200
```

The credential was read only inside the local process from the existing DSH credential store and was not printed, copied into this artifact, or exposed to the conversation.

This model/provider route is distinct from:

- the prior LÉO/BEATRIZ DSH cognitive environment;
- RENATO: `oc/laguna-s-2.1-free`;
- AUGUSTO: `oc/mimo-v2.5-free`.

## Emily result

```text
VERDICT: PASS_WITH_CONDITIONS
EVIDENCE_SUFFICIENCY: SUFFICIENT
FINDING_SEVERITY: MEDIUM
RETROSPECTIVE_CROSS_CHAT_PASS: MAINTAIN_WITH_GAP
LEO_BEATRIZ_RECONCILIATION: ACCEPT
TEAM_CONSENSUS_RECOMMENDATION: PENDING
HUMAN_GATE_READY: NO
RELEASE_GATE: BLOCK
```

Emily's reconciliation rationale: LÉO's incompleteness concern applies to coverage of the newly discovered surface-isolation invariant; BEATRIZ's non-invalidation position applies to historical validity under the acceptance criteria actually in force. The evidence supports preserving the historical PASS while recording the new invariant as a coverage gap.

## Required remediations identified by Emily

- add explicit `SUCCESSOR_SESSION_CREATED != SUCCESSOR_WINDOW_CREATED` assertion;
- preserve predecessor surface until equivalence + handoff are confirmed;
- treat predecessor close as an explicit separately governed action;
- distinguish X11 synthetic events from device-level input in trace/evidence;
- add monitor-aware tiling validation;
- add observable shortcut-execution trace fields;
- add two-window predecessor/successor copresence regression;
- record the original-run coverage gap in the audit trail;
- require independent revalidation for future gate-critical decisions touching this invariant.

## Interpretation boundary

Emily's `TEAM_CONSENSUS_RECOMMENDATION=PENDING` was emitted before MESTRE performed the final team consolidation. Emily does not own the team-consensus decision. Her audit establishes evidence sufficiency, accepts the LÉO × BEATRIZ reconciliation, and keeps the release gate blocked pending the mission's remaining governance gates.

## Runtime incident discovered while resuming the audit

The local DSH initially failed because four session directories (eight root-owned objects counting compressed session artifacts) had incompatible ownership for the service user `sentinelx`. A diagnostic boot produced a concrete `EACCES` on a session artifact. Only those root-owned session objects were changed to `sentinelx:sentinelx`; content and file modes were preserved. Read-back after repair:

```text
ROOT_OWNED_COUNT before = 8
ROOT_OWNED_COUNT after  = 0
mcf-dsh.service         = active (running)
HTTP 127.0.0.1:3081     = 200
```

The default DSH headless route still returned provider `429` after infrastructure recovery; therefore the independent Emily audit used the separate qualified NVIDIA route instead of treating provider saturation as evidence.

## Audit conclusion

```text
EMILY_REVIEW = VALID
EVIDENCE = SUFFICIENT
RETROSPECTIVE_CLASSIFICATION = MAINTAIN_WITH_GAP
LEO_BEATRIZ_RECONCILIATION = ACCEPT
PROTOCOL_MUTATION = NOT_AUTHORIZED_BY_THIS_AUDIT
RELEASE_GATE = BLOCK
SECRETS_EXPOSED = NO
```
