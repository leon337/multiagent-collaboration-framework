import { describe, expect, it, vi } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { GoogleBridgeReadAdapter } from './google-bridge-read.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const trace = '11111111-1111-4111-8111-111111111111';
const skill: McfSkillDefinition = {
  skillId: 'MCF-GOOGLE-CLOUD-READ',
  name: 'Google Cloud readonly', version: '0.1.0', purpose: 'Cloud discovery',
  ownerAgents: ['Mestre'], requiredInputs: [], allowedTools: ['mcf-google-bridge'],
  forbiddenTools: ['write', 'generate'], permissionProfile: 'READ_ONLY',
  executionSteps: [], requiredEvidence: [], acceptanceCriteria: [], failureModes: [],
  fallback: 'stop', handoffTo: 'Mestre',
};
function request(operation = 'list-projects'): ExternalActionRequest {
  return {
    skill, agentId: 'Mestre', inputs: { callerText: 'NEVER FORWARD TO GOOGLE' },
    tool: { provider: 'mcf-google-bridge', operation, resource: 'google-cloud' },
  };
}
function evidence(): EvidenceValidator {
  return {
    createTrustedReceipt: vi.fn((input) => ({ ...input, signature: 'test-signature', receiptId: trace, payloadDigest: 'test-digest' })),
  } as unknown as EvidenceValidator;
}
function bridgeResponse(operation: string, result: unknown): Response {
  return new Response(JSON.stringify({ trace_id: trace, operation, result }), { status: 200 });
}
function adapter(
  operation = 'google.cloud.projects',
  result: unknown = { projects: [{ projectId: 'mcf-potiguar-gemini-261109', displayName: 'MCF Potiguar Gemini', state: 'ACTIVE' }] },
) {
  const transport = vi.fn(async (_input: string, _init?: RequestInit) => bridgeResponse(operation, result));
  const evidenceValidator = evidence();
  return {
    transport,
    evidenceValidator,
    adapter: new GoogleBridgeReadAdapter(evidenceValidator, true, transport, async () => 'private-test-bearer'),
  };
}

describe('Google Bridge MCF read-only integration', () => {
  it('registers only the explicitly scoped skill, provider, resource and operations', () => {
    const { adapter: subject } = adapter();
    expect(subject.supports(request())).toBe(true);
    expect(subject.supports(request('status'))).toBe(true);
    expect(subject.supports(request('generate'))).toBe(false);
    expect(subject.supports({ ...request(), tool: { ...request().tool, provider: 'github' } })).toBe(false);
    expect(subject.supports({ ...request(), tool: { ...request().tool, resource: 'other' } })).toBe(false);
    expect(subject.supports({ ...request(), skill: { ...skill, skillId: 'MCF-START-MISSION' } })).toBe(false);
  });

  it('fails closed when not explicitly enabled, without contacting the Bridge', async () => {
    const { transport, evidenceValidator } = adapter();
    const subject = new GoogleBridgeReadAdapter(evidenceValidator, false, transport, async () => 'token');
    await expect(subject.execute(request())).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
    expect(transport).not.toHaveBeenCalled();
  });

  it('enforces the MCF PermissionEngine allowlist before execution', () => {
    const engine = new PermissionEngine();
    expect(() => engine.assertAllowed(skill, 'Mestre', request().tool, {})).not.toThrow();
    expect(() => engine.assertAllowed(skill, 'Mestre', request('status').tool, {})).not.toThrow();
    for (const operation of ['generate', 'write-project', 'delete', 'search-gmail']) {
      expect(() => engine.assertAllowed(skill, 'Mestre', request(operation).tool, {})).toThrow();
    }
    expect(() => engine.assertAllowed(skill, 'Mestre', { ...request().tool, resource: 'other' }, {})).toThrow();
    expect(() => engine.assertAllowed({ ...skill, skillId: 'MCF-START-MISSION' }, 'Mestre', request().tool, {})).toThrow();
  });

  it('lists projects through fixed loopback endpoint without forwarding arbitrary agent inputs', async () => {
    const { adapter: subject, transport, evidenceValidator } = adapter();
    const receipt = await subject.execute(request());
    expect(receipt).toMatchObject({
      provider: 'mcf-google-bridge', operation: 'list-projects', status: 'SUCCEEDED',
      externalId: trace,
      metadata: { readOnly: true, binding: 'loopback', projectCount: 1 },
    });
    expect(receipt.metadata.projects).toEqual([
      { projectId: 'mcf-potiguar-gemini-261109', displayName: 'MCF Potiguar Gemini', state: 'ACTIVE' },
    ]);
    expect(transport).toHaveBeenCalledTimes(1);
    const [endpoint, options] = transport.mock.calls[0]!;
    expect(endpoint).toBe('http://127.0.0.1:8755/v1/execute');
    expect(JSON.parse(String(options.body))).toEqual({ operation: 'google.cloud.projects', args: {} });
    expect(JSON.stringify(options)).not.toContain('NEVER FORWARD');
    expect(evidenceValidator.createTrustedReceipt).toHaveBeenCalledTimes(1);
  });

  it('maps health status without exposing credentials', async () => {
    const { adapter: subject } = adapter('google.status', {
      service: 'mcf-google-bridge', version: '0.1.0', oauthConnected: true, adcConfigured: true,
      fakeSensitiveKey: 'must-not-be-copied',
    });
    const receipt = await subject.execute(request('status'));
    expect(receipt.metadata).toMatchObject({ bridgeVersion: '0.1.0', adcConfigured: true, oauthConnected: true });
    expect(JSON.stringify(receipt)).not.toContain('must-not-be-copied');
  });

  it('rejects unexpected operation and malformed project data', async () => {
    const { adapter: wrongOperation } = adapter('google.gmail.search', { messages: [] });
    await expect(wrongOperation.execute(request())).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    const { adapter: malformedProject } = adapter('google.cloud.projects', {
      projects: [{ projectId: '../../invalid', displayName: 'x', state: 'ACTIVE' }],
    });
    await expect(malformedProject.execute(request())).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('does not include error response bodies or bearer secrets in failures', async () => {
    const transport = vi.fn(async () => new Response('secret remote error', { status: 401 }));
    const subject = new GoogleBridgeReadAdapter(evidence(), true, transport, async () => 'private-test-bearer');
    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED', statusCode: 401,
    });
    const huge = vi.fn(async () => new Response('X'.repeat(65_537), { status: 200 }));
    await expect(new GoogleBridgeReadAdapter(evidence(), true, huge, async () => 'token')
      .execute(request())).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});
