/* global Response, setTimeout, URL */

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  appendGitHubOutputs,
  deploymentHookForCommit,
  orchestrateStagingDeployment,
} from './render-staging-deploy.mjs';

const previousSha = 'a'.repeat(40);
const releaseSha = 'b'.repeat(40);

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

test('adds an immutable commit ref without removing the hook key', () => {
  const url = deploymentHookForCommit(
    'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha,
  );

  assert.equal(url.searchParams.get('key'), 'secret-hook-value');
  assert.equal(url.searchParams.get('ref'), releaseSha);
});

test('rejects a deploy hook that does not use HTTPS', () => {
  assert.throws(
    () => deploymentHookForCommit('http://api.render.example/deploy?key=secret', releaseSha),
    /must use HTTPS/u,
  );
});

test('deploys and verifies the exact release commit', async () => {
  const render = fakeRender();
  const result = await orchestrateStagingDeployment({
    runtimeUrl: 'https://runtime.example',
    deployHookUrl: 'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha,
    fetchImpl: render.fetchImpl,
    timeoutMs: 100,
    intervalMs: 1,
    sleepImpl: async () => {},
  });

  assert.deepEqual(result, {
    status: 'DEPLOYED',
    releaseSha,
    previousSha,
    deployId: 'dep-1',
    rollbackDeployId: null,
  });
  assert.deepEqual(render.triggered, [releaseSha]);
  assert.deepEqual(render.observation(), { currentSha: releaseSha, ready: true });
});

test('returns NOOP when the requested release is already live', async () => {
  const render = fakeRender();
  const result = await orchestrateStagingDeployment({
    runtimeUrl: 'https://runtime.example',
    deployHookUrl: 'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha: previousSha,
    fetchImpl: render.fetchImpl,
  });

  assert.equal(result.status, 'NOOP');
  assert.deepEqual(render.triggered, []);
});

test('recovers the previous commit after a failed post-deploy readiness check', async () => {
  const render = fakeRender({ failReleaseReadiness: true });
  const result = await orchestrateStagingDeployment({
    runtimeUrl: 'https://runtime.example',
    deployHookUrl: 'https://api.render.example/deploy?key=secret-hook-value',
    releaseSha,
    fetchImpl: render.fetchImpl,
    timeoutMs: 5,
    intervalMs: 1,
    sleepImpl: async () => new Promise((resolve) => setTimeout(resolve, 2)),
  });

  assert.equal(result.status, 'RECOVERED');
  assert.equal(result.releaseSha, releaseSha);
  assert.equal(result.previousSha, previousSha);
  assert.equal(result.deployId, 'dep-1');
  assert.equal(result.rollbackDeployId, 'dep-2');
  assert.match(result.failure, /did not converge/u);
  assert.deepEqual(render.triggered, [releaseSha, previousSha]);
  assert.deepEqual(render.observation(), { currentSha: previousSha, ready: true });
});

test('writes only non-secret deterministic GitHub outputs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mcf-staging-output-'));
  const outputPath = join(directory, 'github-output.txt');
  try {
    appendGitHubOutputs(
      {
        status: 'DEPLOYED',
        releaseSha,
        previousSha,
        deployId: 'secret-provider-id-not-exported',
        rollbackDeployId: null,
      },
      outputPath,
    );

    assert.equal(
      await readFile(outputPath, 'utf8'),
      `status=DEPLOYED\nrelease_sha=${releaseSha}\nprevious_sha=${previousSha}\n`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
