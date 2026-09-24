import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it } from 'vitest';
import { DeterministicBrowserRuntime } from '../src/browser-runtime.js';
import { LocalSearchProvider } from '../src/search-provider.js';
import { createWebAgentServer } from '../src/server.js';

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length) await closers.pop()?.();
});

describe('OpenAI tool annotations', () => {
  it('advertises accurate read-only/open-world/destructive hints', async () => {
    const server = createWebAgentServer({
      searchProvider: new LocalSearchProvider(),
      browserRuntime: new DeterministicBrowserRuntime(),
    });
    const client = new Client({ name: 'annotation-test', version: '0.3.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closers.push(() => client.close());
    closers.push(() => server.close());

    const listed = await client.listTools();
    const byName = Object.fromEntries(listed.tools.map((tool) => [tool.name, tool.annotations]));

    expect(byName.web_search).toMatchObject({
      readOnlyHint: true,
      openWorldHint: true,
      destructiveHint: false,
    });
    expect(byName.web_fetch).toMatchObject({
      readOnlyHint: true,
      openWorldHint: true,
      destructiveHint: false,
    });
    expect(byName.browser_run).toMatchObject({
      readOnlyHint: false,
      openWorldHint: true,
      destructiveHint: false,
    });
    expect(byName.browser_wait).toMatchObject({
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    });
    expect(byName.browser_cancel).toMatchObject({
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    });
  });
});
