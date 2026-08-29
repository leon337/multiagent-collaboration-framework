import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';

import { loadBootstrapConfig } from './human-authority-bootstrap/bootstrap-config.js';
import { BootstrapIssuerModule } from './human-authority-bootstrap/bootstrap-issuer.module.js';

const correlationIdPattern = /^[A-Za-z0-9._:-]{1,128}$/u;

function correlationIdFor(request: IncomingMessage): string {
  const suppliedId = request.headers['x-correlation-id'];
  return typeof suppliedId === 'string' && correlationIdPattern.test(suppliedId)
    ? suppliedId
    : randomUUID();
}

async function bootstrap(): Promise<void> {
  const config = loadBootstrapConfig();
  const adapter = new FastifyAdapter({
    logger: false,
    bodyLimit: 65_536,
    trustProxy: true,
    genReqId: correlationIdFor,
  });
  const app = await NestFactory.create<NestFastifyApplication>(BootstrapIssuerModule, adapter, {
    bufferLogs: true,
  });
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;

  fastify.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && origin !== config.BOOTSTRAP_ALLOWED_ORIGIN) {
      await reply.code(403).send({
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'The request origin is not allowed.',
        correlationId: request.id,
      });
      return;
    }
    if (origin && config.BOOTSTRAP_ALLOWED_ORIGIN) {
      reply.header('vary', 'Origin');
      reply.header('access-control-allow-origin', origin);
      reply.header('access-control-allow-methods', 'GET, POST, OPTIONS');
      reply.header('access-control-allow-headers', 'authorization, content-type, x-correlation-id');
    }
    if (request.method === 'OPTIONS') {
      await reply.code(origin ? 204 : 403).send();
      return;
    }
    reply.header('x-correlation-id', request.id);
    reply.header('x-content-type-options', 'nosniff');
    reply.header('x-frame-options', 'DENY');
    reply.header('referrer-policy', 'no-referrer');
    reply.header('cache-control', 'no-store');
    reply.header(
      'content-security-policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
  });

  app.enableShutdownHooks();
  await app.listen({ host: config.HOST, port: config.PORT });
  console.info(
    JSON.stringify({
      level: 'info',
      service: 'mcf-human-authority-bootstrap',
      event: 'bootstrap_issuer_started',
      host: config.HOST,
      port: config.PORT,
      target: 'STAGING',
      identityDisclosed: false,
    }),
  );
}

void bootstrap().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'mcf-human-authority-bootstrap',
      event: 'bootstrap_issuer_start_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
    }),
  );
  process.exitCode = 1;
});
