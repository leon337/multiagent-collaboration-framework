import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  AstryxCliDiscoveryAdapter,
  ASTRYX_PROVIDER,
  ASTRYX_RESOURCE,
  ASTRYX_SKILL,
} from './astryx-cli-discovery.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const skill: McfSkillDefinition = {
  skillId: ASTRYX_SKILL,
  name: 'Astryx component discovery',
  version: '0.1.0',
  purpose: 'Discover Astryx visual components',
  ownerAgents: ['Mestre'],
  requiredInputs: [],
  allowedTools: [ASTRYX_PROVIDER],
  forbiddenTools: ['write', 'delete', 'publish', 'deploy'],
  permissionProfile: 'READ_ONLY',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Use another approved design system',
  handoffTo: 'Mestre',
};

const request = (
  operation = 'list-components',
  inputs: Record<string, unknown> = {},
): ExternalActionRequest => ({
  skill,
  agentId: 'Mestre',
  inputs,
  tool: {
    provider: ASTRYX_PROVIDER,
    operation,
    resource: ASTRYX_RESOURCE,
  },
});

function jsonResponse(
  type: string,
  data: Record<string, unknown>,
  copy = 'project',
  coreVersion = '0.7.2',
): string {
  return JSON.stringify({
    apiVersion: 1,
    type,
    data: type === 'component.list' ? { detail: 'names', ...data } : data,
    meta: {
      answeredBy: {
        cli: '0.7.2',
        core: coreVersion,
        copy,
      },
    },
  });
}

async function createWorkspace(): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'astryx-'));
  const packageRoot = join(workspace, 'node_modules', '@astryxdesign', 'cli');
  const binaryDirectory = join(packageRoot, 'clients', 'cli', 'bin');
  await mkdir(binaryDirectory, { recursive: true });
  await writeFile(
    join(packageRoot, 'package.json'),
    JSON.stringify({
      name: '@astryxdesign/cli',
      version: '0.7.2',
      bin: { astryx: './clients/cli/bin/astryx.mjs' },
    }),
  );
  await writeFile(join(binaryDirectory, 'astryx.mjs'), '#!/usr/bin/env node\n');
  const corePackageRoot = join(workspace, 'node_modules', '@astryxdesign', 'core');
  await mkdir(corePackageRoot, { recursive: true });
  await writeFile(
    join(corePackageRoot, 'package.json'),
    JSON.stringify({ name: '@astryxdesign/core', version: '0.7.2' }),
  );
  return workspace;
}

function localCliBinary(workspace: string): string {
  return join(
    workspace,
    'node_modules',
    '@astryxdesign',
    'cli',
    'clients',
    'cli',
    'bin',
    'astryx.mjs',
  );
}

const evidence = (): EvidenceValidator =>
  ({
    createTrustedReceipt: vi.fn((input) => ({
      ...input,
      receiptId: 'receipt',
      payloadDigest: 'digest',
      signature: 'sig',
    })),
  }) as unknown as EvidenceValidator;

