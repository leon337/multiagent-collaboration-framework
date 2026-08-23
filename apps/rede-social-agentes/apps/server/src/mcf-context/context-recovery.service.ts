import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import type {
  McfContextProvenance,
  McfContextRecoveryReceipt,
  McfContextRecoveryState,
  McfContextSourceEvidence,
  McfProjectCapsule,
  McfProjectRegistryEntry,
  McfTruthClaim,
} from '@rsa/contracts';

import { ContextSchemaValidator } from './context-schema.validator.js';
import { resolveProject } from './project-resolver.js';
import {
  RepositoryContextSource,
  type RepositoryContextSourceEvidence,
} from './repository-context-source.js';
import {
  normalizeCapsuleClaims,
  normalizeRegistryClaims,
  reconcileTruthClaims,
  type ClaimAuthorityRule,
} from './truth-contract.js';

export type ContextRecoveryRequest =
  | {
      project_hint: string;
      read_only: true;
      material_action: false;
      requires_current_operational_state?: boolean;
    }
  | {
      project_hint: string;
      read_only: false;
      material_action: true;
      requires_current_operational_state?: boolean;
    };

export interface ContextRecoveryRegistrySource {
  source_ref: string;
  source_revision: string;
}

export interface ContextRecoveryServiceOptions {
  repositoryRoot: string;
  schemaDirectory: string;
  registrySources: readonly ContextRecoveryRegistrySource[];
  capsuleSourceRevisions: Readonly<Record<string, string>>;
  maxSourceBytes?: number;
}

export interface ContextClaimsNormalizationInput {
  registry: McfProjectRegistryEntry;
  capsule: McfProjectCapsule;
  registryProvenance: McfContextProvenance;
  capsuleProvenance: McfContextProvenance;
}

export interface ContextRecoveryServiceDependencies {
  now?: () => string;
  receiptId?: () => string;
  normalizeClaims?: (input: ContextClaimsNormalizationInput) => McfTruthClaim[];
}

interface LoadedRegistry {
  entry: McfProjectRegistryEntry;
  source: RepositoryContextSourceEvidence;
}

interface ReceiptMode {
  readOnly: boolean;
  materialAction: boolean;
}

interface ReceiptInput {
  mode: ReceiptMode;
  projectId: string | null;
  recoveryState: McfContextRecoveryState;
  sources: McfContextSourceEvidence[];
  claims: McfTruthClaim[];
  warnings: string[];
}

const DEFAULT_AUTHORITY_RULES: readonly ClaimAuthorityRule[] = [
  {
    claim_key: 'project.id',
    claim_type: 'IDENTITY',
    authoritative_owner: 'MCF_PROJECT_REGISTRY',
  },
];

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sourceRoleOrder(role: McfContextSourceEvidence['role']): number {
  if (role === 'REGISTRY') return 0;
  if (role === 'CAPSULE') return 1;
  return 2;
}

function compareSources(left: McfContextSourceEvidence, right: McfContextSourceEvidence): number {
  const roleOrder = sourceRoleOrder(left.role) - sourceRoleOrder(right.role);
  if (roleOrder !== 0) return roleOrder;
  const referenceOrder = compareText(left.source_ref, right.source_ref);
  if (referenceOrder !== 0) return referenceOrder;
  return compareText(left.source_revision, right.source_revision);
}

function registryEvidence(source: RepositoryContextSourceEvidence): McfContextSourceEvidence {
  return {
    role: 'REGISTRY',
    source_ref: source.source_ref,
    source_revision: source.source_revision,
  };
}

function capsuleEvidence(
  source: RepositoryContextSourceEvidence,
  observedAt?: string,
): McfContextSourceEvidence {
  return {
    role: 'CAPSULE',
    source_ref: source.source_ref,
    source_revision: source.source_revision,
    ...(observedAt === undefined ? {} : { observed_at: observedAt }),
  };
}

function provenance(source: RepositoryContextSourceEvidence): McfContextProvenance {
  return {
    source_ref: source.source_ref,
    source_revision: source.source_revision,
  };
}

function capsuleProvenance(
  source: RepositoryContextSourceEvidence,
  observedAt: string,
): McfContextProvenance {
  return {
    source_ref: source.source_ref,
    source_revision: source.source_revision,
    observed_at: observedAt,
  };
}

