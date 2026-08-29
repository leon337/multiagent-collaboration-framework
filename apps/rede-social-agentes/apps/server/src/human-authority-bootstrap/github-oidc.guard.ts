import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { loadBootstrapConfig, type BootstrapConfig } from './bootstrap-config.js';
import { assertBootstrapGithubOidcClaims } from './github-oidc-policy.js';

export interface BootstrapControlPlaneRequest extends FastifyRequest {
  bootstrapControlPlane: { principalFingerprint: string };
}

@Injectable()
export class BootstrapGithubOidcVerifier {
  private readonly jwks = createRemoteJWKSet(
    new URL('https://token.actions.githubusercontent.com/.well-known/jwks'),
  );
  private readonly config: BootstrapConfig;

  constructor() {
    this.config = loadBootstrapConfig();
  }

  async verify(token: string): Promise<string> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: 'https://token.actions.githubusercontent.com',
      audience: this.config.BOOTSTRAP_OIDC_AUDIENCE,
      algorithms: ['RS256'],
    });
    return assertBootstrapGithubOidcClaims(payload, {
      repository: this.config.BOOTSTRAP_ALLOWED_REPOSITORY,
      repositoryId: this.config.BOOTSTRAP_ALLOWED_REPOSITORY_ID,
      repositoryOwnerId: this.config.BOOTSTRAP_ALLOWED_REPOSITORY_OWNER_ID,
      ref: this.config.BOOTSTRAP_ALLOWED_REF,
      workflowRef: this.config.BOOTSTRAP_ALLOWED_WORKFLOW_REF,
      environment: this.config.BOOTSTRAP_ALLOWED_ENVIRONMENT,
    });
  }
}

@Injectable()
export class BootstrapGithubOidcGuard implements CanActivate {
  constructor(
    @Inject(BootstrapGithubOidcVerifier) private readonly verifier: BootstrapGithubOidcVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const raw = request.headers.authorization;
    const token = typeof raw === 'string' ? /^Bearer\s+([^\s]+)$/iu.exec(raw)?.[1] : null;
    if (!token)
      throw new UnauthorizedException({
        code: 'BOOTSTRAP_OIDC_REQUIRED',
        message: 'GitHub OIDC authentication is required.',
      });
    try {
      const principalFingerprint = await this.verifier.verify(token);
      (request as BootstrapControlPlaneRequest).bootstrapControlPlane = { principalFingerprint };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'BOOTSTRAP_OIDC_REJECTED',
        message: 'GitHub OIDC identity is outside the staging bootstrap boundary.',
      });
    }
  }
}
