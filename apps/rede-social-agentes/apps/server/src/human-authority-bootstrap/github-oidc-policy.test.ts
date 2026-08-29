import { describe, expect, it } from 'vitest';
import { assertBootstrapGithubOidcClaims } from './github-oidc-policy.js';

const policy = {
  repository: 'leon337/multiagent-collaboration-framework',
  repositoryId: '1316814482',
  ref: 'refs/heads/feat/human-authority-bootstrap-004',
  workflowRef:
    'leon337/multiagent-collaboration-framework/.github/workflows/human-authority-bootstrap-staging.yml@refs/heads/feat/human-authority-bootstrap-004',
  environment: 'mcf-human-authority-staging',
};

const valid = {
  repository: policy.repository,
  repository_id: policy.repositoryId,
  ref: policy.ref,
  workflow_ref: policy.workflowRef,
  environment: policy.environment,
  sub: `repo:${policy.repository}:environment:${policy.environment}`,
  run_id: '12345',
  jti: 'token-id',
};

describe('bootstrap GitHub OIDC policy', () => {
  it('accepts only the exact staging workflow boundary', () => {
    expect(assertBootstrapGithubOidcClaims(valid, policy)).toMatch(/^[a-f0-9]{64}$/u);
  });

  it.each([
    ['repository', { ...valid, repository: 'other/repo' }],
    ['repository-id', { ...valid, repository_id: '999999999' }],
    ['ref', { ...valid, ref: 'refs/heads/main' }],
    ['workflow', { ...valid, workflow_ref: 'other/workflow@refs/heads/main' }],
    ['environment', { ...valid, environment: 'production' }],
    ['subject', { ...valid, sub: `repo:${policy.repository}:ref:${policy.ref}` }],
  ])('rejects a mismatched %s claim', (_name, claims) => {
    expect(() => assertBootstrapGithubOidcClaims(claims, policy)).toThrow('OIDC');
  });
});
