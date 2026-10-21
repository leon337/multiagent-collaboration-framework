import type { McfSkillDefinition } from '@rsa/contracts';
import { randomUUID } from 'node:crypto';
import { EvidenceValidator } from './evidence-validator.js';
import type { CanonicalBinding } from './mcf-browser-bridge.adapter.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdapterRegistry } from './adapter-registry.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { ExternalActionAdapterError } from './external-action.contracts.js';
import { McfBrowserBridgeAdapter } from './mcf-browser-bridge.adapter.js';

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

const skill: McfSkillDefinition = {
  skillId: 'MCF-WEB-INTERACT', name: 'Fixture candidate', version: '0.1.0', purpose: 'Test only',
  ownerAgents: ['Mestre', 'Rafael'], requiredInputs: ['target_url', 'interaction_goal', 'authorizedScope'],
  // Proposed permission exists only in this test, never in the canonical registry.
  allowedTools: ['mcf-browser-bridge'], forbiddenTools: ['credential_capture'],
  permissionProfile: 'SCOPED_WRITE', executionSteps: [], requiredEvidence: [],
  acceptanceCriteria: [], failureModes: [], fallback: 'Blocked', handoffTo: 'Beatriz',
};
function request(): ExternalActionRequest {
  return { skill, agentId: 'Rafael',
    inputs: { authorizedScope: true, target_url: 'file:///[LOCAL_FIXTURE]', interaction_goal: 'read-local-fixture' },
    tool: { provider: 'mcf-browser-bridge', operation: 'read-local-fixture', resource: 'mcf-synthetic-fixture' },
    context: { missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-04', expectedMissionVersion: 1 },
  };
}
const summary = { title: 'Synthetic', url: 'file:///[LOCAL_FIXTURE]', text: 'Fixture', truncated: false, visited: 1, untrusted: true };
function candidate(stdout = JSON.stringify(summary)) {
  const run = vi.fn().mockResolvedValue(stdout);
  return { run, adapter: new McfBrowserBridgeAdapter({ enabled: true, socketDir: '/tmp/mcf-fixture-test' }, { run }) };
}
describe('isolated Phase04 fixture adapter', () => {
  it('has no latent support by default and does not run', async () => {
    const adapter = new McfBrowserBridgeAdapter();
    expect(adapter.supports(request())).toBe(false);
    expect(new AdapterRegistry().resolve(request())).toBeNull();
    await expect(adapter.execute(request())).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
  });
  it.each(['agent', 'provider', 'operation', 'resource', 'skill'])('rejects wrong %s before running', async field => {
    const r = request();
    if (field === 'agent') r.agentId = 'Leandro';
    else if (field === 'skill') r.skill = { ...skill, skillId: 'MCF-RUN-TESTS' };
    else r.tool[field as 'provider' | 'operation' | 'resource'] = 'forbidden';
    const { adapter, run } = candidate();
    await expect(adapter.execute(r)).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
    expect(run).not.toHaveBeenCalled();
  });
  it.each([
    { authorizedScope: false }, { target_url: 'https://example.com' },
    { humanGateApproved: true }, { socketDir: '/tmp/attacker' },
  ])('rejects unscoped or arbitrary input %j', async patch => {
    const r = request(); Object.assign(r.inputs, patch);
    const { adapter, run } = candidate();
    await expect(adapter.execute(r)).rejects.toThrow();
    expect(run).not.toHaveBeenCalled();
  });
  it.each([undefined, { missionId: 'other', phaseId: 'PHASE-04', expectedMissionVersion: 1 },
    { missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-03', expectedMissionVersion: 1 },
    { missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-04', expectedMissionVersion: NaN },
  ])('rejects missing or mismatched canonical context', async context => {
    const r = request(); r.context = context;
    const { adapter, run } = candidate();
    await expect(adapter.execute(r)).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(run).not.toHaveBeenCalled();
  });
  it.each(['invalid json', '{}', JSON.stringify({ ...summary, untrusted: false }),
    JSON.stringify({ ...summary, url: 'https://example.com' }), 'x'.repeat(16_385),
  ])('rejects malformed, overbound or nonfixture summaries', async stdout => {
    await expect(candidate(stdout).adapter.execute(request())).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('does not mint trusted receipts even for valid Phase03 summaries', async () => {
    const { adapter, run } = candidate();
    expect(new AdapterRegistry([adapter]).resolve(request())).toBe(adapter);
    await expect(adapter.execute(request())).rejects.toThrow(/provenance/);
    expect(run).toHaveBeenCalledExactlyOnceWith('/tmp/mcf-fixture-test', expect.objectContaining({ missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-04', missionVersion: 1, actionId: expect.any(String) }));
  });
  it.each(['ADAPTER_TIMEOUT', 'ADAPTER_FAILURE'] as const)('propagates bounded host failure %s without retry', async code => {
    const run = vi.fn().mockRejectedValue(new ExternalActionAdapterError(code, 'Denied', false));
    const adapter = new McfBrowserBridgeAdapter({ enabled: true, socketDir: '/tmp/mcf-fixture-test' }, { run });
    await expect(adapter.execute(request())).rejects.toMatchObject({ code, retryable: false });
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('sanitizes unexpected runner errors', async () => {
    const adapter = new McfBrowserBridgeAdapter({ enabled: true, socketDir: '/tmp/mcf-fixture-test' },
      { run: async () => { throw Error('secret-token'); } });
    await expect(adapter.execute(request())).rejects.toThrow('Local fixture read denied; no retry');
  });
});

// Production broker routing generates the envelope; runner substitutes only the local transport.
async function correlatedRunner(patch: (v: any) => any = v => v) {
  const url = new URL('../../../../../mcf-browser-bridge/host/agent-broker.js', import.meta.url).href;
  const { routeAgentResult } = await import(url);
  return { run: vi.fn(async (_dir: string, canonical: CanonicalBinding) => {
    const now = Date.now(), consentRef = randomUUID();
    const envelope = routeAgentResult({ type: 'agent_read_result', protocolVersion: 2,
      canonical, actionId: canonical.actionId, consentRef, summary }, {
      grant: { ref: consentRef, expiresAt: now + 60000 },
      pending: { id: canonical.actionId, canonical, deadline: now + 4000 }, now,
    });
    return JSON.stringify(patch(envelope));
  }) };
}
describe('canonical correlated broker envelope', () => {
  it('mints and verifies a bounded receipt without page content or capability', async () => {
    const evidence = new EvidenceValidator(), r = request();
    const adapter = new McfBrowserBridgeAdapter({ enabled: true, socketDir: '/tmp/mcf-fixture-test' }, await correlatedRunner(), evidence);
    const receipt = await adapter.execute(r);
    expect(() => evidence.verifyForSkill(receipt, r.tool, r.skill, r.inputs, { agentId: r.agentId, executionContext: r.context })).not.toThrow();
    expect(receipt.metadata.summaryDigest).toMatch(/^[a-f0-9]{64}$/);
    for (const key of ['text','url','token','content']) expect(receipt.metadata).not.toHaveProperty(key);
    for (const metadata of [{ ...receipt.metadata, summaryDigest: '0'.repeat(64) },
      { ...receipt.metadata, missionVersion: 42 }, { ...receipt.metadata, expiresAt: Date.now() - 1 },
      { ...receipt.metadata, content: 'forged' }]) {
      const resigned = evidence.createTrustedReceipt({ ...receipt, metadata });
      expect(() => evidence.verifyForSkill(resigned, r.tool, r.skill, r.inputs, { agentId: r.agentId, executionContext: r.context })).toThrow();
    }
    expect(() => evidence.verifyForSkill(receipt, r.tool, r.skill, r.inputs)).toThrow();
  });
  it.each(['missionId','phaseId','actionId','missionVersion','expiry','consent','target'])('denies wrong %s', async field => {
    const runner = await correlatedRunner(v => {
      if (field === 'expiry') v.expiresAt = Date.now() - 1;
      else if (field === 'consent') v.consentRef = '';
      else if (field === 'target') v.target = 'https://example.com';
      else v.canonical[field] = field === 'missionVersion' ? 42 : 'wrong';
      return v;
    });
    const adapter = new McfBrowserBridgeAdapter({ enabled: true, socketDir: '/tmp/mcf-fixture-test' }, runner);
    await expect(adapter.execute(request())).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});

describe('experimental SkillExecutor gate', () => {
  it('denies with feature off and denies other operations even when explicitly enabled', async () => {
    const { SkillExecutor } = await import('./skill-executor.js');
    const { PermissionEngine } = await import('./permission-engine.js');
    const saved = { ...process.env };
    try {
      process.env.MCF_BROWSER_BRIDGE_ENABLED = 'true';
      process.env.MCF_BROWSER_BRIDGE_SAME_HOST = 'true';
      process.env.NODE_ENV = 'test';
      const executor = new SkillExecutor({ load: async () => skill } as any, new PermissionEngine(), new EvidenceValidator());
      const r = request();
      delete process.env.MCF_BROWSER_BRIDGE_SKILL_ENABLED;
      await expect(executor.execute({ skillId: skill.skillId, agentId: r.agentId, inputs: r.inputs, tool: r.tool, executionContext: r.context })).rejects.toThrow();
      process.env.MCF_BROWSER_BRIDGE_SKILL_ENABLED = 'true';
      await expect(executor.execute({ skillId: skill.skillId, agentId: r.agentId, inputs: r.inputs, tool: { ...r.tool, operation: 'write' }, executionContext: r.context })).rejects.toThrow();
    } finally {
      for (const key of ['MCF_BROWSER_BRIDGE_ENABLED','MCF_BROWSER_BRIDGE_SAME_HOST','MCF_BROWSER_BRIDGE_SKILL_ENABLED','NODE_ENV']) {
        if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
      }
    }
  });
});

// Regression: the runtime loads skills/registry.yaml rather than skills/web/*.yaml.
describe('canonical registry integration', () => {
  it('loads the real canonical skill registry with strict fixture-only permission', async () => {
    const { SkillRegistryLoader } = await import('./skill-registry.loader.js');
    const { PermissionEngine } = await import('./permission-engine.js');
    const loaded = await new SkillRegistryLoader().load('MCF-WEB-INTERACT');
    expect(loaded.ownerAgents).toContain('Rafael');
    expect(loaded.permissionProfile).toBe('SCOPED_WRITE');
    expect(() => new PermissionEngine().assertAllowed(loaded, 'Rafael', request().tool, request().inputs)).not.toThrow();
    expect(() => new PermissionEngine().assertAllowed(loaded, 'Rafael', request().tool, { ...request().inputs, target_url: 'https://example.com' })).toThrow();
  });
});
