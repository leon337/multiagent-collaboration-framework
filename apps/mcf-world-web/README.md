# MCF World Web

Hosted, browser-first MVP for **MCF World 3D**.

This application is intentionally static and independent from the existing `apps/rede-social-agentes` workspace. Its first-class browser targets are **Windows 10** and **Linux**. The previous Electron/X11 implementation remains a separate local lineage until that offline workspace can be reconciled.

## Requirements

- Node.js 24 for the included local preview server and tests;
- a current Chromium-family browser with WebGL enabled;
- internet access while using the MVP, because Three.js `0.180.0` is loaded from a pinned HTTPS ESM CDN.

## Run on Windows 10

From PowerShell or Command Prompt at the repository root:

```text
node apps/mcf-world-web/serve.mjs 4173
```

Open:

```text
http://127.0.0.1:4173
```

## Run on Linux

From a terminal at the repository root:

```text
node apps/mcf-world-web/serve.mjs 4173
```

Open:

```text
http://127.0.0.1:4173
```

No X11-specific API is used by the web app.

## Controls

- `W`, `A`, `S`, `D` — move PET;
- arrow keys — move PET;
- approach the luminous ring — enable **Abrir Local**;
- **Abrir Local** — open the URL inside the Browser Surface;
- **Abrir em nova aba** — fallback for sites that block iframe embedding;
- **Voltar ao mundo** — close the Browser Surface without destroying the world instance.

## Browser security model

The Browser Surface:

- canonicalizes destinations through the shared domain module;
- allows only `http:` and `https:` URLs;
- uses an iframe sandbox;
- never attempts to bypass CSP or `X-Frame-Options`;
- opens the explicit external fallback with `noopener,noreferrer`.

Some websites will intentionally refuse to load inside the iframe. That is expected browser behavior, not a condition the app attempts to circumvent.

## Tests

```text
node --test apps/mcf-world-web/tests/*.test.js
```

The PR workflow `.github/workflows/mcf-world-web-ci.yml` runs the same suite on Node 24.

## Hosting

The product files are provider-neutral static assets:

```text
index.html
styles.css
src/*.js
```

A future public host needs HTTPS and ordinary static-file serving. Provider selection and production deployment are outside the current mission boundary.

## Electron lineage

Electron remains a future optional desktop shell for capabilities that a normal browser cannot guarantee. When the offline notebook returns, its real uncommitted Task 6 diff and 18-test local lineage must be inspected and reconciled rather than recreated from memory.
