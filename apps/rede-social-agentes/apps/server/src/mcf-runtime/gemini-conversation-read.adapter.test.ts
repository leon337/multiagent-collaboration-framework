import { describe, expect, it, vi } from 'vitest';
import type { McfSkillDefinition } from '@rsa/contracts';
import type { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GeminiConversationReadAdapter,
  type GeminiConversationReadTransport,
} from './gemini-conversation-read.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-GEMINI-CONVERSATION-READ',
  name: 'read',
  version: '0.1.0',
  purpose: 'read',
  ownerAgents: ['Mestre'],
  requiredInputs: [],
  allowedTools: ['mcf-gemini-conversation'],
  forbiddenTools: [],
  permissionProfile: 'READ_ONLY',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'stop',
  handoffTo: 'Mestre',
};
const request = (): ExternalActionRequest => ({
  skill,
  agentId: 'Mestre',
  inputs: {
    mission_id: 'mission1',
    request_id: 'request1',
    correlation_id: 'correlation1',
    idempotency_key: 'key1',
    policy_scope: 'approved-conversation',
    evidence_ref: 'evidence1',
  },
  context: { missionId: 'mission1', phaseId: 'phase1', expectedMissionVersion: 1 },
  tool: {
    provider: 'mcf-gemini-conversation',
    resource: 'approved-conversation',
    operation: 'read-reply',
  },
});
const evidence = {
  createTrustedReceipt: (value: unknown) => value,
} as unknown as EvidenceValidator;
const transport = (changes: Record<string, unknown> = {}): GeminiConversationReadTransport => ({
  read: async (envelope) => ({
    ...envelope,
    identity_verified: true,
    conversation_verified: true,
    status: 'complete',
    reply: 'PRIVATE_CONTENT',
    ...changes,
  }),
});
const adapter = (t: GeminiConversationReadTransport = transport(), enabled = true) =>
  new GeminiConversationReadAdapter(evidence, enabled, t, 10);

describe('Gemini conversation read boundary', () => {
  it('allows only approved reads and emits a hash without private content', async () => {
    const a = adapter();
    const r = request();
    new PermissionEngine().assertAllowed(r.skill, r.agentId, r.tool, r.inputs);
    expect(a.supports(r)).toBe(true);
    const receipt = await a.execute(r);
    expect(JSON.stringify(receipt)).not.toContain('PRIVATE_CONTENT');
    expect(receipt.metadata).toMatchObject({
      status: 'complete',
      replySha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });
  it('fails closed when disabled or transport absent', async () => {
    await expect(adapter(transport(), false).execute(request())).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
    });
    await expect(
      new GeminiConversationReadAdapter(evidence, true).execute(request()),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
  });
  it.each(['agent', 'provider', 'resource', 'skill', 'permission', 'input', 'mission'])(
    'rejects spoofed %s',
    async (kind) => {
      const r = request();
      r.skill = { ...skill };
      if (kind === 'agent') r.agentId = 'Other';
      if (kind === 'provider') r.tool.provider = 'other';
      if (kind === 'resource') r.tool.resource = 'other';
      if (kind === 'skill') r.skill.skillId = 'OTHER';
      if (kind === 'permission') r.skill.permissionProfile = 'HUMAN_GATE';
      if (kind === 'input') r.inputs.humanGateApproved = true;
      if (kind === 'mission') r.inputs.mission_id = 'other';
      await expect(adapter().execute(r)).rejects.toBeDefined();
      if (!['input', 'mission'].includes(kind))
        expect(() =>
          new PermissionEngine().assertAllowed(r.skill, r.agentId, r.tool, r.inputs),
        ).toThrow();
    },
  );
  it.each([
    { identity_verified: false },
    { conversation_verified: false },
    { status: 'pending' },
    { status: 'unknown' },
    { reply: '' },
    { correlation_id: 'other' },
  ])('rejects unverified or incomplete transport data', async (changes) => {
    await expect(adapter(transport(changes)).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
  it('permits safe repeated reads but rejects an idempotency key with changed parameters', async () => {
    const a = adapter();
    await a.execute(request());
    await expect(a.execute(request())).resolves.toHaveProperty('status', 'SUCCEEDED');
    const different = request();
    different.inputs.request_id = 'otherRequest';
    await expect(a.execute(different)).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT' });
  });
  it('never retries a transport timeout', async () => {
    const read = vi.fn(() => new Promise<never>(() => {}));
    await expect(adapter({ read }).execute(request())).rejects.toMatchObject({
      code: 'ADAPTER_TIMEOUT',
      retryable: false,
    });
    expect(read).toHaveBeenCalledTimes(1);
  });
  it('reports an authenticated in-progress status without turning it into a complete reply', async () => {
    const read = async (envelope: unknown) => ({
      ...(envelope as object),
      identity_verified: true,
      conversation_verified: true,
      status: 'pending',
    });
    const r = request();
    r.tool.operation = 'read-status';
    const receipt = await adapter({ read }).execute(r);
    expect(receipt.metadata).toMatchObject({ status: 'pending', replySha256: null });
  });
  it('rejects sending and arbitrary identifiers in inputs', async () => {
    const r = request();
    r.tool.operation = 'send-message';
    expect(adapter().supports(r)).toBe(false);
    expect(() =>
      new PermissionEngine().assertAllowed(r.skill, r.agentId, r.tool, r.inputs),
    ).toThrow();
    r.tool.operation = 'read-status';
    r.inputs.url = 'https://example.invalid';
    await expect(adapter().execute(r)).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
  });
});
