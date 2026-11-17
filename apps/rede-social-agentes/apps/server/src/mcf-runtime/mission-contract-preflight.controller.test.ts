import type { FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { MissionContractPreflightController } from './mission-contract-preflight.controller.js';
import {
  MissionV11ContextError,
  type MissionV11ContextGuard,
} from './mission-v11-context.guard.js';

const request = { id: 'mcf-context-preflight-001' } as FastifyRequest;
const contract = {
  title: 'Revisar contexto da missão MCF',
  objective: 'Verificar o alinhamento da metodologia com o PIP canônico.',
  expectedOutcome: 'Contrato de missão com contexto técnico revisado.',
  scope: ['Verificar o par PIP e recibo de alinhamento'],
  outOfScope: ['Não criar nem executar missão automaticamente'],
  acceptanceCriteria: ['Admissão do contexto validada'],
  riskClass: 'C',
  selectedAgents: ['Mestre'],
  selectedSkills: ['MCF-START-MISSION'],
  sourceOfTruth: ['repo://leon337/multiagent-collaboration-framework'],
  contractSchemaVersion: '1.1',
  projectId: 'multiagent-collaboration-framework',
  projectEntryMode: 'RESUME_MCF_PROJECT',
};
const verified = {
  contractSchemaVersion: '1.1',
  projectId: 'multiagent-collaboration-framework',
  projectEntryMode: 'RESUME_MCF_PROJECT',
  methodologyPin: { version: '1.1.0', immutableRef: 'git:verified-pin' },
  alignedPipRef: {
    artifactType: 'PROJECT_INTENT_PACKAGE',
    schemaVersion: '1',
    projectId: 'multiagent-collaboration-framework',
    revisionId: 'revision-verified',
    path: 'artifacts/projects/pip.json',
    contentDigest: 'sha256:verified',
    repository: 'leon337/multiagent-collaboration-framework',
    commitSha: null,
  },
};

describe('MissionContractPreflightController', () => {
  it('is protected by SessionAuthGuard rather than a Pet cookie', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      MissionContractPreflightController,
    ) as unknown[];
    expect(guards).toContain(SessionAuthGuard);
  });

  it('preflights an exact verified alignment pair without creating or executing a mission', async () => {
    const validate = vi.fn(async () => verified);
    const preflight = new MissionContractPreflightController({
      validate,
    } as unknown as MissionV11ContextGuard);
    await expect(preflight.preflight({ contract }, request)).resolves.toMatchObject({
      admissionContextState: 'PASS_VERIFIED',
      contextVerified: true,
      missionCreated: false,
      executionAuthorized: false,
      humanGateApproved: false,
      verifiedContext: verified,
    });
    expect(validate).toHaveBeenCalledOnce();
    expect(validate).toHaveBeenCalledWith(contract);
    expect('executePhase' in preflight).toBe(false);
    expect('createMission' in preflight).toBe(false);
  });

  it('rejects missing verified PIP and never reports import readiness', async () => {
    const validate = vi.fn(async () => {
      throw new MissionV11ContextError('ALIGNED_PIP_REQUIRED', 'missing PIP');
    });
    const preflight = new MissionContractPreflightController({
      validate,
    } as unknown as MissionV11ContextGuard);
    await expect(preflight.preflight({ contract }, request)).rejects.toMatchObject({
      status: 422,
    });
    expect(validate).toHaveBeenCalledOnce();
  });

  it('rejects invalid or underspecified contract before invoking context validation', async () => {
    const validate = vi.fn(async () => verified);
    const preflight = new MissionContractPreflightController({
      validate,
    } as unknown as MissionV11ContextGuard);
    await expect(preflight.preflight({ contract: { title: 'x' } }, request)).rejects.toThrow();
    expect(validate).not.toHaveBeenCalled();
  });
});
