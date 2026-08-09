/* global process */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-runtime-staging-deploy.yml',
);
const callbackPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-runtime-staging-deploy-callback.yml',
);

function embeddedCanonicalizer(workflow) {
  const match = workflow.match(
    /cat >"\$RUNNER_TEMP\/canonicalize-runtime-origin\.py" <<'PY'\n([\s\S]*?)\n\s+PY\n/u,
  );
  assert.ok(match, 'callback workflow must embed the runtime-origin canonicalizer');

  const lines = match[1].split('\n');
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/u)?.[0].length ?? 0);
  const indent = Math.min(...indents);
  return lines.map((line) => line.slice(indent)).join('\n');
}

function canonicalizeRuntimeOrigin(script, value) {
  const result = spawnSync('python3', ['-', value], {
    input: script,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test('staging workflow exposes deterministic non-secret runtime correlation', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.ok(
    workflow.includes(
      "run-name: MCF staging deploy ${{ inputs.request_id || 'push' }} ${{ inputs.release_sha || github.sha }} ${{ inputs.mission_id || 'push' }} ${{ inputs.phase_id || 'push' }}",
    ),
  );
  assert.ok(workflow.includes('request_id:'));
  assert.ok(workflow.includes('mission_id:'));
  assert.ok(workflow.includes('phase_id:'));
  assert.ok(workflow.includes('REQUEST_ID:'));
  assert.ok(workflow.includes('id: deploy'));
  assert.ok(workflow.includes('Deployment result DEPLOYED'));
  assert.ok(workflow.includes('Deployment result NOOP'));
  assert.ok(workflow.includes('Deployment result RECOVERED'));
  assert.ok(workflow.includes('RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}'));
  assert.ok(!workflow.includes('RENDER_DEPLOY_HOOK_URL: ${{ inputs.'));
});

test('staging workflow executes the deploy protocol from its trusted control-plane revision', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.ok(workflow.includes('Checkout trusted deploy control plane'));
  assert.ok(workflow.includes('ref: ${{ github.workflow_sha }}'));
  assert.ok(workflow.includes('path: .mcf-control-plane'));
  assert.ok(workflow.includes('Checkout exact release revision'));
  assert.ok(workflow.includes('path: .mcf-release'));
  assert.ok(workflow.includes('working-directory: .mcf-release/apps/rede-social-agentes'));
  assert.ok(
    workflow.includes(
      'run: node .mcf-control-plane/apps/rede-social-agentes/ops/render-staging-deploy.mjs',
    ),
  );
  assert.ok(!workflow.includes('run: node apps/rede-social-agentes/ops/render-staging-deploy.mjs'));
});

test('staging workflow completion reconciles through a canonical stable control plane', async () => {
  const callback = await readFile(callbackPath, 'utf8');
  assert.ok(callback.includes('workflow_run:'));
  assert.ok(callback.includes('MCF Runtime Staging Deploy'));
  assert.ok(callback.includes('MCF_RUNTIME_TOKEN'));
  assert.ok(callback.includes('MCF_CONTROL_PLANE_URL: ${{ secrets.MCF_CONTROL_PLANE_URL }}'));
  assert.ok(callback.includes('MCF_STAGING_RUNTIME_URL: ${{ secrets.MCF_RUNTIME_URL }}'));
  assert.ok(callback.includes('canonicalize-runtime-origin.py'));
  assert.ok(callback.includes('ipaddress.ip_address(host)'));
  assert.ok(callback.includes('host.rstrip(".").encode("idna").decode("ascii").lower()'));
  assert.ok(callback.includes('scheme == "https" and port == 443'));
  assert.ok(
    callback.includes(
      'control_plane_url="$(python3 "$RUNNER_TEMP/canonicalize-runtime-origin.py" "$MCF_CONTROL_PLANE_URL")"',
    ),
  );
  assert.ok(
    callback.includes(
      'staging_runtime_url="$(python3 "$RUNNER_TEMP/canonicalize-runtime-origin.py" "$MCF_STAGING_RUNTIME_URL")"',
    ),
  );
  assert.ok(callback.includes('test "$control_plane_url" != "$staging_runtime_url"'));
  assert.ok(callback.includes('endpoint="${control_plane_url}/v1/mcf/callbacks/staging-deploy"'));
  assert.ok(callback.includes('--arg stagingRuntimeUrl "$staging_runtime_url"'));
  assert.ok(!callback.includes('endpoint="${staging_runtime_url}/'));
  assert.ok(!callback.includes('RENDER_DEPLOY_HOOK_URL'));
});

test('callback canonicalizer collapses equivalent runtime origins', async () => {
  const callback = await readFile(callbackPath, 'utf8');
  const script = embeddedCanonicalizer(callback);

  assert.equal(
    canonicalizeRuntimeOrigin(script, 'https://STAGING.example/'),
    canonicalizeRuntimeOrigin(script, 'https://staging.example:443'),
  );
  assert.equal(
    canonicalizeRuntimeOrigin(script, 'https://staging.example./'),
    canonicalizeRuntimeOrigin(script, 'https://staging.example'),
  );
  assert.equal(
    canonicalizeRuntimeOrigin(script, 'https://[2001:0db8:0:0:0:0:0:1]/'),
    canonicalizeRuntimeOrigin(script, 'https://[2001:db8::1]:443'),
  );
  assert.notEqual(
    canonicalizeRuntimeOrigin(script, 'http://staging.example'),
    canonicalizeRuntimeOrigin(script, 'https://staging.example'),
  );

  const invalid = spawnSync('python3', ['-', 'https://staging.example/runtime'], {
    input: script,
    encoding: 'utf8',
  });
  assert.notEqual(invalid.status, 0);
});
