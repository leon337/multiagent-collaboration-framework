import { describe, expect, it, vi } from 'vitest';

import type { ExternalActionRequest } from './external-action.contracts.js';
import { ExternalActionAdapterError } from './external-action.contracts.js';
import { GitHubExecutionIdentityRegistry } from './github-execution-identity.js';

function request(agentId: string): ExternalActionRequest {
  return {
    agentId,
    skill: {
      skillId: 'MCF-GIT-PR-RELEASE',
      name: 'Versionar, abrir PR e integrar',
      version: '1.0.0',
      purpose: 'test',
      ownerAgents: [agentId],
      requiredInputs: [],
      allowedTools: ['GitHub'],
      forbiddenTools: [],
      permissionProfile: 'SCOPED_WRITE',
      executionSteps: [],
      requiredEvidence: [],
      acceptanceCriteria: [],
      failureModes: [],
      fallback: 'test',
      handoffTo: 'Mestre',
    },
    inputs: {},
    tool: {
      provider: 'github',
      operation: 'create-branch-pr',
      resource: 'leon337/multiagent-collaboration-framework',
    },
  };
}

function githubUser(login: string): Response {
  return new Response(JSON.stringify({ login }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GitHubExecutionIdentityRegistry', () => {
  it('direct-binds MESTRE and verifies the configured GitHub actor', async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer mestre-token' });
      return githubUser('mcfmestreagent-svg');
    });
    const registry = new GitHubExecutionIdentityRegistry(
      {
        MCF_GITHUB_MESTRE_LOGIN: 'mcfmestreagent-svg',
        MCF_GITHUB_MESTRE_TOKEN: 'mestre-token',
      },
      fetcher,
    );

    const bound = await registry.bindWritePrincipal(request('Mestre'));

    expect(bound.executionPrincipal).toEqual({
      provider: 'github',
      principalId: 'MESTRE',
      externalActor: 'mcfmestreagent-svg',
      attributionMode: 'DIRECT',
    });
    expect(bound.agentId).toBe('Mestre');
    expect(await registry.tokenFor(bound.executionPrincipal!)).toBe('mestre-token');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('direct-binds LÉO independently from MESTRE', async () => {
    const registry = new GitHubExecutionIdentityRegistry(
      {
        MCF_GITHUB_LEO_LOGIN: 'mcfleoagent-ops',
        MCF_GITHUB_LEO_TOKEN: 'leo-token',
      },
      vi.fn(async () => githubUser('mcfleoagent-ops')),
    );

    const bound = await registry.bindWritePrincipal(request('Leo'));

    expect(bound.executionPrincipal).toMatchObject({
      principalId: 'LEO',
      externalActor: 'mcfleoagent-ops',
      attributionMode: 'DIRECT',
    });
  });

  it('bootstrap-delegates an authorized unbound agent to MESTRE without changing agentId', async () => {
    const registry = new GitHubExecutionIdentityRegistry(
      {
        MCF_GITHUB_BOOTSTRAP_DELEGATION_ENABLED: 'true',
        MCF_GITHUB_MESTRE_LOGIN: 'mcfmestreagent-svg',
        MCF_GITHUB_MESTRE_TOKEN: 'mestre-token',
      },
      vi.fn(async () => githubUser('mcfmestreagent-svg')),
    );

    const bound = await registry.bindWritePrincipal(request('Gabriel'));

    expect(bound.agentId).toBe('Gabriel');
    expect(bound.executionPrincipal).toEqual({
      provider: 'github',
      principalId: 'MESTRE',
      externalActor: 'mcfmestreagent-svg',
      attributionMode: 'BOOTSTRAP_DELEGATED',
    });
  });

  it('fails closed for an unbound agent when bootstrap delegation is disabled', async () => {
    const fetcher = vi.fn();
    const registry = new GitHubExecutionIdentityRegistry({}, fetcher);

    await expect(registry.bindWritePrincipal(request('Gabriel'))).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      retryable: false,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fails closed when the selected principal has incomplete credentials', async () => {
    const registry = new GitHubExecutionIdentityRegistry(
      { MCF_GITHUB_MESTRE_LOGIN: 'mcfmestreagent-svg' },
      vi.fn(),
    );

    await expect(registry.bindWritePrincipal(request('Mestre'))).rejects.toBeInstanceOf(
      ExternalActionAdapterError,
    );
  });

  it('rejects a credential whose GitHub actor does not match the configured login', async () => {
    const registry = new GitHubExecutionIdentityRegistry(
      {
        MCF_GITHUB_MESTRE_LOGIN: 'mcfmestreagent-svg',
        MCF_GITHUB_MESTRE_TOKEN: 'wrong-token',
      },
      vi.fn(async () => githubUser('mcfleoagent-ops')),
    );

    await expect(registry.bindWritePrincipal(request('Mestre'))).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      retryable: false,
    });
  });
});