function defaultNormalizeClaims(input: ContextClaimsNormalizationInput): McfTruthClaim[] {
  return [
    ...normalizeRegistryClaims(input.registry, input.registryProvenance),
    ...normalizeCapsuleClaims(input.capsule, input.capsuleProvenance),
  ];
}

export class ContextRecoveryService {
  private readonly source: RepositoryContextSource;
  private readonly registrySources: readonly ContextRecoveryRegistrySource[];
  private readonly capsuleSourceRevisions: ReadonlyMap<string, string>;
  private readonly registryValidator: ContextSchemaValidator;
  private readonly capsuleValidator: ContextSchemaValidator;
  private readonly truthValidator: ContextSchemaValidator;
  private readonly receiptValidator: ContextSchemaValidator;
  private readonly now: () => string;
  private readonly receiptId: () => string;
  private readonly normalizeClaims: (input: ContextClaimsNormalizationInput) => McfTruthClaim[];

  constructor(
    options: ContextRecoveryServiceOptions,
    dependencies: ContextRecoveryServiceDependencies = {},
  ) {
    this.source = new RepositoryContextSource({
      repositoryRoot: options.repositoryRoot,
      ...(options.maxSourceBytes === undefined ? {} : { maxSourceBytes: options.maxSourceBytes }),
    });
    this.registrySources = options.registrySources.map((source) => ({ ...source }));
    this.capsuleSourceRevisions = new Map(Object.entries(options.capsuleSourceRevisions));
    this.registryValidator = new ContextSchemaValidator(
      join(options.schemaDirectory, 'project-registry-entry.schema.json'),
    );
    this.capsuleValidator = new ContextSchemaValidator(
      join(options.schemaDirectory, 'project-capsule.schema.json'),
    );
    this.truthValidator = new ContextSchemaValidator(
      join(options.schemaDirectory, 'truth-contract.schema.json'),
    );
    this.receiptValidator = new ContextSchemaValidator(
      join(options.schemaDirectory, 'context-recovery-receipt.schema.json'),
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.receiptId = dependencies.receiptId ?? (() => `context-recovery-${randomUUID()}`);
    this.normalizeClaims = dependencies.normalizeClaims ?? defaultNormalizeClaims;
  }

  recover(request: ContextRecoveryRequest): McfContextRecoveryReceipt {
    const mode = this.validateMode(request);
    if (!mode) {
      return this.createReceipt({
        mode: { readOnly: true, materialAction: false },
        projectId: null,
        recoveryState: 'INVALID_CONTEXT',
        sources: [],
        claims: [],
        warnings: ['INVALID_RECOVERY_REQUEST_MODE'],
      });
    }
    if (
      typeof request.project_hint !== 'string' ||
      request.project_hint.length > 1024 ||
      (request.requires_current_operational_state !== undefined &&
        typeof request.requires_current_operational_state !== 'boolean')
    ) {
      return this.createReceipt({
        mode,
        projectId: null,
        recoveryState: 'INVALID_CONTEXT',
        sources: [],
        claims: [],
        warnings: ['INVALID_RECOVERY_REQUEST'],
      });
    }

    const registries: LoadedRegistry[] = [];
    const registrySourceEvidence: McfContextSourceEvidence[] = [];
    for (const configuredSource of this.registrySources) {
      const loaded = this.source.loadYaml(
        configuredSource.source_ref,
        configuredSource.source_revision,
      );
      if (!loaded.ok) {
        return this.createReceipt({
          mode,
          projectId: null,
          recoveryState: loaded.error.recovery_state,
          sources: registrySourceEvidence,
          claims: [],
          warnings: [`${loaded.error.code}:${loaded.error.source_ref}`],
        });
      }

      registrySourceEvidence.push(registryEvidence(loaded.source));
      const validation = this.registryValidator.validate(loaded.document);
      if (!validation.valid) {
        return this.createReceipt({
          mode,
          projectId: null,
          recoveryState: 'INVALID_CONTEXT',
          sources: registrySourceEvidence,
          claims: [],
          warnings: validation.errors.map(
            ({ instancePath, keyword }) =>
              `REGISTRY_SCHEMA_INVALID:${instancePath || '/'}:${keyword}`,
          ),
        });
      }
      registries.push({
        entry: loaded.document as unknown as McfProjectRegistryEntry,
        source: loaded.source,
      });
    }

    if (registries.length === 0) {
      return this.createReceipt({
        mode,
        projectId: null,
        recoveryState: 'SOURCE_UNAVAILABLE',
        sources: [],
        claims: [],
        warnings: ['PROJECT_REGISTRY_EMPTY'],
      });
    }

    const resolution = resolveProject(
      registries.map(({ entry }) => entry),
      request.project_hint,
    );
    if (resolution.outcome === 'AMBIGUOUS_CONTEXT') {
      return this.createReceipt({
        mode,
        projectId: null,
        recoveryState: 'AMBIGUOUS_CONTEXT',
        sources: registrySourceEvidence,
        claims: [],
        warnings: [`AMBIGUOUS_PROJECT_HINT:${resolution.normalized_hint}`],
      });
    }
    if (resolution.outcome === 'NOT_FOUND') {
      return this.createReceipt({
        mode,
        projectId: null,
        recoveryState: 'SOURCE_UNAVAILABLE',
        sources: registrySourceEvidence,
        claims: [],
        warnings: [`PROJECT_NOT_FOUND:${resolution.normalized_hint}`],
      });
    }

    const resolvedRegistry = registries.find(({ entry }) => entry === resolution.registry_entry);
    if (!resolvedRegistry) {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: 'INVALID_CONTEXT',
        sources: registrySourceEvidence,
        claims: [],
        warnings: ['RESOLVED_REGISTRY_EVIDENCE_MISSING'],
      });
    }

