import { describe, expect, it } from 'vitest';

import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  externalActionIdempotencyFingerprint,
  externalActionPrincipalMetadata,
} from './external-action-ledger.js';

function request(principalId: 'MESTRE' | 'LEO'): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-GIT-PR-RELEASE',
      name: 'Git PR Release',
      version: '1.0.0',
      purpose: 'test',
      ownerAgents: ['Gabriel'],
      requiredInputs: [],
      allowedTools: ['GitHub'],
      forbiddenTools: [],
      permissionProfile: 'SCOPED_WRITE',
      executionSteps: [],
      requiredEvidence: [],
      acceptanceCriteria: [],
      failureModes: [],
      fallback: 'test',
      handoffTo: 'Mestre',
    },
    agentId: 'Gabriel',
    inputs: { idempotency_key: 'principal-fingerprint-0001' },
    tool: {
      provider: 'github',
      operation: 'create-branch-pr',
      resource: 'leon337/multiagent-collaboration-framework',
    },
    context: { missionId: 'm1', phaseId: 'p1', expectedMissionVersion: 1 },
    executionPrincipal: {
      provider: 'github',
      principalId,
      externalActor: principalId === 'MESTRE' ? 'mcfmestreagent-svg' : 'mcfleoagent-ops',
      attributionMode: principalId === 'MESTRE' ? 'BOOTSTRAP_DELEGATED' : 'DIRECT',
    },
  };
}

describe('ExternalActionLedger execution principal attribution', () => {
  it('binds the execution principal into the idempotency fingerprint', () => {
    const mestre = externalActionIdempotencyFingerprint(
      request('MESTRE'),
      'github-branch-pr-write-v1',
      'principal-fingerprint-0001',
    );
    const leo = externalActionIdempotencyFingerprint(
      request('LEO'),
      'github-branch-pr-write-v1',
      'principal-fingerprint-0001',
    );

    expect(mestre).toMatch(/^[a-f0-9]{64}$/u);
    expect(leo).toMatch(/^[a-f0-9]{64}$/u);
    expect(mestre).not.toBe(leo);
  });

  it('emits non-secret principal metadata for durable audit events', () => {
    const metadata = externalActionPrincipalMetadata(request('MESTRE'));

    expect(metadata).toEqual({
      logicalAgentId: 'Gabriel',
      executionPrincipalId: 'MESTRE',
      externalActor: 'mcfmestreagent-svg',
      attributionMode: 'BOOTSTRAP_DELEGATED',
    });
    expect(JSON.stringify(metadata)).not.toMatch(/token|secret|credential/iu);
  });
});
