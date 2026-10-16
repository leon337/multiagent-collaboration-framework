# Mission Trace — PHASE-MCF-WORLD-WEB-FIRST-001

## Cycle 1 — governance and discovery
- current MCF state/protocol read from main;
- remote repositories searched for MCF World / Three.js / Electron / Browser Surface markers;
- authoritative remote Task 6 source not found;
- ruling: new work must be additive.

## Cycle 2 — architecture and plan
- provider-neutral static app boundary selected;
- pure domain separated from Three.js/DOM;
- Browser Surface capability split documented;
- provider selection deferred;
- implementation plan written before production code.

## Cycle 3 — TDD domain
- RED: missing world-domain module;
- GREEN: URL/movement/Local/proximity contract.

## Cycle 4 — TDD hosted browser
- RED: missing hosted UI/source files;
- GREEN: shell, scene, Browser Surface and world loop.

## Cycle 5 — TDD portable server
- RED: missing serve.mjs;
- GREEN: portable HTTP server plus path traversal regression.

## Cycle 6 — hardening and cross-platform validation
- CI matrix expanded to Ubuntu + Windows;
- iframe sandbox tightened by removing allow-same-origin;
- final CI #14 green on both OS jobs;
- docs validation and production-readiness workflow green;
- no production deployment executed.

## Transfer
The next executable action depends on Issue #330: restore access to the offline host, inspect the real Task 6 Electron workspace/diff, preserve it, then reconcile with this web-first lineage.
