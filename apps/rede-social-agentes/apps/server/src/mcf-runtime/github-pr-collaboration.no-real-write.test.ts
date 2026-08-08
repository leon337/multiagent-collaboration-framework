import { describe, expect, it } from 'vitest';

import { GitHubPullCollaborationClient } from './github-pr-collaboration.adapter.js';

describe('C2 provider boundary', () => {
  it('allows dependency injection so tests never require a real GitHub write', () => {
    const fetcher = async () => new Response('{}', { status: 200 });
    const client = new GitHubPullCollaborationClient(fetcher);
    expect(client).toBeInstanceOf(GitHubPullCollaborationClient);
  });
});
