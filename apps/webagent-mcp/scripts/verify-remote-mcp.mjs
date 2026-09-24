import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const baseUrl = process.argv[2]?.replace(/\/$/, '');
if (!baseUrl) throw new Error('usage: node scripts/verify-remote-mcp.mjs <https-base-url>');

const client = new Client({ name: 'webagent-access-004-proof', version: '0.4.0' });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)));

  const listed = await client.listTools();
  const expected = ['browser_cancel', 'browser_run', 'browser_wait', 'web_fetch', 'web_search'];
  assert.deepEqual(listed.tools.map((tool) => tool.name).sort(), [...expected].sort());

  const byName = new Map(listed.tools.map((tool) => [tool.name, tool]));
  assert.equal(byName.get('web_search')?.annotations?.readOnlyHint, true);
  assert.equal(byName.get('web_search')?.annotations?.openWorldHint, true);
  assert.equal(byName.get('web_fetch')?.annotations?.readOnlyHint, true);
  assert.equal(byName.get('browser_cancel')?.annotations?.idempotentHint, true);

  const search = await client.callTool({
    name: 'web_search',
    arguments: { query: 'access 004 public tunnel proof', limit: 1 },
  });
  assert.notEqual(search.isError, true);

  const fetch = await client.callTool({
    name: 'web_fetch',
    arguments: { url: 'https://example.com/' },
  });
  assert.equal(fetch.isError, true);
  assert.match(JSON.stringify(fetch.content), /REMOTE_OPEN_WORLD_DISABLED/);

  console.log(JSON.stringify({
    ok: true,
    endpoint: `${baseUrl}/mcp`,
    tools: listed.tools.map((tool) => tool.name).sort(),
    nonDestructiveCall: 'web_search',
    remoteOpenWorldBlocked: true,
  }));
} finally {
  await client.close().catch(() => undefined);
}
