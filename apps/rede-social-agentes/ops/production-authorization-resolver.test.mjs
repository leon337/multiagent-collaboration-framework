/* global Response */

import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveProductionAuthorization } from './production-authorization-resolver.mjs';

const releaseSha = 'b'.repeat(40);
const otherSha = 'c'.repeat(40);
const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';

function canonicalAuthorization(targetSha = releaseSha) {
  return {
    state: 'AUTHORIZED',
    humanAuthority: 'LEANDRO',
    sourceDecision: 'MCF-DEC-031',
    targetSha,
    operationalGate: 'LEO',
    gateDecision: 'APPROVE',
    provenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION',
    authorizationId: 'auth-123',
    evidenceRef: 'mcf://event/gate-approved/123',
  };
}

test('resolver obtains authorization only from authenticated MCF control plane', async () => {
  let observed;
  const result = await resolveProductionAuthorization({
    controlPlaneUrl: 'https://mcf.example',
    runtimeToken: 'runtime-secret',
    missionId,
    phaseId,
    releaseSha,
    fetchImpl: async (input, init) => {
      observed = { input: String(input), init };
      return new Response(JSON.stringify(canonicalAuthorization()), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  assert.equal(result.state, 'AUTHORIZED');
  assert.equal(result.targetSha, releaseSha);
  assert.equal(observed.input, 'https://mcf.example/v1/mcf/production-authorization/resolve');
  assert.equal(observed.init.method, 'POST');
  assert.equal(observed.init.headers['x-mcf-runtime-token'], 'runtime-secret');
  assert.deepEqual(JSON.parse(observed.init.body), { missionId, phaseId, releaseSha });
});

test('resolver fails closed when control-plane provenance is unavailable', async () => {
  const result = await resolveProductionAuthorization({
    controlPlaneUrl: 'https://mcf.example',
    runtimeToken: 'runtime-secret',
    missionId,
    phaseId,
    releaseSha,
    fetchImpl: async () => new Response('{}', { status: 404 }),
  });

  assert.deepEqual(result, {
    state: 'BLOCKED',
    reason: 'AUTHORIZATION_PROVENANCE_UNAVAILABLE',
    targetSha: releaseSha,
  });
});

test('resolver rejects an authorization for a different SHA', async () => {
  const result = await resolveProductionAuthorization({
    controlPlaneUrl: 'https://mcf.example',
    runtimeToken: 'runtime-secret',
    missionId,
    phaseId,
    releaseSha,
    fetchImpl: async () =>
      new Response(JSON.stringify(canonicalAuthorization(otherSha)), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  });

  assert.equal(result.state, 'BLOCKED');
  assert.equal(result.reason, 'AUTHORIZED_SHA_MISMATCH');
});

test('resolver rejects authorized-looking data without canonical runtime provenance', async () => {
  const authorization = canonicalAuthorization();
  delete authorization.evidenceRef;

  const result = await resolveProductionAuthorization({
    controlPlaneUrl: 'https://mcf.example',
    runtimeToken: 'runtime-secret',
    missionId,
    phaseId,
    releaseSha,
    fetchImpl: async () =>
      new Response(JSON.stringify(authorization), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  });

  assert.equal(result.state, 'BLOCKED');
  assert.equal(result.reason, 'PRODUCTION_AUTHORIZATION_REQUIRED');
});
