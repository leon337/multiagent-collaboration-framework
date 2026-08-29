import { describe, expect, it } from 'vitest';
import { assertBootstrapGithubOidcClaims } from './github-oidc-policy.js';

const policy = {
  repository: 'leon337/multiagent-collaboration-framework',
  repositoryId: '1316814482',
  repositoryOwnerId: '25374535',
  ref: 'refs/heads/feat/human-authority-bootstrap-004',
  workflowRef:
    'leon337/multiagent-collaboration-framework/.github/workflows/human-authority-bootstrap-staging.yml@refs/heads/feat/human-authority-bootstrap-004',
  workflowSha: 'f'.repeat(40),
  environment: 'mcf-human-authority-staging',
};

const immutableSubject =
  'repo:leon337@25374535/multiagent-collaboration-framework@1316814482:environment:mcf-human-authority-staging';

const valid = {
  repository: policy.repository,
  repository_id: policy.repositoryId,
  repository_owner_id: policy.repositoryOwnerId,
  ref: policy.ref,
  workflow_ref: policy.workflowRef,
  workflow_sha: policy.workflowSha,
  environment: policy.environment,
  event_name: 'workflow_dispatch',
  sub: immutableSubject,
  run_id: '12345',
  jti: 'token-id',
};

describe('bootstrap GitHub OIDC policy', () => {
  it('accepts the exact immutable staging workflow identity', () => {
    expect(assertBootstrapGithubOidcClaims(valid, policy)).toMatch(/^[a-f0-9]{64}$/u);
  });

  it.each([
    ['repository', { ...valid, repository: 'other/repo' }],
    ['repository-id', { ...valid, repository_id: '999999999' }],
    ['repository-owner-id', { ...valid, repository_owner_id: '999999999' }],
    ['ref', { ...valid, ref: 'refs/heads/main' }],
    ['workflow', { ...valid, workflow_ref: 'other/workflow@refs/heads/main' }],
    ['workflow-sha', { ...valid, workflow_sha: '0'.repeat(40) }],
    ['environment', { ...valid, environment: 'production' }],
    ['event', { ...valid, event_name: 'push' }],
    [
      'mutable-subject',
      { ...valid, sub: `repo:${policy.repository}:environment:${policy.environment}` },
    ],
  ])('rejects a mismatched %s claim', (_name, claims) => {
    expect(() => assertBootstrapGithubOidcClaims(claims, policy)).toThrow('OIDC');
  });
});
