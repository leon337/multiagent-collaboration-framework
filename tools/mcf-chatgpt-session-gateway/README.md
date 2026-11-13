# MCF ChatGPT Session Gateway — MVP EXPERIMENTAL

Status: **EXPERIMENTAL / HOST_MEDIATED / LOCAL_ONLY**. No production activation.

## Purpose and boundaries

This module connects an MCF orchestration client to **existing, authenticated ChatGPT surfaces** in the MCF Dual Browser Cockpit. It is a client of the canonical Agent Bridge; it is **not** a second MCF runtime, ledger, permission system or cognitive model.

Flow:

```text
LEANDRO → MESTRE / MCF governance → ChatGPTSessionGateway
           → local authenticated Agent Bridge (127.0.0.1)
           → ChatGPT panes / Agent Sessions
           → bridge mission result + SHA evidence → MESTRE
```

Canonical source: `docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md`; UI semantics: `docs/operations/MCF-UI-OPERATING-MANUAL.md`. The Gateway does **not** generate UI selectors or click coordinates. It relies on the existing Cockpit's semantic and lifecycle checks.

## Capabilities of this MVP

- `discover`: verify instance identity, authority and canonical Bridge discovery schema.
- `sessions`: inspect independent ChatGPT Agent Sessions (read-only).
- `open`: create a new independent Agent Session for a **registered** canonical agent, returning `UNVERIFIED` unless the Bridge confirms conversation delivery.
- `dispatch`: send one governed mission to an existing **READY and handshake-verified pane agent**; returns a dispatch receipt, **not a completed result**.
- `result` / `wait`: read mission state and return completed output only with the Bridge's SHA-256 evidence.

**Important limit:** Independent Agent Session creation and pane mission dispatch are different mechanisms. Current Bridge v0.7.4 does not advertise a generic follow-up message/result route for independent Agent Sessions. Thus this MVP does not pretend to run arbitrary follow-up work in them. End-to-end verified execution uses pane missions. Supporting follow-up tasks in independent sessions requires a new, tested, discoverable Bridge contract.

## Run on authorized desktop (Node.js >=22)

No installation, model API key, or new dependencies required.

```bash
cd tools/mcf-chatgpt-session-gateway
npm test
node src/cli.mjs discover --instance notebook
node src/cli.mjs sessions --instance notebook
node src/cli.mjs dispatch --instance notebook --agent Sofia --mission-id EXPERIMENT-001 --objective "Faça uma análise sem ações externas."
node src/cli.mjs result --instance notebook --envelope-id <id-from-dispatch>
node src/cli.mjs wait --instance notebook --envelope-id <id-from-dispatch> --timeout-ms 60000
node src/cli.mjs open --instance notebook --agent Sofia --mission "EXPERIMENT-001" --objective "Analisar proposta."
```

**Use side-effecting commands only under explicit MCF authorization.** `discover`, `sessions`, `result` and `wait` are read-only; `open` and `dispatch` mutate the ChatGPT surface. Opening a new Agent Session creates a visible window and conversation. Do not use `open` as if it dispatches a mission result.

The local descriptor is loaded from:
`~/.config/mcf-dual-browser-cockpit/instances/<instance>/agent-bridge.json`.
The Bridge token stays in process memory and is supplied only in the local Authorization header; never put it in shell arguments, prompts, git or logs.

## Preconditions / failure semantics

- Only `127.0.0.1` descriptors are accepted; no remote Bridge host.
- Discovery must confirm `mcf-dual-browser-runtime-discovery/v1`, instance ID, human authority `LEANDRO` and orchestrator `MESTRE`.
- Mutations stop for paused/busy/queued runtime, unknown agent, identity not READY, or identity warning.
- Mutating POST requests are sent **once**; timeout/connection failure returns `MUTATION_OUTCOME_UNKNOWN`. Do not resend blindly. Reconcile through the Bridge's mission state/receipts first.
- Agent Session bootstrap in the composer is **not** delivery. `READY` requires `deliveryVerified`, a genuine conversation ID and absence of state warnings.
- Mission completion requires `COMPLETED` plus a result with SHA-256 proof from the existing Bridge. `QUEUED`, `ACCEPTED`, `WORKING`, and `TIMEOUT_UNVERIFIED` are not success.
- The Gateway cannot authorize filesystem/GitHub/network effects; such actions remain subject to MCF permission/HDF/HUMAN_GATE. No secret collection, captcha handling, or browser credential extraction.
- No automatic retries of state-changing commands. Result polling is read-only.

## Classification and remaining milestones

1. This module is a **working isolated experimental connector**, not wired into central `MissionRuntime` or `ExternalActionDispatcher`; those connections require integration tests, capability registration and governance review.
2. The unit suite uses a local fake Bridge (no real ChatGPT account or messages) and covers success, drift, authorization state, missing evidence and unknown mutation outcomes.
3. Live E2E qualification must exercise a **dedicated disposable mission** on the authorized Cockpit, verify the returned `envelopeId`, read the actual result SHA, and record evidence. Do not alter an existing mission without confirming its boundary.
4. A future Cockpit extension can expose independent-session `sendTask` and `getResult` if supported by verified DOM-turn evidence and explicit discovery contract.
5. This module is disabled by default in production. No paid model API or paid fallback is used.

## Tests

`npm test` executes `node --test` without dependency installation. All tests use temporary, synthetic descriptors and fake tokens; no real secret is needed.

## Optional AMD/other GPU Linux smoke

On authorized Linux workstations with EGL/GLES and DRM render device, run:

```bash
npm run smoke:gpu-linux
```

The optional script uses a 64x64 EGL pbuffer, GL color clear, GPU readback and renderer check against software fallback. It does not require a browser login, model weights or cloud API. This is **a GPU graphics hardware check**, not a speedup for Node.js/MCP unit tests. Never enable it as a mandatory check on GitHub-hosted CPU-only CI runners.
