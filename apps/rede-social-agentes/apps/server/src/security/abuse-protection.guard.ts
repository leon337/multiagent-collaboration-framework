import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { selectAbusePolicy, type AbusePolicy } from './abuse-policy.js';
import { RateLimitService } from './rate-limit.service.js';

const MCF_CLOUD_CONTEXT_LOCAL_READ_POLICY = 'mcf-cloud-context-local-read';

function routeUrl(request: FastifyRequest): string {
  return request.routeOptions?.url ?? request.url.split('?')[0] ?? '/unknown';
}

function subjectFor(request: FastifyRequest, policy: AbusePolicy): string {
  if (policy.name === MCF_CLOUD_CONTEXT_LOCAL_READ_POLICY) {
    // This route authenticates with x-mcf-cloud-context-token, not Authorization.
    // Bind its bucket to the direct socket peer so arbitrary Bearer/X-Forwarded-For
    // values cannot split the 10/minute limit. Missing peer identity collapses into
    // one fail-closed bucket instead of accepting a client-selected subject.
    return `cloud-peer:${request.raw.socket.remoteAddress ?? 'unresolved'}`;
  }
  const authorization = request.headers.authorization;
  if (authorization?.startsWith('Bearer ') && authorization.length <= 4096) {
    return `session:${authorization.slice(7)}`;
  }
  return `ip:${request.ip}`;
}

@Injectable()
export class AbuseProtectionGuard implements CanActivate {
  constructor(@Inject(RateLimitService) private readonly rateLimits: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();
    const resolvedRouteUrl = routeUrl(request);

    if (request.method === 'OPTIONS' || resolvedRouteUrl === '/health/live') {
      return true;
    }

    const policy = selectAbusePolicy(request.method, resolvedRouteUrl);
    const decision = await this.rateLimits.consume(subjectFor(request, policy), policy);

    reply.header('x-ratelimit-limit', decision.limit);
    reply.header('x-ratelimit-remaining', decision.remaining);

    if (!decision.allowed) {
      reply.header('retry-after', decision.retryAfterSeconds);
      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Try again later.',
          correlationId: request.id,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
