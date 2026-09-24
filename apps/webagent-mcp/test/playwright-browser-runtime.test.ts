import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { AllowAllEgressPolicy } from '../src/egress-policy.js';
import { PlaywrightBrowserRuntime } from '../src/browser-runtime.js';
import type { TargetResolver } from '../src/pinned-fetch.js';

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
    res.end(
      '<html><head><title>Runtime Fixture</title></head><body><main><h1>Evidence Fixture</h1><button>Inspect</button><p>Playwright really opened this page.</p></main></body></html>',
    );
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
  it('launches real Chromium and captures bounded structured evidence + replay', async () => {
    const targetResolver: TargetResolver = {
      async resolve(url) {
        return { hostname: url.hostname, address: '127.0.0.1', family: 4 };
      },
    };
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver,
    });
    runtimes.push(runtime);

    const url = await fixtureUrl();
    const started = runtime.start({ url, goal: 'inspect the fixture' });
    expect(started.runtime).toBe('playwright');

    const completed = await waitForTerminal(runtime, started.runId);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.result?.title).toBe('Runtime Fixture');
    expect(completed.result?.textExcerpt).toContain('Playwright really opened this page.');
    expect(completed.result?.finalUrl).toContain('127.0.0.1');

    const evidence = completed.result?.evidence;
    expect(evidence?.version).toBe(1);

    expect(evidence?.screenshot?.mimeType).toBe('image/jpeg');
    expect(evidence?.screenshot?.bytes).toBeGreaterThan(0);
    expect(evidence?.screenshot?.bytes).toBeLessThanOrEqual(500_000);
    expect(Buffer.from(evidence?.screenshot?.base64 ?? '', 'base64').byteLength).toBe(
      evidence?.screenshot?.bytes,
    );

    expect(evidence?.semantic?.format).toBe('aria-snapshot');
    expect(evidence?.semantic?.content).toContain('Evidence Fixture');
    expect(evidence?.semantic?.chars).toBeLessThanOrEqual(20_000);

    expect(evidence?.timeline.length).toBeGreaterThan(3);
    expect(evidence?.timeline.map((event) => event.seq)).toEqual(
      evidence?.timeline.map((_event, index) => index + 1),
    );
    expect(evidence?.timeline.map((event) => event.type)).toContain('navigation.completed');
    expect(evidence?.timeline.map((event) => event.type)).toContain('evidence.captured');
    expect(evidence?.timeline.map((event) => event.type)).toContain('run.completed');

    expect(evidence?.navigation.some((entry) => entry.url === completed.result?.finalUrl)).toBe(true);
    expect(evidence?.network.some((entry) => entry.url === url)).toBe(true);

    expect(evidence?.replay.version).toBe(1);
    expect(evidence?.replay.request.url).toBe(url);
    expect(evidence?.replay.request.goal).toBe('inspect the fixture');
    expect(evidence?.replay.outcome.status).toBe('COMPLETED');
    expect(evidence?.replay.observedSteps.length).toBeGreaterThan(0);
  });

  it('returns deep-cloned evidence so callers cannot mutate stored run state', async () => {
    const targetResolver: TargetResolver = {
      async resolve(url) {
        return { hostname: url.hostname, address: '127.0.0.1', family: 4 };
      },
    };
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver,
    });
    runtimes.push(runtime);

    const started = runtime.start({ url: await fixtureUrl(), goal: 'capture immutable evidence' });
    const completed = await waitForTerminal(runtime, started.runId);
    expect(completed.status).toBe('COMPLETED');

    const first = runtime.get(started.runId);
    expect(first.result?.evidence?.semantic?.content).toBeTruthy();
    if (first.result?.evidence?.semantic) {
      first.result.evidence.semantic.content = 'tampered';
    }

    const second = runtime.get(started.runId);
    expect(second.result?.evidence?.semantic?.content).not.toBe('tampered');
  });
});
