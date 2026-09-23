# WebAgent Plugin MVP — Design

Mission: `MCF-WEBAGENT-PLUGIN-MVP-001` / Issue #322

## Intent

Create a self-contained TypeScript MCP application that proves the first usable WebAgent vertical slice inside the MCF repository. The MVP is not a TinyFish clone: it establishes the compatibility floor (`search + fetch + asynchronous browser-job lifecycle`) and stable seams for later policy, evidence, replay, budgets, parallel execution, profiles, vaults and MCF multi-agent coordination.

## Scope

### In scope

- `web_search` provider contract and deterministic baseline provider;
- `web_fetch` safe bounded HTTP implementation;
- `browser_run`, `browser_wait`, `browser_cancel` contracts;
- deterministic asynchronous in-memory browser runtime;
- execution envelopes with evidence, timing, budgets and stable errors;
- MCP v2 server over stdio for local/self-hosted qualification;
- OpenAI compatibility plugin manifest, stdio MCP wiring and workflow skill;
- unit/integration tests, typecheck, build and GitHub Actions qualification.

### Out of scope

- real search provider;
- real Playwright/Chromium execution;
- production or public HTTPS deployment;
- OAuth, vault and real credentials;
- persistent browser profiles;
- paid proxies/providers;
- public plugin submission;
- destructive external actions;
- merge to `main` as part of this mission.

## Architecture

```text
MCP client
   |
   v
McpServer
   |
   +-- web_search ----> SearchProvider
   |
   +-- web_fetch -----> FetchProvider
   |
   +-- browser_run ---> BrowserRuntime
   |                      |
   +-- browser_wait ------+
   +-- browser_cancel ----+
                          |
                          v
                    ExecutionEnvelope
                    evidence + timing + budget
```

Provider interfaces are the primary seam. The MCP layer validates/presents tool calls; it does not own provider/runtime behavior.

## Deterministic-first rule

Use deterministic mechanisms before agentic mechanisms. A future browser implementation may add Playwright, visual understanding, Stagehand or LLM fallback behind `BrowserRuntime`, while the five public MCP tool names remain stable.

## Tool contracts

### `web_search`

Input:
- `query: string` (1..500 chars)
- `limit?: number` (1..20, default 5)

Output:
- execution envelope;
- `data.query`;
- `data.results[]` with `title`, `url`, `snippet`, optional `source`.

The baseline provider is `local-empty`. It validates the contract and returns a clearly labeled empty result set. It must never be described as a live external search.

### `web_fetch`

Input:
- `url: string`;
- `maxBytes?: number` (default 250000, cap 1000000).

Rules:
- only `http:` and `https:` URLs;
- reject embedded credentials;
- stream and bound response bodies;
- 10-second timeout;
- return UTF-8 normalized text plus metadata;
- no claim of article extraction/crawling in this MVP.

Output data:
- `url`, `status`, `contentType`, `text`, `truncated`.

### Browser lifecycle

`browser_run` input:
- `url`;
- `goal`;
- optional `maxSteps` and `maxDurationMs`.

It returns immediately with a UUID and `PENDING` snapshot. The deterministic runtime later transitions the run to `COMPLETED`, unless it is cancelled first.

`browser_wait` returns the current snapshot.

`browser_cancel` transitions a non-terminal run to `CANCELLED`. Terminal states are preserved.

The runtime is labeled `deterministic-mvp`. It does **not** launch or operate a real browser; its result explicitly says completion occurred without live browser execution.

## Execution envelope

```ts
type ExecutionEnvelope<T> = {
  ok: boolean;
  operation: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  evidence: Array<{
    kind: 'source' | 'request' | 'runtime';
    ref: string;
    detail?: string;
  }>;
  budget: {
    maxSteps?: number;
    maxDurationMs?: number;
    consumedSteps?: number;
  };
  data?: T;
  error?: { code: string; message: string };
};
```

Stack traces are not emitted in tool results.

## Stable error semantics

- `INVALID_URL`
- `INVALID_ARGUMENT`
- `FETCH_TIMEOUT`
- `FETCH_FAILED`
- `RUN_NOT_FOUND`
- fallback `OPERATION_FAILED`

Fetch oversize is represented by bounded output plus `truncated: true`; cancellation is represented by the `CANCELLED` run state rather than an error code.

## MCP SDK decision

The executed implementation uses the published MCP TypeScript v2 split packages:

- `@modelcontextprotocol/server@2.0.0`;
- `@modelcontextprotocol/client@2.0.0` in protocol integration tests.

The test suite creates a real in-memory MCP connection, calls `listTools()`, and invokes `web_search` through the protocol boundary.

This proves the local MCP v2 contract. It does not prove a public ChatGPT deployment until a remote HTTPS MCP endpoint is deployed and tested in the current OpenAI integration surface.

## Package boundary

Current local/self-hosted package:

```text
apps/webagent-mcp/
  package.json
  tsconfig.json
  src/
    contracts.ts
    execution.ts
    search-provider.ts
    fetch-provider.ts
    browser-runtime.ts
    server.ts
  test/
    execution.test.ts
    search-provider.test.ts
    fetch-provider.test.ts
    browser-runtime.test.ts
    server.test.ts
    plugin-package.test.ts
  .codex-plugin/plugin.json
  .mcp.json
  skills/webagent/SKILL.md
  README.md
.github/workflows/webagent-mcp-qualification.yml
```

A portable root `plugin.json` + `mcp.json` package is deferred until the server has a real remote HTTPS endpoint. No placeholder public URL is permitted.

## Qualification

GitHub Actions runs on Node 22:

```text
npm install --no-audit --no-fund
npm run typecheck
npm test
npm run build
```

`npm install` is used for this mission because a deterministic lockfile has not yet been generated/committed. Lockfile hardening is required before a release candidate.

Tests require no internet service, API key, live browser binary or paid account. Fetch network behavior is tested with an injected `fetch` implementation.

## Governance

- exact implementation claims require exact-SHA CI evidence;
- no merge/deploy/publication is implied by a green branch;
- no secret is committed;
- no live search is claimed by `local-empty`;
- no real browser control is claimed by `deterministic-mvp`;
- external providers and live workers are future adapters, not hidden dependencies;
- `CLAIM <= EVIDENCE`.
