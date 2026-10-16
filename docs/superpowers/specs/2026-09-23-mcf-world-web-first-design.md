# MCF World 3D — Web-first Hosted Architecture Design

**Date:** 2026-09-23  
**Mission:** #324  
**Branch:** `mission/mcf-world-web-first-2026-09-23`  
**Classification:** Class B — reversible product/architecture implementation, no production deployment  
**Authority:** LEANDRO authorized continuous execution without intermediate continuation gates.

## 1. Intent

MCF World 3D must stop depending on a Linux/X11 notebook as its primary runtime. The product core becomes a hosted browser application that runs on Windows 10 and Linux in modern Chromium-family browsers. Electron remains an optional desktop shell for capabilities that the browser cannot reliably provide, especially unrestricted embedded navigation.

The previous local Electron/Three.js workspace remains a separate evidence source. Its uncommitted Task 6 changes are unavailable while the notebook is powered off and must not be recreated or described as remotely preserved.

## 2. Current evidence and constraints

Live GitHub discovery on 2026-09-23 found no repository or indexed code containing the previous World-specific markers `MCF_WORLD_SMOKE_BROWSER`, the known Electron BrowserWindow security implementation, or the prior Three.js application. The authoritative previous implementation is therefore treated as local/offline until the host returns.

The official MCF repository already uses `apps/` for product/runtime applications. To avoid coupling this MVP to the existing `apps/rede-social-agentes` pnpm workspace and its lockfile, the hosted MVP is additive at `apps/mcf-world-web/`.

The new app must not modify or claim equivalence with the unavailable local Electron workspace.

## 3. Success criteria

The hosted MVP is acceptable when all of the following are true:

1. A static web application boots without a server-side runtime.
2. The same files can be served on Windows 10 or Linux through any static HTTP server.
3. A navigable WebGL/Three.js scene displays terrain, sky/light, a PET avatar and a follow camera.
4. Keyboard movement supports `WASD` and arrow keys.
5. A Local can be represented at a world position with a URL target.
6. When the PET is near a Local, the user can open its URL intent from inside the world UI.
7. Browser mode presents an in-world Browser Surface using an iframe when the destination permits framing, always provides an explicit external-tab fallback, and provides an explicit return-to-world action.
8. URL input accepts only `http:` and `https:` destinations after normalization; unsafe schemes such as `javascript:` are rejected.
9. Domain logic for movement, proximity, Local placement and URL normalization is automated-testable without WebGL or DOM dependencies.
10. CI on the mission PR executes the World tests on Node 24.
11. No production deployment occurs in this mission.
12. A reconciliation checkpoint clearly identifies the offline Electron work that remains to be inspected when the host returns.

## 4. Non-goals

This implementation cycle does not include:

- multiplayer;
- accounts/authentication;
- social-network features;
- full server persistence;
- embedding the MCF agent runtime in the 3D world;
- production deployment;
- paid API/AI dependencies;
- destructive replacement of the local Electron workspace;
- claiming arbitrary websites can always be embedded in browser mode.

## 5. Architecture

```text
                    hosted static files
                           │
                           ▼
                 ┌──────────────────┐
                 │  mcf-world-web   │
                 │ HTML/CSS/ESM     │
                 └────────┬─────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
       world-domain   three-scene   browser-surface
       pure JS        browser-only   browser adapter
             │            │            │
             └────────────┴────────────┘
                          │
                    interaction UI

Future reconciliation:
local Electron shell ──> same world-domain/navigation contract
```

### 5.1 `world-domain`

Pure JavaScript module with no DOM, WebGL, Electron or storage dependency. It owns:

- vector helpers needed by tests;
- movement direction calculation;
- proximity checks;
- Local placement ahead of the PET;
- URL normalization/validation;
- navigation intent data.

### 5.2 `three-scene`

Browser-only adapter. It imports a pinned Three.js ESM version and owns:

- scene, renderer and camera;
- grass-colored ground plane;
- atmospheric background/fog and lights;
- simple PET geometry;
- Local marker geometry;
- animation loop;
- PET transform and follow-camera updates.

The first hosted MVP uses pinned Three.js `0.180.0` from an HTTPS ESM CDN so the app remains static and does not require modification of the RSA pnpm lockfile while the local host is unavailable. A later migration may bundle the dependency after repository/runtime reconciliation.

### 5.3 `browser-surface`

Browser adapter with these states:

- `closed`;
- `embedded(url)`;
- external-tab fallback available at all times.

