import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';
import type { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { AstryxCliDiscoveryAdapter, ASTRYX_PROVIDER, ASTRYX_RESOURCE, ASTRYX_SKILL } from './astryx-cli-discovery.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const skill: McfSkillDefinition = {
  skillId: ASTRYX_SKILL, name: 'Full-stack visual development', version: '0.1.0',
  purpose: 'Discover Astryx visual components', ownerAgents: ['Mestre'], requiredInputs: [],
  allowedTools: [ASTRYX_PROVIDER], forbiddenTools: ['write', 'delete', 'publish', 'deploy'],
  permissionProfile: 'READ_ONLY', executionSteps: [], requiredEvidence: [],
  acceptanceCriteria: [], failureModes: [], fallback: 'Use another approved design system',
  handoffTo: 'Mestre',
};
const request = (operation = 'list-components', inputs: Record<string, unknown> = {}): ExternalActionRequest => ({
  skill, agentId: 'Mestre', inputs,
  tool: { provider: ASTRYX_PROVIDER, operation, resource: ASTRYX_RESOURCE },
});
const evidence = (): EvidenceValidator => ({
  createTrustedReceipt: vi.fn((input) => ({ ...input, receiptId: 'receipt', payloadDigest: 'digest', signature: 'sig' })),
}) as unknown as EvidenceValidator;

describe('Astryx CLI discovery adapter', () => {
  let workspace: string | undefined;
  afterEach(async () => { if (workspace) await rm(workspace, { recursive: true, force: true }); workspace = undefined; });

  it('supports only the exact skill/provider/resource/read operations', () => {
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, '/tmp');
    expect(subject.supports(request())).toBe(true);
    expect(subject.supports(request('read-component-docs', { componentName: 'Button' }))).toBe(true);
    expect(subject.supports(request('publish'))).toBe(false);
    expect(subject.supports({ ...request(), skill: { ...skill, skillId: 'MCF-START-MISSION' } })).toBe(false);
    expect(subject.supports({ ...request(), tool: { ...request().tool, provider: 'shell' } })).toBe(false);
  });

  it('fails closed while disabled without executing a command', async () => {
    workspace = await mkdtemp(join(tmpdir(), 'astryx-'));
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), false, workspace, 'astryx', runner as never);
    await expect(subject.execute(request())).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
    expect(runner).not.toHaveBeenCalled();
  });

  it('executes a fixed allowlisted component-list command and emits a trusted readonly receipt', async () => {
    workspace = await mkdtemp(join(tmpdir(), 'astryx-'));
    const runner = vi.fn(async (_binary: string, args: readonly string[], options: unknown) => {
      expect(args).toEqual(['component', '--list']);
      expect(options).toMatchObject({ cwd: workspace, maxBuffer: 32768, windowsHide: true });
      return { stdout: 'Button\nCard\nDialog', stderr: '' };
    });
    const validator = evidence();
    const subject = new AstryxCliDiscoveryAdapter(validator, true, workspace, 'astryx', runner);
    const receipt = await subject.execute(request());
    expect(receipt).toMatchObject({ provider: ASTRYX_PROVIDER, operation: 'list-components', status: 'SUCCEEDED', metadata: { readOnly: true, stdout: 'Button\nCard\nDialog' } });
    expect(validator.createTrustedReceipt).toHaveBeenCalledTimes(1);
  });

  it('validates component names before passing them as CLI arguments', async () => {
    workspace = await mkdtemp(join(tmpdir(), 'astryx-'));
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, 'astryx', runner as never);
    await expect(subject.execute(request('read-component-docs', { componentName: 'Button; rm -rf /' }))).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(runner).not.toHaveBeenCalled();
  });

  it('enforces the same readonly boundary in PermissionEngine', () => {
    const permissions = new PermissionEngine();
    expect(() => permissions.assertAllowed(skill, 'Mestre', request().tool, {})).not.toThrow();
    expect(() => permissions.assertAllowed(skill, 'Mestre', request('publish').tool, {})).toThrow();
    expect(() => permissions.assertAllowed(skill, 'Mestre', { ...request().tool, resource: 'other' }, {})).toThrow();
  });
});
