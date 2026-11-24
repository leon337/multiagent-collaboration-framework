import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { McfToolReceipt } from '@rsa/contracts';

import { AdapterRegistry } from './adapter-registry.js';
import {
  AstryxCliDiscoveryAdapter,
  ASTRYX_PROVIDER,
  ASTRYX_RESOURCE,
  ASTRYX_SKILL,
} from './astryx-cli-discovery.adapter.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import type {
  McfEventRecord,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
  PersistMcfExecutionInput,
} from './mcf-runtime.repository.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

beforeEach(() => {
  process.env.DATABASE_URL = 'postgres://127.0.0.1:5432/mcf';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

class InMemoryRuntimeRepository implements McfRuntimeRepository {
  private mission: McfMissionRecord | null = null;
  private phase: McfPhaseRecord | null = null;
  private events: McfEventRecord[] = [];
  persisted: PersistMcfExecutionInput | null = null;

  async createMission(input: Parameters<McfRuntimeRepository['createMission']>[0]) {
    this.mission = input.mission;
    this.events.push({ ...input.event });
    return input.mission;
  }

  async findMission(missionId: string) {
    return this.mission?.id === missionId ? this.mission : null;
  }

  async findPhase(missionId: string, phaseId: string) {
    return this.phase?.missionId === missionId && this.phase.id === phaseId ? this.phase : null;
  }

  async persistExecution(input: PersistMcfExecutionInput) {
    if (!this.mission || this.mission.id !== input.missionId) {
      throw new Error('mission missing');
    }
    this.persisted = input;
    this.phase = input.phase;
    this.events.push(...input.events.map((event) => ({ ...event })));
    this.mission = {
      ...this.mission,
      state: input.missionState,
      currentPhaseId: input.phase.id,
      currentAgentId: input.nextAgentId,
      version: this.mission.version + 1,
      updatedAt: input.phase.updatedAt,
    };
    return { mission: this.mission, phase: input.phase };
  }

  async completePendingPhase(): Promise<never> {
    throw new Error('not used by Astryx discovery E2E');
  }

  async listEvents(missionId: string) {
    return this.events.filter((event) => event.missionId === missionId);
  }
}

class InMemoryExternalLedger {
  receipt: McfToolReceipt | null = null;
  validatedReceiptId: string | null = null;
  failures: string[] = [];

  async reserve() {
    return 'attempt-astryx-discovery-e2e-0001';
  }

  async recordExecuted(_attemptId: string, receipt: McfToolReceipt) {
    this.receipt = receipt;
  }

  async recordEvidenceValidated(_attemptId: string, receiptId: string) {
    this.validatedReceiptId = receiptId;
  }

  async recordEvidenceRejected(_attemptId: string, _receiptId: string | null, reason: string) {
    this.failures.push(reason);
  }

  async recordFailed(_attemptId: string, failure: { message: string }) {
    this.failures.push(failure.message);
  }

  async recordUnknown() {
    throw new Error('unexpected UNKNOWN state');
  }

  async recordExecuting() {}
  async recordReconciliationPrepared() {}
}

async function createWorkspace(): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'astryx-runtime-e2e-'));
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

function cliResponse(type: string, data: Record<string, unknown>): string {
  return JSON.stringify({
    apiVersion: 1,
    type,
    data: type === 'component.list' ? { detail: 'names', ...data } : data,
    meta: {
      answeredBy: {
        cli: '0.7.2',
        core: '0.7.2',
        copy: 'project',
      },
    },
  });
}

function runtime(
  workspace: string,
  enabled: boolean,
  runner: (
    binary: string,
    args: string[],
    options: unknown,
  ) => Promise<{
    stdout: string;
    stderr: string;
  }>,
) {
  const evidence = new EvidenceValidator();
  const adapter = new AstryxCliDiscoveryAdapter(evidence, enabled, workspace, runner);
  const adapters = new AdapterRegistry([adapter]);
  const ledger = new InMemoryExternalLedger();
  const dispatcher = new ExternalActionDispatcher(
    adapters,
    ledger as unknown as ExternalActionLedger,
  );
  const registry = new SkillRegistryLoader();
  const executor = new SkillExecutor(registry, new PermissionEngine(), evidence, dispatcher);
  const repository = new InMemoryRuntimeRepository();
  const service = new MissionRuntimeService(repository, executor, registry, evidence);
  return { service, repository, ledger };
}

