# WebAgent Plugin MVP Implementation Plan

Mission: `MCF-WEBAGENT-PLUGIN-MVP-001` · Issue #322

**Goal:** Deliver a tested TypeScript MCP vertical slice exposing deterministic `web_search`, safe bounded `web_fetch`, and asynchronous browser-job lifecycle tools.

**Architecture:** Keep MCP registration thin and isolate behavior behind `SearchProvider`, `FetchProvider`, and `BrowserRuntime`. All tool results use a shared execution envelope so evidence, timing, budget usage and stable errors are first-class.

**Current tech stack:** Node.js 22, TypeScript, `@modelcontextprotocol/server@2.0.0`, `@modelcontextprotocol/client@2.0.0` for protocol integration tests, Zod v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-webagent-plugin-mvp-design.md`

## Execution ruling — MCP SDK

The plan originally targeted the monolithic v1 MCP TypeScript package. During implementation, the current upstream SDK state was re-verified and the application was migrated before the MCP surface was implemented. The branch now uses the published v2 split packages. The qualification suite proves a real MCP v2 client/server handshake using `InMemoryTransport`, `listTools()`, and a tool call.

This does **not** claim that a public ChatGPT plugin has already passed Developer Mode or submission review. That requires a deployed HTTPS MCP endpoint and belongs to the next integration boundary.

## Execution ruling — plugin packaging

This mission ships the currently supported OpenAI local/self-hosted compatibility layout:

```text
.codex-plugin/plugin.json
.mcp.json
skills/webagent/SKILL.md
```

The MCP server is launched locally over stdio after the project is built. A portable root `plugin.json` + `mcp.json` package is intentionally deferred because public packaging must point to a real remote HTTPS MCP endpoint; this mission does not invent a placeholder deployment.

## Global constraints

- Node.js 22+.
- No secret, paid provider, live browser binary or external account is required for qualification.
- `browser_run` must identify its runtime as `deterministic-mvp`; it must not claim real browsing.
- Only HTTP/HTTPS URLs are accepted by fetch/browser inputs.
- MCP layer owns validation/presentation; provider/runtime classes own behavior.
- No merge, production deploy or public publication is part of this mission.
- `CLAIM <= EVIDENCE`.

## Review focus

1. Embedded URL credentials fail closed with `INVALID_URL`.
2. Fetch bodies are streamed and bounded; truncation is explicit.
3. Unknown browser run IDs produce `RUN_NOT_FOUND` semantics.
4. Cancelling a completed run preserves `COMPLETED`.
5. Provider/runtime failures are converted to stable envelopes without stack leakage.
6. Search and browser simulation are never misrepresented as live external execution.
7. Plugin package files contain no secret material.

## Task status

### Task 1 — Project skeleton and execution envelope

- [x] Add package/build configuration and qualification workflow.
- [x] Add RED execution-envelope tests.
- [x] Observe expected RED CI.
- [x] Implement contracts, typed operational errors and execution envelope.
- [x] Observe GREEN CI.

Evidence: RED `466621fd5e0c081d9dd2a3c498aa1c1caf60f0ed`; GREEN `408310935d09648ed8ee83bc73dfbaa3ab0b2aa1`.

### Task 2 — Search provider

- [x] Add RED tests for normalization and validation.
- [x] Observe expected RED CI.
- [x] Implement `LocalSearchProvider` with explicit `local-empty` evidence.
- [x] Observe GREEN CI.

Evidence: RED `6929fcc6c8cb346dd6e215d7bc2799d70cd58cae`; GREEN `635958f4c4c23704a44dfd9c90193e715eafe6c0`.

### Task 3 — Safe fetch provider

- [x] Add RED tests for protocol/credential rejection, normalized text, truncation and network errors.
- [x] Observe expected RED CI.
- [x] Implement bounded streaming HTTP/HTTPS fetch with timeout and typed errors.
- [x] Observe GREEN CI.

Evidence: RED `af06b7a143546ad00fbb9cf5bc7fbf43f70d52d3`; GREEN `2bd6c129dba228d0852658a5e9ebb4f44732de80`.

### Task 4 — Asynchronous browser runtime

- [x] Add RED tests for UUIDs, async completion, missing runs, cancellation and terminal-state preservation.
- [x] Observe expected RED CI.
- [x] Implement `DeterministicBrowserRuntime`.
- [x] Observe GREEN CI.

Evidence: RED `4f133ae7257688c80149aa9b2c5ec248fa2a12c7`; GREEN `b0d84463ae317cb25f8eb307dc4e59ad24479413`.

### Task 5 — MCP server surface

- [x] Re-verify SDK state and migrate the scaffold to MCP TypeScript v2 before implementing the surface.
- [x] Add RED protocol-level integration tests using a real MCP client and in-memory transport.
- [x] Observe expected RED CI.
- [x] Implement `web_search`, `web_fetch`, `browser_run`, `browser_wait`, `browser_cancel` on `McpServer`.
- [x] Observe GREEN typecheck, tests and build.

Evidence: migration `8d4f525fadd178b7e5e6ab61f23508e01a84f83e`; RED `c68d7aacc62487572c18690c5d9cd9259f50d987`; GREEN `12e29a61ce3c938ea82fc532b0a756cb6a75ddbc`.

### Task 6 — Plugin packaging and operator documentation

- [x] Add RED package tests.
- [x] Observe expected test failure with package files absent.
- [x] Add `.codex-plugin/plugin.json`.
- [x] Add local stdio `.mcp.json` without secrets.
- [x] Add governed `skills/webagent/SKILL.md` capability boundaries.
- [x] Add operator `README.md` with architecture, commands, limitations and next boundaries.
- [ ] Observe final GREEN qualification on exact post-documentation head.

RED evidence: `9721ce2c3ff5708d6b86006641c8f6ce0d9c15ec`, workflow run `35894381375` (typecheck success; test expected failure).

### Task 7 — Integration checkpoint

- [ ] Record exact final branch HEAD and CI run/status.
- [ ] Open draft PR from `mission/webagent-plugin-mvp-001` to `main`.
- [ ] Review the PR diff and record limitations.
- [ ] Update Issue #322 with exact evidence and next mission boundary.

## Qualification command set

The branch workflow currently runs:

```text
npm install --no-audit --no-fund
npm run typecheck
npm test
npm run build
```

`npm install` is used rather than `npm ci` because this isolated GitHub-driven mission does not yet carry a committed lockfile. Producing a deterministic lockfile is a follow-up hardening item before release packaging.

Tests require no internet service, API key, browser binary or paid account. Fetch network behavior is tested through an injected `fetch` implementation.
