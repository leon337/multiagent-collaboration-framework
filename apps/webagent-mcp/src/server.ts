import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import type { BrowserRuntime } from './browser-runtime.js';
import { createDefaultBrowserRuntime } from './browser-runtime.js';
import type { ExecutionEnvelope } from './contracts.js';
import { executeEnvelope } from './execution.js';
import type { FetchProvider } from './fetch-provider.js';
import { HttpFetchProvider } from './fetch-provider.js';
import type { SearchProvider } from './search-provider.js';
import { createDefaultSearchProvider } from './search-provider.js';

export type WebAgentDependencies = {
  searchProvider?: SearchProvider;
  fetchProvider?: FetchProvider;
  browserRuntime?: BrowserRuntime;
};

function toolResult<T>(result: ExecutionEnvelope<T>) {
  return {
    isError: !result.ok,
    content: [{ type: 'text' as const, text: JSON.stringify(result) }],
  };
}

export function createWebAgentServer(deps: WebAgentDependencies = {}): McpServer {
  const searchProvider = deps.searchProvider ?? createDefaultSearchProvider();
  const fetchProvider = deps.fetchProvider ?? new HttpFetchProvider();
  const browserRuntime = deps.browserRuntime ?? createDefaultBrowserRuntime();

  const server = new McpServer({ name: 'mcf-webagent', version: '0.2.0' });

  server.registerTool(
    'web_search',
    {
      title: 'Web Search',
      description: 'Search through the configured provider. WEBAGENT_SEARXNG_URL enables a live self-hostable SearXNG adapter; otherwise local-empty is used.',
      inputSchema: z.object({
        query: z.string().min(1).max(500),
        limit: z.number().int().min(1).max(20).optional(),
      }),
    },
    async ({ query, limit }) => toolResult(await searchProvider.search({ query, limit })),
  );

  server.registerTool(
    'web_fetch',
    {
      title: 'Web Fetch',
      description: 'Fetch bounded public HTTP/HTTPS content with redirect validation and public-egress policy enforcement.',
      inputSchema: z.object({
        url: z.string().min(1),
        maxBytes: z.number().int().min(1).max(1_000_000).optional(),
      }),
    },
    async ({ url, maxBytes }) => toolResult(await fetchProvider.fetch({ url, maxBytes })),
  );

  server.registerTool(
    'browser_run',
    {
      title: 'Browser Run',
      description: 'Start an asynchronous browser job. The default runtime is real headless Chromium through Playwright; deterministic mode remains available by configuration.',
      inputSchema: z.object({
        url: z.string().min(1),
        goal: z.string().min(1).max(2_000),
        maxSteps: z.number().int().min(1).max(500).optional(),
        maxDurationMs: z.number().int().min(1).max(900_000).optional(),
      }),
    },
    async ({ url, goal, maxSteps, maxDurationMs }) => {
      const result = await executeEnvelope(
        'browser_run',
        () => browserRuntime.start({ url, goal, maxSteps, maxDurationMs }),
        {
          evidence: [
            {
              kind: 'runtime',
              ref: `browser-runtime:${browserRuntime.kind}`,
              detail:
                browserRuntime.kind === 'playwright'
                  ? 'Real headless Chromium runtime with public-egress policy'
                  : 'Deterministic fallback runtime',
            },
          ],
          budget: { maxSteps, maxDurationMs, consumedSteps: 0 },
        },
      );
      return toolResult(result);
    },
  );

  server.registerTool(
    'browser_wait',
    {
      title: 'Browser Wait',
      description: 'Read the current state of an asynchronous browser run.',
      inputSchema: z.object({ runId: z.string().min(1) }),
    },
    async ({ runId }) =>
      toolResult(
        await executeEnvelope('browser_wait', () => browserRuntime.get(runId), {
          evidence: [{ kind: 'runtime', ref: `browser-run:${runId}` }],
        }),
      ),
  );

  server.registerTool(
    'browser_cancel',
    {
      title: 'Browser Cancel',
      description: 'Cancel a non-terminal browser run. Terminal states are preserved.',
      inputSchema: z.object({ runId: z.string().min(1) }),
    },
    async ({ runId }) =>
      toolResult(
        await executeEnvelope('browser_cancel', () => browserRuntime.cancel(runId), {
          evidence: [{ kind: 'runtime', ref: `browser-run:${runId}` }],
        }),
      ),
  );

  return server;
}

export function serveWebAgentStdio(): void {
  void serveStdio(() => createWebAgentServer());
  console.error('mcf-webagent MCP server running on stdio');
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  serveWebAgentStdio();
}