describe('Astryx CLI discovery adapter', () => {
  let workspace: string | undefined;

  afterEach(async () => {
    if (workspace) {
      await rm(workspace, { recursive: true, force: true });
    }
    workspace = undefined;
  });

  it('supports only the exact skill/provider/resource/read operations', () => {
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, '/tmp');

    expect(subject.supports(request())).toBe(true);
    expect(subject.supports(request('read-component-docs', { componentName: 'Button' }))).toBe(
      true,
    );
    expect(subject.supports(request('publish'))).toBe(false);
    expect(
      subject.supports({
        ...request(),
        skill: { ...skill, skillId: 'MCF-START-MISSION' },
      }),
    ).toBe(false);
    expect(
      subject.supports({
        ...request(),
        tool: { ...request().tool, provider: 'shell' },
      }),
    ).toBe(false);
  });

  it('requires an explicit absolute workspace when enabled', async () => {
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, '', runner as never);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(runner).not.toHaveBeenCalled();
  });

  it('rejects a workspace inside the runtime checkout', async () => {
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, process.cwd(), runner as never);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(runner).not.toHaveBeenCalled();
  });

  it('fails closed while disabled without resolving or executing a CLI', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), false, workspace, runner as never);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
    });
    expect(runner).not.toHaveBeenCalled();
  });

  it('fails closed when the project-local CLI package is missing', async () => {
    workspace = await mkdtemp(join(tmpdir(), 'astryx-empty-'));
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner as never);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(runner).not.toHaveBeenCalled();
  });

  it('fails closed when the project-local Core package is missing', async () => {
    workspace = await createWorkspace();
    await rm(join(workspace, 'node_modules', '@astryxdesign', 'core'), {
      recursive: true,
      force: true,
    });
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner as never);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(runner).not.toHaveBeenCalled();
  });

  it('rejects a CLI-reported Core version that differs from the installed package', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn(async () => ({
      stdout: jsonResponse('component.list', { components: { actions: [] } }, 'project', '0.7.3'),
      stderr: '',
    }));
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('executes only the verified workspace-local binary and emits a trusted receipt', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn(async (binary: string, args: string[], options: unknown) => {
      expect(binary).toBe(process.execPath);
      expect(args).toEqual([localCliBinary(workspace!), '--json', 'component', '--list']);
      expect(options).toMatchObject({
        cwd: workspace,
        maxBuffer: 32_768,
        windowsHide: true,
      });
      return {
        stdout: jsonResponse('component.list', { components: { actions: [] } }),
        stderr: '',
      };
    });
    const validator = evidence();
    const subject = new AstryxCliDiscoveryAdapter(validator, true, workspace, runner);
    const receipt = await subject.execute(request());

    expect(receipt).toMatchObject({
      provider: ASTRYX_PROVIDER,
      operation: 'list-components',
      status: 'SUCCEEDED',
      metadata: {
        readOnly: true,
        cliPackage: '@astryxdesign/cli',
        corePackage: '@astryxdesign/core',
        cliVersion: '0.7.2',
        coreVersion: '0.7.2',
        cliCopy: 'project',
        cliPackageRoot: join(workspace, 'node_modules', '@astryxdesign', 'cli'),
        corePackageRoot: join(workspace, 'node_modules', '@astryxdesign', 'core'),
        cliBinary: localCliBinary(workspace),
        stdout: jsonResponse('component.list', { components: { actions: [] } }),
      },
    });
    expect(validator.createTrustedReceipt).toHaveBeenCalledTimes(1);
  });

  it('uses documented detail options and preserves the requested resource in receipts', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn(async (_binary: string, args: string[]) => {
      expect(args).toEqual([
        localCliBinary(workspace!),
        '--json',
        'component',
        'Button',
        '--detail',
        'compact',
      ]);
      return { stdout: jsonResponse('component.detail', { name: 'Button' }), stderr: '' };
    });
    const validator = evidence();
    const subject = new AstryxCliDiscoveryAdapter(validator, true, workspace, runner);
    const aliasRequest = {
      ...request('read-component-docs', { componentName: 'Button' }),
      tool: {
        ...request('read-component-docs').tool,
        resource: 'Astryx Design System',
      },
    };

    await subject.execute(aliasRequest);
    expect(validator.createTrustedReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ resource: 'Astryx Design System' }),
    );
  });

  it('truncates stderr at a valid UTF-8 byte boundary', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn(async () => ({
      stdout: jsonResponse('component.list', { components: { actions: [] } }),
      stderr: 'é'.repeat(1_500),
    }));
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner);
    const receipt = await subject.execute(request());

    expect(Buffer.byteLength(String(receipt.metadata.stderr), 'utf8')).toBe(2_048);
    expect(receipt.metadata.stderr).toBe('é'.repeat(1_024));
  });

  it('classifies the Node execFile SIGTERM timeout as retryable', async () => {
    workspace = await createWorkspace();
    const timeout = Object.assign(new Error('command timed out'), {
      killed: true,
      signal: 'SIGTERM',
    });
    const runner = vi.fn(async () => {
      throw timeout;
    });
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'ADAPTER_TIMEOUT',
      retryable: true,
    });
  });

  it('rejects global or fallback CLI provenance', async () => {
    workspace = await createWorkspace();
    const untrusted = jsonResponse('component.list', { components: {} }, 'global');
    const runner = vi.fn(async () => ({ stdout: untrusted, stderr: '' }));
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects CLI output above the configured byte limit', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn(async () => ({ stdout: 'x'.repeat(32_769), stderr: '' }));
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner);

    await expect(subject.execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('validates component names before passing them as CLI arguments', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn();
    const subject = new AstryxCliDiscoveryAdapter(evidence(), true, workspace, runner as never);

    await expect(
      subject.execute(request('read-component-docs', { componentName: 'Button; rm -rf /' })),
    ).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(runner).not.toHaveBeenCalled();
  });

  it('enforces the same readonly boundary in PermissionEngine', () => {
    const permissions = new PermissionEngine();

    expect(() => permissions.assertAllowed(skill, 'Mestre', request().tool, {})).not.toThrow();
    expect(() => permissions.assertAllowed(skill, 'Mestre', request('publish').tool, {})).toThrow();
    expect(() =>
      permissions.assertAllowed(skill, 'Mestre', { ...request().tool, resource: 'other' }, {}),
    ).toThrow();
  });
});
