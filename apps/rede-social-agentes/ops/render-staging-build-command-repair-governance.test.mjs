/* global process */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-render-staging-build-command-repair.yml',
);

async function workflow() {
  return readFile(workflowPath, 'utf8');
}

test('repair workflow is manual, main-only, and bound to protected staging environment', async () => {
  const value = await workflow();
  assert.equal(value.includes('workflow_dispatch:'), true);
  assert.equal(value.includes('\n  push:'), false);
  assert.equal(value.includes('\n  pull_request:'), false);
  assert.equal(value.includes("github.ref == 'refs/heads/main'"), true);
  assert.equal(value.includes('environment: mcf-human-authority-staging'), true);
});

test('repair scope is hard-bound to the canonical staging service and workspace', async () => {
  const value = await workflow();
  assert.equal(value.includes('EXPECTED_SERVICE_ID: srv-d9p1r6vlk1mc73a7gtj0'), true);
  assert.equal(value.includes('EXPECTED_WORKSPACE_ID: tea-d2u2msje5dus73eb6ehg'), true);
  assert.equal(value.includes('test "$RENDER_STAGING_SERVICE_ID" = "$EXPECTED_SERVICE_ID"'), true);
  assert.equal(value.includes('autoDeploy == "no"'), true);
  assert.equal(value.includes('branch == "main"'), true);
});

test('repair removes only the known failing corepack enable step', async () => {
  const value = await workflow();
  assert.equal(value.includes('BROKEN_BUILD_COMMAND:'), true);
  assert.equal(value.includes('DESIRED_BUILD_COMMAND:'), true);
  assert.equal(value.includes('corepack enable && corepack prepare pnpm@11.17.0 --activate'), true);
  assert.equal(
    value.includes('cd apps/rede-social-agentes && corepack prepare pnpm@11.17.0 --activate'),
    true,
  );
  assert.equal(value.includes('UNEXPECTED_BUILD_COMMAND'), true);
});

test('repair workflow uses exact Render service GET/PATCH/GET semantics', async () => {
  const value = await workflow();
  assert.equal(value.includes('https://api.render.com/v1/services/$EXPECTED_SERVICE_ID'), true);
  assert.equal(value.includes('--request PATCH'), true);
  assert.equal(
    value.includes("'{serviceDetails:{envSpecificDetails:{buildCommand:$desired}}}'"),
    true,
  );
  assert.equal(value.includes('.ownerId == $owner'), true);
  assert.equal(value.includes('.name == "mcf-runtime-staging-api"'), true);
});

test('workflow uses the protected Render API key without exposing or accepting it as input', async () => {
  const value = await workflow();
  assert.equal(value.includes('RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}'), true);
  assert.equal(value.includes('api_key:'), false);
  assert.equal(value.includes('render_api_key:'), false);
  assert.equal(value.includes('workflow_dispatch:\n    inputs:'), false);
});

test('repair workflow does not trigger a deploy or mutate unrelated provider fields', async () => {
  const value = await workflow();
  assert.equal(value.includes('deploys create'), false);
  assert.equal(value.includes('/deploys'), false);
  assert.equal(value.includes('RENDER_DEPLOY_HOOK_URL'), false);
  assert.equal(value.includes('--branch '), false);
  assert.equal(value.includes('--repo '), false);
  assert.equal(value.includes('--start-command '), false);
});
