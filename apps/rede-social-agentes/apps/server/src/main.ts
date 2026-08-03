import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';

import { AppModule } from './app.module.js';
import { loadRuntimeConfig } from './config.js';

const correlationIdPattern = /^[A-Za-z0-9._:-]{1,128}$/u;

function correlationIdFor(request: IncomingMessage): string {
  const suppliedId = request.headers['x-correlation-id'];
  return typeof suppliedId === 'string' && correlationIdPattern.test(suppliedId)
    ? suppliedId
    : randomUUID();
}

async function bootstrap(): Promise<void> {
  const config = loadRuntimeConfig();
  const adapter = new FastifyAdapter({
    logger: false,
    bodyLimit: config.BODY_LIMIT_BYTES,
    trustProxy: config.TRUST_PROXY,
    genReqId: correlationIdFor,
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  fastify.addHook('onRequest', async (request, reply) => {
    const requestOrigin = request.headers.origin;
    const originIsAllowed =
      typeof requestOrigin === 'string' && config.ALLOWED_ORIGINS.includes(requestOrigin);

    if (requestOrigin) {
      reply.header('vary', 'Origin');
      if (!originIsAllowed) {
        await reply.code(403).send({
          code: 'ORIGIN_NOT_ALLOWED',
          message: 'The request origin is not allowed.',
          correlationId: request.id,
        });
        return;
      }

      reply.header('access-control-allow-origin', requestOrigin);
      reply.header('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      reply.header(
        'access-control-allow-headers',
        'authorization, content-type, x-correlation-id',
      );
      reply.header(
        'access-control-expose-headers',
        'x-correlation-id, x-ratelimit-limit, x-ratelimit-remaining, retry-after',
      );
      reply.header('access-control-max-age', '86400');
    }

    if (request.method === 'OPTIONS') {
      await reply.code(originIsAllowed ? 204 : 403).send();
      return;
    }

    reply.header('x-correlation-id', request.id);
    reply.header('x-content-type-options', 'nosniff');
    reply.header('x-frame-options', 'DENY');
    reply.header('referrer-policy', 'no-referrer');
    reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    reply.header('cross-origin-opener-policy', 'same-origin');
    reply.header('cross-origin-resource-policy', 'same-site');
    reply.header(
      'content-security-policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    reply.header('x-dns-prefetch-control', 'off');
    reply.header('cache-control', 'no-store');
    if (config.NODE_ENV === 'production') {
      reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
    }
  });

  app.enableShutdownHooks();
  await app.listen({ host: config.HOST, port: config.PORT });

  console.info(
    JSON.stringify({
      level: 'info',
      service: 'rede-social-agentes',
      component: 'server',
      event: 'server_started',
      environment: config.NODE_ENV,
      host: config.HOST,
      port: config.PORT,
      trustProxy: config.TRUST_PROXY,
      bodyLimitBytes: config.BODY_LIMIT_BYTES,
      allowedOriginCount: config.ALLOWED_ORIGINS.length,
    }),
  );
}

void bootstrap().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'rede-social-agentes',
      component: 'server',
      event: 'server_start_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    }),
  );
  process.exitCode = 1;
});
