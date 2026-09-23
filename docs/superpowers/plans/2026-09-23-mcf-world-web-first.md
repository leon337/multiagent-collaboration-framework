# MCF World Web-first MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a provider-neutral hosted MCF World MVP for Windows 10 and Linux browsers while preserving the offline Electron workspace for later reconciliation.

**Architecture:** Add a standalone static app at `apps/mcf-world-web/`. Keep domain logic pure and testable in Node, use a pinned Three.js ESM CDN only in the browser adapter, and isolate URL presentation behind a browser-surface module. Do not modify the existing RSA workspace or deploy production.

**Tech Stack:** JavaScript ESM, Node 24 built-in test runner, HTML/CSS, Three.js 0.180.0 ESM, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-23-mcf-world-web-first-design.md`

## Global Constraints

- Windows 10 and Linux Chromium-family browsers are first-class targets.
- No production deployment in this mission.
- No paid API/AI dependency.
- Do not recreate or overwrite unavailable local Electron Task 6 history.
- Browser navigation accepts HTTP(S) only and never bypasses CSP/X-Frame-Options.
- MVP must remain outside `apps/rede-social-agentes` dependency/lockfile graph.
- Three.js is pinned to `0.180.0` for this static MVP.

## Review Focus

- Malicious or malformed URL input must never reach iframe/window navigation.
- Diagonal movement must not be faster than single-axis movement.
- Zero-length Local forward vectors must fail predictably rather than create NaN positions.
- Browser Surface close/reopen must not lose the 3D world state.
- WebGL initialization failure must produce a readable UI state rather than a blank page.

---

### Task 1: Establish RED domain contract and CI

**Files:**
- Create: `.github/workflows/mcf-world-web-ci.yml`
- Create: `apps/mcf-world-web/tests/world-domain.test.js`

**Interfaces:**
- Consumes: none.
- Produces: expected exports from `../src/world-domain.js`: `normalizeHttpUrl`, `movementVector`, `createLocalAhead`, `isWithinDistance`.

- [ ] **Step 1: Write the failing domain tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHttpUrl,
  movementVector,
  createLocalAhead,
  isWithinDistance,
} from '../src/world-domain.js';

test('normalizes a hostname to https', () => {
  assert.equal(normalizeHttpUrl('example.com'), 'https://example.com/');
});

test('rejects non-http URL schemes', () => {
  assert.throws(() => normalizeHttpUrl('javascript:alert(1)'), TypeError);
  assert.throws(() => normalizeHttpUrl('data:text/html,hello'), TypeError);
});

test('normalizes diagonal movement to unit length', () => {
  const result = movementVector({ forward: 1, right: 1 });
  assert.ok(Math.abs(Math.hypot(result.x, result.z) - 1) < 1e-9);
});

test('creates a Local ahead of the PET with canonical URL', () => {
  const local = createLocalAhead({
    id: 'demo',
    petPosition: { x: 2, y: 0, z: 3 },
    forward: { x: 0, z: -2 },
    distance: 5,
    url: 'example.com',
  });
  assert.deepEqual(local.position, { x: 2, y: 0, z: -2 });
  assert.equal(local.url, 'https://example.com/');
});

test('rejects zero-length Local forward vector', () => {
  assert.throws(
    () => createLocalAhead({
      id: 'bad',
      petPosition: { x: 0, y: 0, z: 0 },
      forward: { x: 0, z: 0 },
      distance: 5,
      url: 'https://example.com',
    }),
    RangeError,
  );
});

test('proximity includes the exact interaction boundary', () => {
  assert.equal(
    isWithinDistance({ x: 0, z: 0 }, { x: 3, z: 4 }, 5),
    true,
  );
});
```

- [ ] **Step 2: Add PR CI that executes the test file**

Workflow requirements:

```yaml
name: MCF World Web CI
on:
  pull_request:
    paths:
      - 'apps/mcf-world-web/**'
      - '.github/workflows/mcf-world-web-ci.yml'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: node --test apps/mcf-world-web/tests/*.test.js
```

- [ ] **Step 3: Open/update draft PR and verify RED**

Expected: CI fails because `apps/mcf-world-web/src/world-domain.js` does not exist.

- [ ] **Step 4: Record RED evidence in phase validation artifact**

Record workflow run/job identifier and missing-module failure.

---

