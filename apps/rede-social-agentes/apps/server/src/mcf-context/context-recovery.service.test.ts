import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { McfProjectCapsule, McfProjectRegistryEntry, McfTruthClaim } from '@rsa/contracts';
import { stringify } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';
import {
  ContextRecoveryService,
  type ContextRecoveryRequest,
  type ContextRecoveryServiceDependencies,
  type ContextRecoveryServiceOptions,
} from './context-recovery.service.js';
import { normalizeCapsuleClaims, normalizeRegistryClaims } from './truth-contract.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemaDirectory = join(repositoryRoot, 'schemas/context');
const canonicalRegistryRef = 'context/projects/multiagent-collaboration-framework.yaml';
const canonicalCapsuleRef = '.mcf/project-capsule.yaml';
const fixedDependencies: ContextRecoveryServiceDependencies = {
  now: () => '2026-08-23T04:00:00Z',
  receiptId: () => 'context-recovery-test-001',
};
const temporaryDirectories: string[] = [];

function registryEntry(
  overrides: {
    projectId?: string;
    canonicalRepository?: string;
    aliases?: string[];
    capsulePath?: string;
  } = {},
): McfProjectRegistryEntry {
  const projectId = overrides.projectId ?? 'multiagent-collaboration-framework';
  return {
    schema_version: 1,
    project: { id: projectId, lifecycle: 'REGISTERED' },
    identity: {
      canonical_repository:
        overrides.canonicalRepository ?? 'leon337/multiagent-collaboration-framework',
      aliases: overrides.aliases ?? ['MCF'],
    },
    ownership: { project_owner: 'LEANDRO' },
    context: {
      capsule_path: overrides.capsulePath ?? '.mcf/project-capsule.yaml',
      canonical_entrypoints: ['README.md', 'docs/MCF-CURRENT-STATE.md'],
    },
    freshness: {
      operational_state: 'LIVE_REQUIRED',
      project_identity: 'DURABLE',
    },
  };
}

function capsule(projectId = 'multiagent-collaboration-framework'): McfProjectCapsule {
  return {
    schema_version: 1,
    project_id: projectId,
    purpose: 'Governed multi-agent collaboration.',
    lifecycle: 'ACTIVE',
    snapshot: {
      current_workstream: 'context-fabric-cf0-cf1',
      current_status: 'CF0_CF1_IMPLEMENTATION_IN_PROGRESS',
      next_action: 'Complete repository-native recovery kernel',
      blockers: [],
    },
    sources: { current_state: 'docs/MCF-CURRENT-STATE.md' },
    observed_at: '2026-08-23T00:22:10-03:00',
  };
}

function createTemporaryRepository(): string {
  const root = mkdtempSync(join(tmpdir(), 'mcf-recovery-'));
  temporaryDirectories.push(root);
  return root;
}

function writeYaml(root: string, sourceRef: string, value: unknown): void {
  const path = join(root, sourceRef);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, stringify(value), 'utf8');
}

function service(
  options: Partial<ContextRecoveryServiceOptions> = {},
  dependencies: ContextRecoveryServiceDependencies = fixedDependencies,
): ContextRecoveryService {
  return new ContextRecoveryService(
    {
      repositoryRoot,
      schemaDirectory,
      registrySources: [
        {
          source_ref: canonicalRegistryRef,
          source_revision: 'registry-revision-input',
        },
      ],
      capsuleSourceRevisions: {
        [canonicalCapsuleRef]: 'capsule-revision-input',
      },
      ...options,
    },
    dependencies,
  );
}

