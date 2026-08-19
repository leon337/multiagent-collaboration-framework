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

function includes(workflow, expected) {
  assert.equal(workflow.includes(expected), true);
}

function excludes(workflow, unexpected) {
  assert.equal(workflow.includes(unexpected), false);
}

test(
  'production workflow has no automatic main, pull request, schedule, or workflow-run trigger',
  async () => {
    const workflow = await productionWorkflow();
    includes(workflow, 'name: MCF Runtime Production Deploy');
    includes(workflow, 'workflow_dispatch:');
    excludes(workflow, '\n  push:');
    excludes(workflow, '\n  pull_request:');
    excludes(workflow, '\n  schedule:');
    excludes(workflow, '\n  workflow_run:');
    includes(workflow, 'group: mcf-runtime-production-deploy');
    includes(workflow, 'cancel-in-progress: false');
  },
);

test(
  'dispatch supplies locators only and cannot manufacture production authorization',
  async () => {
    const workflow = await productionWorkflow();
    includes(workflow, 'release_sha:');
    includes(workflow, 'mission_id:');
    includes(workflow, 'phase_id:');
    excludes(workflow, 'authorization_target_sha:');
    excludes(workflow, 'AUTHORIZATION_STATE: AUTHORIZED');
    excludes(workflow, 'HUMAN_AUTHORITY: LEANDRO');
    excludes(workflow, 'AUTHORIZATION_SOURCE_DECISION: MCF-DEC-031');
    excludes(workflow, 'OPERATIONAL_GATE: LEO');
    excludes(workflow, 'GATE_DECISION: APPROVE');
  },
);

test('production workflow resolves authorization from protected MCF control plane', async () => {
  const workflow = await productionWorkflow();
  includes(workflow, 'MCF_CONTROL_PLANE_URL: ${{ secrets.MCF_CONTROL_PLANE_URL }}');
  includes(workflow, 'MCF_RUNTIME_TOKEN: ${{ secrets.MCF_RUNTIME_TOKEN }}');
  includes(workflow, 'resolveProductionAuthorization');
  includes(workflow, 'missionId: process.env.MISSION_ID');
  includes(workflow, 'phaseId: process.env.PHASE_ID');
  includes(workflow, "resolution.state === 'AUTHORIZED'");
});

test(
  'production workflow uses protected provider configuration and never accepts provider secrets as inputs',
  async () => {
    const workflow = await productionWorkflow();
    includes(workflow, 'MCF_PRODUCTION_RUNTIME_URL: ${{ secrets.MCF_PRODUCTION_RUNTIME_URL }}');
    includes(
      workflow,
      'RENDER_PRODUCTION_DEPLOY_HOOK_URL: ${{ secrets.RENDER_PRODUCTION_DEPLOY_HOOK_URL }}',
    );
    excludes(workflow, 'MCF_PRODUCTION_RUNTIME_URL: ${{ inputs.');
    excludes(workflow, 'RENDER_PRODUCTION_DEPLOY_HOOK_URL: ${{ inputs.');
    includes(workflow, 'permissions:\n  contents: read');
  },
);

test('production workflow executes trusted policy against exact release checkout', async () => {
  const workflow = await productionWorkflow();
  includes(workflow, 'Checkout trusted production control plane');
  includes(workflow, 'ref: ${{ github.workflow_sha }}');
  includes(workflow, 'path: .mcf-control-plane');
  includes(workflow, 'Checkout exact production release revision');
  includes(workflow, 'ref: ${{ inputs.release_sha }}');
  includes(workflow, 'path: .mcf-release');
  includes(workflow, "import { orchestrateProductionPromotion }");
  excludes(
    workflow,
    'run: node .mcf-control-plane/apps/rede-social-agentes/ops/render-staging-deploy.mjs',
  );
});

test(
  'production workflow exposes explicit blocked, deployed, noop, and recovered outcomes',
  async () => {
    const workflow = await productionWorkflow();
    includes(workflow, 'id: promote');
    includes(workflow, 'Promotion result BLOCKED');
    includes(workflow, 'Promotion result DEPLOYED');
    includes(workflow, 'Promotion result NOOP');
    includes(workflow, 'Promotion result RECOVERED');
  },
);
