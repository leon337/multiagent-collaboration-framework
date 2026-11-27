# MCF Browser Federated Authentication

- **Capability ID:** `MCF-BROWSER-FEDERATED-AUTH`
- **Mission:** [MCF-BROWSER-FEDERATED-AUTH-001 — Issue #584](https://github.com/leon337/multiagent-collaboration-framework/issues/584)
- **Status:** `EXPERIMENTAL` / orchestration-ready / local-browser qualification in progress
- **Version:** 0.1.0
- **Authority:** LEANDRO (human gate); MESTRE (orchestration)
- **Last reconciled:** 2026-11-27

## Purpose

Allow LEANDRO to complete Google OAuth in a persistent, visible Google Chrome session. The preferred control path is the authorized Chrome extension through MESTRE Browser Control (MBC); CDP is reserved for a separately reviewed local adapter and must remain loopback-only. The legacy headless Playwright Chromium context is not the authentication target. Supported platforms may use either a same-tab redirect or an authentication popup/new tab. For a popup, the browser retains the platform opener, focuses the OAuth page in the remote viewer, and restores the opener when the popup closes. For a same-tab redirect, the viewer follows the Google page and the provider's normal return navigation restores the platform in the same tab.

This is a human-assisted sign-in capability. It is not an autonomous credential manager and does not grant permission to perform account or financial actions.

## Discovery for new chats

When LEANDRO asks to sign in with Google, authenticate a site through the MCF browser, use a saved authenticated link, or resume an OAuth popup:

1. Read this runbook and the `MCF-BROWSER-FEDERATED-AUTH` entry in `skills/registry.yaml`.
2. Reconcile the live host and runtime. Do not trust an old hostname, port, process, profile, URL, or session claim. Standard browser for this mission: installed Google Chrome; Brave is not the selected browser.
3. On the authorized host, verify the user service `mcf-dsh-browser-viewer.service`, local health endpoint on port 3096, and the current Tailscale Serve mapping. Derive the remote URL from live `tailscale serve status`; never reuse an unverified link.
4. Use the saved-link catalog to resolve the intended platform. Current catalog entries observed during this mission: `IQ Option` and `Olymptrade`. Re-read the catalog before use.
5. Open the saved platform link in the authorized Google Chrome session controlled through MBC. Confirm the browser client, active mission, and platform domain. Do not use the legacy isolated/headless DSH Chromium context for Google OAuth.
6. Trigger only the platform's visible sign-in flow. Verify that the page is actually a sign-in flow, not registration, before continuing.
7. For a same-tab redirect, verify the active page moves to an exact approved Google identity host over HTTPS and wait for the provider's return navigation. For a new page, verify its opener is the allowlisted platform and its destination is an exact approved Google identity host or the same platform's domain. Focus only validated pages in the viewer. Close unknown-origin popups.
8. Hand the viewer to LEANDRO. LEANDRO enters the Google identity, password, passkey, recovery factor, or MFA code directly. The agent must not read, type, copy, store, transmit, or summarize those values.
9. Wait for the OAuth flow to return or close. Verify only a non-sensitive session signal (for example, a signed-in account label or an authenticated app landing page). Never inspect cookies, localStorage, sessionStorage, OAuth codes, URL query state, or tokens.
10. Re-open the other saved platform only after the first flow is finished. Confirm that each domain retains its own session in the same persistent browser profile.
11. Record the platform, domains, popup lifecycle, persistence result, viewer reachability, and HUMAN_GATE disposition without recording the user's email or secrets.

## Runtime behavior and origin policy

The legacy local DSH Browser implementation still uses a persistent Playwright Chromium context and viewer. It is retained for isolated automation, but it is not qualified for Google OAuth. Google OAuth must use the installed Google Chrome interactive session through the authorized MBC extension. A new page is not automatically trusted merely because it was created by the browser.

The popup policy is intentionally narrow:

- Trusted platform origins: `olymptrade.com` and `iqoption.com`, including their subdomains.
- Exact Google identity destinations: `accounts.google.com`, `consent.google.com`, `myaccount.google.com`, and `oauth2.googleapis.com`.
- Same-platform redirects are permitted only when the popup's opener was one of the trusted platforms.
- HTTPS is required. Embedded URL credentials are rejected.
- Unknown opener, unknown destination, lookalike domains, and insecure schemes fail closed.
- Existing network route guards remain in force. This feature must not relax private-IP, DNS, localhost, or internal-network protections.
- A separate popup is focused in the viewer; closing it restores the opener tab when still available. Same-tab redirects remain in the same tab and return through the provider's redirect.

The allowlist is a technical starting point for this mission, not a universal allowlist for arbitrary sites. Add another platform only through a separately reviewed change with explicit origin evidence and tests.

## Human gate and prohibited behavior

`HUMAN_GATE` is mandatory for authentication, account linking, passkeys, password entry, MFA, recovery, CAPTCHA, and consent screens that grant account access.

Never:

- request or accept a password, one-time code, recovery code, passkey secret, OAuth authorization code, access token, refresh token, cookie, or browser storage value in chat;
- enter user credentials on the user's behalf;
- bypass MFA, CAPTCHA, risk checks, regional restrictions, or provider consent;
- log complete OAuth URLs or query strings, because they may contain state and authorization material;
- treat a visible Google account chooser as proof that the platform session is authenticated;
- execute deposits, withdrawals, trades, purchases, transfers, or other financial actions as part of sign-in;
- reuse another person's profile or cross-chat browser state.

The user may complete the login directly in the viewer. If the provider requires extra verification or blocks the attempt, stop and report the exact non-secret blocker.

## Verification checklist

- [ ] Runtime and viewer health confirmed on the authorized host.
- [ ] Installed Google Chrome session and exact authorized profile confirmed through MBC.
- [ ] MBC extension reports connected and the `mestre-her-agent` mission is active.
- [ ] Google sign-in is not attempted in the legacy headless isolated DSH context.
- [ ] Saved link resolves to the intended platform.
- [ ] Sign-in flow distinguished from registration.
- [ ] Popup opener matches the saved platform origin.
- [ ] Popup destination matches an exact Google identity host or same-platform redirect.
- [ ] Untrusted popup and lookalike domain tests fail closed.
- [ ] Viewer displays the active OAuth page without exposing query state in agent output.
- [ ] Closing/returning from popup restores the opener.
- [ ] Persistent profile survives a controlled service restart only after the user finishes the active login flow.
- [ ] LEANDRO completed authentication manually.
- [ ] Non-sensitive authenticated-session evidence captured.
- [ ] No credentials, OAuth state, tokens, cookies, or financial actions recorded.

## Qualification snapshot — 2026-11-27

Observed in the current local runtime:

- The legacy isolated/headless DSH browser and local viewer health were confirmed, but this browser mode is not qualified for Google OAuth.
- A regression test was added for platform-origin validation and exact Google identity hosts: 3/3 PASS.
- The previous runtime behavior closed all new pages.
- After the fix and service restart, the IQ Option sign-in modal exposed a Google sign-in action; selecting it navigated the active MCF browser page to a Google Accounts sign-in page. The observed IQ Option flow used same-tab navigation, not a separate popup; OAuth query/state data was removed from status and snapshot output.
- No credential was entered. The user has not yet completed authentication. The Google sign-in attempt occurred in the legacy headless isolated context; it is not evidence that the installed interactive Chrome/Brave session can authenticate.
- Olymptrade sign-in control was visible in the expanded menu, but its semantic click timed out; the Google OAuth flow for Olymptrade remains unqualified.
- Remote Tailscale viewer mapping on port 8511 was configured, but external device reachability has not yet been verified.
- This capability is not an executable MCF server-runtime skill. Its current qualification is local-browser + orchestration/documentation; do not count it among the server's executable skills.

## Recovery and handoff

If the popup is blocked, first inspect the runtime's popup lifecycle and opener/destination evidence. Do not disable the route guard or permit arbitrary popups. Preserve the authorized Google Chrome profile and current page. If CDP is unavailable, do not silently switch to headless Chromium; stop and ask LEANDRO to authorize a visible dedicated browser session. If a code change requires restarting the browser service, warn LEANDRO first when an OAuth flow is open, because restart closes the active popup.

For continuation, open Issue #584, revalidate the host and saved-link catalog, test Olymptrade, let LEANDRO complete the Google login manually, verify the resulting non-sensitive session state, then update this runbook and the issue with evidence.


## MESTRE Live voice co-agent — architecture update (2026-11-27)

LEANDRO selected **Google Chrome** as the standard browser. The operational topology uses two concurrent MESTRE instances with distinct responsibilities:

- **MESTRE (ChatGPT/orchestrator):** owns the mission, coordinates actions, observes evidence, and remains accountable for HUMAN_GATE.
- **MESTRE Live (Gemini Live voice session):** provides real-time spoken conversation with LEANDRO and may execute browser actions only through the MESTRE Browser Control (MBC) gateway and its registered client `mestre-her-agent`. It must not access Playwright sockets, CDP directly, or Electron/admin identity.

MESTRE Live is an existing runtime session/profile of the canonical MESTRE identity, not a new canonical agent identity. Its local service is `mestre-agent.service` on loopback port 8878; Tailscale Serve maps port 8466 to that service (tailnet-only). The browser viewer remains port 3096, mapped to 8511. The viewer header now contains a **MESTRE Live** link that opens the voice app in a separate tab so the browser session can continue operating.

### Live host evidence observed 2026-11-27

- `mestre-agent.service`: active/running; `GET /health` returned `{"ok":true,"configured":true}`.
- `GET /api/live/status`: `ready=true`, model `gemini-3.8-live`, `mic_only_when_started=true`. This proves provider/runtime readiness, not that LEANDRO's microphone is currently connected.
- `mestre-browser-control.service`: active/running; gateway health returned `ok=true`, version `0.5.2`.
- MBC status for `mestre-her-agent`: mission `MESTRE_AGENT_HTTP_HTTPS_20261104` active, level `autonomo`, extension state `connected`, no pending requests. The mission's currently reported domains are public HTTP/HTTPS. Revalidate this scope and its authorization before every new mission; do not infer authorization for other domains or sensitive actions.
- MESTRE Live's adapter declares browser status/action tools and routes them exclusively through MBC. It explicitly disallows direct Playwright/CDP access.
- The separate ChatGPT↔Gemini relay on port 8892 reported `player_connected=false` and `audio_ready=false`; it is not evidence of an active audio connection and is not required to open the MESTRE Live app itself.

### Interaction and concurrency rules

1. Open the MESTRE Live link from the browser viewer. On a remote device, Tailscale must be connected; the voice app is tailnet-only.
2. LEANDRO explicitly starts the microphone/Live session and grants browser microphone permission when prompted. No background listening before the user starts it.
3. MESTRE Live speaks with LEANDRO and can use MBC browser tools within the registered mission scope. Authentication, MFA, CAPTCHA, consent, account changes, and financial actions remain HUMAN_GATE.
4. MESTRE (ChatGPT) remains the orchestrator and must not issue concurrent browser mutations while MESTRE Live is operating the same browser session. Use one browser writer at a time; reconcile MBC mission/lease state before switching control.
5. The voice agent must narrate material actions, distinguish proposal from execution, and report tool receipts and observed postconditions. Speech alone is not authorization for a sensitive action.
6. If the Live session is unavailable, the browser operator may continue only through the separately authorized MBC path; do not fall back to the isolated headless Chromium context for Google authentication.

### Qualification boundary

The local UI link and service readiness are verified. End-to-end microphone capture, spoken turn-taking during a browser task, Chrome identity confirmation in MBC, and coordinated command handoff with the ChatGPT orchestrator still require an interactive E2E test with LEANDRO. Until that test passes, classify the two-agent voice/browser workflow as `EXPERIMENTAL`, not fully qualified.