It never attempts to bypass CSP or `X-Frame-Options`. The UI explains that some sites block embedding. The user can always return to the 3D world by closing the surface.

### 5.4 Future Electron adapter

Electron is not implemented in this remote phase because the existing local implementation is unavailable. When the host returns, its browser controller and IPC security model are reconciled against a common navigation contract rather than rewritten blindly.

## 6. Interaction model

- `W`, `A`, `S`, `D` and arrow keys update movement intent.
- PET movement occurs on the X/Z plane.
- The camera follows from a fixed trailing offset and looks at the PET.
- At least one demonstration Local exists in front of the initial PET position.
- When within interaction radius, UI enables `Abrir Local`.
- Opening a Local pauses movement input, opens the Browser Surface overlay and keeps the world instance alive behind it.
- `Voltar ao mundo` closes the overlay and restores interaction.

## 7. URL safety contract

`normalizeHttpUrl(value)`:

- trims surrounding whitespace;
- if the value has no scheme, prefixes `https://`;
- parses with the standard `URL` constructor;
- accepts only `http:` and `https:`;
- returns canonical URL string;
- throws `TypeError` for empty, malformed or disallowed-scheme inputs.

This contract is shared by Local creation and Browser Surface opening.

## 8. Local placement contract

`createLocalAhead({ petPosition, forward, distance, url, id })`:

- normalizes the X/Z forward vector;
- rejects a zero-length forward vector;
- returns a Local at `petPosition + normalizedForward * distance`;
- preserves Y from the supplied PET position unless the caller overrides rendering elevation;
- stores the canonical HTTP(S) URL.

## 9. Browser compatibility

Primary targets:

- Windows 10 + current Chromium-family browser;
- Linux + current Chromium-family browser.

The app uses standard ESM, DOM APIs and WebGL exposed through Three.js. It does not rely on X11, Wayland, filesystem APIs, Node integration or Electron IPC.

If WebGL renderer creation fails, the page must show a readable unsupported-runtime message instead of an empty canvas.

## 10. Hosting contract

The MVP is static and provider-neutral:

```text
index.html
styles.css
src/*.js
```

Required hosting behavior:

- HTTPS in any public environment;
- static file serving;
- correct JavaScript MIME types;
- no backend required;
- no secrets in the client.

Provider selection and public production deployment are separate decisions.

## 11. Testing strategy

### Unit/domain tests

Node built-in test runner, no package dependencies:

- URL normalization and scheme rejection;
- movement vector normalization;
- Local placement ahead of the PET;
- proximity boundary behavior.

### Static contract tests

Verify the hosted files contain:

- pinned Three.js URL;
- return-to-world control;
- iframe sandbox policy;
- WebGL failure UI hook.

### CI

A dedicated PR workflow runs the World tests with Node 24 when `apps/mcf-world-web/**` or its workflow changes.

### Manual smoke (future hosted preview)

- boot scene;
- move PET;
- approach Local;
- open embedded surface;
- close surface;
- verify return to world.

Public deployment smoke is not part of this phase.

## 12. Security

- no Node/Electron privileges in browser runtime;
- iframe uses a restrictive `sandbox` and `referrerpolicy`;
- no `javascript:`/`data:` navigation;
- external-tab action uses `noopener,noreferrer`;
- no attempt to circumvent target-site frame policy;
- no credentials or secrets committed;
- dependency URL pinned to an exact Three.js version.

## 13. Repository topology

New additive paths:

```text
apps/mcf-world-web/
├── README.md
├── index.html
├── styles.css
├── src/
│   ├── world-domain.js
│   ├── three-scene.js
│   ├── browser-surface.js
│   └── main.js
└── tests/
    ├── world-domain.test.js
    └── static-contract.test.js

.github/workflows/mcf-world-web-ci.yml
```

No existing RSA application file is modified by the MVP.

## 14. Migration/reconciliation checkpoint

When the notebook returns:

1. use SentinelX to inspect the actual local repository and `git diff`;
2. capture the real uncommitted Task 6 changes;
3. run its original test suite;
4. compare its domain/navigation behavior against `apps/mcf-world-web/src/world-domain.js`;
5. extract compatible domain code or adapt interfaces without losing either lineage;
6. decide whether the Electron shell lives in this repository or a dedicated desktop repository;
7. run Windows 10 and Linux desktop packaging tests before declaring desktop parity.

## 15. Decision summary

The hosted browser app becomes the primary product path. Electron remains a secondary capability adapter. The current remote implementation is deliberately static, portable and additive so meaningful progress can continue while the original local machine is powered off.
