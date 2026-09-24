import { createServer as createHttpServer, request as httpRequest } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { AllowAllEgressPolicy } from '../src/egress-policy.js';
import { createPinnedFetch, type TargetResolver } from '../src/pinned-fetch.js';
import { PinnedEgressProxy } from '../src/pinned-proxy.js';
import { PlaywrightBrowserRuntime } from '../src/browser-runtime.js';

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length) await closers.pop()?.();
});

const loopbackResolver: TargetResolver = {
  async resolve(url) {
    return {
      hostname: url.hostname,
      address: '127.0.0.1',
      family: 4,
    };
  },
};

async function httpFixture() {
  let lastHost = '';
  const server = createHttpServer((req, res) => {
    lastHost = req.headers.host ?? '';
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<html><head><title>Pinned Fixture</title></head><body>Pinned transport works.</body></html>');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  closers.push(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address() as AddressInfo;
  return {
    port: address.port,
    host: () => lastHost,
  };
}

describe('pinned egress', () => {
  it('fetch connects to the approved IP while preserving the original Host', async () => {
    const fixture = await httpFixture();
    const pinnedFetch = createPinnedFetch(loopbackResolver);

    const response = await pinnedFetch(new URL(`http://rebind.example:${fixture.port}/proof`));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Pinned transport works.');
    expect(fixture.host()).toBe(`rebind.example:${fixture.port}`);
  });

  it('CONNECT proxy opens the socket to the approved IP instead of resolving the hostname again', async () => {
    let connected = false;
    const target = createTcpServer((socket) => {
      connected = true;
      socket.end();
    });
    await new Promise<void>((resolve) => target.listen(0, '127.0.0.1', resolve));
    closers.push(() => new Promise<void>((resolve) => target.close(() => resolve())));
    const targetPort = (target.address() as AddressInfo).port;

    const proxy = new PinnedEgressProxy({ targetResolver: loopbackResolver });
    await proxy.listen();
    closers.push(() => proxy.close());
    const proxyAddress = proxy.address() as AddressInfo;

    const status = await new Promise<number>((resolve, reject) => {
      const req = httpRequest({
        host: '127.0.0.1',
        port: proxyAddress.port,
        method: 'CONNECT',
        path: `rebind.example:${targetPort}`,
      });
      req.once('connect', (res, socket) => {
        socket.destroy();
        resolve(res.statusCode ?? 0);
      });
      req.once('error', reject);
      req.end();
    });

    expect(status).toBe(200);
    expect(connected).toBe(true);
  });

  it('routes real Chromium through the pinned proxy', async () => {
    const fixture = await httpFixture();
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver: loopbackResolver,
    });
    closers.push(() => runtime.dispose());

    const started = runtime.start({
      url: `http://rebind.example:${fixture.port}/`,
      goal: 'prove pinned browser transport',
      maxDurationMs: 15_000,
    });

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const snapshot = runtime.get(started.runId);
      if (snapshot.status === 'COMPLETED') {
        expect(snapshot.result?.title).toBe('Pinned Fixture');
        expect(snapshot.result?.textExcerpt).toContain('Pinned transport works.');
        return;
      }
      if (snapshot.status === 'FAILED' || snapshot.status === 'CANCELLED') {
        throw new Error(JSON.stringify(snapshot));
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    throw new Error('pinned browser run did not complete');
  });
});
