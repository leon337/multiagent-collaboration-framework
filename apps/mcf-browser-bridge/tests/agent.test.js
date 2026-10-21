import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import { randomUUID } from 'node:crypto';
import { createAgentBroker, privateDirectory, authorizeAgentRead, routeAgentResult } from '../host/agent-broker.js';
import { encode, FrameParser } from '../host/framing.js';
import { validAgentRead } from '../extension/agent-contract.js';
const summary = { title: 'Synthetic', url: 'file:///[LOCAL_FIXTURE]', text: 'Synthetic', truncated: false, visited: 1, untrusted: true };
function fixture() { const dir = fs.mkdtempSync('/tmp/mcf-agent-test-'); fs.chmodSync(dir, 0o700); return dir; }
const target = { tabId: 1, documentId: 'doc-1', url: 'file:///tmp/fixtures/bridge-fixture.html', origin: 'file://' };
const request = (token, overrides = {}) => ({ protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-03', actionId: randomUUID(), action: 'read-summary', token, expiresAt: Date.now() + 4000, timeoutMs: 4000, ...overrides });
function exchange(dir, r, raw = false) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection(dir + '/mcf-agent.sock'); let value = null;
    const parser = new FrameParser(r => { value = r; });
    s.setTimeout(4800, () => s.destroy());
    s.on('connect', () => s.write(raw ? r : encode(r)));
    s.on('data', b => { try { parser.push(b); } catch (e) { reject(e); s.destroy(); } });
    s.on('error', reject); s.on('close', () => resolve(value));
  });
}
test('agent schema denies arbitrary actions, writes, extra properties, expiry and budget', () => {
  const r = request('a'.repeat(64)); assert.equal(validAgentRead(r), true);
  for (const patch of [{ action: 'write' }, { action: 'eval' }, { url: 'https://example.com' }, { expiresAt: Date.now() - 1 }, { timeoutMs: 5001 }, { token: 'bad' }, { phaseId: 'PHASE-02' }]) assert.equal(validAgentRead({ ...r, ...patch }), false);
});
test('private directory and existing paths fail closed; no default socket', async () => {
  const dir = fixture();
  try {
    assert.throws(() => privateDirectory(dir + '/../' + dir.split('/').at(-1)));
    fs.symlinkSync(dir, dir + '-link'); assert.throws(() => privateDirectory(dir + '-link'));
    fs.chmodSync(dir, 0o755); assert.throws(() => privateDirectory(dir)); fs.chmodSync(dir, 0o700);
    const broker = createAgentBroker(dir, () => {});
    assert.deepEqual(fs.readdirSync(dir), []);
    fs.writeFileSync(dir + '/mcf-agent.sock', 'do not overwrite');
    await assert.rejects(broker.allow({ target, expiresAt: Date.now() + 1000 }));
    broker.revoke(); assert.equal(fs.readFileSync(dir + '/mcf-agent.sock', 'utf8'), 'do not overwrite');
  } finally { fs.rmSync(dir + '-link', { force: true }); fs.rmSync(dir, { recursive: true, force: true }); }
});
test('real Unix IPC: opt-in, forged token, replay, concurrent, malformed, result, revoke, expiry', async t => {
  const dir = fixture(); let broker, clock = Date.now(), forwarded = [], wake;
  try {
    broker = createAgentBroker(dir, r => { forwarded.push(r); wake?.(); }, () => clock);
    await assert.rejects(exchange(dir, request('a'.repeat(64))));
    let grant;
    try { grant = await broker.allow({ target, expiresAt: clock + 60000 }); }
    catch (e) { if (['EPERM','EACCES'].includes(e.code)) { t.skip('NOT_RUN: sandbox denies Unix socket listen'); return; } throw e; }
    const cap = JSON.parse(fs.readFileSync(dir + '/mcf-agent-capability.json', 'utf8'));
    assert.equal(fs.statSync(dir + '/mcf-agent.sock').mode & 0o777, 0o600);
    assert.equal(fs.statSync(dir + '/mcf-agent-capability.json').mode & 0o777, 0o600);
    assert.equal((await exchange(dir, request('b'.repeat(64)))).status, 'DENIED');
    for (const patch of [{ action: 'write' }, { extra: true }, { expiresAt: clock - 1 }]) assert.equal((await exchange(dir, request(cap.token, patch))).status, 'DENIED');
    assert.equal(await exchange(dir, Buffer.from([1, 0, 1, 0]), true), null); // oversize frame header
    assert.equal(await exchange(dir, Buffer.concat([Buffer.from([1, 0, 0, 0]), Buffer.from('{')]), true), null);
    const r = request(cap.token);
    const reached = new Promise(resolve => { wake = resolve; });
    const reading = exchange(dir, r); await reached; wake = null;
    assert.equal(forwarded.length, 1); assert.equal(forwarded[0].consentRef, grant.consentRef);
    assert.equal((await exchange(dir, request(cap.token))).status, 'DENIED');
    broker.result({ type: 'agent_read_result', protocolVersion: 1, actionId: r.actionId, consentRef: grant.consentRef, summary });
    assert.deepEqual((await reading).summary, summary);
    assert.equal((await exchange(dir, r)).status, 'DENIED');
    assert.doesNotThrow(() => broker.result({ type: 'agent_read_result', protocolVersion: 1, actionId: r.actionId, consentRef: grant.consentRef, summary }));
    const deniedRequest = request(cap.token);
    const denialReached = new Promise(resolve => { wake = resolve; });
    const deniedReading = exchange(dir, deniedRequest); await denialReached; wake = null;
    const denial = { type: 'agent_read_denied', protocolVersion: 1, actionId: deniedRequest.actionId, consentRef: grant.consentRef, failureCode: 'CONTEXT_CHANGED' };
    broker.result(denial);
    assert.equal((await deniedReading).failureCode, 'CONTEXT_CHANGED');
    assert.doesNotThrow(() => broker.result(denial));
    const timed = request(cap.token, { timeoutMs: 20 });
    assert.equal((await exchange(dir, timed)).failureCode, 'TIMEOUT');
    assert.doesNotThrow(() => broker.result({ ...denial, actionId: timed.actionId }));
    const canonical = { missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-04', actionId: randomUUID(), missionVersion: 1 };
    const canonicalRequest = request(cap.token, { protocolVersion: 2, phaseId: 'PHASE-04', actionId: canonical.actionId, canonical });
    const canonicalReached = new Promise(resolve => { wake = resolve; });
    const canonicalReading = exchange(dir, canonicalRequest); await canonicalReached; wake = null;
    assert.deepEqual(forwarded.at(-1).canonical, canonical);
    broker.result({ type: 'agent_read_result', protocolVersion: 2, canonical, actionId: canonical.actionId, consentRef: grant.consentRef, summary });
    const envelope = await canonicalReading;
    assert.deepEqual(envelope.canonical, canonical); assert.equal(envelope.consentRef, grant.consentRef);
    assert.equal((await exchange(dir, canonicalRequest)).status, 'DENIED');
    clock += 60001;
    assert.equal((await exchange(dir, request(cap.token))).status, 'DENIED');
    broker.revoke();
    assert.equal(fs.existsSync(dir + '/mcf-agent-capability.json'), false);
    await assert.rejects(exchange(dir, request(cap.token)));
  } finally { broker?.revoke(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('synthetic broker gate: absent/revoked consent, forged token, replay, concurrent and expiry', () => {
  const token = 'a'.repeat(64), now = Date.now(), seen = new Set();
  const grant = { token, expiresAt: now + 60000 };
  const check = (r, patch = {}) => authorizeAgentRead(r, { grant, seen, pending: null, now, ...patch });
  assert.equal(check(request(token), { grant: null }), false);
  assert.equal(check(request('b'.repeat(64))), false);
  const r = request(token);
  assert.equal(check(r), true); assert.equal(check(r), false);
  assert.equal(check(request(token), { pending: {} }), false);
  assert.equal(check(request(token), { now: now + 60001 }), false);
  assert.equal(check(request(token, { action: 'write' })), false);
  assert.equal(check(request(token, { code: 'arbitrary' })), false);
});

test('broker routes bounded denial; ignores stale/duplicate and timeout/revoke races', () => {
  const now = Date.now(), grant = { ref: 'ref-1', expiresAt: now + 5000 }, pending = { id: 'read-1', deadline: now + 1000 };
  const denied = { type: 'agent_read_denied', protocolVersion: 1, actionId: 'read-1', consentRef: 'ref-1', failureCode: 'CONTEXT_CHANGED' };
  const route = (r, patch = {}) => routeAgentResult(r, { grant, pending, now, ...patch });
  assert.equal(route(denied).failureCode, 'CONTEXT_CHANGED');
  assert.equal(route(denied).retryable, false);
  for (const patch of [{ pending: null }, { grant: null }, { pending: { ...pending, id: 'new-read' } }]) assert.equal(route(denied, patch), null);
  assert.equal(route({ ...denied, consentRef: 'old-ref' }), null);
  const success = { type: 'agent_read_result', protocolVersion: 1, actionId: 'read-1', consentRef: 'ref-1', summary };
  assert.equal(route(success, { now: pending.deadline }).failureCode, 'TIMEOUT');
  assert.equal(route(success, { pending: null }), null);
  assert.equal(route(success).status, 'VALIDATED');
  for (const patch of [{ failureCode: 'arbitrary secret text' }, { extra: true }, { protocolVersion: 2 }]) assert.throws(() => route({ ...denied, ...patch }));
});
