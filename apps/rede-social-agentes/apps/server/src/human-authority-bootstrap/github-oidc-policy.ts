import { createHash } from 'node:crypto';

export interface BootstrapGithubOidcPolicy {
  repository: string;
  repositoryId: string;
  ref: string;
  workflowRef: string;
  environment: string;
}

function claim(claims: Record<string, unknown>, name: string): string {
  const value = claims[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`OIDC claim ${name} is missing.`);
  }
  return value;
}

export function assertBootstrapGithubOidcClaims(
  claims: Record<string, unknown>,
  policy: BootstrapGithubOidcPolicy,
): string {
  const repository = claim(claims, 'repository');
  const repositoryId = claim(claims, 'repository_id');
  const ref = claim(claims, 'ref');
  const workflowRef = claim(claims, 'workflow_ref');
  const environment = claim(claims, 'environment');
  const subject = claim(claims, 'sub');
  const expectedSubject = `repo:${policy.repository}:environment:${policy.environment}`;

  if (
    repository !== policy.repository ||
    repositoryId !== policy.repositoryId ||
    ref !== policy.ref ||
    workflowRef !== policy.workflowRef ||
    environment !== policy.environment ||
    subject !== expectedSubject
  ) {
    throw new Error('OIDC claims do not match the staging bootstrap trust boundary.');
  }

  const principal = {
    repository,
    repositoryId,
    ref,
    workflowRef,
    environment,
    runId: claim(claims, 'run_id'),
    jti: claim(claims, 'jti'),
  };
  return createHash('sha256').update(JSON.stringify(principal)).digest('hex');
}
