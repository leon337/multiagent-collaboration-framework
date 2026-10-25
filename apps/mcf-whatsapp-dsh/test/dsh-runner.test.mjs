import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { invokeDeepSeek } from '../src/dsh-runner.mjs';
const dir = dirname(fileURLToPath(import.meta.url));
const config = { command: process.execPath, preArgs: [join(dir, 'fake-dsh.mjs')], profile: 'mcf-whatsapp-dsh', cwd: dir, timeoutMs: 2000 };
test('adota id persistente fornecido pelo subprocesso headless', async () => {
  const first = await invokeDeepSeek('oi', null, config);
  assert.match(first.sessionId, /^session-/);
  assert.equal(first.answer, 'ECO:oi');
  const next = await invokeDeepSeek('continua', first.sessionId, config);
  assert.equal(next.sessionId, first.sessionId);
  assert.equal(next.answer, 'ECO:continua');
});
test('recusa invocação de ferramenta e falha de subprocesso', async () => {
  await assert.rejects(invokeDeepSeek('FAIL_TOOL', null, config), /tool_boundary_broken/);
  await assert.rejects(invokeDeepSeek('FAIL_EXIT', null, config), /dsh_failed/);
  await assert.rejects(invokeDeepSeek('FAIL_QUOTA', null, config), /dsh_quota_exhausted/);
  await assert.rejects(invokeDeepSeek('', null, config), /invalid_prompt/);
});
