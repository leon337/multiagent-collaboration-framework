# MCF Browser — MESTRE Live Voice Co-Agent

- **Capability:** `MCF-BROWSER-FEDERATED-AUTH`
- **Mission:** [Issue #584](https://github.com/leon337/multiagent-collaboration-framework/issues/584)
- **Status:** `EXPERIMENTAL` — local service and embedded panel verified; full interactive E2E pending
- **Selected browser:** Google Chrome
- **Authority:** LEANDRO
- **Orchestrator:** MESTRE (ChatGPT)
- **Voice runtime:** MESTRE Live (Gemini Live)

## Objective

Allow LEANDRO to speak with a Live agent while the browser is being operated. Keep orchestration and voice interaction separate enough to avoid competing browser actions.

## Two-agent session topology

| Role | Runtime | Responsibility |
|---|---|---|
| MESTRE — Orchestrator | ChatGPT / current MCF session | Owns mission, scope, evidence, gates, and coordination |
| MESTRE Live — Voice co-agent | Existing `mestre-agent.service`, Gemini 3.8 Live | Real-time voice conversation; may operate browser only through MBC |

MESTRE Live is a separate runtime/session of the canonical MESTRE identity. It is not a new canonical agent ID. Do not add a duplicate identity to the MCF agent registry.

## Browser control boundary

- Standard browser is the installed Google Chrome interactive profile authorized by LEANDRO.
- MESTRE Live browser tools are routed through MESTRE Browser Control (MBC), using client ID `mestre-her-agent`.
- The adapter uses MBC gateway CLI and does not access Playwright sockets, CDP, or Electron/admin identity directly.
- MBC extension/mission authorization must be revalidated at the beginning of each mission.
- Only one agent may mutate the shared browser session at a time. When MESTRE Live is operating the browser, ChatGPT MESTRE remains supervisory and does not issue concurrent browser mutations.
- Authentication, MFA, CAPTCHA, consent, account changes, and financial actions remain HUMAN_GATE.

## Existing local services observed

| Service | Local endpoint | Observed state |
|---|---|---|
| `mestre-agent.service` | `127.0.0.1:8878` | active; `/health` returned configured=true |
| MESTRE Live API | `GET /api/live/status` | ready=true; `gemini-3.8-live`; microphone starts only after user action |
| `mestre-browser-control.service` | `127.0.0.1:47831` | active; gateway health OK, version 0.5.2 |
| MBC client `mestre-her-agent` | gateway status | mission active; extension connected; zero pending requests |
| Browser viewer | `127.0.0.1:3096` | active; Tailscale Serve port 8511 |
| MESTRE Live UI | `127.0.0.1:8878` | Tailscale Serve port 8466, tailnet-only |

The separate ChatGPT↔Gemini relay on port 8892 reported `player_connected=false` and `audio_ready=false`. This is not evidence of an active audio session. Do not conflate that relay with the MESTRE Live app's own Live WebSocket.

## User workflow

1. Open the MCF Browser viewer.
2. Click **MESTRE Live** in the header. The voice app opens inside an integrated side panel in the same MCF Browser screen; it does not open a new tab. On desktop, the browser and voice panel are side by side; on narrow screens, the panel stacks below the browser.
3. Connect to Tailscale first when using a remote device.
4. Start the microphone/Live session manually and grant Chrome microphone permission.
5. Speak to MESTRE Live. It narrates the task and may call MBC browser tools within the active mission scope.
6. MESTRE (ChatGPT) supervises mission scope and evidence. Do not let both instances issue concurrent browser mutations.

## Local viewer change

The local viewer at `/home/leo/.local/share/mcf-dsh-browser` now embeds the existing MESTRE Live app in a lazy-loaded iframe panel. The header button toggles the panel without navigating away from the browser. It chooses local port 8878 for localhost access and Tailscale Serve port 8466 for tailnet hostnames. The viewer CSP explicitly allows only these two Live origins, and the iframe delegates `microphone` and `autoplay`; the user must still start the microphone and grant permission. Backups were created before editing:

- `viewer.html.backup-before-20261127-inline-live`
- `viewer.js.backup-before-20261127-inline-live`

The DSH Browser runtime directory is not a Git checkout. This local UI change is therefore documented but is not part of the MCF repository diff.

## E2E still required

- [ ] Open the integrated MESTRE Live panel from the viewer on desktop and Android/Tailscale; confirm no new tab is opened.
- [ ] Start microphone inside the embedded panel manually; verify browser permission, user speech capture, and agent audio playback.
- [ ] Keep a browser task running while speaking; verify turn-taking does not interrupt the browser.
- [ ] Verify MESTRE Live's MBC client is attached to the intended Google Chrome profile, not another browser.
- [ ] Verify only one writer controls the browser at a time.
- [ ] Verify the agent reports each browser action and observed postcondition truthfully.
- [ ] Confirm stop/mute and session teardown work.

Until all checks pass, the voice/browser co-agent workflow remains experimental.
