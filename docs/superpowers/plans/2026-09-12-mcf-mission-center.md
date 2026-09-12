# MCF Mission Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a read-only Mission Center web app that automatically reflects the Gama Fund mission state from a validated machine-readable projection.

**Architecture:** A standalone Node service serves static HTML/CSS/JS and a same-origin `/api/status` endpoint. The endpoint fetches a configured public mission projection, validates it, caches the last valid snapshot and marks stale fallback explicitly. The browser polls every 15 seconds and never receives service credentials.

**Tech Stack:** Node 24, TypeScript 6, Vitest 4, browser HTML/CSS/JavaScript.

**Spec:** `docs/superpowers/specs/2026-09-12-mcf-mission-center-design.md`

## Global Constraints
- Bind `127.0.0.1` by default.
- Read-only MVP; no HUMAN_GATE mutation controls.
- `CLAIM <= EVIDENCE`.
- `NO_EVIDENCE = NOT_EXECUTED`.
- No secrets in browser payloads.
- No external dependency is required for status validation or HTTP serving.

---

### Task 1: Mission status contract and projection
**Files:** create `apps/mission-center/src/status.ts`, `apps/mission-center/src/status.test.ts`, and `artifacts/missions/MCF-GAMA-FUND-2026-001/mission-status.json`.
- [ ] Write failing tests for valid projection, missing evidence shape and malformed stages.
- [ ] Verify RED.
- [ ] Implement minimal runtime validation.
- [ ] Verify GREEN.
- [ ] Create current G3 mission projection.

### Task 2: Status source with last-known-good cache
**Files:** create `apps/mission-center/src/status-source.ts` and tests.
- [ ] Write failing tests for fresh fetch, TTL cache, invalid upstream and stale fallback.
- [ ] Verify RED.
- [ ] Implement source and cache.
- [ ] Verify GREEN.

### Task 3: HTTP server and browser UI
**Files:** create `apps/mission-center/src/server.ts`, `apps/mission-center/public/index.html`, `public/app.js`, `public/styles.css`, package and tsconfig files.
- [ ] Write failing server tests for localhost defaults and `/api/status` JSON.
- [ ] Verify RED.
- [ ] Implement minimal server.
- [ ] Verify GREEN.
- [ ] Implement dashboard rendering and 15-second polling.

### Task 4: Verification and VPS handoff
- [ ] Run mission-center typecheck/tests/build.
- [ ] Run local smoke request against `/api/status` using a fixture projection.
- [ ] Commit evidence.
- [ ] Deploy behind VPS private networking when shell access is available.
- [ ] Verify live URL, auto-refresh and no-secret browser payload.
