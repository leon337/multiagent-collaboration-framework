# WebAgent Plugin MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tested TypeScript MCP vertical slice exposing deterministic `web_search`, safe bounded `web_fetch`, and asynchronous browser-job lifecycle tools.

**Architecture:** Keep MCP tool registration thin and isolate behavior behind `SearchProvider`, `FetchProvider`, and `BrowserRuntime` contracts. All results use a shared execution envelope so evidence, timing and budget metadata are first-class from the first release.

**Tech Stack:** Node.js 22, TypeScript, `@modelcontextprotocol/sdk@1.30.0`, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-webagent-plugin-mvp-design.md`

## Global Constraints

- Node.js 22+.
- No secret, paid provider, live browser binary or external account is required for qualification.
- Browser runtime must identify itself as `deterministic-mvp`; it must not claim real browsing.
- Only HTTP/HTTPS URLs are accepted by fetch/browser inputs.
- MCP layer owns validation/presentation; provider/runtime classes own behavior.
- No merge, production deploy or public publication is part of this plan.

## Review Focus

1. URL with embedded credentials must fail closed with `INVALID_URL`.
2. Oversized fetch response must not silently consume unlimited memory; returned text is bounded and flagged truncated.
3. Unknown browser run ID must return `RUN_NOT_FOUND` semantics.
4. Cancelling a completed run must preserve its terminal `COMPLETED` state.
5. Provider failure must be converted to a stable execution envelope and never leak a stack trace through MCP tool output.

---

### Task 1: Project skeleton and execution envelope

**Files:**
- Create: `apps/webagent-mcp/package.json`
- Create: `apps/webagent-mcp/tsconfig.json`
- Create: `apps/webagent-mcp/test/execution.test.ts`
- Create: `apps/webagent-mcp/src/contracts.ts`
- Create: `apps/webagent-mcp/src/execution.ts`
- Create: `.github/workflows/webagent-mcp-qualification.yml`

**Interfaces:**
- Produces: `ExecutionEnvelope<T>`, `EvidenceItem`, `BudgetUsage`, `executeEnvelope<T>(operation, fn, options?)`.

- [ ] **Step 1: Add package/build configuration and qualification workflow** using Node 22, TypeScript, Vitest, MCP SDK 1.30.0 and Zod.
- [ ] **Step 2: Write failing execution-envelope tests** asserting timing, successful data, stable error conversion and no stack in serialized error.
- [ ] **Step 3: Push RED commit and observe GitHub Actions fail because `src/execution.ts` is missing.**
- [ ] **Step 4: Implement `contracts.ts` and minimal `executeEnvelope`** with `performance.now()` timing and `unknown` error normalization.
- [ ] **Step 5: Observe qualification green for Task 1 behavior.**

### Task 2: Search provider

**Files:**
- Create: `apps/webagent-mcp/test/search-provider.test.ts`
- Create: `apps/webagent-mcp/src/search-provider.ts`

**Interfaces:**
- Consumes: `ExecutionEnvelope<T>`, `executeEnvelope`.
- Produces: `SearchRequest`, `SearchResult`, `SearchProvider`, `LocalSearchProvider.search(request)`.

- [ ] **Step 1: Write failing tests** for trimmed queries, limit validation and deterministic empty baseline results.
- [ ] **Step 2: Observe RED.**
- [ ] **Step 3: Implement `LocalSearchProvider`** with no external dependency, returning `provider: 'local-empty'` evidence and an empty result list.
- [ ] **Step 4: Observe GREEN and full-suite pass.**

### Task 3: Safe fetch provider

**Files:**
- Create: `apps/webagent-mcp/test/fetch-provider.test.ts`
- Create: `apps/webagent-mcp/src/fetch-provider.ts`

**Interfaces:**
- Consumes: `ExecutionEnvelope<T>`, injected `fetch` compatible function.
- Produces: `FetchRequest`, `FetchData`, `FetchProvider`, `HttpFetchProvider.fetch(request)`.

- [ ] **Step 1: Write failing tests** for protocol rejection, credential rejection, normalized text, truncation and fetch failure mapping.
- [ ] **Step 2: Observe RED.**
- [ ] **Step 3: Implement URL validation and bounded body reading** with an injected fetch implementation and timeout signal.
- [ ] **Step 4: Observe GREEN and full-suite pass.**

### Task 4: Asynchronous browser runtime

**Files:**
- Create: `apps/webagent-mcp/test/browser-runtime.test.ts`
- Create: `apps/webagent-mcp/src/browser-runtime.ts`

**Interfaces:**
- Produces: `BrowserRunRequest`, `BrowserRunSnapshot`, `BrowserRuntime`, `DeterministicBrowserRuntime.start/get/cancel`.

- [ ] **Step 1: Write failing tests** for stable run IDs, async transition to completed, unknown ID, cancellation and completed-run cancellation preservation.
- [ ] **Step 2: Observe RED.**
- [ ] **Step 3: Implement deterministic in-memory runtime** using `crypto.randomUUID()` and a scheduled microtask/timer to complete jobs.
- [ ] **Step 4: Observe GREEN and full-suite pass.**

### Task 5: MCP server surface

**Files:**
- Create: `apps/webagent-mcp/src/server.ts`
- Create: `apps/webagent-mcp/test/server.test.ts`

**Interfaces:**
- Consumes: provider/runtime contracts from Tasks 2–4.
- Produces: `createWebAgentServer(deps?)` registering `web_search`, `web_fetch`, `browser_run`, `browser_wait`, `browser_cancel`.

- [ ] **Step 1: Write failing test** against server construction/tool metadata using injectable providers.
- [ ] **Step 2: Observe RED.**
- [ ] **Step 3: Implement MCP server** using `McpServer`, Zod schemas and stdio transport entrypoint guarded by direct execution.
- [ ] **Step 4: Observe GREEN, typecheck and build pass.**

### Task 6: Plugin packaging and operator documentation

**Files:**
- Create: `apps/webagent-mcp/.codex-plugin/plugin.json`
- Create: `apps/webagent-mcp/.mcp.json`
- Create: `apps/webagent-mcp/skills/webagent/SKILL.md`
- Create: `apps/webagent-mcp/README.md`

**Interfaces:**
- Consumes: built MCP stdio entrypoint.
- Produces: installable plugin package foundation and usage guidance.

- [ ] **Step 1: Add plugin manifest** pointing to `./skills/` and `./.mcp.json`.
- [ ] **Step 2: Add skill instructions** that prefer search → fetch → browser and clearly label the deterministic browser MVP limitation.
- [ ] **Step 3: Add README** documenting tools, architecture, local commands, limitations and next evolution boundaries.
- [ ] **Step 4: Run final CI qualification on exact head.**

### Task 7: Integration checkpoint

**Files:**
- Update: Issue #322
- Create: draft pull request from `mission/webagent-plugin-mvp-001` to `main`.

- [ ] **Step 1: Record exact branch HEAD and CI run/status.**
- [ ] **Step 2: Open draft PR with scope, tests, governance boundary and unresolved limitations.**
- [ ] **Step 3: Update Issue #322 with evidence and next mission boundary.**
