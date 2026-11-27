# MCF Browser Federated Authentication

- **Capability ID:** `MCF-BROWSER-FEDERATED-AUTH`
- **Mission:** [MCF-BROWSER-FEDERATED-AUTH-001 — Issue #584](https://github.com/leon337/multiagent-collaboration-framework/issues/584)
- **Status:** `EXPERIMENTAL` / orchestration-ready / local-browser qualification in progress
- **Version:** 0.1.0
- **Authority:** LEANDRO (human gate); MESTRE (orchestration)
- **Last reconciled:** 2026-11-27

## Purpose

Allow LEANDRO to complete Google OAuth in a persistent, isolated MCF browser session when a supported platform opens an authentication popup or new tab. The browser must retain the platform opener, focus the OAuth page in the remote viewer, and return to the opener when the popup closes or the provider redirects back.

This is a human-assisted sign-in capability. It is not an autonomous credential manager and does not grant permission to perform account or financial actions.

## Discovery for new chats

When LEANDRO asks to sign in with Google, authenticate a site through the MCF browser, use a saved authenticated link, or resume an OAuth popup:

1. Read this runbook and the `MCF-BROWSER-FEDERATED-AUTH` entry in `skills/registry.yaml`.
2. Reconcile the live host and runtime. Do not trust an old hostname, port, process, profile, URL, or session claim.
3. On the authorized host, verify the user service `mcf-dsh-browser-viewer.service`, local health endpoint on port 3096, and the current Tailscale Serve mapping. Derive the remote URL from live `tailscale serve status`; never reuse an unverified link.
4. Use the saved-link catalog to resolve the intended platform. Current catalog entries observed during this mission: `IQ Option` and `Olymptrade`. Re-read the catalog before use.
5. Open the saved platform link in the isolated persistent profile. Confirm the browser status and platform domain.
6. Trigger only the platform's visible sign-in flow. Verify that the page is actually a sign-in flow, not registration, before continuing.
7. When a new page is created, verify its opener is the allowlisted platform and its destination is HTTPS on an exact approved Google identity host or the same platform's domain. Focus only validated pages in the viewer. Close unknown-origin popups.
8. Hand the viewer to LEANDRO. LEANDRO enters the Google identity, password, passkey, recovery factor, or MFA code directly. The agent must not read, type, copy, store, transmit, or summarize those values.
9. Wait for the OAuth flow to return or close. Verify only a non-sensitive session signal (for example, a signed-in account label or an authenticated app landing page). Never inspect cookies, localStorage, sessionStorage, OAuth codes, URL query state, or tokens.
10. Re-open the other saved platform only after the first flow is finished. Confirm that each domain retains its own session in the same persistent browser profile.
11. Record the platform, domains, popup lifecycle, persistence result, viewer reachability, and HUMAN_GATE disposition without recording the user's email or secrets.

## Runtime behavior and origin policy

The local DSH Browser implementation uses a persistent Playwright Chromium context and a viewer. A new page is not automatically trusted merely because it was created by the browser.

The popup policy is intentionally narrow:

- Trusted platform origins: `olymptrade.com` and `iqoption.com`, including their subdomains.
- Exact Google identity destinations: `accounts.google.com`, `consent.google.com`, `myaccount.google.com`, and `oauth2.googleapis.com`.
- Same-platform redirects are permitted only when the popup's opener was one of the trusted platforms.
- HTTPS is required. Embedded URL credentials are rejected.
- Unknown opener, unknown destination, lookalike domains, and insecure schemes fail closed.
- Existing network route guards remain in force. This feature must not relax private-IP, DNS, localhost, or internal-network protections.
- The popup is focused in the viewer; closing it restores the opener tab when still available.

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

- Persistent isolated Chromium profile and local viewer health confirmed.
- A regression test was added for platform-origin validation and exact Google identity hosts: 3/3 PASS.
- The previous runtime behavior closed all new pages.
- After the fix and service restart, the IQ Option sign-in modal exposed a Google sign-in action; selecting it opened a Google Accounts sign-in page in the active MCF browser view.
- No credential was entered. The user has not yet completed authentication.
- Olymptrade popup OAuth flow remains to be tested.
- Remote Tailscale viewer mapping on port 8511 was configured, but external device reachability has not yet been verified.
- This capability is not an executable MCF server-runtime skill. Its current qualification is local-browser + orchestration/documentation; do not count it among the server's executable skills.

## Recovery and handoff

If the popup is blocked, first inspect the runtime's popup lifecycle and opener/destination evidence. Do not disable the route guard or permit arbitrary popups. Preserve the persistent profile and current page. If a code change requires restarting the browser service, warn LEANDRO first when an OAuth flow is open, because restart closes the active popup.

For continuation, open Issue #584, revalidate the host and saved-link catalog, test Olymptrade, let LEANDRO complete the Google login manually, verify the resulting non-sensitive session state, then update this runbook and the issue with evidence.
