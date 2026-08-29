import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import YAML from 'yaml';

const root = resolve(import.meta.dirname, '../../..');

const read = (path) => readFile(resolve(root, path), 'utf8');

test('bootstrap staging service is isolated, free, and has no provider credential', async () => {
  const blueprint = YAML.parse(await read('render.yaml'));
  const service = blueprint.services.find(
    (item) => item.name === 'mcf-human-authority-bootstrap-staging',
  );
  assert.ok(service);
  assert.equal(service.plan, 'free');
  assert.equal(service.branch, 'feat/human-authority-bootstrap-004');
  assert.equal(service.healthCheckPath, '/health/ready');
  assert.equal(service.autoDeployTrigger, 'off');
  const env = Object.fromEntries(service.envVars.map((item) => [item.key, item]));
  assert.equal(env.MCF_BOOTSTRAP_ISSUER.value, 'true');
  assert.equal(env.BOOTSTRAP_OIDC_AUDIENCE.value, 'mcf-human-authority-bootstrap');
  assert.equal(env.BOOTSTRAP_ALLOWED_ENVIRONMENT.value, 'mcf-human-authority-staging');
  assert.equal(env.BOOTSTRAP_RUNTIME_BASE_URL.sync, false);
  assert.equal(env.BOOTSTRAP_ALLOWED_REPOSITORY_ID.value, '1316814482');
  assert.equal(env.BOOTSTRAP_ALLOWED_REPOSITORY_OWNER_ID.value, '25374535');
  assert.equal(env.BOOTSTRAP_ALLOWED_WORKFLOW_SHA.sync, false);
  assert.equal(
    env.BOOTSTRAP_EXPECTED_RUNTIME_SHA.value,
    'a7b2016cd7705f37acb949ba77de31833cf62521',
  );
  assert.ok(env.DATABASE_URL);
  assert.ok(env.BOOTSTRAP_SEAL_PUBLIC_JWK);
  assert.equal(env.RENDER_API_KEY, undefined);
  assert.equal(env.BOOTSTRAP_SEAL_PRIVATE_JWK, undefined);
});

test('control-plane workflow fails closed before referencing an absent protected environment', async () => {
  const workflowText = await read('.github/workflows/human-authority-bootstrap-staging.yml');
  const workflow = YAML.parse(workflowText);
  const preflight = workflow.jobs.environment_precondition;
  const job = workflow.jobs.bind_authority;
  assert.equal(workflow.permissions.contents, 'read');
  assert.equal(workflow.permissions.actions, 'read');
  assert.equal(workflow.permissions['id-token'], 'write');
  assert.ok(preflight);
  assert.equal(preflight.environment, undefined);
  assert.match(workflowText, /environments\/mcf-human-authority-staging/);
  assert.match(workflowText, /ENVIRONMENT_NOT_READY/);
  assert.match(workflowText, /required_reviewers/);
  assert.match(workflowText, /25374535/);
  assert.match(workflowText, /reviewers\?\.length===1/);
  assert.match(workflowText, /prevent_self_review===false/);
  assert.match(workflowText, /deployment-branch-policies/);
  assert.match(workflowText, /feat\/human-authority-bootstrap-004/);
  assert.equal(job.needs, 'environment_precondition');
  assert.equal(job.environment, 'mcf-human-authority-staging');
  assert.equal(job['runs-on'], 'ubuntu-latest');
  assert.match(workflowText, /BOOTSTRAP_INTENT_REF/);
  assert.match(workflowText, /BOOTSTRAP_SEAL_PRIVATE_JWK/);
  assert.match(workflowText, /RENDER_API_KEY/);
  assert.match(workflowText, /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/);
  assert.match(workflowText, /actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/);
  assert.doesNotMatch(workflowText, /actions\/(?:checkout|setup-node)@v[0-9]+/);
  assert.match(workflowText, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflowText, /persist-credentials: false/);
  assert.doesNotMatch(workflowText, /ref: \$\{\{ github\.ref \}\}/);
  assert.doesNotMatch(workflowText, /VPS/);
  assert.doesNotMatch(workflowText, /curl[^\n]*(?:-X|--request)\s+(?:PUT|POST|PATCH|DELETE)/i);
});

test('Docker entrypoint can run bootstrap issuer without loading the public runtime', async () => {
  const dockerfile = await read('apps/rede-social-agentes/deploy/server.Dockerfile');
  assert.match(dockerfile, /MCF_BOOTSTRAP_ISSUER/);
  assert.match(dockerfile, /bootstrap-main\.js/);
  assert.match(dockerfile, /dist\/main\.js/);
});

test('bootstrap persistence stores no raw human identity columns', async () => {
  const migration = [
    await read(
      'apps/rede-social-agentes/packages/database/migrations/0030_human_authority_binding_bootstrap.sql',
    ),
    await read(
      'apps/rede-social-agentes/packages/database/migrations/0031_human_authority_binding_evidence_gates.sql',
    ),
  ].join('\n');
  assert.match(migration, /"sealed_binding" text NOT NULL/);
  assert.match(migration, /"subject_fingerprint" text NOT NULL/);
  assert.match(migration, /RUNTIME_VERIFIED/);
  assert.match(migration, /RECONCILIATION_REQUIRED/);
  assert.doesNotMatch(migration, /"account_id"/);
  assert.doesNotMatch(migration, /"email"/);
  assert.doesNotMatch(migration, /"token"/);
  assert.doesNotMatch(migration, /render_api_key/i);
});

test('OIDC verification pins issuer, audience and RS256 before immutable claim policy', async () => {
  const guard = await read(
    'apps/rede-social-agentes/apps/server/src/human-authority-bootstrap/github-oidc.guard.ts',
  );
  assert.match(guard, /issuer: 'https:\/\/token\.actions\.githubusercontent\.com'/);
  assert.match(guard, /audience: this\.config\.BOOTSTRAP_OIDC_AUDIENCE/);
  assert.match(guard, /algorithms: \['RS256'\]/);
});

test('bootstrap entrypoint remains independent from the public runtime module', async () => {
  const entrypoint = await read('apps/rede-social-agentes/apps/server/src/bootstrap-main.ts');
  assert.match(entrypoint, /BootstrapIssuerModule/);
  assert.doesNotMatch(entrypoint, /AppModule/);
  assert.doesNotMatch(entrypoint, /McfRuntimeModule/);
  assert.doesNotMatch(entrypoint, /\.\/config\.js/);
});

test('repository-root Docker context excludes local dependency and build artifacts', async () => {
  const dockerignore = await readFile(resolve(root, '.dockerignore'), 'utf8');
  assert.match(dockerignore, /(^|\n)\*\*\/node_modules(\n|$)/u);
  assert.match(dockerignore, /(^|\n)\*\*\/dist(\n|$)/u);
  assert.match(dockerignore, /(^|\n)\.env\.\*(\n|$)/u);
});
