/* global process */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-runtime-staging-deploy.yml',
);

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

test('staging workflow completion triggers authenticated runtime reconciliation', async () => {
  const callbackPath = resolve(
    process.cwd(),
    '../../.github/workflows/mcf-runtime-staging-deploy-callback.yml',
  );
  const callback = await readFile(callbackPath, 'utf8');
  assert.ok(callback.includes('workflow_run:'));
  assert.ok(callback.includes('MCF Runtime Staging Deploy'));
  assert.ok(callback.includes('MCF_RUNTIME_TOKEN'));
  assert.ok(callback.includes('/v1/mcf/callbacks/staging-deploy'));
  assert.ok(!callback.includes('RENDER_DEPLOY_HOOK_URL'));
});
