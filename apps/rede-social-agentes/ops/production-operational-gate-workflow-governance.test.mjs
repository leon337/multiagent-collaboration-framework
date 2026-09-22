/* global process */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-production-operational-gate.yml',
);

async function workflow() {
  return readFile(workflowPath, 'utf8');
}

test('operational gate is manual, main-only and production-environment bound', async () => {
  const value = await workflow();
  assert.equal(value.includes('name: MCF Production Operational Gate'), true);
  assert.equal(value.includes('workflow_dispatch:'), true);
  assert.equal(value.includes('\n  push:'), false);
  assert.equal(value.includes('\n  pull_request:'), false);
  assert.equal(value.includes('\n  schedule:'), false);
  assert.equal(value.includes('environment: production'), true);
  assert.equal(value.includes("if: ${{ github.ref != 'refs/heads/main' }}"), true);

  const mainGuard = value.indexOf('Validate canonical main dispatch');
  const runtimeToken = value.indexOf('MCF_RUNTIME_TOKEN: ${{ secrets.MCF_RUNTIME_TOKEN }}');
  assert.ok(mainGuard >= 0 && runtimeToken > mainGuard);
});

test('dispatch cannot manufacture LEANDRO authority or provider mutation', async () => {
  const value = await workflow();
  assert.equal(value.includes('humanGateDecision'), false);
  assert.equal(value.includes('reservedHumanAuthority'), false);
  assert.equal(value.includes('HUMAN_AUTHORITY:'), false);
  assert.equal(value.includes('RENDER_PRODUCTION_DEPLOY_HOOK_URL'), false);
  assert.equal(value.includes('deploy-production'), false);
  assert.equal(value.includes('api.render.com'), false);
  assert.equal(value.includes('trigger_deploy'), false);
});

test('operational gate is bound to exact persisted mission phase and release SHA', async () => {
  const value = await workflow();
  assert.equal(value.includes('release_sha:'), true);
  assert.equal(value.includes('mission_id:'), true);
  assert.equal(value.includes('phase_id:'), true);
  assert.equal(value.includes('decision:'), true);
  assert.equal(value.includes('source_ref:'), false);
  assert.equal(value.includes('evidence_ref:'), false);
  assert.equal(value.includes('/v1/mcf/production-authorization/operational-gate'), true);
  assert.equal(value.includes('/v1/mcf/production-authorization/resolve'), true);
  assert.equal(value.includes('x-mcf-runtime-token: $MCF_RUNTIME_TOKEN'), true);
});

test('source and evidence refs are generated from the trusted GitHub run', async () => {
  const value = await workflow();
  assert.equal(
    value.includes(
      'SOURCE_REF: github-actions:${{ github.repository }}:${{ github.run_id }}:${{ github.run_attempt }}',
    ),
    true,
  );
  assert.equal(
    value.includes(
      'EVIDENCE_REF: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}',
    ),
    true,
  );
  assert.equal(value.includes('sourceRef:$sourceRef'), true);
  assert.equal(value.includes('evidenceRef:$evidenceRef'), true);
});

test('approval is considered successful only after canonical resolver returns AUTHORIZED', async () => {
  const value = await workflow();
  assert.equal(value.includes("if: ${{ inputs.decision == 'APPROVE' }}"), true);
  assert.equal(value.includes('.state == "AUTHORIZED"'), true);
  assert.equal(value.includes('.humanAuthority == "LEANDRO"'), true);
  assert.equal(value.includes('.operationalGate == "LEO"'), true);
  assert.equal(value.includes('.gateDecision == "APPROVE"'), true);
  assert.equal(value.includes('.provenance == "MCF_RUNTIME_PERSISTED_AUTHORIZATION"'), true);
  assert.equal(value.includes('.targetSha == $sha'), true);
});
