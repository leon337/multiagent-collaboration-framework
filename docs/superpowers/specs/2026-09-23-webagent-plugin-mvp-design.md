# WebAgent Plugin MVP — Design

Mission: `MCF-WEBAGENT-PLUGIN-MVP-001` / Issue #322

## Intent

Create a self-contained TypeScript MCP application that proves the first usable WebAgent vertical slice inside the MCF repository. The application must expose stable web-oriented tool contracts while keeping provider/runtime details replaceable.

The MVP is not a TinyFish clone. It establishes the compatibility floor (`search + fetch + browser job lifecycle`) and the architectural seams needed for later MCF advantages: policy, evidence, replay, budget control, multi-agent/parallel execution and governed authenticated profiles.

## Scope

### In scope

- `web_search` tool contract and provider interface;
- `web_fetch` tool contract and safe bounded HTTP implementation;
- `browser_run`, `browser_wait`, `browser_cancel` tool contracts;
- deterministic asynchronous in-memory browser runtime for the MVP;
- execution envelope carrying status, evidence and budget/runtime metadata;
- MCP server over stdio for qualification and local clients;
- plugin package metadata and a workflow skill;
- unit tests, typecheck and GitHub Actions qualification.

### Out of scope

- production deployment;
- OAuth, vault and real credentials;
- persistent browser profiles;
- Playwright/Chromium worker fleet;
- paid proxies/search APIs;
- public plugin submission;
- destructive external actions.

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
                    evidence + timing
```

Provider interfaces are the primary seam. The MCP layer contains input validation and presentation only; it must not own provider logic.

## Deterministic-first rule

The MVP deliberately uses deterministic implementations. A future browser implementation may add Playwright/Stagehand/LLM fallback, but the tool contracts remain stable.

## Tool contracts

### `web_search`

Input:
- `query: string` (1..500 chars)
- `limit?: number` (1..20, default 5)

Output:
- execution envelope
- `data.results[]` with `title`, `url`, `snippet`, optional `source`

The baseline provider is deterministic and local so qualification requires no paid service or secret. It may return a clearly labeled empty result set when no external provider is configured.

### `web_fetch`

Input:
- `url: string`
- `maxBytes?: number` (default 250000, capped at 1000000)

Rules:
- only `http:` and `https:` URLs;
- reject embedded credentials;
- bounded response body;
- 10 second timeout;
- no claim of clean article extraction in this MVP; output is normalized text plus metadata.

Output data:
- `url`, `status`, `contentType`, `text`, `truncated`.

### Browser lifecycle

`browser_run` input:
- `url`
- `goal`
- optional `maxSteps` and `maxDurationMs`

`browser_run` returns immediately with `runId` and `PENDING`/`RUNNING` state.

`browser_wait` returns the current snapshot for a run.

`browser_cancel` transitions a non-terminal run to `CANCELLED`; cancellation is idempotent for an already-cancelled run and must not convert `COMPLETED` or `FAILED` into another state.

The MVP runtime does not control a real browser. It executes a deterministic simulated job adapter whose contract can later be replaced by Playwright workers. Responses must label the runtime as `deterministic-mvp` so simulation is never mistaken for external browser execution.

## Execution envelope

All provider-facing tool results use:

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

Invariant: a tool must not return `ok: true` without `data` or terminal runtime evidence appropriate to that operation.

## Error model

Stable error codes for the MVP:
- `INVALID_URL`
- `FETCH_TIMEOUT`
- `FETCH_FAILED`
- `BODY_TOO_LARGE`
- `RUN_NOT_FOUND`
- `RUN_CANCELLED`
- `INVALID_ARGUMENT`

Provider/internal errors are translated at the MCP boundary; stack traces are not returned as tool content.

## Files

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
    search-provider.test.ts
    fetch-provider.test.ts
    browser-runtime.test.ts
    execution.test.ts
  .codex-plugin/plugin.json
  .mcp.json
  skills/webagent/SKILL.md
  README.md
.github/workflows/webagent-mcp-qualification.yml
```

## Qualification

CI must execute on changes to the application or workflow:

```text
npm ci
npm run typecheck
npm test
npm run build
```

Node 22 is the baseline.

Tests require no internet service, API key, browser binary or paid account. Fetch network behavior is tested with an injected `fetch` implementation.

## Governance

- exact implementation claims require exact-SHA CI evidence;
- no merge or deploy is part of this design;
- no secret is committed;
- no real browser control is claimed by the deterministic MVP runtime;
- external providers are future adapters, not hidden dependencies.
