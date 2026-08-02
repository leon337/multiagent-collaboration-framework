import 'reflect-metadata';

import { randomUUID } from 'node:crypto';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';

import { AppModule } from './app.module.js';
import { loadRuntimeConfig } from './config.js';

async function bootstrap(): Promise<void> {
  const config = loadRuntimeConfig();
  const adapter = new FastifyAdapter({
    logger: false,
    genReqId(request) {
      const suppliedId = request.headers['x-correlation-id'];
      return typeof suppliedId === 'string' && suppliedId.trim().length > 0
        ? suppliedId
        : randomUUID();
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('x-correlation-id', request.id);
    done();
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
