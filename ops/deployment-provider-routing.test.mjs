import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_DEPLOYMENT_SURFACES,
  requiresGovernedRuntimePromotion,
  resolveProviderRoute,
} from './deployment-provider-routing.mjs';

const sha = 'b10edfced251ef6a6494262c1319d93107eb7fc4';

test('Neon is persistence; never substitute for application hosting', () => {
  assert.equal(PRIMARY_DEPLOYMENT_SURFACES.api, 'render/rsa-api-free');
  assert.equal(PRIMARY_DEPLOYMENT_SURFACES.web, 'render/rsa-web-free');
  assert.match(PRIMARY_DEPLOYMENT_SURFACES.database, /^verify-/);
});

test('Documentation-only is published from verified GitHub main, not from Vercel', () => {
  const r = resolveProviderRoute({
    changedFiles: ['docs/operations/runbook.md', 'AGENTS.md'],
    exactSha: sha,
    vercelBuildLimited: true,
  });
  assert.equal(r.knowledgePublication, 'GITHUB_MAIN_AFTER_VERIFIED_MERGE');
  assert.equal(r.runtimePromotion, 'NOT_NEEDED_FOR_DOCUMENT_ONLY_CHANGE');
  assert.equal(r.vercel, 'DEGRADED_OPTIONAL_NOT_A_RENDER_GATE');
  assert.equal(r.productionDeploymentVerified, false);
});

test('An MCF registry update is runtime-affecting even if it documents an experimental skill', () => {
  assert.equal(requiresGovernedRuntimePromotion(['skills/registry.yaml']), true);
  assert.equal(requiresGovernedRuntimePromotion(['skills/backup/MCF-PROJECT-DRIVE-BACKUP.yaml']), true);
});

test('Vercel build-rate-limit cannot bypass Render verification or production gates', () => {
  const first = resolveProviderRoute({changedFiles:['skills/registry.yaml'],exactSha:sha,vercelBuildLimited:true});
  assert.equal(first.runtimePromotion, 'BLOCKED_RENDER_NOT_VERIFIED');
  const second = resolveProviderRoute({changedFiles:['skills/registry.yaml'],exactSha:sha,vercelBuildLimited:true,renderVerified:true});
  assert.equal(second.runtimePromotion, 'BLOCKED_GOVERNED_AUTHORIZATION_REQUIRED');
});

test('A complete set of verified prerequisites gives only workflow eligibility', () => {
  const r = resolveProviderRoute({
    changedFiles: ['apps/rede-social-agentes/apps/server/src/mcf-runtime/test.ts'],
    exactSha: sha,
    renderVerified: true,
    persistedHumanAuthorization: true,
    persistedLeoOperationalGate: true,
  });
  assert.equal(r.runtimePromotion, 'ELIGIBLE_FOR_GOVERNED_WORKFLOW_ONLY');
  assert.equal(r.providerMutationExecuted, false);
});

test('Invalid SHA always blocks runtime promotion, even when gates appear present', () => {
  const r = resolveProviderRoute({
    changedFiles: ['render.yaml'],
    exactSha: 'bad',
    renderVerified: true,
    persistedHumanAuthorization: true,
    persistedLeoOperationalGate: true,
  });
  assert.equal(r.runtimePromotion, 'BLOCKED_INVALID_RELEASE_SHA');
});

test('Invalid input fail-closed', () => {
  assert.throws(() => requiresGovernedRuntimePromotion('docs/README.md'), TypeError);
  assert.throws(() => requiresGovernedRuntimePromotion([undefined]), TypeError);
});
