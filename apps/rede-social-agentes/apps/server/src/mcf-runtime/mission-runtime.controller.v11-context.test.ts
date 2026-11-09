import { describe, expect, it, vi } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';

import { MissionRuntimeController } from './mission-runtime.controller.js';
import { MissionV11ContextError } from './mission-v11-context.guard.js';
import type { MissionRuntimeService } from './mission-runtime.service.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';

const mockRequest = { id: 'staging-context-001' } as unknown as AuthenticatedHumanRequest;

describe('MissionRuntimeController v1.1 validation response', () => {
  it.each([
    'ALIGNED_PIP_REQUIRED',
    'ALIGNED_PIP_PAIR_INVALID',
    'METHODOLOGY_PIN_MISMATCH',
  ] as const)('returns 422 (not 500) for %s without leaking error details', async (code) => {
    const runtime = {
      createMission: vi.fn().mockRejectedValue(
        new MissionV11ContextError(code, 'Sensitive internal test path must not leak'),
      ),
    } as unknown as MissionRuntimeService;

    const controller = new MissionRuntimeController(runtime);
    const input = {
      contract: {
        title: 'Staging invalid context',
        objective: 'Do not accept an unaligned implementation mission',
        expectedOutcome: 'Validation rejection only',
        scope: ['Test the v1.1 gate'],
        outOfScope: ['Production writes'],
        acceptanceCriteria: ['HTTP 422 without a sensitive error'],
        riskClass: 'B' as const,
        selectedAgents: ['Sofia'],
        selectedSkills: ['MCF-START-MISSION'],
        sourceOfTruth: [],
        contractSchemaVersion: '1.1' as const,
        projectId: 'staging-test',
        projectEntryMode: 'ADOPT_EXISTING_PROJECT' as const,
      },
    };
    try {
      await controller.createMission(input, mockRequest);
      throw new Error('The runtime should have rejected invalid v1.1 context');
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      const httpError = error as UnprocessableEntityException;
      expect(httpError.getStatus()).toBe(422);
      const payload = httpError.getResponse();
      expect(payload).toMatchObject({
        code: 'MCF_V11_CONTEXT_REJECTED',
        contextCode: code,
        correlationId: 'staging-context-001',
      });
      expect(JSON.stringify(payload)).not.toContain('Sensitive internal test path');
    }
  });
});
