/* global process */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-runtime-production-deploy.yml',
);

const targetShaInput = 'AUTHORIZATION_TARGET_SHA: ${{ inputs.authorization_target_sha }}';
const derivedTargetSha = 'AUTHORIZATION_TARGET_SHA: ${{ inputs.release_sha }}';
const runtimeSecret = 'MCF_PRODUCTION_RUNTIME_URL: ${{ secrets.MCF_PRODUCTION_RUNTIME_URL }}';
const deployHookSecret = 'RENDER_PRODUCTION_DEPLOY_HOOK_URL: ${{ secrets.RENDER_PRODUCTION_DEPLOY_HOOK_URL }}';
const runtimeInput = 'MCF_PRODUCTION_RUNTIME_URL: ${{ inputs.';
const deployHookInput = 'RENDER_PRODUCTION_DEPLOY_HOOK_URL: ${{ inputs.';
const policyCommand = 'run: node .mcf-control-plane/apps/rede-social-agentes/ops/production-promotion-policy.mjs';
const stagingCommand = 'run: node .mcf-control-plane/apps/rede-social-agentes/ops/render-staging-deploy.mjs';

async function productionWorkflow() {
  return readFile(workflowPath, 'utf8');
}

function includes(workflow, expected) {
  assert.equal(workflow.includes(expected), true);
}

function excludes(workflow, unexpected) {
  assert.equal(workflow.includes(unexpected), false);
}

test('production workflow has no automatic main, pull request, schedule, or workflow-run trigger', async () => {
  const workflow = await productionWorkflow();

  includes(workflow, 'name: MCF Runtime Production Deploy');
  includes(workflow, 'workflow_dispatch:');
  excludes(workflow, '\n  push:');
  excludes(workflow, '\n  pull_request:');
  excludes(workflow, '\n  schedule:');
  excludes(workflow, '\n  workflow_run:');
  includes(workflow, 'group: mcf-runtime-production-deploy');
  includes(workflow, 'cancel-in-progress: false');
});

test('production workflow keeps release SHA and delegated gate SHA independently bound', async () => {
  const workflow = await productionWorkflow();

  includes(workflow, 'release_sha:');
  includes(workflow, 'authorization_target_sha:');
  includes(workflow, 'required: true');
  includes(workflow, 'RELEASE_SHA: ${{ inputs.release_sha }}');
  includes(workflow, targetShaInput);
  excludes(workflow, derivedTargetSha);
  includes(workflow, 'AUTHORIZATION_STATE: AUTHORIZED');
  includes(workflow, 'HUMAN_AUTHORITY: LEANDRO');
  includes(workflow, 'AUTHORIZATION_SOURCE_DECISION: MCF-DEC-031');
  includes(workflow, 'OPERATIONAL_GATE: LEO');
  includes(workflow, 'GATE_DECISION: APPROVE');
});

test('production workflow uses protected provider configuration and never accepts provider secrets as inputs', async () => {
  const workflow = await productionWorkflow();

  includes(workflow, runtimeSecret);
  includes(workflow, deployHookSecret);
  excludes(workflow, runtimeInput);
  excludes(workflow, deployHookInput);
  includes(workflow, 'permissions:\n  contents: read');
});

test('production workflow executes policy from trusted control plane against exact release checkout', async () => {
  const workflow = await productionWorkflow();

  includes(workflow, 'Checkout trusted production control plane');
  includes(workflow, 'ref: ${{ github.workflow_sha }}');
  includes(workflow, 'path: .mcf-control-plane');
  includes(workflow, 'Checkout exact production release revision');
  includes(workflow, 'ref: ${{ inputs.release_sha }}');
  includes(workflow, 'path: .mcf-release');
  includes(workflow, policyCommand);
  excludes(workflow, stagingCommand);
});

test('production workflow exposes explicit blocked, deployed, noop, and recovered outcomes', async () => {
  const workflow = await productionWorkflow();

  includes(workflow, 'id: promote');
  includes(workflow, 'Promotion result BLOCKED');
  includes(workflow, 'Promotion result DEPLOYED');
  includes(workflow, 'Promotion result NOOP');
  includes(workflow, 'Promotion result RECOVERED');
  includes(workflow, "steps.promote.outputs.status == 'BLOCKED'");
  includes(workflow, "steps.promote.outputs.status == 'DEPLOYED'");
  includes(workflow, "steps.promote.outputs.status == 'NOOP'");
  includes(workflow, "steps.promote.outputs.status == 'RECOVERED'");
});
