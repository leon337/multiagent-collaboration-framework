import type { McfSkillDefinition } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';
import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GovernedBrowserExternalAdapter,
  parseBrowserMissionInputs,
  browserEvidenceDigest,
  type BrowserMissionInput,
  type BrowserMissionResult,
} from './governed-browser.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const repo = 'https://github.com/leon337/multiagent-collaboration-framework';
const docs = repo + '/tree/main/docs';
const skill: McfSkillDefinition = {
  skillId: 'MCF-AUTONOMOUS-BROWSER-RESEARCH',
  name: 'Navegação governada',
  version: '0.1.0',
  purpose: 'Pesquisa pública governada',
  ownerAgents: ['Mestre'],
  requiredInputs: [
    'missionId',
    'instanceId',
    'objective',
    'startUrl',
    'allowedHosts',
    'waypoints',
    'maxSteps',
    'authorizedScope',
    'restoreWorkspace',
  ],
  allowedTools: ['mcf-agent-bridge'],
  forbiddenTools: ['credential_capture', 'form_submit', 'login'],
  permissionProfile: 'READ_AND_PROPOSE',
  executionSteps: ['plan', 'navigate', 'observe', 'restore'],
  requiredEvidence: ['step_receipts', 'text_digests', 'restoration'],
  acceptanceCriteria: ['verified', 'scope_preserved'],
  failureModes: ['recovery_required', 'unsafe_scope'],
  fallback: 'Fail closed',
  handoffTo: 'Mestre',
};

const inputs: BrowserMissionInput = {
  missionId: 'mcf-browser-t1',
  instanceId: 'notebook-team2',
  objective: 'Examinar a documentação do MCF',
  startUrl: repo,
  allowedHosts: ['github.com'],
  waypoints: ['docs'],
  maxSteps: 3,
  authorizedScope: true,
  restoreWorkspace: true,
};
const tool = {
  provider: 'mcf-agent-bridge',
  operation: 'inspect-governed-browser',
  resource: 'local-workspace',
};

function result(): BrowserMissionResult {
  const value: BrowserMissionResult = {
    schema: 'mcf-governed-browser-mission/v1',
    missionId: inputs.missionId,
    instanceId: inputs.instanceId,
    status: 'COMPLETED',
    verified: true,
    restored: true,
    completedSteps: 2,
    evidenceDigest: 'a'.repeat(64),
    failureCode: null,
    events: [
      { kind: 'NAVIGATION_PLANNED', step: 0, url: repo },
      {
        kind: 'NAVIGATION_VERIFIED',
        step: 0,
        url: repo,
        title: 'Repository',
        textLength: 280,
        textDigest: 'a'.repeat(64),
      },
      { kind: 'SEMANTIC_PLAN', step: 1, targetLabel: 'docs', url: docs },
      { kind: 'NAVIGATION_PLANNED', step: 1, url: docs },
      {
        kind: 'NAVIGATION_VERIFIED',
        step: 1,
        url: docs,
        title: 'docs',
        textLength: 140,
        textDigest: 'b'.repeat(64),
      },
      { kind: 'WORKSPACE_RESTORED' },
    ],
  };
  value.evidenceDigest = browserEvidenceDigest(value.events);
  return value;
}

function request(): ExternalActionRequest {
  return { skill, agentId: 'Mestre', tool, inputs: { ...inputs } };
}

describe('governed browser MCF permission boundary', () => {
  it('permits only a scoped public browser mission', () => {
    expect(() =>
      new PermissionEngine().assertAllowed(skill, 'Mestre', tool, { ...inputs }),
    ).not.toThrow();
    expect(() => parseBrowserMissionInputs({ ...inputs })).not.toThrow();
  });

  it('rejects unauthorized provider, operation, resource, identity and missing scope', () => {
    const engine = new PermissionEngine();
    for (const wrong of [
      { ...tool, provider: 'remote-desktop-commander' },
      { ...tool, operation: 'navigate' },
      { ...tool, resource: 'private-workspace' },
    ]) {
      expect(() => engine.assertAllowed(skill, 'Mestre', wrong, { ...inputs })).toThrow();
    }
    expect(() => engine.assertAllowed(skill, 'Rafael', tool, { ...inputs })).toThrow();
    expect(() =>
      engine.assertAllowed(skill, 'Mestre', tool, { ...inputs, authorizedScope: false }),
    ).toThrow();
    expect(() =>
      engine.assertAllowed(skill, 'Mestre', tool, { ...inputs, humanGateApproved: true }),
    ).toThrow();
  });

  it('rejects dangerous host, URL, waypoint, credential scopes and unexpected inputs', () => {
    for (const values of [
      { startUrl: 'http://github.com/' },
      { startUrl: 'https://github.com/login' },
      { startUrl: 'https://github.com/a?token=test' },
      { allowedHosts: ['127.0.0.1'], startUrl: 'https://127.0.0.1/' },
      { waypoints: ['delete account'] },
      { restoreWorkspace: false },
      { humanGateApproved: true },
      { maxSteps: 1 },
    ]) {
      expect(() => parseBrowserMissionInputs({ ...inputs, ...values })).toThrow();
    }
  });
});

