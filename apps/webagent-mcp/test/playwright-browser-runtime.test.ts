import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { AllowWriteBrowserActionPolicy } from '../src/browser-actions.js';
import { AllowAllEgressPolicy } from '../src/egress-policy.js';
import { PlaywrightBrowserRuntime } from '../src/browser-runtime.js';
import { OperationError } from '../src/execution.js';
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
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    if (req.url === '/second') {
      res.end('<html><head><title>Second Page</title></head><body><main>Second destination.</main></body></html>');
      return;
    }
    res.end(`
      <html>
        <head><title>Runtime Fixture</title></head>
        <body>
          <main>
            <h1>Evidence Fixture</h1>
            <label>Name <input id="name" /></label>
            <label>Role
              <select id="role">
                <option value="student">Student</option>
                <option value="architect">Architect</option>
              </select>
            </label>
            <button id="submit" type="button">Inspect</button>
            <p id="result">Playwright really opened this page.</p>
          </main>
          <script>
            document.querySelector('#submit').addEventListener('click', () => {
              const name = document.querySelector('#name').value;
              const role = document.querySelector('#role').value;
              document.querySelector('#result').textContent = name + '|' + role;
            });
          </script>
        </body>
      </html>
    `);
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/`;
}

function localResolver(): TargetResolver {
  return {
    async resolve(url) {
      return { hostname: url.hostname, address: '127.0.0.1', family: 4 };
    },
  };
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
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver: localResolver(),
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

  it('denies WRITE actions by default', async () => {
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver: localResolver(),
    });
    runtimes.push(runtime);

    const started = runtime.start({
      url: await fixtureUrl(),
      goal: 'try a write',
      actions: [{ type: 'fill', selector: '#name', value: 'Leandro' }],
    });

    const failed = await waitForTerminal(runtime, started.runId);
    expect(failed.status).toBe('FAILED');
    expect(failed.error?.code).toBe('ACTION_POLICY_DENIED');
  });

  it('executes deterministic navigate/click/fill/select/press when WRITE policy is explicitly allowed', async () => {
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver: localResolver(),
      actionPolicy: new AllowWriteBrowserActionPolicy(),
    });
    runtimes.push(runtime);

    const url = await fixtureUrl();
    const started = runtime.start({
      url,
      goal: 'complete the local interaction fixture',
      maxSteps: 10,
      actions: [
        { type: 'fill', selector: '#name', value: 'Leandro' },
        { type: 'select', selector: '#role', value: 'architect' },
        { type: 'press', selector: '#name', key: 'Tab' },
        { type: 'click', selector: '#submit' },
      ],
    });

    const completed = await waitForTerminal(runtime, started.runId);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.result?.textExcerpt).toContain('Leandro|architect');
    expect(completed.budget.consumedSteps).toBe(5);

    const timelineTypes = completed.result?.evidence.timeline.map((event) => event.type) ?? [];
    expect(timelineTypes.filter((type) => type === 'action.started')).toHaveLength(4);
    expect(timelineTypes.filter((type) => type === 'action.completed')).toHaveLength(4);

    const replayActions = completed.result?.evidence.replay.request.actions ?? [];
    expect(replayActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'fill', selector: '#name', risk: 'WRITE', value: '[REDACTED]' }),
        expect.objectContaining({ type: 'select', selector: '#role', risk: 'WRITE', value: '[REDACTED]' }),
        expect.objectContaining({ type: 'press', selector: '#name', risk: 'WRITE', key: 'Tab' }),
        expect.objectContaining({ type: 'click', selector: '#submit', risk: 'WRITE' }),
      ]),
    );
    expect(JSON.stringify(completed.result?.evidence)).not.toContain('Leandro');
    expect(JSON.stringify(completed.result?.evidence)).not.toContain('architect');
  });

  it('allows explicit READ navigation under the default policy', async () => {
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver: localResolver(),
    });
    runtimes.push(runtime);

    const base = await fixtureUrl();
    const target = new URL('/second', base).toString();
    const started = runtime.start({
      url: base,
      goal: 'navigate to the second page',
      actions: [{ type: 'navigate', url: target }],
    });

    const completed = await waitForTerminal(runtime, started.runId);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.result?.title).toBe('Second Page');
    expect(completed.result?.finalUrl).toBe(target);
    expect(completed.result?.textExcerpt).toContain('Second destination.');
  });

  it('enforces maxSteps before starting an oversized action plan', async () => {
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver: localResolver(),
      actionPolicy: new AllowWriteBrowserActionPolicy(),
    });
    runtimes.push(runtime);

    try {
      runtime.start({
        url: await fixtureUrl(),
        goal: 'exceed the action budget',
        maxSteps: 1,
        actions: [{ type: 'click', selector: '#submit' }],
      });
      throw new Error('expected STEP_BUDGET_EXCEEDED');
    } catch (error) {
      expect(error).toBeInstanceOf(OperationError);
      expect((error as OperationError).code).toBe('STEP_BUDGET_EXCEEDED');
    }
  });

  it('returns deep-cloned evidence so callers cannot mutate stored run state', async () => {
    const runtime = new PlaywrightBrowserRuntime({
      egressPolicy: new AllowAllEgressPolicy(),
      targetResolver: localResolver(),
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
