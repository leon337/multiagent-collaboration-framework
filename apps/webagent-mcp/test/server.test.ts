import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it } from 'vitest';
import { createWebAgentServer } from '../src/server.js';

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length) await closers.pop()?.();
});

describe('createWebAgentServer', () => {
  it('advertises the five MVP tools over an MCP connection', async () => {
    const server = createWebAgentServer();
    const client = new Client({ name: 'webagent-test', version: '0.1.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closers.push(async () => client.close());
    closers.push(async () => server.close());

    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name).sort()).toEqual(
      ['browser_cancel', 'browser_run', 'browser_wait', 'web_fetch', 'web_search'].sort(),
    );
    const browserRun = listed.tools.find((tool) => tool.name === 'browser_run');
    expect(browserRun?.inputSchema).toHaveProperty('properties.actions');
  });

  it('executes web_search through the MCP boundary', async () => {
    const server = createWebAgentServer();
    const client = new Client({ name: 'webagent-test', version: '0.1.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closers.push(async () => client.close());
    closers.push(async () => server.close());

    const response = await client.callTool({ name: 'web_search', arguments: { query: 'mcp', limit: 2 } });
    expect(response.isError).not.toBe(true);
    expect(response.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'text', text: expect.stringContaining('"operation":"web_search"') }),
      ]),
    );
  });
});
