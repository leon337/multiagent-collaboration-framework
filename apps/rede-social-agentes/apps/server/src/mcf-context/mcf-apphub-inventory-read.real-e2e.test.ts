import 'reflect-metadata';

import { randomBytes } from 'node:crypto';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { describe, expect, it } from 'vitest';

import { McfContextModule } from './mcf-context.module.js';

const enabled =
  process.env.MCF_APPHUB_E2E_ENABLE === 'EXPLICIT_LOCAL_LAB_ONLY' &&
  process.env.MCF_APPHUB_INVENTORY_ENABLE === 'LOCAL_READ_ONLY' &&
  process.env.NODE_ENV !== 'production';

describe('App Hub real local Context Fabric HTTP smoke', () => {
  it.skipIf(!enabled)(
    'proves gated GET, query denial, wrong-method denial and live Google read',
    async () => {
      // This is an opt-in local test; never run it with CI or production credentials.
      const token = randomBytes(48).toString('hex');
      const oldToken = process.env.MCF_CONTEXT_READ_TOKEN;
      process.env.MCF_CONTEXT_READ_TOKEN = token;
      class LocalTestModule {}
      Module({ imports: [McfContextModule] })(LocalTestModule);

      let app: Awaited<ReturnType<typeof NestFactory.create>> | undefined;
      try {
        app = await NestFactory.create(LocalTestModule, new FastifyAdapter(), { logger: false });
        await app.listen(0, '127.0.0.1');
        const endpoint = `${await app.getUrl()}/v1/mcf/context/cloud/apphub`;
        const unauthorized = await fetch(endpoint);
        const injected = await fetch(endpoint + '?project=other-project', {
          headers: { 'x-mcf-context-token': token },
        });
        const mutation = await fetch(endpoint, {
          method: 'POST',
          headers: { 'x-mcf-context-token': token },
        });
        const response = await fetch(endpoint, {
          headers: { 'x-mcf-context-token': token },
        });
        const body: unknown = await response.json();
        expect(unauthorized.status).toBe(401);
        expect(injected.status).toBe(400);
        expect(mutation.status).toBe(404);
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('private, no-store');
        expect(body).toMatchObject({
          protocol: 'MCF_APPHUB_CONTEXT_FABRIC_READ_V1',
          read_only: true,
          material_action: false,
          provider_payload_persisted_by_mcf: false,
          project_id: process.env.MCF_APPHUB_PROJECT_ID,
          counts: {
            applications: expect.any(Number),
            discoveredServices: expect.any(Number),
            discoveredWorkloads: expect.any(Number),
          },
        });
      } finally {
        if (app) await app.close();
        if (oldToken === undefined) delete process.env.MCF_CONTEXT_READ_TOKEN;
        else process.env.MCF_CONTEXT_READ_TOKEN = oldToken;
      }
    },
    30_000,
  );
});
