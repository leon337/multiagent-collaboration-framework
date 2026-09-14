import { GitHubExecutionIdentityRegistry } from './github-execution-identity.js';

const env: NodeJS.ProcessEnv = {
  MCF_GITHUB_MESTRE_LOGIN: 'mcfmestreagent-svg',
  MCF_GITHUB_MESTRE_TOKEN: 'principal-token',
  MCF_GITHUB_LEO_LOGIN: 'mcfleoagent-ops',
  MCF_GITHUB_LEO_TOKEN: 'leo-principal-token',
  MCF_GITHUB_BOOTSTRAP_DELEGATION_ENABLED: 'true',
};

function identityResponse(login: string, status = 200): Response {
  return new Response(JSON.stringify({ login }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
export function createTestGitHubExecutionIdentityRegistry(): GitHubExecutionIdentityRegistry {
  return new GitHubExecutionIdentityRegistry(env, async (input, init) => {
    if (input !== 'https://api.github.com/user') {
      throw new Error(`unexpected identity verification request ${input}`);
    }

    const authorization = new Headers(init?.headers).get('authorization');
    if (authorization === 'Bearer principal-token') {
      return identityResponse('mcfmestreagent-svg');
    }
    if (authorization === 'Bearer leo-principal-token') {
      return identityResponse('mcfleoagent-ops');
    }
    return identityResponse('unauthorized', 401);
  });
}
