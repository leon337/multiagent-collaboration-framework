# PHASE-01 REPORT — evidence and limits
Date: 2026-10-21. Coordinator: MESTRE. Status: DOCUMENTED, review pending.

## What was actually done
1. Read canonical README, current-state document, unified agent protocol, Dual Browser discovery protocol and ChatGPT semantic UI manual/contract on GitHub.
2. Inspected WebAgent browser-actions, runtime, evidence and server; inspected PermissionEngine, HDF, SkillExecutor, ExternalActionDispatcher/contract, AdapterRegistry and Nest wiring on main.
3. Inspected Issue #455 and related #367, #365, #381, #434, #439, #427; PRs #371, #435, #440 and the WebAgent qualification workflow. Historical WebAgent PR #371 qualification was successful; this does not imply current main CI is green.
4. Verified exact main head via authenticated GitHub CLI on authorized host: 460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615; tree e7b26c4239176b8af3851d601623576b3b4c405a.
5. Read-only diagnostics on online device leo-N43SM (Predix Remote Desktop Commander): Linux Mint 22.1, kernel 6.8.0-147-generic, Node 24.22.0, npm 11.19.1, git 2.43, gh 2.102; memory 7.7 GiB, disk 72 GB free at root.
6. Brave browser executable and active: 1.97.57 (Chromium 155 family). Google Chrome package status deinstall ok config-files, no browser binary. NativeMessagingHosts user dirs for both exist with 0 manifests. Shallow search of home did not find a local MCF clone (negative result is depth-limited).
7. Opened a planning-only branch; persisted this report and companion design documents. No computer/browser application state changed.

## Technical findings
- WebAgent Playwright/headless has navigate READ and click/fill/select/press WRITE operations. Writes are blocked by default. This is not the human Brave/Chrome profile.
- Cockpit Electron/Agent Bridge and Agent Workspace are distinct surfaces, not a second runtime.
- MCF-OPERATE-DUAL-BROWSER is scoped to the Cockpit; not general authorization for an external browser.
- PermissionEngine, adapter registration and evidence checks must be explicitly integrated, not assumed from a new provider name.
- Dispatcher has durably unknown-effect handling. Any browser action with uncertain effect must NOT be retried blindly.
- The open Issue #365 requires reconciliation of work that continues after ChatGPT response interruptions.
- The Issue #427 tracks security/readiness debt separately. Do not weaken gates.
- Checklist Issue #367 is partly lagging the code from PR #371; avoid equating checkboxes with current implementation.

## Not performed
No browser extension code, Native Messaging host, host install, browser UI action, screenshot of sensitive pages, credentials, Dual Browser discovery, automated extension tests or real E2E. Independent agent review, LÉO gate, production mutations and release also NOT_RUN.

## Next
Obtain PR CI/document validation on exact SHA; security/architecture independent review; operational gate. If approved separately, begin implementation in a new boundary.
