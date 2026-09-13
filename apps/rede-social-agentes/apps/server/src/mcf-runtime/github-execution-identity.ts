import { Injectable } from '@nestjs/common';

import {
  ExternalActionAdapterError,
  type ExternalActionRequest,
  type ExternalExecutionPrincipal,
} from './external-action.contracts.js';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type PrincipalId = 'MESTRE' | 'LEO';

interface PrincipalEnvironmentBinding {
  loginEnv: 'MCF_GITHUB_MESTRE_LOGIN' | 'MCF_GITHUB_LEO_LOGIN';
  tokenEnv: 'MCF_GITHUB_MESTRE_TOKEN' | 'MCF_GITHUB_LEO_TOKEN';
}

const principalBindings: Record<PrincipalId, PrincipalEnvironmentBinding> = {
  MESTRE: {
    loginEnv: 'MCF_GITHUB_MESTRE_LOGIN',
    tokenEnv: 'MCF_GITHUB_MESTRE_TOKEN',
  },
  LEO: {
    loginEnv: 'MCF_GITHUB_LEO_LOGIN',
    tokenEnv: 'MCF_GITHUB_LEO_TOKEN',
  },
};

const directPrincipals = new Map<string, PrincipalId>([
  ['Mestre', 'MESTRE'],
  ['Leo', 'LEO'],
]);

function authenticationRequired(message: string): ExternalActionAdapterError {
  return new ExternalActionAdapterError('AUTHENTICATION_REQUIRED', message, false, 403);
}

@Injectable()
export class GitHubExecutionIdentityRegistry {
  private readonly verified = new Map<PrincipalId, { login: string; token: string }>();

  constructor(
    private readonly env: NodeJS.ProcessEnv = process.env,
    private readonly fetcher: FetchLike = globalThis.fetch,
  ) {}

  private credentials(principalId: PrincipalId): { login: string; token: string } {
    const binding = principalBindings[principalId];
    const login = this.env[binding.loginEnv]?.trim();
    const token = this.env[binding.tokenEnv]?.trim();
    if (!login || !token) {
      throw authenticationRequired(
        `GitHub execution principal ${principalId} is not fully configured`,
      );
    }
    return { login, token };
  }

  private async verify(principalId: PrincipalId): Promise<{ login: string; token: string }> {
    const configured = this.credentials(principalId);
    const cached = this.verified.get(principalId);
    if (cached?.login === configured.login && cached.token === configured.token) return cached;

    let response: Response;
    try {
      response = await this.fetcher('https://api.github.com/user', {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'mcf-runtime-github-identity-binding',
          Authorization: `Bearer ${configured.token}`,
        },
      });
    } catch (error) {
      throw new ExternalActionAdapterError(
        'NETWORK_FAILURE',
        error instanceof Error ? error.message : 'GitHub identity verification failed',
        true,
      );
    }

    if (response.status === 429) {
      throw new ExternalActionAdapterError(
        'RATE_LIMITED',
        'GitHub identity verification was rate limited',
        true,
        response.status,
      );
    }
    if (!response.ok) {
      throw authenticationRequired('GitHub execution principal credentials could not be verified');
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub identity verification returned invalid JSON',
        false,
        response.status,
      );
    }
    const observedLogin =
      typeof body === 'object' && body !== null && 'login' in body
        ? (body as { login?: unknown }).login
        : null;
    if (
      typeof observedLogin !== 'string' ||
      observedLogin.toLowerCase() !== configured.login.toLowerCase()
    ) {
      throw authenticationRequired(
        `GitHub execution principal ${principalId} does not match the configured external actor`,
      );
    }

    this.verified.set(principalId, configured);
    return configured;
  }

  async bindWritePrincipal(request: ExternalActionRequest): Promise<ExternalActionRequest> {
    const directPrincipal = directPrincipals.get(request.agentId);
    const principalId: PrincipalId = directPrincipal ?? 'MESTRE';
    const attributionMode = directPrincipal ? 'DIRECT' : 'BOOTSTRAP_DELEGATED';

    if (!directPrincipal && this.env.MCF_GITHUB_BOOTSTRAP_DELEGATION_ENABLED !== 'true') {
      throw authenticationRequired(
        `Agent ${request.agentId} has no direct GitHub execution principal and bootstrap delegation is disabled`,
      );
    }

    const credential = await this.verify(principalId);
    return {
      ...request,
      executionPrincipal: {
        provider: 'github',
        principalId,
        externalActor: credential.login,
        attributionMode,
      },
    };
  }

  async tokenFor(principal: ExternalExecutionPrincipal): Promise<string> {
    if (principal.provider !== 'github' || !(principal.principalId in principalBindings)) {
      throw authenticationRequired('Unsupported GitHub execution principal');
    }
    const principalId = principal.principalId as PrincipalId;
    const verified = await this.verify(principalId);
    if (verified.login.toLowerCase() !== principal.externalActor.toLowerCase()) {
      throw authenticationRequired('GitHub execution principal descriptor does not match its credential');
    }
    return verified.token;
  }
}
