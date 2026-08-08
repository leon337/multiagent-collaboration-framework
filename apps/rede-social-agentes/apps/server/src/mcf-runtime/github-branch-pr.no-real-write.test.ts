import { describe, expect, it } from 'vitest';

import { GitHubBranchPrClient } from './github-branch-pr.adapter.js';

describe('C1 provider boundary', () => {
  it('allows dependency injection so tests never require a real GitHub write', () => {
    const fetcher = async () => new Response('{}', { status: 200 });
    const client = new GitHubBranchPrClient(fetcher);
    expect(client).toBeInstanceOf(GitHubBranchPrClient);
  });
});
