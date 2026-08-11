import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { GitHubStagingDeployClient } from './github-staging-deploy.adapter.js';

describe('Gate D provider boundary', () => {
  it('allows dependency injection so tests never require a real staging dispatch', () => {
    const fetcher = async () => new Response('{}', { status: 200 });
    const client = new GitHubStagingDeployClient(fetcher, 'test-token');
    expect(client).toBeInstanceOf(GitHubStagingDeployClient);
  });

  it('keeps the staging deploy adapter out of the live runtime registry during implementation', async () => {
    const modulePath = fileURLToPath(new URL('./mcf-runtime.module.ts', import.meta.url));
    const source = await readFile(modulePath, 'utf8');

    expect(source).toContain('provide: GitHubActionsStagingDeployAdapter');
    expect(source).toContain(
      'new AdapterRegistry([githubReview, githubCiQuery, githubBranchPr, githubPrCollaboration])',
    );
    expect(source).not.toContain(
      'new AdapterRegistry([githubReview, githubCiQuery, githubBranchPr, githubPrCollaboration, githubStagingDeploy])',
    );
    expect(source).not.toContain('github-actions-staging-deploy-v1');
  });
});
