import { createHash } from 'node:crypto';

export interface BootstrapGithubOidcPolicy {
  repository: string;
  repositoryId: string;
  repositoryOwnerId: string;
  ref: string;
  workflowRef: string;
  workflowSha: string;
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
  const repositoryOwnerId = claim(claims, 'repository_owner_id');
  const ref = claim(claims, 'ref');
  const workflowRef = claim(claims, 'workflow_ref');
  const workflowSha = claim(claims, 'workflow_sha');
  const environment = claim(claims, 'environment');
  const subject = claim(claims, 'sub');
  const [owner, repositoryName] = policy.repository.split('/');
  if (!owner || !repositoryName) throw new Error('OIDC repository policy is invalid.');
  const expectedSubject = `repo:${owner}@${policy.repositoryOwnerId}/${repositoryName}@${policy.repositoryId}:environment:${policy.environment}`;
  const eventName = claim(claims, 'event_name');

  if (
    repository !== policy.repository ||
    repositoryId !== policy.repositoryId ||
    repositoryOwnerId !== policy.repositoryOwnerId ||
    ref !== policy.ref ||
    workflowRef !== policy.workflowRef ||
    workflowSha !== policy.workflowSha ||
    environment !== policy.environment ||
    eventName !== 'workflow_dispatch' ||
    subject !== expectedSubject
  ) {
    throw new Error('OIDC claims do not match the staging bootstrap trust boundary.');
  }

  const principal = {
    repository,
    repositoryId,
    repositoryOwnerId,
    ref,
    workflowRef,
    workflowSha,
    environment,
    runId: claim(claims, 'run_id'),
    jti: claim(claims, 'jti'),
  };
  return createHash('sha256').update(JSON.stringify(principal)).digest('hex');
}
