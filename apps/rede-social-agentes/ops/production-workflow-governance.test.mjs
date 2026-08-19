/* global process */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-runtime-production-deploy.yml',
);

async function productionWorkflow() {
  return readFile(workflowPath, 'utf8');
}

test('production workflow has no automatic main, pull request, schedule, or workflow-run trigger', async () => {
  const workflow = await productionWorkflow();

  assert.ok(workflow.includes('name: MCF Runtime Production Deploy'));
  assert.ok(workflow.includes('workflow_dispatch:'));
  assert.ok(!workflow.includes('\n  push:'));
  assert.ok(!workflow.includes('\n  pull_request:'));
  assert.ok(!workflow.includes('\n  schedule:'));
  assert.ok(!workflow.includes('\n  workflow_run:'));
  assert.ok(workflow.includes('group: mcf-runtime-production-deploy'));
  assert.ok(workflow.includes('cancel-in-progress: false'));
});

test('production workflow keeps release SHA and delegated gate SHA independently bound', async () => {
  const workflow = await productionWorkflow();

  assert.ok(workflow.includes('release_sha:'));
  assert.ok(workflow.includes('authorization_target_sha:'));
  assert.ok(workflow.includes('required: true'));
  assert.ok(workflow.includes('RELEASE_SHA: ${{ inputs.release_sha }}'));
  assert.ok(
    workflow.includes('AUTHORIZATION_TARGET_SHA: ${{ inputs.authorization_target_sha }}'),
  );
  assert.ok(
    !workflow.includes('AUTHORIZATION_TARGET_SHA: ${{ inputs.release_sha }}'),
  );

  assert.ok(workflow.includes('AUTHORIZATION_STATE: AUTHORIZED'));
  assert.ok(workflow.includes('HUMAN_AUTHORITY: LEANDRO'));
  assert.ok(workflow.includes('AUTHORIZATION_SOURCE_DECISION: MCF-DEC-031'));
  assert.ok(workflow.includes('OPERATIONAL_GATE: LEO'));
  assert.ok(workflow.includes('GATE_DECISION: APPROVE'));
});

test('production workflow uses protected provider configuration and never accepts provider secrets as inputs', async () => {
  const workflow = await productionWorkflow();

  assert.ok(
    workflow.includes('MCF_PRODUCTION_RUNTIME_URL: ${{ secrets.MCF_PRODUCTION_RUNTIME_URL }}'),
  );
  assert.ok(
    workflow.includes(
      'RENDER_PRODUCTION_DEPLOY_HOOK_URL: ${{ secrets.RENDER_PRODUCTION_DEPLOY_HOOK_URL }}',
    ),
  );
  assert.ok(!workflow.includes('MCF_PRODUCTION_RUNTIME_URL: ${{ inputs.'));
  assert.ok(
    !workflow.includes('RENDER_PRODUCTION_DEPLOY_HOOK_URL: ${{ inputs.'),
  );
  assert.ok(workflow.includes('permissions:\n  contents: read'));
});

test('production workflow executes policy from trusted control plane against exact release checkout', async () => {
  const workflow = await productionWorkflow();

  assert.ok(workflow.includes('Checkout trusted production control plane'));
  assert.ok(workflow.includes('ref: ${{ github.workflow_sha }}'));
  assert.ok(workflow.includes('path: .mcf-control-plane'));
  assert.ok(workflow.includes('Checkout exact production release revision'));
  assert.ok(workflow.includes('ref: ${{ inputs.release_sha }}'));
  assert.ok(workflow.includes('path: .mcf-release'));
  assert.ok(
    workflow.includes(
      'run: node .mcf-control-plane/apps/rede-social-agentes/ops/production-promotion-policy.mjs',
    ),
  );
  assert.ok(
    !workflow.includes(
      'run: node .mcf-control-plane/apps/rede-social-agentes/ops/render-staging-deploy.mjs',
    ),
  );
});

test('production workflow exposes explicit blocked, deployed, noop, and recovered outcomes', async () => {
  const workflow = await productionWorkflow();

  assert.ok(workflow.includes('id: promote'));
  assert.ok(workflow.includes('Promotion result BLOCKED'));
  assert.ok(workflow.includes('Promotion result DEPLOYED'));
  assert.ok(workflow.includes('Promotion result NOOP'));
  assert.ok(workflow.includes('Promotion result RECOVERED'));
  assert.ok(workflow.includes("steps.promote.outputs.status == 'BLOCKED'"));
  assert.ok(workflow.includes("steps.promote.outputs.status == 'DEPLOYED'"));
  assert.ok(workflow.includes("steps.promote.outputs.status == 'NOOP'"));
  assert.ok(workflow.includes("steps.promote.outputs.status == 'RECOVERED'"));
});