async function createAstryxMission(service: MissionRuntimeService) {
  return service.createMission({
    contract: {
      title: 'MCF Astryx component discovery runtime E2E',
      objective: 'Validar o caminho governado de descoberta de componentes Astryx.',
      expectedOutcome: 'MissionRuntime executa o adapter, valida receipt e persiste evidências.',
      scope: [ASTRYX_SKILL],
      outOfScope: ['scaffolding', 'file_write', 'backend_generation', 'production_deploy'],
      acceptanceCriteria: [
        'fixed_readonly_cli_command',
        'project_cli_and_core_versions_verified',
        'signed_receipt_semantically_valid',
        'evidence_persisted_in_runtime_ledger',
      ],
      riskClass: 'B',
      selectedAgents: ['Mestre'],
      selectedSkills: [ASTRYX_SKILL],
      sourceOfTruth: ['skills/registry.yaml', 'docs/operations/MCF-ASTRYX-CLI-ADAPTER.md'],
    },
  });
}

describe('MCF Astryx component discovery canonical runtime E2E', () => {
  let workspace: string | undefined;

  afterEach(async () => {
    if (workspace) {
      await rm(workspace, { recursive: true, force: true });
    }
    workspace = undefined;
  });

  it('executes MissionRuntime → SkillExecutor → Dispatcher → Adapter → EvidenceValidator', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn(async (binary: string, args: string[]) => {
      expect(binary).toBe(process.execPath);
      expect(args).toEqual([localCliBinary(workspace!), '--json', 'component', '--list']);
      return {
        stdout: cliResponse('component.list', { components: { actions: [] } }),
        stderr: '',
      };
    });
    const { service, repository, ledger } = runtime(workspace, true, runner);
    const mission = await createAstryxMission(service);

    const result = await service.executePhase(mission.id, {
      phaseId: randomUUID(),
      skillId: ASTRYX_SKILL,
      agentId: 'Mestre',
      expectedMissionVersion: 1,
      inputs: {},
      tool: {
        provider: ASTRYX_PROVIDER,
        operation: 'list-components',
        resource: ASTRYX_RESOURCE,
      },
    });

    expect(result).toMatchObject({
      phaseState: 'COMPLETED',
      evidenceStatus: 'VALID',
    });
    expect(result.receipt?.metadata).toMatchObject({
      cliPackage: '@astryxdesign/cli',
      corePackage: '@astryxdesign/core',
      cliVersion: '0.7.2',
      coreVersion: '0.7.2',
      corePackageRoot: join(workspace, 'node_modules', '@astryxdesign', 'core'),
      cliCopy: 'project',
      readOnly: true,
      exitCode: 0,
    });
    expect(result.selectedSkill.requiredEvidence).toContain('corePackageRoot');
    expect(ledger.receipt?.receiptId).toBe(result.receipt?.receiptId);
    expect(ledger.validatedReceiptId).toBe(result.receipt?.receiptId);
    expect(ledger.failures).toEqual([]);
    expect(repository.persisted?.receipt?.receiptId).toBe(result.receipt?.receiptId);
    expect(repository.persisted?.externalAttemptId).toBe('attempt-astryx-discovery-e2e-0001');

    const timeline = await service.timeline(mission.id);
    const eventTypes = timeline.events.map((event) => event.eventType);
    expect(eventTypes).toContain('TOOL_RECEIPT_RECORDED');
    expect(eventTypes).toContain('EVIDENCE_VALIDATED');
    expect(eventTypes).toContain('PHASE_COMPLETED');
  });

  it('executes a scaffold proposal through MissionRuntime and validates its disposable diff receipt', async () => {
    workspace = await createWorkspace();
    const source = 'export function Pilot() { return <main>pilot</main>; }\\n';
    const runner = vi.fn(async (binary: string, args: string[], options: unknown) => {
      const cwd = (options as { cwd: string }).cwd;
      expect(binary).toBe(process.execPath);
      expect(args).toEqual([
        localCliBinary(workspace!),
        '--json',
        'template',
        'Dashboard',
        'src/astryx-pilot/Pilot.tsx',
      ]);
      const target = join(cwd, 'src/astryx-pilot/Pilot.tsx');
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, source);
      return {
        stdout: cliResponse('template.copy', {
          filesCopied: 1,
          fileName: 'Pilot.tsx',
          outputDir: dirname(target),
        }),
        stderr: '',
      };
    });
    const { service, repository, ledger } = runtime(workspace, true, runner);
    const mission = await service.createMission({
      contract: {
        title: 'MCF Astryx disposable scaffold proposal E2E',
        objective: 'Gerar proposta de scaffold Astryx sem gravar no projeto alvo.',
        expectedOutcome: 'MissionRuntime valida receipt, digest e escopo do artefato temporário.',
        scope: [ASTRYX_SKILL],
        outOfScope: ['apply_scaffold', 'checkout_write', 'production_deploy'],
        acceptanceCriteria: [
          'proposal_only',
          'approved_paths_bound',
          'scratch_workspace_cleaned',
          'signed_diff_valid',
        ],
        riskClass: 'B',
        selectedAgents: ['Mestre'],
        selectedSkills: [ASTRYX_SKILL],
        sourceOfTruth: ['skills/registry.yaml', 'docs/operations/MCF-ASTRYX-CLI-ADAPTER.md'],
      },
    });
    const inputs = {
      templateId: 'Dashboard',
      targetPath: 'src/astryx-pilot/Pilot.tsx',
      baseCommitSha: 'a'.repeat(40),
      repository: 'leon337/multiagent-collaboration-framework',
      allowed_paths: ['src/astryx-pilot'],
    };

    const result = await service.executePhase(mission.id, {
      phaseId: randomUUID(),
      skillId: ASTRYX_SKILL,
      agentId: 'Mestre',
      expectedMissionVersion: 1,
      inputs,
      tool: {
        provider: ASTRYX_PROVIDER,
        operation: 'draft-template-scaffold',
        resource: ASTRYX_RESOURCE,
      },
    });

    expect(result).toMatchObject({ phaseState: 'COMPLETED', evidenceStatus: 'VALID' });
    expect(result.receipt).toMatchObject({
      operation: 'draft-template-scaffold',
      commitSha: 'a'.repeat(40),
      metadata: {
        proposalOnly: true,
        readOnly: false,
        writeMode: 'DISPOSABLE_PROPOSAL_ONLY',
        proposalWorkspaceCleaned: true,
        targetPath: inputs.targetPath,
        approvedPaths: inputs.allowed_paths,
        diffDigest: expect.stringMatching(/^[a-f0-9]{64}$/u),
      },
    });
    expect(
      Buffer.from(
        String((result.receipt?.metadata.sourceArtifact as { data: string }).data),
        'base64',
      ).toString('utf8'),
    ).toBe(source);
    expect(ledger.validatedReceiptId).toBe(result.receipt?.receiptId);
    expect(ledger.failures).toEqual([]);
    expect(repository.persisted?.evidenceStatus).toBe('VALID');
  });

  it('fails closed through MissionRuntime when the adapter is disabled', async () => {
    workspace = await createWorkspace();
    const runner = vi.fn(async () => ({
      stdout: cliResponse('component.list', { components: { actions: [] } }),
      stderr: '',
    }));
    const { service, repository, ledger } = runtime(workspace, false, runner);
    const mission = await createAstryxMission(service);

    const result = await service.executePhase(mission.id, {
      phaseId: randomUUID(),
      skillId: ASTRYX_SKILL,
      agentId: 'Mestre',
      expectedMissionVersion: 1,
      inputs: {},
      tool: {
        provider: ASTRYX_PROVIDER,
        operation: 'list-components',
        resource: ASTRYX_RESOURCE,
      },
    });

    expect(result).toMatchObject({
      phaseState: 'RECOVERING',
      evidenceStatus: 'INVALID',
    });
    expect(result.receipt).toBeNull();
    expect(runner).not.toHaveBeenCalled();
    expect(ledger.receipt).toBeNull();
    expect(ledger.validatedReceiptId).toBeNull();
    expect(repository.persisted?.evidenceStatus).toBe('INVALID');
    expect(repository.persisted?.externalAttemptId).toBe('attempt-astryx-discovery-e2e-0001');
  });
});
