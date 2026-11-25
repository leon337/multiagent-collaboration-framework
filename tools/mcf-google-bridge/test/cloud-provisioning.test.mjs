import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  CLOUD_PROVISIONING_OPERATIONS,
  MAPS_SERVICES,
  dispatchCloudProvisioning,
} from '../src/cloud-provisioning.mjs';
import { BridgeError } from '../src/bridge.mjs';

const projectId = 'mcf-obras-logistica-v1';
const missionId = 'agente-logistica-v1';
const project = {
  projectId,
  projectNumber: '123456789',
  displayName: 'MCF Agente Logistica Obras V1',
  state: 'ACTIVE',
  labels: { mcf_managed: 'true', mcf_mission: missionId },
};
const restrictions = {
  apiTargets: [
    { service: 'geocoding-backend.googleapis.com' },
    { service: 'routes.googleapis.com' },
  ],
};
const keyString = 'AIzaSyTestOnlyMapsKeyNotARealCredential000000';

function dependencies(googleRequest) {
  return { googleRequest, BridgeError };
}

test('provisioning operations are explicit and do not include billing or IAM', () => {
  assert.deepEqual(CLOUD_PROVISIONING_OPERATIONS, [
    'google.cloud.projects.create',
    'google.cloud.services.enableMaps',
    'google.cloud.apiKeys.createMaps',
    'google.cloud.apiKeys.inspectMaps',
  ]);
  assert.equal(CLOUD_PROVISIONING_OPERATIONS.some((op) => /billing|iam|delete|deploy/u.test(op)), false);
  assert.deepEqual(MAPS_SERVICES, [
    'geocoding-backend.googleapis.com',
    'routes.googleapis.com',
    'apikeys.googleapis.com',
  ]);
});

test('project creation is idempotent and does not link billing', async () => {
  const calls = [];
  let projectReadCount = 0;
  const googleRequest = async (url, kind, init = {}) => {
    calls.push({ url, kind, init });
    if (url.endsWith('/v3/projects/mcf-obras-logistica-v1')) {
      if (init.method === 'POST') throw new Error('unexpected duplicate create');
      projectReadCount += 1;
      if (projectReadCount === 1) throw new BridgeError('GOOGLE_HTTP_404', 404);
      return project;
    }
    if (url.endsWith('/v3/projects') && init.method === 'POST') {
      const body = JSON.parse(init.body);
      assert.deepEqual(body.labels, { mcf_managed: 'true', mcf_mission: missionId });
      assert.equal('parent' in body, false);
      return { name: 'operations/project-create-1' };
    }
    if (url.endsWith('/v3/operations/project-create-1')) {
      return { done: true, response: project };
    }
    if (url.endsWith('/v3/projects/mcf-obras-logistica-v1')) return project;
    if (url.endsWith('/billingInfo')) return { projectId, billingEnabled: false, billingAccountName: '' };
    throw new Error('unexpected request ' + url);
  };
  const result = await dispatchCloudProvisioning(
    'google.cloud.projects.create',
    { projectId, missionId, displayName: project.displayName },
    dependencies(googleRequest),
  );
  assert.equal(result.status, 'SUCCEEDED');
  assert.equal(result.billingLinked, false);
  assert.equal(result.billingEnabled, false);
  assert.equal(result.projectNumber, '123456789');
  assert.equal(calls.filter((c) => c.init.method === 'POST').length, 1);
});

test('existing project is adopted only when MCF ownership labels match', async () => {
  const googleRequest = async () => ({ ...project, labels: { mcf_managed: 'true', mcf_mission: 'other-mission' } });
  await assert.rejects(
    dispatchCloudProvisioning('google.cloud.projects.create', {
      projectId, missionId, displayName: project.displayName,
    }, dependencies(googleRequest)),
    (error) => error.code === 'PROJECT_ID_CONFLICT',
  );
});

test('service enablement uses only the fixed Maps API allowlist', async () => {
  const enabled = new Set([MAPS_SERVICES[1], MAPS_SERVICES[2]]);
  const calls = [];
  const googleRequest = async (url, kind, init = {}) => {
    calls.push({ url, kind, init });
    if (url.endsWith('/v3/projects/mcf-obras-logistica-v1')) return project;
    if (url.endsWith('/billingInfo')) return { projectId, billingEnabled: false, billingAccountName: '' };
    if (url.includes('/services/') && !url.endsWith(':enable')) {
      const service = url.split('/services/')[1];
      return { state: enabled.has(service) ? 'ENABLED' : 'DISABLED' };
    }
    if (url.endsWith('/geocoding-backend.googleapis.com:enable')) {
      enabled.add('geocoding-backend.googleapis.com');
      return { name: 'operations/service-enable-1' };
    }
    if (url.endsWith('/v1/operations/service-enable-1')) return { done: true, response: {} };
    throw new Error('unexpected request ' + url);
  };
  const result = await dispatchCloudProvisioning(
    'google.cloud.services.enableMaps',
    { projectId, missionId, services: ['compute.googleapis.com'] },
    dependencies(googleRequest),
  );
  assert.equal(result.status, 'SUCCEEDED');
  assert.equal(result.billingEnabled, false);
  assert.equal(result.billingLinked, false);
  assert.deepEqual(result.services.map((x) => x.service), [...MAPS_SERVICES]);
  assert.equal(calls.some((x) => x.url.includes('compute.googleapis.com')), false);
});

