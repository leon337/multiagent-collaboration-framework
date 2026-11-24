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
  process.env.DATABASE_URL = 'postgres://127.0.0.1:5432/mcf';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

const skill: McfSkillDefinition = {
  skillId: ASTRYX_SKILL,
  name: 'Astryx visual discovery and scaffold proposal',
  version: '0.1.0',
  purpose:
    'Discover components and templates and propose scaffolds in disposable workspaces through the pinned project-local Astryx CLI.',
  ownerAgents: ['Mestre'],
  requiredInputs: [],
  allowedTools: [ASTRYX_PROVIDER],
  forbiddenTools: ['write', 'delete', 'publish', 'deploy'],
  permissionProfile: 'READ_AND_PROPOSE',
  executionSteps: ['list_components'],
  requiredEvidence: ['signed_json_output', 'project_package_provenance'],
  acceptanceCriteria: ['receipt_semantically_valid'],
  failureModes: ['cli_unavailable', 'invalid_package_provenance'],
  fallback: 'Stop and report the missing Astryx dependency.',
  handoffTo: 'Mestre',
};

// The Foundation workflow installs the pinned CLI/Core packages in RUNNER_TEMP.
const realCliTest = process.env.MCF_ASTRYX_REAL_CLI_WORKSPACE ? it : it.skip;

describe('Astryx pinned CLI real integration', () => {
  realCliTest(
    'discovers template source/skeleton and produces a disposable scaffold proposal',
    async () => {
      const workspace = process.env.MCF_ASTRYX_REAL_CLI_WORKSPACE;
      if (!workspace) return;

      const evidence = new EvidenceValidator();
      const adapter = new AstryxCliDiscoveryAdapter(evidence, true, workspace, undefined, 30_000);
      const permissions = new PermissionEngine();
      const run = async (operation: string, inputs: Record<string, unknown> = {}) => {
        const request: ExternalActionRequest = {
          skill,
          agentId: 'Mestre',
          inputs,
          tool: { provider: ASTRYX_PROVIDER, operation, resource: ASTRYX_RESOURCE },
        };
        permissions.assertAllowed(skill, 'Mestre', request.tool, request.inputs);
        const receipt = await adapter.execute(request);
        evidence.verifyForSkill(receipt, request.tool, skill, request.inputs);
        return receipt;
      };

      const catalog = await run('list-templates');
      const envelope = JSON.parse(String(catalog.metadata.stdout)) as {
        data: unknown;
      };
      const rows = Array.isArray(envelope.data)
        ? envelope.data
        : envelope.data &&
            typeof envelope.data === 'object' &&
            'templates' in envelope.data &&
            Array.isArray((envelope.data as { templates: unknown[] }).templates)
          ? (envelope.data as { templates: unknown[] }).templates
          : [];
      const candidate = rows.find(
        (entry) =>
          entry && typeof entry === 'object' && (entry as { isReady?: unknown }).isReady !== false,
      ) as { id?: unknown; templateId?: unknown; name?: unknown } | undefined;
      const templateId = candidate?.id ?? candidate?.templateId ?? candidate?.name;
      if (typeof templateId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u.test(templateId)) {
        throw new Error('Pinned Astryx CLI returned no ready template with a stable identifier');
      }

      const source = await run('read-template-source', { templateId });
      const skeleton = await run('read-template-skeleton', { templateId });
      const proposal = await run('draft-template-scaffold', {
        templateId,
        targetPath: 'src/astryx-pilot/Scaffold.tsx',
        baseCommitSha: process.env.GITHUB_SHA ?? 'a'.repeat(40),
        repository: 'leon337/multiagent-collaboration-framework',
        allowed_paths: ['src/astryx-pilot'],
      });

      expect(source.metadata).toMatchObject({ readOnly: true, templateId });
      expect(skeleton.metadata).toMatchObject({ readOnly: true, templateId });
      expect(proposal).toMatchObject({
        provider: ASTRYX_PROVIDER,
        operation: 'draft-template-scaffold',
        status: 'SUCCEEDED',
        metadata: {
          readOnly: false,
          proposalOnly: true,
          writeMode: 'DISPOSABLE_PROPOSAL_ONLY',
          proposalWorkspaceCleaned: true,
          templateId,
          targetPath: 'src/astryx-pilot/Scaffold.tsx',
        },
      });
      expect(proposal.metadata.diffDigest).toMatch(/^[a-f0-9]{64}$/u);
      expect(Number(proposal.metadata.outputBytes)).toBeGreaterThan(0);
    },
  );

  realCliTest('executes the pinned project CLI and validates its signed JSON receipt', async () => {
    const workspace = process.env.MCF_ASTRYX_REAL_CLI_WORKSPACE;
    if (!workspace) return;

    const evidence = new EvidenceValidator();
    const adapter = new AstryxCliDiscoveryAdapter(evidence, true, workspace, undefined, 30_000);
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
    const command = receipt.metadata.command as string[];
    expect(command[0]).toBe(process.execPath);
    expect(command[1]).toBe(receipt.metadata.cliBinary);
    expect(command[1]).toContain('/node_modules/@astryxdesign/cli/');
    expect(command.slice(2)).toEqual(['--json', 'component', '--list']);

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
