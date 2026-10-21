// Process-level regression smoke. Only synthetic files/data in an isolated temp tree.
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { encode, FrameParser } from '../host/framing.js';

const source = fileURLToPath(new URL('../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'mcf-bridge-smoke-'));
const cleanup = () => rmSync(temporary, { recursive: true, force: true });
process.once('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { cleanup(); process.exit(signal === 'SIGINT' ? 130 : 143); });
const extensionId = 'a'.repeat(32);
const origin = `chrome-extension://${extensionId}/`;
function request(action = 'hello') {
  return {
    protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-02',
    actionId: `synthetic-${action}`, action, sessionId: action === 'hello' ? null : 'synthetic-session',
    expiresAt: Date.now() + 10000,
    target: { tabId: 1, documentId: 'synthetic-document', url: 'file:///synthetic/fixtures/bridge-fixture.html', origin: 'file://' },
    budget: { maxChars: 4000, maxNodes: 2000, timeoutMs: 5000 },
  };
}
function launch(caller, input) {
  const child = spawnSync(process.execPath, [join(temporary, 'host/host.js'), caller], {
    cwd: temporary, env: { ...process.env, MCF_BRIDGE_AGENT_SOCKET_DIR: '' }, input, timeout: 5000, killSignal: 'SIGKILL', maxBuffer: 65536,
    stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
  });
  assert.ifError(child.error); // EACCES/EPERM/timeout is not a passing denial.
  assert.equal(child.signal, null, 'host must exit normally, not be killed');
  assert.ok(Number.isInteger(child.status), 'host must provide an exit status');
  return child;
}
function deniedProcess(child) {
  assert.notEqual(child.status, 0, 'denied startup must exit nonzero');
  assert.equal(child.stdout.length, 0, 'denied startup must emit no native frames');
  // Proves the actual host ran, rather than a launcher/sandbox rejecting Node.
  assert.match(child.stderr.toString('utf8'), /Bridge configuration\/caller denied\./);
}
function response(child) {
  assert.equal(child.status, 0);
  assert.equal(child.stderr.length, 0);
  const messages = [], parser = new FrameParser(value => messages.push(value));
  parser.push(child.stdout); parser.end();
  assert.equal(messages.length, 1, 'expected one complete native uint32 LE response');
  return messages[0];
}
let currentCase = 'temporary setup';
try {
  for (const dir of ['host', 'extension']) mkdirSync(join(temporary, dir));
  // Explicit allowlist: never copy a repository config, secrets or browser manifests.
  for (const file of ['package.json', 'host/host.js', 'host/framing.js', 'host/session.js', 'host/agent-broker.js', 'extension/contract.js', 'extension/agent-contract.js']) {
    copyFileSync(join(source, file), join(temporary, file));
  }
  currentCase = 'missing config';
  deniedProcess(launch(origin, encode(request())));
  console.log('PASS: missing config — nonzero exit, empty stdout, host denial');
  writeFileSync(join(temporary, 'host/config.local.json'), JSON.stringify({ extensionId }), { mode: 0o600 });
  currentCase = 'wrong origin';
  deniedProcess(launch(`chrome-extension://${'b'.repeat(32)}/`, encode(request())));
  console.log('PASS: wrong origin — nonzero exit, empty stdout, host denial');
  currentCase = 'valid hello';
  const hello = response(launch(origin, encode(request())));
  assert.equal(hello.protocolVersion, 1); assert.equal(hello.actionId, 'synthetic-hello');
  assert.equal(hello.state, 'VALIDATED'); assert.equal(hello.failureCode, null);
  assert.match(hello.sessionId, /^[A-Za-z0-9_-]{1,80}$/);
  console.log('PASS: valid native hello — VALIDATED');
  currentCase = 'attempted click';
  const click = response(launch(origin, encode(request('click'))));
  assert.equal(click.protocolVersion, 1); assert.equal(click.actionId, 'synthetic-click');
  assert.equal(click.state, 'DENIED'); assert.equal(click.failureCode, 'ACTION_POLICY_DENIED');
  assert.equal(click.retryable, false);
  console.log('PASS: attempted click — ACTION_POLICY_DENIED');
  console.log('PASS: host process smoke 4/4 (no browser E2E)');
} catch (error) {
  console.error(`FAIL: host process smoke at ${currentCase}: ${error.message}`);
  console.error('If process execution is sandbox-blocked, record NOT_RUN and run separately with authorized supervision; do not weaken sandbox protections.');
  process.exitCode = 1;
} finally {
  cleanup();
}
