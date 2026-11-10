import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import type { McfMissionV11ValidationContextCode } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { ChatRuntimeBridgeController } from './chat-runtime-bridge.controller.js';
import type { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import { McfPermissionDeniedError } from './mcf-runtime.errors.js';
import { MissionRuntimeController } from './mission-runtime.controller.js';
import type { MissionRuntimeService } from './mission-runtime.service.js';
import { MissionV11ContextError } from './mission-v11-context.guard.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';

const mockRequest = {
  id: 'staging-context-001',
  authenticatedHuman: { accountId: 'synthetic-human-account' },
} as AuthenticatedHumanRequest;

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

const validationCodes: McfMissionV11ValidationContextCode[] = [
  'V11_CONTEXT_INCOMPLETE',
  'ALIGNED_PIP_REQUIRED',
  'ALIGNED_PIP_PAIR_INVALID',
  'PROJECT_CONTEXT_MISMATCH',
  'METHODOLOGY_PIN_MISMATCH',
  'PRR_REF_INVALID',
  'PRR_NOT_CONFIRMED',
  'REMOTE_CONTEXT_READER_REQUIRED',
];

function controllerRejecting(error: Error): MissionRuntimeController {
  return new MissionRuntimeController({
    createMission: vi.fn().mockRejectedValue(error),
  } as unknown as MissionRuntimeService);
}

describe('MissionRuntimeController v1.1 error classification', () => {
  it.each(validationCodes)('returns safe 422 for %s', async (code) => {
    const controller = controllerRejecting(
      new MissionV11ContextError(code, 'Sensitive internal test path must not leak'),
    );

    const rejection = await controller
      .createMission(input, mockRequest)
      .catch((error: unknown) => error);
    expect(rejection).toBeInstanceOf(UnprocessableEntityException);
    const exception = rejection as UnprocessableEntityException;
    expect(exception.getStatus()).toBe(422);
    expect(exception.getResponse()).toEqual({
      code: 'MCF_V11_CONTEXT_REJECTED',
      contextCode: code,
      message: 'A missão v1.1 exige contexto de projeto e alinhamento de intenção verificados.',
      correlationId: 'staging-context-001',
    });
    expect(JSON.stringify(exception.getResponse())).not.toContain('Sensitive internal test path');
  });

  it('classifies a missing canonical schema root as 503, never as client 422', async () => {
    const controller = controllerRejecting(
      new MissionV11ContextError(
        'PROJECT_ARTIFACT_ROOT_UNAVAILABLE',
        '/workspace/schemas/project-intent-package-v1.schema.json is missing',
      ),
    );

    const rejection = await controller
      .createMission(input, mockRequest)
      .catch((error: unknown) => error);
    expect(rejection).toBeInstanceOf(ServiceUnavailableException);
    const exception = rejection as ServiceUnavailableException;
    expect(exception.getStatus()).toBe(503);
    expect(exception.getResponse()).toEqual({
      code: 'MCF_V11_CONTEXT_UNAVAILABLE',
      message: 'Artefatos de contexto do servidor indisponíveis.',
      correlationId: 'staging-context-001',
    });
    expect(JSON.stringify(exception.getResponse())).not.toContain('/workspace/');
    expect(JSON.stringify(exception.getResponse())).not.toContain(
      'PROJECT_ARTIFACT_ROOT_UNAVAILABLE',
    );
  });

  it('does not mask an unknown infrastructure error as a validation rejection', async () => {
    const unknown = new Error('sensitive runtime outage');
    const controller = controllerRejecting(unknown);

    await expect(controller.createMission(input, mockRequest)).rejects.toBe(unknown);
  });

  it('does not echo internal details in legacy permission errors', async () => {
    const controller = controllerRejecting(
      new McfPermissionDeniedError('secret internal permission policy'),
    );

    const rejection = await controller
      .createMission(input, mockRequest)
      .catch((error: unknown) => error);
    const exception = rejection as { getStatus(): number; getResponse(): unknown };
    expect(exception.getStatus()).toBe(403);
    expect(JSON.stringify(exception.getResponse())).not.toContain(
      'secret internal permission policy',
    );
  });

  it('applies the same 503 mapping at the chat bridge entrypoint', async () => {
    const bridge = new ChatRuntimeBridgeController({
      dispatch: vi
        .fn()
        .mockRejectedValue(
          new MissionV11ContextError('PROJECT_ARTIFACT_ROOT_UNAVAILABLE', 'sensitive path'),
        ),
    } as unknown as ChatRuntimeBridgeService);
    const rejection = await bridge
      .dispatch({ objective: 'Open a governed MCF implementation mission.' }, mockRequest)
      .catch((error: unknown) => error);

    expect(rejection).toBeInstanceOf(ServiceUnavailableException);
    const exception = rejection as ServiceUnavailableException;
    expect(exception.getResponse()).toMatchObject({
      code: 'MCF_V11_CONTEXT_UNAVAILABLE',
      correlationId: 'staging-context-001',
    });
    expect(JSON.stringify(exception.getResponse())).not.toContain('sensitive path');
  });
});
