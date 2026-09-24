import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function readText(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

describe('plugin package', () => {
  it('declares the supported OpenAI compatibility manifest', async () => {
    const manifest = JSON.parse(await readText('../.codex-plugin/plugin.json')) as Record<string, unknown>;

    expect(manifest).toMatchObject({
      name: 'mcf-webagent',
      version: '0.2.0',
      skills: './skills/',
      mcpServers: './.mcp.json',
    });
  });

  it('wires the local MCP server over stdio without embedding secrets', async () => {
    const config = JSON.parse(await readText('../.mcp.json')) as {
      mcpServers?: Record<string, Record<string, unknown>>;
    };
    const server = config.mcpServers?.mcf_webagent;

    expect(server).toMatchObject({
      type: 'stdio',
      command: 'node',
      args: ['./dist/src/server.js'],
      cwd: '.',
    });
    expect(JSON.stringify(config)).not.toMatch(/token|password|secret/i);
  });

  it('ships a skill that states live-runtime and security boundaries', async () => {
    const skill = await readText('../skills/webagent/SKILL.md');

    expect(skill).toContain('name: webagent');
    expect(skill).toContain('WEBAGENT_SEARXNG_URL');
    expect(skill).toContain('Playwright');
    expect(skill).toContain('DNS rebinding');
  });
});
