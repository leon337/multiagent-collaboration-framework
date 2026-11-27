# MCF Browser — MESTRE Live Voice Co-Agent

- **Capability:** `MCF-BROWSER-FEDERATED-AUTH`
- **Mission:** [Issue #584](https://github.com/leon337/multiagent-collaboration-framework/issues/584)
- **Status:** `EXPERIMENTAL` — remote embedded audio roundtrip and MBC observability verified with simulated microphone; physical microphone and exact Chrome profile identity still pending
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
2. Click **MESTRE Live** to open the voice panel and **O que o MESTRE vê** to open observability. Both stay inside the same MCF Browser application; neither opens a new tab. On desktop, panels appear in a right rail; on narrow screens, they stack below the browser.
3. Connect to Tailscale first when using a remote device.
4. Start the microphone/Live session manually and grant Chrome microphone permission.
5. Speak to MESTRE Live. It narrates the task and may call MBC browser tools within the active mission scope. The observability panel shows the actual Chrome screenshot and browser snapshot returned by MBC, plus the live tool-action timeline.
6. MESTRE (ChatGPT) supervises mission scope and evidence. Do not let both instances issue concurrent browser mutations.

## Local viewer and observability change

The local viewer at `/home/leo/.local/share/mcf-dsh-browser` now has two integrated panels:

- **MESTRE Live:** eager-loaded iframe in the same application, with explicit `microphone` and `autoplay` delegation. The user still starts the session and grants microphone permission.
- **O que o MESTRE vê:** a read-only observer panel backed by the MBC client `mestre-her-agent`, not by the viewer's isolated Chromium. It displays:
  - a current Chrome screenshot obtained through MBC `browser_take_screenshot`;
  - the exact redacted text/DOM observation returned by MBC `browser_snapshot`;
  - extension/mission connection state and capture time;
  - an action timeline with start/end events, tool names, action labels, duration, and truthful verification status. Running actions pulse; completed observations turn green; unverified results remain explicitly unverified.

The viewer proxies the read-only observer endpoints through its authenticated local API. The viewer token is required at the proxy and revalidated by the MESTRE service. Page text and screenshots are returned on demand and are not persisted by the observer. The viewer refreshes the screenshot/snapshot every five seconds while the panel is open and polls the in-memory tool event stream every 250 ms.

### MBC session isolation correction

The MESTRE Live adapter previously used the legacy shared MBC session. Although the client mission was active and the extension connected, the active tabs were owned by `chatgpt-main`; MESTRE Live received `TAB_OWNED_BY_OTHER_MISSION` when requesting a snapshot or screenshot.

A dedicated MBC conversation session was created for `mestre-her-agent` and stored in `~/.config/mestre-browser-control/mestre-her-agent.session` with mode `0600`. The adapter now requires this session token and does not fall back to the shared legacy session. After the change, MBC status, `browser_snapshot`, and `browser_take_screenshot` succeeded. A process-local lock serializes agent browser calls and observer captures so the observer does not race a browser mutation.

The main viewer screenshot remains the isolated DSH Chromium. It is intentionally labelled as such; the **O que o MESTRE vê** panel is the authoritative view of the Chrome tab MESTRE receives through MBC.

Backups created before local changes:

- `viewer.html.backup-before-agent-observability-20261127`
- `viewer.js.backup-before-agent-observability-20261127`
- `server.cjs.backup-before-agent-observability-20261127`
- `live_bridge.py.backup-before-observability-20261127`
- `browser_receipts.py.backup-before-observability-20261127`
- `browser_gateway_adapter.py.backup-before-observability-20261127`

The DSH Browser viewer and MESTRE Live runtime directories are not Git checkouts. Their local implementation changes are documented here but are not part of the MCF repository diff.

## E2E status and remaining qualification

- [x] Integrated MESTRE Live panel opens inside the viewer without a new tab.
- [x] Desktop layout verified at 1440×900.
- [x] Mobile layout verified at 390×844; iframe loads eagerly when opened.
- [x] Remote Tailscale viewer (:8511) and Live iframe (:8466) load without failed HTTP requests.
- [x] Simulated microphone input sent PCM to Gemini Live and received playable response audio through the cross-origin iframe; latest run sent 41 PCM chunks, received 1 audio chunk, had zero underruns, and ~1.6 s estimated first-audio latency.
- [x] Explicit stop control tears down the Live session in the browser test.
- [x] Observer panel displays an MBC screenshot and the corresponding redacted browser snapshot from the dedicated MESTRE session.
- [x] Tool timeline displays real `tool_started` / `tool_finished` events for `browser_snapshot`, including duration and `observation_available`; no browser arguments or typed text are exposed in the timeline.
- [x] Observer and agent browser calls are serialized by a shared process-local MBC lock.
- [x] Chatterbox status no longer produces a 404: the read-only status route explicitly reports that Chatterbox is disabled in this runtime; synthesis/start/stop routes remain disabled for privacy.
- [ ] LEANDRO's physical microphone and speaker on the actual Android/device must be tested interactively; automated audio tests used a simulated microphone.
- [ ] Verify that the connected MBC extension is attached to the exact intended installed Google Chrome profile, not merely that an extension reports connected.
- [ ] Validate spoken turn-taking while a real browser task is in progress and confirm that only one writer mutates the shared browser.
- [ ] Complete a user-accepted end-to-end session and verify stop/mute behavior on the user's actual device.

The workflow remains `EXPERIMENTAL` until the physical-device microphone and exact Chrome-profile checks pass.
