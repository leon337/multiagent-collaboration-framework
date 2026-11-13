/** Manual notebook-only E2E: MCF_AGENT_BRIDGE_REAL_E2E=1. Never runs in CI by default. */
import type { McfSkillDefinition } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import { GovernedBrowserExternalAdapter } from './governed-browser.adapter.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-AUTONOMOUS-BROWSER-RESEARCH',
  name: 'Autonomous public browser',
  version: '0.1.0',
  purpose: 'Read public pages',
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
  forbiddenTools: ['login', 'form_submit', 'publication'],
  permissionProfile: 'READ_AND_PROPOSE',
  executionSteps: ['plan', 'navigate', 'verify', 'restore'],
  requiredEvidence: ['semantic_plan', 'page_hashes', 'restoration'],
  acceptanceCriteria: ['verified_navigation', 'workspace_restored'],
  failureModes: ['semantic_ambiguity', 'checkpoint_required'],
  fallback: 'Fail closed',
  handoffTo: 'Mestre',
};

const tool = {
  provider: 'mcf-agent-bridge',
  operation: 'inspect-governed-browser',
  resource: 'local-workspace',
};

describe('real local Agent Bridge through canonical SkillExecutor', () => {
  it.skipIf(process.env.MCF_AGENT_BRIDGE_REAL_E2E !== '1')(
    'navigates Github MCF and validates the signed receipt',
    async () => {
      const path = process.env.MCF_AGENT_BRIDGE_MISSION_SCRIPT;
      if (!path) throw new Error('MCF_AGENT_BRIDGE_MISSION_SCRIPT required');
      const attempts: string[] = [];
      const ledger = {
        reserve: vi.fn(async () => {
          attempts.push('reserve');
          return 'browser-real-attempt';
        }),
        recordExecuting: vi.fn(async () => {
          attempts.push('executing');
        }),
        recordReconciliationPrepared: vi.fn(async () => {
          attempts.push('prepared');
        }),
        recordExecuted: vi.fn(async () => {
          attempts.push('executed');
        }),
        recordEvidenceValidated: vi.fn(async () => {
          attempts.push('evidence_validated');
        }),
      } as unknown as ExternalActionLedger;
      const evidence = new EvidenceValidator();
      const adapter = new GovernedBrowserExternalAdapter(evidence, {
        enabled: true,
        scriptPath: path,
        timeoutMs: 90_000,
      });
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
        inputs: {
          missionId: 'mcf-browser-live-' + Date.now(),
          instanceId: 'notebook-team2',
          objective: 'Consultar a documentação oficial do MCF',
          startUrl: 'https://github.com/leon337/multiagent-collaboration-framework',
          allowedHosts: ['github.com'],
          waypoints: ['docs', 'MCF-CURRENT-STATE.md'],
          maxSteps: 4,
          authorizedScope: true,
          restoreWorkspace: true,
        },
        executionContext: {
          missionId: 'mcf-browser-local-live-integration',
          phaseId: 'browser-live-test-phase',
          expectedMissionVersion: 1,
        },
      });
      expect(response.phaseState).toBe('COMPLETED');
      expect(response.evidenceStatus).toBe('VALID');
      expect(response.receipt?.metadata.completedSteps).toBe(3);
      expect(response.receipt?.metadata.restored).toBe(true);
      expect(attempts).toEqual([
        'reserve',
        'executing',
        'prepared',
        'executed',
        'evidence_validated',
      ]);
    },
    120_000,
  );
});
