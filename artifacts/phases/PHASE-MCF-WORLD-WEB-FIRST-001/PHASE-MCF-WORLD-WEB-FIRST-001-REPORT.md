# PHASE-MCF-WORLD-WEB-FIRST-001 — Report

## Result
The host-independent web-first MVP was implemented on branch `mission/mcf-world-web-first-2026-09-23` and is represented by draft PR #343.

Latest audited head: `4761e4b9c6fa21bdb6dc25a685d5c369626b0e54`.

## Implemented
- `apps/mcf-world-web/src/world-domain.js`
  - HTTP(S)-only URL normalization
  - normalized movement vector
  - Local placement
  - distance/proximity check
- `apps/mcf-world-web/src/three-scene.js`
  - WebGL renderer
  - terrain/light/fog
  - PET
  - Local marker
  - camera/render lifecycle
  - readable WebGL initialization failure callback
- `apps/mcf-world-web/src/browser-surface.js`
  - iframe navigation through canonical URL validation
  - restrictive sandbox
  - safe external-tab opening with noopener/noreferrer
  - return-to-world flow
- `apps/mcf-world-web/src/main.js`
  - WASD/arrows
  - normalized movement
  - proximity-gated Local opening
  - keeps the 3D scene alive while the Browser Surface overlay is open
- `apps/mcf-world-web/serve.mjs`
  - dependency-free local HTTP server
  - GET/HEAD only
  - MIME types
  - root confinement/path traversal protection
- CI matrix on Ubuntu and Windows.

## TDD chronology
- CI #1: RED — `world-domain.js` missing.
- CI #2: GREEN — domain contract passed.
- CI #3: RED — hosted shell/browser files missing; 6 domain tests still green.
- CI #8: GREEN — hosted shell/browser contract green.
- CI #9: RED — `serve.mjs` missing; prior 10 tests remained green.
- CI #11: GREEN — 12 tests passed after portable server implementation.
- CI #14: final audited GREEN on Ubuntu and Windows.

## Security hardening
Latest head includes commit message `fix: tighten Browser Surface iframe sandbox`.
The iframe sandbox is `allow-forms allow-scripts allow-popups` and intentionally omits `allow-same-origin`.
All iframe/window targets are normalized through the HTTP(S)-only domain function.
External tab opening uses `noopener,noreferrer`.
The local HTTP server confines resolved paths to the app root and has a traversal regression test.

## Remote discovery
No authoritative versioned copy of the earlier local MCF World 3D / Electron Task 6 implementation was found in accessible GitHub repositories. The new web app therefore uses additive paths and does not claim to replace that offline state.

## Git state at audit
- PR: #343, open draft
- PR mergeable: true
- Compare against current main: diverged, 33 commits ahead, 2 behind
- Changed files: 30
- No production deployment performed

## Remaining external dependency
Issue #330 remains blocked until the offline host returns so the real local Electron Task 6 diff can be inspected and reconciled without fabrication.