function readOnlyRequest(overrides: Partial<ContextRecoveryRequest> = {}): ContextRecoveryRequest {
  return {
    project_hint: 'MCF',
    read_only: true,
    material_action: false,
    ...overrides,
  } as ContextRecoveryRequest;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('ContextRecoveryService repository-only kernel', () => {
  it('recovers MCF from Registry and Capsule for durable/snapshot-only read context', () => {
    const receipt = service().recover(readOnlyRequest());

    expect(receipt).toMatchObject({
      schema_version: 1,
      receipt_id: 'context-recovery-test-001',
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'RECOVERED',
      recovered_at: '2026-08-23T04:00:00Z',
      read_only: true,
      material_action: false,
      evidence_only: true,
    });
    expect(receipt.claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claim_key: 'project.id',
          value: 'multiagent-collaboration-framework',
          freshness: 'DURABLE',
        }),
        expect.objectContaining({
          claim_key: 'snapshot.current_status',
          freshness: 'SNAPSHOT',
          observed_at: '2026-08-28T09:24:53Z',
        }),
      ]),
    );

    const receiptValidator = new ContextSchemaValidator(
      join(schemaDirectory, 'context-recovery-receipt.schema.json'),
    );
    expect(receiptValidator.validate(receipt)).toEqual({ valid: true, errors: [] });
  });

  it('records both Registry and Capsule source revision inputs', () => {
    expect(service().recover(readOnlyRequest()).sources).toEqual([
      {
        role: 'REGISTRY',
        source_ref: canonicalRegistryRef,
        source_revision: 'registry-revision-input',
      },
      {
        role: 'CAPSULE',
        source_ref: canonicalCapsuleRef,
        source_revision: 'capsule-revision-input',
        observed_at: '2026-08-28T09:24:53Z',
      },
    ]);
  });

  it('treats prior Receipts as evidence only and never as recovery input', () => {
    const baseline = service().recover(readOnlyRequest());
    const requestWithUntrustedReceipt = {
      ...readOnlyRequest(),
      prior_receipt: {
        ...baseline,
        project_id: 'attacker-selected-project',
        owner: 'ATTACKER',
      },
    } as unknown as ContextRecoveryRequest;

    const recovered = service().recover(requestWithUntrustedReceipt);

    expect(recovered).toEqual(baseline);
    expect(recovered.evidence_only).toBe(true);
    expect('owner' in recovered).toBe(false);
    expect('source_of_truth' in recovered).toBe(false);
  });

  it('fails closed with AMBIGUOUS_CONTEXT for equally strong project candidates', () => {
    const root = createTemporaryRepository();
    const firstRef = 'context/projects/mcf.yaml';
    const secondRef = 'context/projects/mission-control.yaml';
    writeYaml(root, firstRef, registryEntry());
    writeYaml(
      root,
      secondRef,
      registryEntry({
        projectId: 'mission-control',
        canonicalRepository: 'leon337/mission-control',
        aliases: ['MCF'],
        capsulePath: '.mcf/mission-control.yaml',
      }),
    );

    const receipt = service({
      repositoryRoot: root,
      registrySources: [
        { source_ref: firstRef, source_revision: 'first-revision' },
        { source_ref: secondRef, source_revision: 'second-revision' },
      ],
      capsuleSourceRevisions: {},
    }).recover(readOnlyRequest());

    expect(receipt).toMatchObject({
      project_id: null,
      recovery_state: 'AMBIGUOUS_CONTEXT',
      evidence_only: true,
    });
    expect(receipt.warnings).toContain('AMBIGUOUS_PROJECT_HINT:mcf');
  });

  it('returns INVALID_CONTEXT for schema failure or Registry/Capsule identity mismatch', () => {
    const invalidRoot = createTemporaryRepository();
    const invalidRegistryRef = 'context/projects/invalid.yaml';
    writeYaml(invalidRoot, invalidRegistryRef, { schema_version: 1, project: {} });

    expect(
      service({
        repositoryRoot: invalidRoot,
        registrySources: [{ source_ref: invalidRegistryRef, source_revision: 'invalid-revision' }],
        capsuleSourceRevisions: {},
      }).recover(readOnlyRequest()),
    ).toMatchObject({ project_id: null, recovery_state: 'INVALID_CONTEXT' });

    const mismatchRoot = createTemporaryRepository();
    writeYaml(mismatchRoot, canonicalRegistryRef, registryEntry());
    writeYaml(mismatchRoot, canonicalCapsuleRef, capsule('other-project'));

    const mismatch = service({ repositoryRoot: mismatchRoot }).recover(readOnlyRequest());
    expect(mismatch).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'INVALID_CONTEXT',
    });
    expect(mismatch.warnings).toContain('REGISTRY_CAPSULE_PROJECT_ID_MISMATCH');
  });

  it('records Capsule evidence even when the loaded Capsule fails schema validation', () => {
    const root = createTemporaryRepository();
    writeYaml(root, canonicalRegistryRef, registryEntry());
    const invalidCapsule = { ...capsule() } as Partial<McfProjectCapsule>;
    delete invalidCapsule.observed_at;
    writeYaml(root, canonicalCapsuleRef, invalidCapsule);

    const receipt = service({ repositoryRoot: root }).recover(readOnlyRequest());

    expect(receipt.recovery_state).toBe('INVALID_CONTEXT');
    expect(receipt.sources).toContainEqual({
      role: 'CAPSULE',
      source_ref: canonicalCapsuleRef,
      source_revision: 'capsule-revision-input',
    });
  });

  it('fails closed for malformed runtime modes or absent requests', () => {
    for (const request of [
      null,
      {
        project_hint: 'MCF',
        read_only: true,
        material_action: true,
      },
    ]) {
      const receipt = service().recover(request as unknown as ContextRecoveryRequest);
      expect(receipt).toMatchObject({
        project_id: null,
        recovery_state: 'INVALID_CONTEXT',
        read_only: true,
        material_action: false,
      });
      expect(receipt.warnings).toContain('INVALID_RECOVERY_REQUEST_MODE');
    }
  });

  it('fails closed when an internal normalizer violates its typed boundary', () => {
    const invalidDependencies = {
      ...fixedDependencies,
      normalizeClaims: () => null,
    } as unknown as ContextRecoveryServiceDependencies;

    const receipt = service({}, invalidDependencies).recover(readOnlyRequest());

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'INVALID_CONTEXT',
    });
    expect(receipt.warnings).toContain('TRUTH_NORMALIZATION_INVALID_RESULT');
  });

  it('bounds schema warnings and returns a valid fail-closed Receipt', () => {
    const root = createTemporaryRepository();
    const invalidRegistry = registryEntry() as unknown as Record<string, unknown>;
    (invalidRegistry.identity as Record<string, unknown>).aliases = Array.from(
      { length: 300 },
      (_, index) => index,
    );
    writeYaml(root, canonicalRegistryRef, invalidRegistry);

    const recovery = service({ repositoryRoot: root });
    const receipt = recovery.recover(readOnlyRequest());

    expect(receipt).toMatchObject({
      project_id: null,
      recovery_state: 'INVALID_CONTEXT',
    });
    expect(receipt.warnings).toHaveLength(256);
    expect(receipt.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/^RECEIPT_WARNINGS_TRUNCATED:\d+$/u)]),
    );
    expect(recovery.recover(readOnlyRequest())).toEqual(receipt);
    const receiptValidator = new ContextSchemaValidator(
      join(schemaDirectory, 'context-recovery-receipt.schema.json'),
    );
    expect(receiptValidator.validate(receipt)).toEqual({ valid: true, errors: [] });
  });

  it('rejects an oversized internal truth result before claim validation', () => {
    const oversizedDependencies: ContextRecoveryServiceDependencies = {
      ...fixedDependencies,
      normalizeClaims: ({ registry, registryProvenance }) => {
        const template = normalizeRegistryClaims(registry, registryProvenance)[0] as McfTruthClaim;
        return Array.from({ length: 1025 }, (_, index) => ({
          ...template,
          claim_key: `test.claim.${index}`,
        }));
      },
    };

    const receipt = service({}, oversizedDependencies).recover({
      project_hint: 'MCF',
      read_only: false,
      material_action: true,
    });

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'INVALID_CONTEXT',
      read_only: false,
      material_action: true,
    });
    expect(receipt.warnings).toContain('TRUTH_CLAIMS_LIMIT_EXCEEDED:1025:1024');
    expect(receipt.claims).toEqual([]);
  });

  it('fails closed when individually valid claims exceed the aggregate Receipt budget', () => {
    const aggregateDependencies: ContextRecoveryServiceDependencies = {
      ...fixedDependencies,
      normalizeClaims: ({ registry, registryProvenance }) => {
        const template = normalizeRegistryClaims(registry, registryProvenance)[0] as McfTruthClaim;
        return Array.from({ length: 900 }, (_, index) => ({
          ...template,
          claim_key: `aggregate.claim.${index}`,
          value: { index },
          provenance: template.provenance.map((entry) => ({ ...entry })),
        }));
      },
    };

    const receipt = service({}, aggregateDependencies).recover(readOnlyRequest());

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'INVALID_CONTEXT',
      claims: [],
    });
    expect(receipt.warnings).toContain('RECEIPT_CLAIMS_OMITTED:AGGREGATE_LIMIT');
  });

  it('bounds a diagnostic derived from the maximum accepted project hint', () => {
    const request = readOnlyRequest({ project_hint: 'x'.repeat(1024) });
    const recovery = service();

    const receipt = recovery.recover(request);

    expect(receipt.recovery_state).toBe('SOURCE_UNAVAILABLE');
    expect(receipt.warnings).toHaveLength(1);
    expect(Array.from(receipt.warnings[0] ?? '')).toHaveLength(1024);
    expect(receipt.warnings[0]).toMatch(/:TRUNCATED_SHA256:[a-f0-9]{64}$/u);
    expect(recovery.recover(request)).toEqual(receipt);
  });

  it('rejects registry source fan-out that cannot fit with Capsule evidence', () => {
    const registrySources = Array.from({ length: 257 }, (_, index) => ({
      source_ref: canonicalRegistryRef,
      source_revision: `registry-revision-${index}`,
    }));

    const receipt = service({ registrySources }).recover(readOnlyRequest());

    expect(receipt).toMatchObject({
      project_id: null,
      recovery_state: 'INVALID_CONTEXT',
      sources: [],
    });
    expect(receipt.warnings).toContain('REGISTRY_SOURCES_LIMIT_EXCEEDED:257:255');
  });

  it('blocks a material-current request when live verification is unavailable', () => {
    const receipt = service().recover({
      project_hint: 'MCF',
      read_only: false,
      material_action: true,
      requires_current_operational_state: true,
    });

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'SOURCE_UNAVAILABLE',
      read_only: false,
      material_action: true,
    });
    expect(receipt.warnings).toContain('LIVE_VERIFICATION_UNAVAILABLE:MATERIAL_ACTION_BLOCKED');
  });

  it('degrades explicitly to PARTIAL_RECOVERY for read-only current-state reasoning', () => {
    const receipt = service().recover(
      readOnlyRequest({ requires_current_operational_state: true }),
    );

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'PARTIAL_RECOVERY',
      read_only: true,
      material_action: false,
    });
    expect(receipt.claims.length).toBeGreaterThan(0);
    expect(receipt.warnings).toContain('LIVE_VERIFICATION_UNAVAILABLE:READ_ONLY_CONTEXT_ONLY');
  });

  it('adds live evidence when the configured read-only verifier confirms freshness', async () => {
    const verify = vi.fn().mockResolvedValue({
      outcome: 'VERIFIED',
      source: {
        role: 'LIVE_VERIFICATION',
        source_ref: 'repo://leon337/multiagent-collaboration-framework/.git/HEAD',
        source_revision: 'a'.repeat(40),
        observed_at: '2026-08-23T07:00:00Z',
      },
      warnings: [],
    });
    const receipt = await service(
      {},
      { ...fixedDependencies, liveVerifier: { verify } },
    ).recoverWithLiveVerification(readOnlyRequest({ requires_current_operational_state: true }));

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'RECOVERED',
      evidence_only: true,
    });
    expect(receipt.sources).toContainEqual({
      role: 'LIVE_VERIFICATION',
      source_ref: 'repo://leon337/multiagent-collaboration-framework/.git/HEAD',
      source_revision: 'a'.repeat(40),
      observed_at: '2026-08-23T07:00:00Z',
    });
    expect(verify).toHaveBeenCalledOnce();
  });

  it('does not call the live verifier for snapshot-only read recovery', async () => {
    const verify = vi.fn();
    const receipt = await service(
      {},
      { ...fixedDependencies, liveVerifier: { verify } },
    ).recoverWithLiveVerification(readOnlyRequest());

    expect(receipt.recovery_state).toBe('RECOVERED');
    expect(verify).not.toHaveBeenCalled();
  });

  it('returns DRIFT_DETECTED with live evidence when the repository moved', async () => {
    const receipt = await service(
      {},
      {
        ...fixedDependencies,
        liveVerifier: {
          verify: async () => ({
            outcome: 'DRIFT_DETECTED',
            source: {
              role: 'LIVE_VERIFICATION',
              source_ref: 'repo://leon337/multiagent-collaboration-framework/.git/HEAD',
              source_revision: 'b'.repeat(40),
              observed_at: '2026-08-23T07:00:00Z',
            },
            warnings: [`GIT_HEAD_DRIFT:${'a'.repeat(40)}:${'b'.repeat(40)}`],
          }),
        },
      },
    ).recoverWithLiveVerification(readOnlyRequest({ requires_current_operational_state: true }));

    expect(receipt.recovery_state).toBe('DRIFT_DETECTED');
    expect(receipt.warnings).toContain(`GIT_HEAD_DRIFT:${'a'.repeat(40)}:${'b'.repeat(40)}`);
  });

  it('fails closed when a live verifier returns malformed evidence', async () => {
    const receipt = await service(
      {},
      {
        ...fixedDependencies,
        liveVerifier: {
          verify: async () =>
            ({
              outcome: 'VERIFIED',
              source: {
                role: 'CAPSULE',
                source_ref: 'invalid-live-source',
                source_revision: 'invalid',
              },
              warnings: [],
            }) as never,
        },
      },
    ).recoverWithLiveVerification(readOnlyRequest({ requires_current_operational_state: true }));

    expect(receipt.recovery_state).toBe('PARTIAL_RECOVERY');
    expect(receipt.warnings).toEqual(
      expect.arrayContaining([
        'LIVE_VERIFICATION_INVALID_RESULT',
        'LIVE_VERIFICATION_UNAVAILABLE:READ_ONLY_CONTEXT_ONLY',
      ]),
    );
    expect(receipt.sources.some(({ role }) => role === 'LIVE_VERIFICATION')).toBe(false);
  });

  it('returns RECONCILIATION_REQUIRED for an injected internal authoritative conflict', () => {
    const conflictingDependencies: ContextRecoveryServiceDependencies = {
      ...fixedDependencies,
      normalizeClaims: ({
        registry,
        capsule: projectCapsule,
        registryProvenance,
        capsuleProvenance,
      }) => {
        const claims = [
          ...normalizeRegistryClaims(registry, registryProvenance),
          ...normalizeCapsuleClaims(projectCapsule, capsuleProvenance),
        ];
        const projectIdentity = claims.find(
          ({ claim_key, owner }) => claim_key === 'project.id' && owner === 'MCF_PROJECT_REGISTRY',
        ) as McfTruthClaim;
        return [
          ...claims,
          {
            ...projectIdentity,
            value: 'conflicting-authoritative-id',
            source_ref: 'context/projects/conflicting-authority.yaml',
            provenance: [
              {
                source_ref: 'context/projects/conflicting-authority.yaml',
                source_revision: 'conflicting-revision',
              },
            ],
          },
        ];
      },
    };

    const receipt = service({}, conflictingDependencies).recover(readOnlyRequest());

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'RECONCILIATION_REQUIRED',
    });
    expect(receipt.warnings).toEqual(
      expect.arrayContaining([
        'AUTHORITATIVE_DISAGREEMENT:project.id:MCF_PROJECT_CAPSULE,MCF_PROJECT_REGISTRY',
      ]),
    );
  });

  it('recovers identically after deleting a test-local cache', () => {
    const root = createTemporaryRepository();
    writeYaml(root, canonicalRegistryRef, registryEntry());
    writeYaml(root, canonicalCapsuleRef, capsule());
    const cacheDirectory = join(root, '.test-runtime-cache');
    mkdirSync(cacheDirectory);
    writeFileSync(join(cacheDirectory, 'stale-receipt.json'), '{"project_id":"wrong"}', 'utf8');
    const recovery = service({ repositoryRoot: root });

    const beforeDeletion = recovery.recover(readOnlyRequest());
    rmSync(cacheDirectory, { recursive: true, force: true });
    const afterDeletion = recovery.recover(readOnlyRequest());

    expect(afterDeletion).toEqual(beforeDeletion);
    expect(afterDeletion.recovery_state).toBe('RECOVERED');
  });

  it('loads an owning-project Capsule from an explicitly mapped repository root', () => {
    const registryRoot = createTemporaryRepository();
    const projectRoot = createTemporaryRepository();
    writeYaml(
      registryRoot,
      canonicalRegistryRef,
      registryEntry({
        projectId: 'cognitive-ledger',
        canonicalRepository: 'leon337/cognitive-ledger',
        aliases: ['Ledger'],
      }),
    );
    writeYaml(projectRoot, canonicalCapsuleRef, capsule('cognitive-ledger'));

    const receipt = service({
      repositoryRoot: registryRoot,
      capsuleSourceRevisions: {},
      projectRepositories: {
        'cognitive-ledger': {
          repositoryRoot: projectRoot,
          sourceRevision: 'ledger-commit-sha',
        },
      },
    }).recover(readOnlyRequest({ project_hint: 'Ledger' }));

    expect(receipt).toMatchObject({
      project_id: 'cognitive-ledger',
      recovery_state: 'RECOVERED',
    });
    expect(receipt.sources).toContainEqual({
      role: 'CAPSULE',
      source_ref: 'repo://leon337/cognitive-ledger/.mcf/project-capsule.yaml',
      source_revision: 'ledger-commit-sha',
      observed_at: '2026-08-23T00:22:10-03:00',
    });
    expect(receipt.claims).toContainEqual(
      expect.objectContaining({
        claim_key: 'snapshot.current_status',
        source_ref: 'repo://leon337/cognitive-ledger/.mcf/project-capsule.yaml',
      }),
    );
  });

  it('does not fall back to the Registry repository when a mapped Capsule is unavailable', () => {
    const registryRoot = createTemporaryRepository();
    const emptyProjectRoot = createTemporaryRepository();
    writeYaml(
      registryRoot,
      canonicalRegistryRef,
      registryEntry({
        projectId: 'cognitive-ledger',
        canonicalRepository: 'leon337/cognitive-ledger',
        aliases: ['Ledger'],
      }),
    );
    writeYaml(registryRoot, canonicalCapsuleRef, capsule('cognitive-ledger'));

    const receipt = service({
      repositoryRoot: registryRoot,
      capsuleSourceRevisions: {},
      projectRepositories: {
        'cognitive-ledger': {
          repositoryRoot: emptyProjectRoot,
          sourceRevision: 'ledger-commit-sha',
        },
      },
    }).recover(readOnlyRequest({ project_hint: 'Ledger' }));

    expect(receipt).toMatchObject({
      project_id: 'cognitive-ledger',
      recovery_state: 'SOURCE_UNAVAILABLE',
    });
    expect(receipt.warnings).toContain('SOURCE_NOT_FOUND:.mcf/project-capsule.yaml');
  });

  it('keeps identical Capsule paths isolated by stable project id', () => {
    const registryRoot = createTemporaryRepository();
    const ledgerRoot = createTemporaryRepository();
    const triViewRoot = createTemporaryRepository();
    const ledgerRegistryRef = 'context/projects/cognitive-ledger.yaml';
    const triViewRegistryRef = 'context/projects/triview-workspace-linux.yaml';
    writeYaml(
      registryRoot,
      ledgerRegistryRef,
      registryEntry({
        projectId: 'cognitive-ledger',
        canonicalRepository: 'leon337/cognitive-ledger',
        aliases: ['Ledger'],
      }),
    );
    writeYaml(
      registryRoot,
      triViewRegistryRef,
      registryEntry({
        projectId: 'triview-workspace-linux',
        canonicalRepository: 'leon337/triview-workspace-linux',
        aliases: ['TriView'],
      }),
    );
    writeYaml(ledgerRoot, canonicalCapsuleRef, capsule('cognitive-ledger'));
    writeYaml(triViewRoot, canonicalCapsuleRef, capsule('triview-workspace-linux'));

    const recovery = service({
      repositoryRoot: registryRoot,
      registrySources: [
        { source_ref: ledgerRegistryRef, source_revision: 'registry-sha' },
        { source_ref: triViewRegistryRef, source_revision: 'registry-sha' },
      ],
      capsuleSourceRevisions: {},
      projectRepositories: {
        'cognitive-ledger': {
          repositoryRoot: ledgerRoot,
          sourceRevision: 'ledger-sha',
        },
        'triview-workspace-linux': {
          repositoryRoot: triViewRoot,
          sourceRevision: 'triview-sha',
        },
      },
    });

    expect(recovery.recover(readOnlyRequest({ project_hint: 'Ledger' }))).toMatchObject({
      project_id: 'cognitive-ledger',
      recovery_state: 'RECOVERED',
      sources: expect.arrayContaining([expect.objectContaining({ source_revision: 'ledger-sha' })]),
    });
    expect(recovery.recover(readOnlyRequest({ project_hint: 'TriView' }))).toMatchObject({
      project_id: 'triview-workspace-linux',
      recovery_state: 'RECOVERED',
      sources: expect.arrayContaining([
        expect.objectContaining({ source_revision: 'triview-sha' }),
      ]),
    });
  });

  it('keeps stable project identity after a canonical repository rename', () => {
    const root = createTemporaryRepository();
    writeYaml(
      root,
      canonicalRegistryRef,
      registryEntry({ canonicalRepository: 'leon337/mcf-renamed' }),
    );
    writeYaml(root, canonicalCapsuleRef, capsule());

    const receipt = service({ repositoryRoot: root }).recover(
      readOnlyRequest({ project_hint: 'leon337/mcf-renamed' }),
    );

    expect(receipt).toMatchObject({
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'RECOVERED',
    });
  });
});
