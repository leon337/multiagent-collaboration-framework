/* global Response, URL, setTimeout */

import assert from 'node:assert/strict';
import test from 'node:test';

const previousSha = 'a'.repeat(40);
const releaseSha = 'b'.repeat(40);
const otherSha = 'c'.repeat(40);

function authorizationFor(targetSha = releaseSha) {
  return {
    state: 'AUTHORIZED',
    humanAuthority: 'LEANDRO',
    sourceDecision: 'MCF-DEC-031',
    targetSha,
    operationalGate: 'LEO',
    gateDecision: 'APPROVE',
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fakeRender({ failReleaseReadiness = false } = {}) {
  let currentSha = previousSha;
  let ready = true;
  const triggered = [];

  async function fetchImpl(input) {
    const url = new URL(input);
    if (url.hostname === 'runtime.example' && url.pathname === '/health/version') {
      return jsonResponse({ commitSha: currentSha });
    }
    if (url.hostname === 'runtime.example' && url.pathname === '/health/ready') {
      return jsonResponse({ status: ready ? 'ok' : 'not-ready' }, ready ? 200 : 503);
    }
    if (url.hostname === 'api.render.example' && url.pathname === '/deploy') {
      const ref = url.searchParams.get('ref');
      triggered.push(ref);
      currentSha = ref;
      ready = !(failReleaseReadiness && ref === releaseSha);
      return jsonResponse({ id: `dep-${triggered.length}` });
    }
    return jsonResponse({ code: 'NOT_FOUND' }, 404);
  }

  return {
    fetchImpl,
    triggered,
    observation: () => ({ currentSha, ready }),
  };
}

async function loadPolicy() {
  return import('./production-promotion-policy.mjs');
}

test('main update without applicable production authorization cannot move production', async () => {
  const { evaluateProductionPromotion, orchestrateProductionPromotion } = await loadPolicy();
  const decision = evaluateProductionPromotion({
    releaseSha,
    authorization: null,
  });

  assert.deepEqual(decision, {
    allowed: false,
    reason: 'PRODUCTION_AUTHORIZATION_REQUIRED',
    releaseSha,
  });

  let externalCalls = 0;
  const result = await orchestrateProductionPromotion({
    runtimeUrl: 'https://runtime.example',
    deployHookUrl: 'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha,
    authorization: null,
    fetchImpl: async () => {
      externalCalls += 1;
      throw new Error('production side effect must not be attempted');
    },
  });

  assert.deepEqual(result, {
    status: 'BLOCKED',
    reason: 'PRODUCTION_AUTHORIZATION_REQUIRED',
    releaseSha,
  });
  assert.equal(externalCalls, 0);
});

test('authorization bound to a different SHA is rejected before provider access', async () => {
  const { evaluateProductionPromotion, orchestrateProductionPromotion } = await loadPolicy();
  const authorization = authorizationFor(otherSha);
  const decision = evaluateProductionPromotion({ releaseSha, authorization });

  assert.deepEqual(decision, {
    allowed: false,
    reason: 'AUTHORIZED_SHA_MISMATCH',
    releaseSha,
  });

  let externalCalls = 0;
  const result = await orchestrateProductionPromotion({
    runtimeUrl: 'https://runtime.example',
    deployHookUrl: 'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha,
    authorization,
    fetchImpl: async () => {
      externalCalls += 1;
      throw new Error('mismatched authorization must fail closed');
    },
  });

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.reason, 'AUTHORIZED_SHA_MISMATCH');
  assert.equal(externalCalls, 0);
});

test('authorized exact-SHA promotion deploys only the authorized release and verifies it', async () => {
  const { evaluateProductionPromotion, orchestrateProductionPromotion } = await loadPolicy();
  const authorization = authorizationFor(releaseSha);
  const decision = evaluateProductionPromotion({ releaseSha, authorization });

  assert.deepEqual(decision, {
    allowed: true,
    reason: 'AUTHORIZED_EXACT_SHA',
    releaseSha,
  });

  const render = fakeRender();
  const result = await orchestrateProductionPromotion({
    runtimeUrl: 'https://runtime.example',
    deployHookUrl: 'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha,
    authorization,
    fetchImpl: render.fetchImpl,
    timeoutMs: 100,
    intervalMs: 1,
    sleepImpl: async () => {},
  });

  assert.equal(result.status, 'DEPLOYED');
  assert.equal(result.releaseSha, releaseSha);
  assert.equal(result.previousSha, previousSha);
  assert.deepEqual(render.triggered, [releaseSha]);
  assert.deepEqual(render.observation(), { currentSha: releaseSha, ready: true });
});

test('authorized promotion recovers the previous healthy SHA when post-deploy readiness fails', async () => {
  const { orchestrateProductionPromotion } = await loadPolicy();
  const render = fakeRender({ failReleaseReadiness: true });

  const result = await orchestrateProductionPromotion({
    runtimeUrl: 'https://runtime.example',
    deployHookUrl: 'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha,
    authorization: authorizationFor(releaseSha),
    fetchImpl: render.fetchImpl,
    timeoutMs: 5,
    intervalMs: 1,
    sleepImpl: async () => new Promise((resolve) => setTimeout(resolve, 2)),
  });

  assert.equal(result.status, 'RECOVERED');
  assert.equal(result.releaseSha, releaseSha);
  assert.equal(result.previousSha, previousSha);
  assert.deepEqual(render.triggered, [releaseSha, previousSha]);
  assert.deepEqual(render.observation(), { currentSha: previousSha, ready: true });
});
