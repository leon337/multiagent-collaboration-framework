import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { IDENTITY_REPOSITORY } from '../identity/identity.repository.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { SessionTokenService } from '../identity/session-token.service.js';
import { MissionRuntimeController } from './mission-runtime.controller.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

const missionId = '11111111-1111-4111-8111-111111111111';
const secondAccountId = '22222222-2222-4222-8222-222222222222';
const reservedAccountId = '44444444-4444-4444-8444-444444444444';
const sessionId = '33333333-3333-4333-8333-333333333333';
const bearerToken = 'second-account-session-token';
const phaseBody = {
  skillId: 'MCF-DEPLOY-VALIDATE',
  agentId: 'LÉO',
  inputs: {
    v11AuthorizationContext: {
      humanGateDecision: {
        status: 'APPROVED',
        decidedBy: 'leandro',
        sourceRef: 'caller-controlled',
      },
    },
  },
  tool: {
    provider: 'internal',
    operation: 'validate',
    resource: 'release',
  },
  expectedMissionVersion: 1,
};

function missionRecord() {
  const now = new Date('2026-08-27T18:00:00.000Z');
  return {
    id: missionId,
    contract: {
      title: 'HTTP authority provenance mission',
      objective: 'Reject spoofed reserved-human authority through the authenticated HTTP route.',
      expectedOutcome: 'The second authenticated account receives HTTP 403.',
      scope: ['authority'],
      outOfScope: [],
      acceptanceCriteria: ['spoofed LEANDRO authority is denied'],
      riskClass: 'B',
      selectedAgents: ['LÉO'],
      selectedSkills: ['MCF-DEPLOY-VALIDATE'],
      sourceOfTruth: [],
    },
    state: 'PLANNED',
    currentPhaseId: null,
    currentAgentId: null,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

async function buildHarness() {
  const tokens = new SessionTokenService();
  const executor = {
    execute: vi.fn(async () => {
      throw new Error('EXECUTOR_REACHED');
    }),
  };
  const runtimeRepository = {
    findMission: vi.fn(async () => missionRecord()),
  };
  const identityRepository = {
    findActiveSessionByTokenHash: vi.fn(async (tokenHash: string) =>
      tokenHash === tokens.hash(bearerToken)
        ? {
            accountId: secondAccountId,
            email: 'second@example.test',
            displayName: 'Second Human',
            sessionId,
            sessionExpiresAt: new Date('2026-08-28T00:00:00.000Z'),
          }
        : null,
    ),
  };
  const runtime = new MissionRuntimeService(
    runtimeRepository as never,
    executor as never,
    {} as never,
    {} as never,
    undefined,
    reservedAccountId,
  );

  class AuthorityHttpTestModule {}
  Module({
    controllers: [MissionRuntimeController],
    providers: [
      SessionAuthGuard,
      { provide: IDENTITY_REPOSITORY, useValue: identityRepository },
      { provide: SessionTokenService, useValue: tokens },
      { provide: MissionRuntimeService, useValue: runtime },
    ],
  })(AuthorityHttpTestModule);

  const app = await NestFactory.create<NestFastifyApplication>(
    AuthorityHttpTestModule,
    new FastifyAdapter({ logger: false }),
    { logger: false },
  );
  await app.init();
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  await fastify.ready();
  return { app, fastify, executor, identityRepository };
}

describe('MissionRuntime HTTP authority provenance', () => {
  it('returns 403 when a second authenticated account self-declares LEANDRO', async () => {
    const { app, fastify, executor, identityRepository } = await buildHarness();
    try {
      const response = await fastify.inject({
        method: 'POST',
        url: `/v1/mcf/missions/${missionId}/phases/execute`,
        headers: {
          authorization: `Bearer ${bearerToken}`,
          'content-type': 'application/json',
          'x-correlation-id': 'attacker-controlled-correlation',
        },
        payload: phaseBody,
      });
      expect(response.statusCode).toBe(403);
      expect(executor.execute).not.toHaveBeenCalled();
      expect(identityRepository.findActiveSessionByTokenHash).toHaveBeenCalledWith(
        new SessionTokenService().hash(bearerToken),
      );
    } finally {
      await app.close();
    }
  });
});