### Task 2: Implement the pure World domain

**Files:**
- Create: `apps/mcf-world-web/src/world-domain.js`

**Interfaces:**
- Consumes: the tests from Task 1.
- Produces:
  - `normalizeHttpUrl(value: string): string`
  - `movementVector({forward,right}): {x:number,z:number}`
  - `createLocalAhead(input): {id:string,position:{x,y,z},url:string}`
  - `isWithinDistance(a,b,distance): boolean`

- [ ] **Step 1: Implement `normalizeHttpUrl` minimally**

Rules: trim, add `https://` only when no URI scheme is present, parse via `URL`, allow only `http:`/`https:`, throw `TypeError` otherwise.

- [ ] **Step 2: Implement `movementVector` minimally**

Map `right` to X and `-forward` to Z. Return zero vector for no input; otherwise normalize to length 1.

- [ ] **Step 3: Implement `createLocalAhead` minimally**

Normalize the supplied X/Z forward vector, reject zero length with `RangeError`, add normalized vector times distance to PET X/Z, preserve PET Y, canonicalize URL.

- [ ] **Step 4: Implement `isWithinDistance` minimally**

Use X/Z Euclidean distance and include equality at boundary.

- [ ] **Step 5: Run the full World domain suite**

Run: `node --test apps/mcf-world-web/tests/world-domain.test.js`
Expected: all tests pass.

---

### Task 3: Add RED static/browser contract tests

**Files:**
- Create: `apps/mcf-world-web/tests/static-contract.test.js`

**Interfaces:**
- Consumes: file layout defined by the spec.
- Produces: contract for `index.html`, `src/main.js`, `src/three-scene.js`, `src/browser-surface.js` and `styles.css`.

- [ ] **Step 1: Write failing static contract tests**

Tests read source files from disk and assert:

```js
assert.match(indexHtml, /type="importmap"/);
assert.match(indexHtml, /three@0\.180\.0/);
assert.match(indexHtml, /id="webgl-error"/);
assert.match(indexHtml, /id="browser-surface"/);
assert.match(indexHtml, /id="return-to-world"/);
assert.match(browserSurface, /sandbox/);
assert.match(browserSurface, /noopener,noreferrer/);
assert.match(mainJs, /ArrowUp/);
assert.match(mainJs, /KeyW/);
```

- [ ] **Step 2: Run static contract test and verify RED**

Run: `node --test apps/mcf-world-web/tests/static-contract.test.js`
Expected: FAIL because hosted UI files do not yet exist.

---

### Task 4: Implement hosted 3D scene and Browser Surface

**Files:**
- Create: `apps/mcf-world-web/index.html`
- Create: `apps/mcf-world-web/styles.css`
- Create: `apps/mcf-world-web/src/three-scene.js`
- Create: `apps/mcf-world-web/src/browser-surface.js`
- Create: `apps/mcf-world-web/src/main.js`

**Interfaces:**
- Consumes: `movementVector`, `isWithinDistance`, `normalizeHttpUrl` from `world-domain.js`.
- Produces:
  - `createWorldScene({canvas,onWebglError})`
  - `createBrowserSurface(elements)` with `open(url)` and `close()`.

- [ ] **Step 1: Build semantic HTML shell**

Include canvas, help/status HUD, `Abrir Local` button, hidden Browser Surface overlay, iframe, external-tab link/button, `Voltar ao mundo`, and hidden WebGL error region. Add import map pinning `three` to exact version `0.180.0` over HTTPS.

- [ ] **Step 2: Implement restrictive Browser Surface adapter**

Normalize URL before navigation. Set iframe `sandbox="allow-forms allow-scripts allow-same-origin allow-popups"` and `referrerpolicy="strict-origin-when-cross-origin"`. External open uses `window.open(url, '_blank', 'noopener,noreferrer')`. `close()` removes iframe `src` and hides overlay.

- [ ] **Step 3: Implement Three.js scene adapter**

Create renderer with antialiasing, PerspectiveCamera, scene background/fog, hemisphere + directional light, grass plane, PET group from primitive geometry, Local marker, resize handler and render API. Catch renderer creation failure and call `onWebglError`.

- [ ] **Step 4: Implement movement/camera interaction loop**

