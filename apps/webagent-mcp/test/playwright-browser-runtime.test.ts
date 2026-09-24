import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { AllowAllEgressPolicy } from '../src/egress-policy.js';
import { PlaywrightBrowserRuntime } from '../src/browser-runtime.js';

const runtimes: PlaywrightBrowserRuntime[] = [];
const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(runtimes.map((runtime) => runtime.dispose()));
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
  runtimes.length = 0;
  servers.length = 0;
});

async function fixtureUrl(): Promise<string> {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<html><head><title>Runtime Fixture</title></head><body><main>Playwright really opened this page.</main></body></html>');
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/`;
}

async function waitForTerminal(runtime: PlaywrightBrowserRuntime, runId: string) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const snapshot = runtime.get(runId);
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(snapshot.status)) return snapshot;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('browser run did not reach a terminal state');
}

describe('PlaywrightBrowserRuntime', () => {
  it('launches real Chromium and captures page evidence', async () => {
    const runtime = new PlaywrightBrowserRuntime({ egressPolicy: new AllowAllEgressPolicy() });
    runtimes.push(runtime);

    const started = runtime.start({ url: await fixtureUrl(), goal: 'inspect the fixture' });
    expect(started.runtime).toBe('playwright');

    const completed = await waitForTerminal(runtime, started.runId);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.result?.title).toBe('Runtime Fixture');
    expect(completed.result?.textExcerpt).toContain('Playwright really opened this page.');
    expect(completed.result?.finalUrl).toContain('127.0.0.1');
  });
});