describe('governed browser canonical adapter and evidence', () => {
  it('signs one verified local result via EvidenceValidator', async () => {
    const host = { run: vi.fn(async () => result()) };
    const evidence = new EvidenceValidator();
    const adapter = new GovernedBrowserExternalAdapter(
      evidence,
      { enabled: true, scriptPath: '/tmp/mock.py', timeoutMs: 60_000 },
      host,
    );
    const registry = new AdapterRegistry([adapter]);
    expect(registry.resolve(request())).toBe(adapter);
    const receipt = await adapter.execute(request());
    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.externalId).toBe(inputs.missionId);
    expect(receipt.metadata.restored).toBe(true);
    expect(host.run).toHaveBeenCalledWith(inputs);
    expect(() =>
      evidence.verifyForSkill(receipt, tool, skill, { ...inputs }, { agentId: 'Mestre' }),
    ).not.toThrow();
  });

  it('rejects false green from incomplete or unsafe execution result', async () => {
    const evidence = new EvidenceValidator();
    for (const change of [
      { verified: false },
      { restored: false },
      { status: 'RECOVERING' },
      { completedSteps: 1 },
      { failureCode: 'navigation_unknown' },
      { events: result().events.filter((event) => event.kind !== 'WORKSPACE_RESTORED') },
    ]) {
      const host = { run: vi.fn(async () => ({ ...result(), ...change })) };
      const adapter = new GovernedBrowserExternalAdapter(
        evidence,
        { enabled: true, scriptPath: '/tmp/mock.py', timeoutMs: 60_000 },
        host,
      );
      await expect(adapter.execute(request())).rejects.toThrow();
    }
  });

  it('denies disabled local runner and does not invoke it', async () => {
    const host = { run: vi.fn(async () => result()) };
    const adapter = new GovernedBrowserExternalAdapter(
      new EvidenceValidator(),
      { enabled: false, scriptPath: '', timeoutMs: 60_000 },
      host,
    );
    await expect(adapter.execute(request())).rejects.toThrow('disabled');
    expect(host.run).not.toHaveBeenCalled();
  });

  it('rejects a validly signed but semantically invalid receipt', async () => {
    const evidence = new EvidenceValidator();
    const adapter = new GovernedBrowserExternalAdapter(
      evidence,
      { enabled: true, scriptPath: '/tmp/mock.py', timeoutMs: 60_000 },
      { run: async () => result() },
    );
    const original = await adapter.execute(request());
    const tampered = evidence.createTrustedReceipt({
      provider: tool.provider,
      operation: tool.operation,
      resource: tool.resource,
      externalId: inputs.missionId,
      commitSha: null,
      observedAt: new Date().toISOString(),
      status: 'SUCCEEDED',
      metadata: { ...original.metadata, completedSteps: 1 },
    });
    expect(() =>
      evidence.verifyForSkill(tampered, tool, skill, { ...inputs }, { agentId: 'Mestre' }),
    ).toThrow('Governed browser');
  });
});

describe('governed browser complete MCF runtime dispatch path', () => {
  it('reserves, prepares, executes, signs, validates and persists evidence through SkillExecutor', async () => {
    const order: string[] = [];
    const ledger = {
      reserve: vi.fn(async () => {
        order.push('reserve');
        return 'attempt-browser-1';
      }),
      recordExecuting: vi.fn(async () => {
        order.push('executing');
      }),
      recordReconciliationPrepared: vi.fn(async () => {
        order.push('prepared');
      }),
      recordExecuted: vi.fn(async () => {
        order.push('executed');
      }),
      recordEvidenceValidated: vi.fn(async () => {
        order.push('evidence_validated');
      }),
    } as unknown as ExternalActionLedger;
    const evidence = new EvidenceValidator();
    const host = {
      run: vi.fn(async () => {
        order.push('browser');
        return result();
      }),
    };
    const adapter = new GovernedBrowserExternalAdapter(
      evidence,
      { enabled: true, scriptPath: '/tmp/mock.py', timeoutMs: 90_000 },
      host,
    );
    const dispatcher = new ExternalActionDispatcher(new AdapterRegistry([adapter]), ledger);
    const executor = new SkillExecutor(
      { load: async () => skill } as unknown as SkillRegistryLoader,
      new PermissionEngine(),
      evidence,
      dispatcher,
    );
    const response = await executor.execute({
      skillId: skill.skillId,
      agentId: 'Mestre',
      tool,
      inputs: { ...inputs },
      executionContext: {
        missionId: 'mcf-mission-test',
        phaseId: 'phase-test',
        expectedMissionVersion: 1,
      },
    });
    expect(response.phaseState).toBe('COMPLETED');
    expect(response.evidenceStatus).toBe('VALID');
    expect(response.receipt?.status).toBe('SUCCEEDED');
    expect(response.externalAction?.adapterId).toBe('mcf-governed-browser-local-v1');
    expect(order).toEqual([
      'reserve',
      'executing',
      'prepared',
      'browser',
      'executed',
      'evidence_validated',
    ]);
  });
});
