import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { DeterministicBrowserRuntime } from '../src/browser-runtime.js';
import { LocalSearchProvider } from '../src/search-provider.js';
import { createWebAgentHttpServer } from '../src/http-server.js';

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length) await closers.pop()?.();

  it('allows explicit remote-open-world disable even on loopback', async () => {
    const previous = process.env.WEBAGENT_REMOTE_OPEN_WORLD;
    process.env.WEBAGENT_REMOTE_OPEN_WORLD = 'disabled';
    try {
      const { baseUrl } = await listenTestServer();
      const ready = await fetch(`${baseUrl}/health/ready`);
      await expect(ready.json()).resolves.toMatchObject({ openWorldEnabled: false });
    } finally {
      if (previous === undefined) delete process.env.WEBAGENT_REMOTE_OPEN_WORLD;
      else process.env.WEBAGENT_REMOTE_OPEN_WORLD = previous;
    }
  });
});

async function listenTestServer(options: { openWorldEnabled?: boolean } = {}) {
  const runtime = new DeterministicBrowserRuntime();
  const app = createWebAgentHttpServer({
    host: '127.0.0.1',
    port: 0,
    allowedHosts: ['127.0.0.1', 'localhost'],
    openWorldEnabled: options.openWorldEnabled,
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

async function postWithRawHost(url: string, host: string): Promise<number> {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });

  return new Promise<number>((resolve, reject) => {
    const req = httpRequest(
      url,
      {
        method: 'POST',
        headers: {
          Host: host,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        res.resume();
        res.once('end', () => resolve(status));
      },
    );
    req.once('error', reject);
    req.end(body);
  });
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
      openWorldEnabled: true,
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

    const status = await postWithRawHost(`${baseUrl}/mcp`, 'evil.example');

    expect(status).toBe(403);
  });

  it('can expose protocol staging while disabling anonymous open-world fetch', async () => {
    const { baseUrl } = await listenTestServer({ openWorldEnabled: false });
    const client = new Client({ name: 'webagent-restricted-http-test', version: '0.3.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)));
    closers.push(() => client.close());

    const response = await client.callTool({
      name: 'web_fetch',
      arguments: { url: 'https://example.com/' },
    });

    expect(response.isError).toBe(true);
    expect(JSON.stringify(response.content)).toContain('REMOTE_OPEN_WORLD_DISABLED');

    const ready = await fetch(`${baseUrl}/health/ready`);
    await expect(ready.json()).resolves.toMatchObject({ openWorldEnabled: false });
  });
});
