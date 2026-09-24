import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { DeterministicBrowserRuntime } from '../src/browser-runtime.js';
import { LocalSearchProvider } from '../src/search-provider.js';
import { createWebAgentHttpServer } from '../src/http-server.js';

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length) await closers.pop()?.();
});

async function listenTestServer() {
  const runtime = new DeterministicBrowserRuntime();
  const app = createWebAgentHttpServer({
    host: '127.0.0.1',
    port: 0,
    allowedHosts: ['127.0.0.1', 'localhost'],
    dependencies: {
      searchProvider: new LocalSearchProvider(),
      browserRuntime: runtime,
    },
  });
  await app.listen();
  closers.push(() => app.close());

  const address = app.address() as AddressInfo;
  return { app, baseUrl: `http://127.0.0.1:${address.port}` };
}

describe('WebAgent Streamable HTTP server', () => {
  it('serves readiness and 404s unknown paths', async () => {
    const { baseUrl } = await listenTestServer();

    const ready = await fetch(`${baseUrl}/health/ready`);
    expect(ready.status).toBe(200);
    await expect(ready.json()).resolves.toMatchObject({
      status: 'ok',
      service: 'mcf-webagent',
      transport: 'streamable-http',
    });

    const missing = await fetch(`${baseUrl}/nope`);
    expect(missing.status).toBe(404);
  });

  it('connects over Streamable HTTP and invokes an MCP tool', async () => {
    const { baseUrl } = await listenTestServer();
    const client = new Client({ name: 'webagent-http-test', version: '0.3.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)));
    closers.push(() => client.close());

    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name).sort()).toEqual(
      ['browser_cancel', 'browser_run', 'browser_wait', 'web_fetch', 'web_search'].sort(),
    );

    const response = await client.callTool({
      name: 'web_search',
      arguments: { query: 'streamable http', limit: 2 },
    });
    expect(response.isError).not.toBe(true);
  });

  it('rejects an unapproved Host header before MCP handling', async () => {
    const { baseUrl } = await listenTestServer();

    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        host: 'evil.example',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    });

    expect(response.status).toBe(403);
  });
});
