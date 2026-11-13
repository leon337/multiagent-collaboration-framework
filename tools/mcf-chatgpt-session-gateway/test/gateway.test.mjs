import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ChatGPTSessionGateway, GatewayError } from '../src/gateway.mjs';

const readyAgent = { agentId: 'Sofia', pane: 'workspace', state: 'READY', handshakeVerified: true };
const discovery = (overrides = {}) => ({
  schema: 'mcf-dual-browser-runtime-discovery/v1',
  authority: { human: 'LEANDRO', orchestrator: 'MESTRE' },
  instance: { instanceId: 'notebook', paused: false, busy: false, queueDepth: 0, ...overrides.instance },
  current: {
    paneAgents: [readyAgent],
    canonicalAgents: [{ agentId: 'Sofia' }],
    agentSessions: [],
    ...overrides.current,
  },
  warnings: overrides.warnings ?? [],
});
const ok = (data, status = 200) =>
  new Response(JSON.stringify({ ok: true, ...data }), { status, headers: { 'Content-Type': 'application/json' } });
const failed = (error, status = 422) =>
  new Response(JSON.stringify({ ok: false, error }), { status });
async function fixture(fetchFn, config = {}) {
  const home = await mkdtemp(join(tmpdir(), 'mcf-chatgpt-gw-'));
  const dir = join(home, '.config/mcf-dual-browser-cockpit/instances/notebook');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'agent-bridge.json'), JSON.stringify({
    enabled: true, host: '127.0.0.1', port: 43325, token: 'fake-local-test-token',
    instanceId: 'notebook', ...config,
  }));
  const gateway = new ChatGPTSessionGateway({ home, instanceId: 'notebook', fetchFn, timeoutMs: 500 });
  return { gateway, cleanup: () => rm(home, { recursive: true, force: true }) };
}
const sequence = (...responses) => {
  const calls = [];
  let i = 0;
  return {
    calls,
    fetchFn: async (url, options) => {
      calls.push({ url, options });
      return responses[i++] ?? failed('unexpected_request', 400);
    },
  };
};
const errorCode = code => err => err instanceof GatewayError && err.code === code;

test('rejects instance path traversal before reading descriptor', () => {
  assert.throws(() => new ChatGPTSessionGateway({ instanceId: '../secrets' }), errorCode('INVALID_INSTANCE_ID'));
});

test('rejects non-loopback bridge descriptor without making any request', async t => {
  const mock = sequence();
  const f = await fixture(mock.fetchFn, { host: '0.0.0.0' });
  t.after(f.cleanup);
  await assert.rejects(f.gateway.discover(), errorCode('BRIDGE_DESCRIPTOR_INVALID'));
  assert.equal(mock.calls.length, 0);
});