Track WASD/arrows, compute normalized movement from domain function, move PET on X/Z by `speed * deltaSeconds`, rotate toward motion, follow from trailing elevated offset, update Local proximity, and enable `Abrir Local` only inside radius.

- [ ] **Step 5: Keep world alive while Browser Surface is open**

Opening the overlay clears key state and suppresses movement, but does not dispose renderer/scene. Closing restores world UI.

- [ ] **Step 6: Run both World test files**

Run: `node --test apps/mcf-world-web/tests/*.test.js`
Expected: all tests pass.

---

### Task 5: Add portable local serving and documentation

**Files:**
- Create: `apps/mcf-world-web/README.md`
- Create: `apps/mcf-world-web/serve.mjs`
- Extend: `apps/mcf-world-web/tests/static-contract.test.js`

**Interfaces:**
- Consumes: static app files.
- Produces: `node apps/mcf-world-web/serve.mjs [port]` portable preview server.

- [ ] **Step 1: Add failing server contract test**

Start the server as a child process on an ephemeral/selected test port, fetch `/` and `/src/world-domain.js`, assert HTTP 200 and JavaScript content type for `.js`.

- [ ] **Step 2: Verify RED**

Expected: FAIL because `serve.mjs` does not exist.

- [ ] **Step 3: Implement dependency-free static server**

Use Node `http`, `fs/promises`, `path` and `url`; restrict resolved paths to the app root; map `/` to `index.html`; emit MIME types for `.html`, `.css`, `.js`; return 404 for missing files and 403 for path traversal.

- [ ] **Step 4: Document Windows 10 and Linux run commands**

README commands:

```bash
node apps/mcf-world-web/serve.mjs 4173
```

Then open `http://localhost:4173` in a modern browser.

- [ ] **Step 5: Run all World tests**

Run: `node --test apps/mcf-world-web/tests/*.test.js`
Expected: all tests pass.

---

### Task 6: Complete Class B PRF and branch verification

**Files:**
- Create/update all required files under `artifacts/phases/PHASE-MCF-WORLD-WEB-FIRST-001/`.
- Update: `artifacts/missions/MCF-WORLD-WEB-FIRST-2026-09-23/STATUS.md`.

**Interfaces:**
- Consumes: GitHub commits, PR workflow evidence, spec, plan and test outputs.
- Produces: transferable checkpoint and auditable phase package.

- [ ] **Step 1: Populate PLAN/REPORT/DECISIONS/CHECKPOINT**

Record authority boundary, selected agents, execution chronology, remote discovery, architectural rulings and offline-host blocker.

- [ ] **Step 2: Populate VALIDATION/VALIDATION-FULL/SMOKE**

Use actual CI/test evidence only. Hosted visual smoke is `NAO_APLICAVEL` until a preview/public host is available; explain why. Local Electron smoke remains `BLOCKED_BY_HOST_OFFLINE`.

- [ ] **Step 3: Generate manifest**

List SHA-256 hashes for PRF artifacts using a deterministic ordering. If hashing cannot be executed in the current tool environment, record that limitation rather than invent hashes.

- [ ] **Step 4: Verify the branch against acceptance criteria**

Use GitHub compare, PR diff and workflow status. Do not call the phase delivered if CI is not green.

- [ ] **Step 5: Audit**

Emily checks evidence vs claims, scope, security assertions and offline-host boundaries. Record findings.

- [ ] **Step 6: Léo gate**

Decide `APROVAR`, `APROVAR_COM_RESSALVAS`, `RETORNAR_PARA_CORRECAO` or `BLOQUEAR` from evidence. No production promotion is permitted.

- [ ] **Step 7: Update mission status**

If hosted MVP acceptance is met, mark this phase `ENTREGUE` while parent mission remains `AGUARDANDO_DEPENDENCIA_EXTERNA` only for desktop/Electron reconciliation. Otherwise preserve exact incomplete state.

## Self-review

- Spec coverage: all 15 design sections map to Tasks 1–6; Electron implementation is intentionally a deferred reconciliation checkpoint.
- Placeholder scan: no implementation placeholders are used; deferred items are explicit non-goals or external dependency states.
- Type/interface consistency: domain exports defined in Task 1 are implemented in Task 2 and consumed by Task 4.
- Review-focus coverage: URL abuse, diagonal speed, zero-vector Local, overlay state preservation and WebGL failure each have a test or explicit static/browser contract owner.
