import { beforeEach, describe, expect, it } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';

import {
  AstryxCliDiscoveryAdapter,
  ASTRYX_PROVIDER,
  ASTRYX_RESOURCE,
  ASTRYX_SKILL,
} from './astryx-cli-discovery.adapter.js';
import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { PermissionEngine } from './permission-engine.js';

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

const skill: McfSkillDefinition = {
  skillId: ASTRYX_SKILL,
  name: 'Astryx component discovery',
  version: '0.1.0',
  purpose: 'Discover components through the pinned project-local Astryx CLI.',
  ownerAgents: ['Mestre'],
  requiredInputs: [],
  allowedTools: [ASTRYX_PROVIDER],
  forbiddenTools: ['write', 'delete', 'publish', 'deploy'],
  permissionProfile: 'READ_ONLY',
  executionSteps: ['list_components'],
  requiredEvidence: ['signed_json_output', 'project_package_provenance'],
  acceptanceCriteria: ['receipt_semantically_valid'],
  failureModes: ['cli_unavailable', 'invalid_package_provenance'],
  fallback: 'Stop and report the missing Astryx dependency.',
  handoffTo: 'Mestre',
};

const realCliTest = process.env.MCF_ASTRYX_REAL_CLI_WORKSPACE ? it : it.skip;

describe('Astryx pinned CLI real integration', () => {
  realCliTest('executes the pinned project CLI and validates its signed JSON receipt', async () => {
    const workspace = process.env.MCF_ASTRYX_REAL_CLI_WORKSPACE;
    if (!workspace) return;

    const evidence = new EvidenceValidator();
    const adapter = new AstryxCliDiscoveryAdapter(
      evidence,
      true,
      workspace,
      'pnpm',
      undefined,
      30_000,
    );
    const request: ExternalActionRequest = {
      skill,
      agentId: 'Mestre',
      inputs: {},
      tool: {
        provider: ASTRYX_PROVIDER,
        operation: 'list-components',
        resource: ASTRYX_RESOURCE,
      },
    };

    new PermissionEngine().assertAllowed(skill, 'Mestre', request.tool, request.inputs);
    const receipt = await adapter.execute(request);
    evidence.verifyForSkill(receipt, request.tool, skill, request.inputs);

    expect(receipt.metadata.outputDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(Number(receipt.metadata.outputBytes)).toBeGreaterThan(0);
    expect(receipt.metadata.workspace).toBe(workspace);
    expect(receipt.metadata.workspace).not.toBe(process.cwd());
    expect(receipt.metadata.command).toEqual([
      'pnpm',
      'exec',
      'astryx',
      '--json',
      'component',
      '--list',
    ]);

    expect(receipt).toMatchObject({
      provider: ASTRYX_PROVIDER,
      operation: 'list-components',
      status: 'SUCCEEDED',
      metadata: {
        cliPackage: '@astryxdesign/cli',
        corePackage: '@astryxdesign/core',
        cliVersion: '0.7.17',
        coreVersion: '0.7.17',
        cliCopy: 'project',
        readOnly: true,
        exitCode: 0,
      },
    });
  });
});