test('restricted Maps key is stored only in owner-only file and never returned', async () => {
  const home = await mkdtemp(path.join(tmpdir(), 'mcf-maps-secret-'));
  const previousHome = process.env.HOME;
  process.env.HOME = home;
  const calls = [];
  const googleRequest = async (url, kind, init = {}) => {
    calls.push({ url, kind, init });
    if (url.endsWith('/v3/projects/mcf-obras-logistica-v1')) return project;
    if (url.endsWith('/billingInfo')) return { projectId, billingEnabled: false, billingAccountName: '' };
    if (url.includes('/services/')) return { state: 'ENABLED' };
    if (url.endsWith('/locations/global/keys/mcf-obras-maps-v1')) {
      if (init.method === 'POST') throw new Error('unexpected key recreation');
      throw new BridgeError('GOOGLE_HTTP_404', 404);
    }
    if (url.includes('/locations/global/keys?keyId=')) {
      const body = JSON.parse(init.body);
      assert.deepEqual(body.restrictions, restrictions);
      return { name: 'operations/key-create-1' };
    }
    if (url.endsWith('/v2/operations/key-create-1')) {
      return { done: true, response: {
        name: 'projects/123456789/locations/global/keys/mcf-obras-maps-v1',
        displayName: 'MCF Agente Logistica Obras V1 - Maps server',
        keyString,
        restrictions,
      } };
    }
    throw new Error('unexpected request ' + url);
  };
  try {
    const result = await dispatchCloudProvisioning(
      'google.cloud.apiKeys.createMaps',
      { projectId, missionId },
      dependencies(googleRequest),
    );
    assert.equal(result.status, 'SUCCEEDED');
    assert.equal(result.billingEnabled, false);
    assert.equal(result.billingLinked, false);
    assert.equal(result.projectNumber, '123456789');
    assert.equal(result.secretAlias, 'agente-logistica-obras/google_maps_api_key');
    assert.equal(result.secretFingerprint.length, 64);
    assert.equal(JSON.stringify(result).includes(keyString), false);
    const secretPath = path.join(home, '.config', 'agente-logistica-obras', 'google_maps_api_key');
    assert.equal((await readFile(secretPath, 'utf8')).trim(), keyString);
    assert.equal((await stat(secretPath)).mode & 0o077, 0);
    assert.equal(calls.some((x) => x.kind === 'cloud-write'), true);
  } finally {
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
    await rm(home, { recursive: true, force: true });
  }
});

test('key creation fails closed when an existing key has broader API restrictions', async () => {
  const googleRequest = async (url) => {
    if (url.endsWith('/v3/projects/mcf-obras-logistica-v1')) return project;
    if (url.includes('/services/')) return { state: 'ENABLED' };
    if (url.endsWith('/locations/global/keys/mcf-obras-maps-v1')) {
      return { name: 'projects/123456789/locations/global/keys/mcf-obras-maps-v1', restrictions: { apiTargets: [] } };
    }
    throw new Error('unexpected request ' + url);
  };
  await assert.rejects(
    dispatchCloudProvisioning('google.cloud.apiKeys.createMaps', { projectId, missionId }, dependencies(googleRequest)),
    (error) => error.code === 'EXISTING_KEY_RESTRICTIONS_MISMATCH',
  );
});


test('Maps API enablement is blocked when billing is enabled or linked', async () => {
  const calls = [];
  const googleRequest = async (url, kind, init = {}) => {
    calls.push({ url, kind, init });
    if (url.endsWith('/v3/projects/mcf-obras-logistica-v1')) return project;
    if (url.endsWith('/billingInfo')) {
      return {
        projectId,
        billingEnabled: true,
        billingAccountName: 'billingAccounts/000000-000000-000000',
      };
    }
    throw new Error('Maps services must not be enabled when billing is linked');
  };
  const result = await dispatchCloudProvisioning(
    'google.cloud.services.enableMaps',
    { projectId, missionId },
    dependencies(googleRequest),
  );
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.reason, 'BILLING_LINK_PRESENT');
  assert.equal(calls.some((call) => call.init.method === 'POST'), false);
});