    const registryClaims = normalizeRegistryClaims(
      resolvedRegistry.entry,
      provenance(resolvedRegistry.source),
    );
    const capsuleRef = resolvedRegistry.entry.context.capsule_path;
    const capsuleRevision = this.capsuleSourceRevisions.get(capsuleRef);
    if (capsuleRevision === undefined) {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: 'SOURCE_UNAVAILABLE',
        sources: registrySourceEvidence,
        claims: registryClaims,
        warnings: [`CAPSULE_REVISION_UNAVAILABLE:${capsuleRef}`],
      });
    }

    const loadedCapsule = this.source.loadCapsule(resolvedRegistry.entry, capsuleRevision);
    if (!loadedCapsule.ok) {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: loadedCapsule.error.recovery_state,
        sources: registrySourceEvidence,
        claims: registryClaims,
        warnings: [`${loadedCapsule.error.code}:${loadedCapsule.error.source_ref}`],
      });
    }

    const capsuleValidation = this.capsuleValidator.validate(loadedCapsule.document);
    const loadedSources = [...registrySourceEvidence, capsuleEvidence(loadedCapsule.source)];
    if (!capsuleValidation.valid) {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: 'INVALID_CONTEXT',
        sources: loadedSources,
        claims: registryClaims,
        warnings: capsuleValidation.errors.map(
          ({ instancePath, keyword }) => `CAPSULE_SCHEMA_INVALID:${instancePath || '/'}:${keyword}`,
        ),
      });
    }

    const projectCapsule = loadedCapsule.document as unknown as McfProjectCapsule;
    const allSources = [
      ...registrySourceEvidence,
      capsuleEvidence(loadedCapsule.source, projectCapsule.observed_at),
    ];
    if (projectCapsule.project_id !== resolvedRegistry.entry.project.id) {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: 'INVALID_CONTEXT',
        sources: allSources,
        claims: registryClaims,
        warnings: ['REGISTRY_CAPSULE_PROJECT_ID_MISMATCH'],
      });
    }

    let normalizedClaims: McfTruthClaim[];
    try {
      const producedClaims = this.normalizeClaims({
        registry: resolvedRegistry.entry,
        capsule: projectCapsule,
        registryProvenance: provenance(resolvedRegistry.source),
        capsuleProvenance: capsuleProvenance(loadedCapsule.source, projectCapsule.observed_at),
      });
      if (!Array.isArray(producedClaims)) {
        return this.createReceipt({
          mode,
          projectId: resolution.project_id,
          recoveryState: 'INVALID_CONTEXT',
          sources: allSources,
          claims: registryClaims,
          warnings: ['TRUTH_NORMALIZATION_INVALID_RESULT'],
        });
      }
      normalizedClaims = producedClaims;
    } catch {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: 'INVALID_CONTEXT',
        sources: allSources,
        claims: registryClaims,
        warnings: ['TRUTH_NORMALIZATION_FAILED'],
      });
    }

    const validClaims: McfTruthClaim[] = [];
    const claimWarnings: string[] = [];
    for (const [index, claim] of normalizedClaims.entries()) {
      const unknownClaim: unknown = claim;
      const validation = this.truthValidator.validate(unknownClaim);
      if (validation.valid) {
        validClaims.push(claim);
      } else {
        const claimKey =
          typeof unknownClaim === 'object' &&
          unknownClaim !== null &&
          'claim_key' in unknownClaim &&
          typeof unknownClaim.claim_key === 'string'
            ? unknownClaim.claim_key
            : `claim-${index}`;
        claimWarnings.push(
          ...validation.errors.map(
            ({ instancePath, keyword }) =>
              `TRUTH_SCHEMA_INVALID:${claimKey}:${instancePath || '/'}:${keyword}`,
          ),
        );
      }
    }
    if (claimWarnings.length > 0 || validClaims.length === 0) {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: 'INVALID_CONTEXT',
        sources: allSources,
        claims: validClaims,
        warnings: claimWarnings.length > 0 ? claimWarnings : ['TRUTH_CLAIMS_EMPTY'],
      });
    }

    const reconciliation = reconcileTruthClaims(validClaims, DEFAULT_AUTHORITY_RULES);
    if (reconciliation.outcome === 'RECONCILIATION_REQUIRED') {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: 'RECONCILIATION_REQUIRED',
        sources: allSources,
        claims: validClaims,
        warnings: reconciliation.conflicts.map(
          ({ claim_key, reason, owners }) => `${reason}:${claim_key}:${owners.join(',')}`,
        ),
      });
    }

    const requiresCurrentOperationalState =
      resolvedRegistry.entry.freshness.operational_state === 'LIVE_REQUIRED' &&
      (mode.materialAction || request.requires_current_operational_state === true);
    if (requiresCurrentOperationalState) {
      return this.createReceipt({
        mode,
        projectId: resolution.project_id,
        recoveryState: mode.materialAction ? 'SOURCE_UNAVAILABLE' : 'PARTIAL_RECOVERY',
        sources: allSources,
        claims: reconciliation.accepted_claims,
        warnings: [
          mode.materialAction
            ? 'LIVE_VERIFICATION_UNAVAILABLE:MATERIAL_ACTION_BLOCKED'
            : 'LIVE_VERIFICATION_UNAVAILABLE:READ_ONLY_CONTEXT_ONLY',
        ],
      });
    }

    return this.createReceipt({
      mode,
      projectId: resolution.project_id,
      recoveryState: 'RECOVERED',
      sources: allSources,
      claims: reconciliation.accepted_claims,
      warnings: [],
    });
  }

  private validateMode(request: unknown): ReceiptMode | null {
    if (typeof request !== 'object' || request === null) return null;

    const candidate = request as { read_only?: unknown; material_action?: unknown };
    if (candidate.read_only === true && candidate.material_action === false) {
      return { readOnly: true, materialAction: false };
    }
    if (candidate.read_only === false && candidate.material_action === true) {
      return { readOnly: false, materialAction: true };
    }
    return null;
  }

  private createReceipt(input: ReceiptInput): McfContextRecoveryReceipt {
    const receipt: McfContextRecoveryReceipt = {
      schema_version: 1,
      receipt_id: this.receiptId(),
      project_id: input.projectId,
      recovery_state: input.recoveryState,
      recovered_at: this.now(),
      read_only: input.mode.readOnly,
      material_action: input.mode.materialAction,
      sources: input.sources.toSorted(compareSources),
      claims: [...input.claims],
      warnings: [...new Set(input.warnings)].toSorted(compareText),
      evidence_only: true,
    };

    const validation = this.receiptValidator.validate(receipt);
    if (!validation.valid) {
      throw new Error(
        `ContextRecoveryService produced an invalid Receipt: ${validation.errors
          .map(({ instancePath, keyword }) => `${instancePath || '/'}:${keyword}`)
          .join(',')}`,
      );
    }
    return receipt;
  }
}
