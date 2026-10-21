import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validAgentRead, validAgentMessage } from '../extension/agent-contract.js';
import { authorizeAgentRead, routeAgentResult } from '../host/agent-broker.js';
const now = Date.now(), token = 'a'.repeat(64);
const canonical = { missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-04', actionId: randomUUID(), missionVersion: 1 };
const request = { protocolVersion: 2, missionId: canonical.missionId, phaseId: canonical.phaseId, actionId: canonical.actionId, canonical, action: 'read-summary', token, expiresAt: now + 4000, timeoutMs: 4000 };
const grant = { token, ref: randomUUID(), expiresAt: now + 60000 };
const summary = { title: 'Synthetic', url: 'file:///[LOCAL_FIXTURE]', text: 'Fixture', truncated: false, visited: 1, untrusted: true };
const reply = { type: 'agent_read_result', protocolVersion: 2, actionId: canonical.actionId, canonical, consentRef: grant.ref, summary };
const pending = { id: canonical.actionId, canonical, deadline: now + 4000 };
test('canonical v2 strict identity, schema, expiry, replay and revoked grant', () => {
  assert.equal(validAgentRead(request, now), true);
  for (const patch of [{ missionId: 'other' }, { phaseId: 'PHASE-03' }, { actionId: randomUUID() }, { missionVersion: -1 }, { missionVersion: '1' }, { extra: true }]) {
    assert.equal(validAgentRead({ ...request, canonical: { ...canonical, ...patch } }, now), false);
  }
  const state = { grant, seen: new Set(), pending: null, now };
  assert.equal(authorizeAgentRead(request, state), true);
  assert.equal(authorizeAgentRead(request, state), false);
  assert.equal(authorizeAgentRead(request, { ...state, seen: new Set(), grant: null }), false);
  assert.equal(authorizeAgentRead(request, { ...state, seen: new Set(), now: now + 60001 }), false);
  const { action, token: ignored, timeoutMs, ...identity } = request;
  assert.equal(validAgentMessage({ ...identity, type: 'agent_read_request', consentRef: grant.ref, target: { tabId: 1, documentId: 'doc', url: 'file:///tmp/fixtures/bridge-fixture.html', origin: 'file://' }, budget: { maxChars: 4000, maxNodes: 2000, timeoutMs } }), true);
});
test('canonical result must echo pending binding; consent, timeout, STOP and duplicate fail closed', () => {
  const route = (r, patch = {}) => routeAgentResult(r, { grant, pending, now, ...patch });
  const result = route(reply);
  assert.deepEqual(result.canonical, canonical); assert.deepEqual(result.summary, summary);
  assert.equal(result.consentRef, grant.ref); assert.equal(Object.hasOwn(result, 'token'), false);
  for (const patch of [{ missionId: 'other' }, { phaseId: 'PHASE-03' }, { actionId: randomUUID() }, { missionVersion: 2 }]) assert.throws(() => route({ ...reply, canonical: { ...canonical, ...patch } }));
  assert.equal(route({ ...reply, consentRef: randomUUID() }), null);
  assert.equal(route(reply, { grant: null }), null);
  assert.equal(route(reply, { pending: null }), null);
  assert.equal(route(reply, { now: now + 5000 }).status, 'DENIED');
  const { canonical: ignored, ...unbound } = reply;
  assert.throws(() => route({ ...unbound, protocolVersion: 1 }));
});

test('stale canonical or legacy replies do not revoke an unrelated active read', () => {
  const oldActionId = randomUUID();
  const oldCanonical = { ...canonical, actionId: oldActionId };
  const delayed = { ...reply, actionId: oldActionId, canonical: oldCanonical };
  assert.equal(routeAgentResult(delayed, { grant, pending, now }), null);
  assert.equal(routeAgentResult({ type: 'agent_read_result', protocolVersion: 1, actionId: oldActionId, consentRef: grant.ref, summary }, { grant, pending, now }), null);
  assert.equal(routeAgentResult(delayed, { grant, pending: null, now }), null);
  // Still fail closed when the active actionId matches but identity is forged.
  assert.throws(() => routeAgentResult({ ...reply, canonical: { ...canonical, missionVersion: 77 } }, { grant, pending, now }), /INVALID_CANONICAL_RESULT/);
  assert.throws(() => routeAgentResult({ type: 'agent_read_result', protocolVersion: 1, actionId: canonical.actionId, consentRef: grant.ref, summary }, { grant, pending, now }), /INVALID_CANONICAL_RESULT/);
});