test('discovery verifies expected instance and sends token only in request header', async t => {
  const mock = sequence(ok({ discovery: discovery() }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  const result = await f.gateway.discover();
  assert.equal(result.instance.instanceId, 'notebook');
  assert.equal(mock.calls.length, 1);
  assert.equal(mock.calls[0].options.headers.Authorization, 'Bearer fake-local-test-token');
  assert.ok(!JSON.stringify(result).includes('fake-local-test-token'));
});

test('rejects discovery from a different instance', async t => {
  const mock = sequence(ok({ discovery: discovery({ instance: { instanceId: 'other' } }) }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  await assert.rejects(f.gateway.discover(), errorCode('DISCOVERY_CONTRACT_MISMATCH'));
});

test('blocks dispatch on paused runtime with zero mutations', async t => {
  const mock = sequence(ok({ discovery: discovery({ instance: { paused: true } }) }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  await assert.rejects(f.gateway.dispatchPaneMission({
    agentId: 'Sofia', missionId: 'M1', objective: 'Diagnosticar.',
  }), errorCode('BRIDGE_NOT_READY'));
  assert.equal(mock.calls.filter(c => c.options.method === 'POST').length, 0);
});

test('blocks unverified agent identity without dispatch', async t => {
  const mock = sequence(ok({ discovery: discovery({ current: {
    paneAgents: [{ ...readyAgent, handshakeVerified: false }],
  } }) }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  await assert.rejects(f.gateway.dispatchPaneMission({
    agentId: 'Sofia', missionId: 'M1', objective: 'Analisar.',
  }), errorCode('AGENT_IDENTITY_UNVERIFIED'));
  assert.equal(mock.calls.length, 1);
});

test('dispatches exactly one mission and does not claim an accepted queued task completed', async t => {
  const mock = sequence(ok({ discovery: discovery() }), ok({
    queued: true, delivered: null, envelope: { envelopeId: 'e-01' }, state: 'QUEUED',
  }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  const result = await f.gateway.dispatchPaneMission({
    agentId: 'Sofia', missionId: 'M-001', objective: 'Propor arquitetura.',
  });
  assert.deepEqual({ state: result.state, completed: result.completed, deliveryVerified: result.deliveryVerified },
    { state: 'QUEUED', completed: false, deliveryVerified: false });
  assert.equal(result.envelopeId, 'e-01');
  assert.equal(mock.calls.length, 2);
  assert.equal(mock.calls[1].options.method, 'POST');
  assert.equal(JSON.parse(mock.calls[1].options.body).missionId, 'M-001');
});

test('after ambiguous POST timeout returns unknown and never retries automatically', async t => {
  const mock = sequence(ok({ discovery: discovery() }));
  const f = await fixture(async (url, options) => {
    mock.calls.push({ url, options });
    if (options.method === 'POST') throw new Error('socket lost after write');
    return ok({ discovery: discovery() });
  });
  t.after(f.cleanup);
  await assert.rejects(f.gateway.dispatchPaneMission({
    agentId: 'Sofia', missionId: 'M2', objective: 'Revisar.',
  }), e => e.code === 'MUTATION_OUTCOME_UNKNOWN' && e.uncertain === true);
  assert.equal(mock.calls.filter(c => c.options.method === 'POST').length, 1);
});

test('returns terminal success only with completed state and verified SHA-256 evidence', async t => {
  const mock = sequence(ok({ mission: { envelopeId: 'e-3', state: 'COMPLETED' } }),
    ok({ envelopeId: 'e-3', state: 'COMPLETED', result: { resultSha256: 'a'.repeat(64), text: 'Feito.' } }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  const outcome = await f.gateway.missionResult('e-3');
  assert.equal(outcome.completed, true);
  assert.equal(outcome.result.text, 'Feito.');
});

test('fails closed when completed result has no evidence hash', async t => {
  const mock = sequence(ok({ mission: { envelopeId: 'e-4', state: 'COMPLETED' } }),
    ok({ envelopeId: 'e-4', state: 'COMPLETED', result: { text: 'Sem recibo.' } }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  await assert.rejects(f.gateway.missionResult('e-4'), errorCode('RESULT_EVIDENCE_UNVERIFIED'));
});

test('does not promote an independent ChatGPT session created with unverified draft', async t => {
  const mock = sequence(ok({ discovery: discovery() }),
    ok({ session: { sessionId: 's1' } }, 201),
    ok({ discovery: discovery({ current: { agentSessions: [{
      sessionId: 's1', surfaceState: 'OPEN', deliveryVerified: false,
      stateWarning: 'open_without_conversation_evidence',
    }] } }) }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  const session = await f.gateway.openAgentSession({ agent: 'Sofia', objective: 'Analisar.' });
  assert.equal(session.state, 'UNVERIFIED');
  assert.equal(session.deliveryVerified, false);
  assert.equal(session.conversationId, null);
});

test('promotes independent session only after verified conversation evidence', async t => {
  const mock = sequence(ok({ discovery: discovery() }),
    ok({ session: { sessionId: 's2' } }, 201),
    ok({ discovery: discovery({ current: { agentSessions: [{
      sessionId: 's2', conversationId: 'conv-222', deliveryVerified: true, stateWarning: null,
    }] } }) }));
  const f = await fixture(mock.fetchFn);
  t.after(f.cleanup);
  const session = await f.gateway.openAgentSession({ agent: 'Sofia' });
  assert.equal(session.state, 'READY');
  assert.equal(session.conversationId, 'conv-222');
});
