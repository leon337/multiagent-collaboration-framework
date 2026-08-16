import { createHash } from 'node:crypto';

import type {
  HumanDecisionRecord,
  IntentAlignmentReceiptV1,
  McfArtifactRef,
  ProjectIntentPackageV1,
  ProvenanceRef,
} from '@rsa/contracts';

import {
  calculateProjectArtifactDigest,
  canonicalAlignmentReceiptPath,
  type CanonicalArtifactRef,
  type LocalProjectArtifact,
  type RepositoryProjectArtifactStore,
} from '../project-artifacts/repository-project-artifact.store.js';
import {
  CANONICAL_INTENT_DIMENSIONS,
  createIncrementalIntentRevision,
  type IncrementalIntentRevisionInput,
  type IntentDimension,
} from './human-intent-discovery.service.js';

const ZERO_DIGEST = `sha256:${'0'.repeat(64)}`;
const HUMAN_AUTHORITY_PROVENANCE = new Set([
  'HUMAN_DIRECT_STATEMENT',
  'HUMAN_CONFIRMED_SYNTHESIS',
  'PRIOR_VALID_HUMAN_DECISION',
]);
const EXACT_BINDING_STATEMENT =
  'Confirmation binds exactly the referenced Project Intent Package revision and content digest.';

export interface FinalIntentReadback {
  viewType: 'DERIVED_FINAL_INTENT_READBACK';
  authorityClass: 'DERIVED_REBUILDABLE_VIEW';
  sourcePipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;
  exactPipRevision: string;
  exactPipContentDigest: string;
  dimensions: Array<{
    dimension: IntentDimension;
    record: ProjectIntentPackageV1['dimensions'][IntentDimension];
  }>;
  currentHumanDecisions: HumanDecisionRecord[];
  supersededHumanDecisionHistory: HumanDecisionRecord[];
  unknowns: ProjectIntentPackageV1['unknowns'];
  blockers: ProjectIntentPackageV1['blockers'];
  conflicts: ProjectIntentPackageV1['conflicts'];
  readiness: ProjectIntentPackageV1['readiness'];
  exactRevisionConfirmationStatement: typeof EXACT_BINDING_STATEMENT;
  implementationAuthorized: false;
  readbackDigest: string;
}

export interface IntentAlignmentCommand {
  humanAuthority: string;
  confirmationSourceRef: string;
  confirmedAt: string;
  expectedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;
  finalReadbackRefOrDigest: string;
  decision: 'PASS' | 'REJECTED_FOR_CORRECTION';
}

export type IntentAlignmentErrorCode =
  | 'ALIGNMENT_AUTHORITY_INVALID'
  | 'ALIGNMENT_CONFIRMATION_INVALID'
  | 'FINAL_READBACK_INVALID'
  | 'PIP_REF_MISMATCH'
  | 'PIP_REF_REVISION_MISMATCH'
  | 'PIP_REF_DIGEST_MISMATCH'
  | 'PIP_NOT_READY'
  | 'BLOCKING_UNKNOWN'
  | 'BLOCKER_OR_CONFLICT'
  | 'ALIGNMENT_PAIR_INCOMPLETE'
  | 'ALIGNMENT_PAIR_INVALID'
  | 'ALIGNED_REVISION_IMMUTABLE'
  | 'MATERIAL_CHANGE_PROVENANCE_REQUIRED';

export class IntentAlignmentError extends Error {
  constructor(
    readonly code: IntentAlignmentErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'IntentAlignmentError';
  }
}

export interface AlignmentPersistenceHooks {
  afterAlignedPipPersisted?:
    ((pip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>) => Promise<void>) | undefined;
}

export interface VerifiedAlignmentResult {
  outcome: 'PASS';
  alignedPip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>;
  receipt: LocalProjectArtifact<'INTENT_ALIGNMENT_RECEIPT'>;
  implementationAuthorized: false;
}

export interface RejectedAlignmentResult {
  outcome: 'REJECTED_FOR_CORRECTION';
  pipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;
  correctionRequired: true;
  implementationAuthorized: false;
}

export type IntentAlignmentResult = VerifiedAlignmentResult | RejectedAlignmentResult;

export type AlignmentPairVerification =
  | {
      state: 'PASS_VERIFIED';
      alignedPip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>;
      receipt: LocalProjectArtifact<'INTENT_ALIGNMENT_RECEIPT'>;
      implementationAuthorized: false;
    }
  | {
      state: 'INCOMPLETE' | 'INVALID';
      reason: string;
      implementationAuthorized: false;
    };

export interface ReopenAlignedIntentResult {
  priorAlignedPip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>;
  priorReceipt: LocalProjectArtifact<'INTENT_ALIGNMENT_RECEIPT'>;
  successorPip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>;
  implementationAuthorized: false;
}

function fail(code: IntentAlignmentErrorCode, message: string): never {
  throw new IntentAlignmentError(code, message);
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

export function calculateFinalIntentReadbackDigest(
  input: Omit<FinalIntentReadback, 'readbackDigest'> | FinalIntentReadback,
): string {
  const payload = structuredClone(input) as FinalIntentReadback;
  delete (payload as Partial<FinalIntentReadback>).readbackDigest;
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(sortJson(payload)), 'utf8')
    .digest('hex')}`;
}

function sameRef(left: McfArtifactRef, right: McfArtifactRef): boolean {
  return (
    left.artifactType === right.artifactType &&
    left.schemaVersion === right.schemaVersion &&
    left.projectId === right.projectId &&
    left.revisionId === right.revisionId &&
    left.path === right.path &&
    left.contentDigest === right.contentDigest &&
    left.repository === right.repository &&
    left.commitSha === right.commitSha
  );
}

function hasHumanAuthority(provenance: ProvenanceRef[]): boolean {
  return provenance.some((item) => HUMAN_AUTHORITY_PROVENANCE.has(item.type));
}

function alignmentReceiptId(revisionId: string): string {
  return `alignment-${revisionId}`;
}

function createFinalReadbackSnapshot(
  pip: ProjectIntentPackageV1,
  pipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>,
): FinalIntentReadback {
  const withoutDigest: Omit<FinalIntentReadback, 'readbackDigest'> = {
    viewType: 'DERIVED_FINAL_INTENT_READBACK',
    authorityClass: 'DERIVED_REBUILDABLE_VIEW',
    sourcePipRef: structuredClone(pipRef),
    exactPipRevision: pip.revisionId,
    exactPipContentDigest: pip.contentDigest,
    dimensions: CANONICAL_INTENT_DIMENSIONS.map((dimension) => ({
      dimension,
      record: structuredClone(pip.dimensions[dimension]),
    })),
    currentHumanDecisions: structuredClone(
      pip.humanDecisions.filter((decision) => decision.status === 'CURRENT'),
    ),
    supersededHumanDecisionHistory: structuredClone(
      pip.humanDecisions.filter((decision) => decision.status === 'SUPERSEDED'),
    ),
    unknowns: structuredClone(pip.unknowns),
    blockers: structuredClone(pip.blockers),
    conflicts: structuredClone(pip.conflicts),
    readiness: structuredClone(pip.readiness),
    exactRevisionConfirmationStatement: EXACT_BINDING_STATEMENT,
    implementationAuthorized: false,
  };
  return {
    ...withoutDigest,
    readbackDigest: calculateFinalIntentReadbackDigest(withoutDigest),
  };
}

function assertCommand(
  command: IntentAlignmentCommand,
): asserts command is IntentAlignmentCommand & { humanAuthority: 'LEANDRO' } {
  if (command.humanAuthority !== 'LEANDRO') {
    fail('ALIGNMENT_AUTHORITY_INVALID', 'only LEANDRO can confirm final intent alignment');
  }
  if (
    command.confirmationSourceRef.trim().length === 0 ||
    command.confirmedAt.trim().length === 0 ||
    Number.isNaN(Date.parse(command.confirmedAt))
  ) {
    fail(
      'ALIGNMENT_CONFIRMATION_INVALID',
      'alignment requires a source reference and valid confirmation timestamp',
    );
  }
}

function assertReadbackBinding(
  readback: FinalIntentReadback,
  command: IntentAlignmentCommand,
): void {
  if (readback.sourcePipRef.revisionId !== command.expectedPipRef.revisionId) {
    fail('PIP_REF_REVISION_MISMATCH', 'final read-back and expected PIP revisions differ');
  }
  if (readback.sourcePipRef.contentDigest !== command.expectedPipRef.contentDigest) {
    fail('PIP_REF_DIGEST_MISMATCH', 'final read-back and expected PIP digests differ');
  }
  if (!sameRef(readback.sourcePipRef, command.expectedPipRef)) {
    fail('PIP_REF_MISMATCH', 'final read-back is not bound to the exact expected PIP reference');
  }
  if (
    readback.viewType !== 'DERIVED_FINAL_INTENT_READBACK' ||
    readback.authorityClass !== 'DERIVED_REBUILDABLE_VIEW' ||
    readback.implementationAuthorized !== false ||
    readback.exactRevisionConfirmationStatement !== EXACT_BINDING_STATEMENT ||
    calculateFinalIntentReadbackDigest(readback) !== readback.readbackDigest ||
    command.finalReadbackRefOrDigest !== readback.readbackDigest
  ) {
    fail(
      'FINAL_READBACK_INVALID',
      'final read-back identity, digest or authority marker is invalid',
    );
  }
}

function alignedCandidate(
  source: ProjectIntentPackageV1,
  confirmedAt: string,
): ProjectIntentPackageV1 {
  const pip = structuredClone(source);
  pip.lifecycle = 'ALIGNED';
  pip.alignment = {
    status: 'ALIGNED',
    receiptRef: canonicalAlignmentReceiptPath(alignmentReceiptId(pip.revisionId)),
    alignedAt: confirmedAt,
  };
  pip.contentDigest = calculateProjectArtifactDigest(pip);
  return pip;
}

function preAlignmentCandidate(aligned: ProjectIntentPackageV1): ProjectIntentPackageV1 {
  const pip = structuredClone(aligned);
  pip.lifecycle = 'READY_FOR_ALIGNMENT';
  pip.alignment = { status: 'NOT_ALIGNED' };
  pip.contentDigest = calculateProjectArtifactDigest(pip);
  return pip;
}

function assertReadyForAlignment(pip: ProjectIntentPackageV1): void {
  if (
    pip.lifecycle !== 'READY_FOR_ALIGNMENT' ||
    pip.readiness.state !== 'READY_FOR_ALIGNMENT' ||
    pip.alignment.status !== 'NOT_ALIGNED'
  ) {
    fail('PIP_NOT_READY', 'PASS alignment requires a READY_FOR_ALIGNMENT non-aligned PIP');
  }
  if (
    pip.readiness.blockingUnknownIds.length > 0 ||
    pip.unknowns.some((unknown) => unknown.blocking)
  ) {
    fail('BLOCKING_UNKNOWN', 'PASS alignment cannot contain a blocking unknown');
  }
  if (pip.blockers.length > 0 || pip.conflicts.length > 0) {
    fail('BLOCKER_OR_CONFLICT', 'PASS alignment cannot contain blockers or conflicts');
  }
}

function receiptMatchesPair(
  receipt: IntentAlignmentReceiptV1,
  pip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>,
): boolean {
  return (
    receipt.decision === 'PASS' &&
    receipt.humanAuthority === 'LEANDRO' &&
    receipt.projectId === pip.artifact.projectId &&
    sameRef(receipt.pipRef, pip.reference) &&
    pip.artifact.lifecycle === 'ALIGNED' &&
    pip.artifact.alignment.status === 'ALIGNED' &&
    pip.artifact.alignment.alignedAt === receipt.confirmedAt &&
    pip.artifact.alignment.receiptRef === canonicalAlignmentReceiptPath(receipt.receiptId)
  );
}

function receiptMatchesCommand(
  receipt: IntentAlignmentReceiptV1,
  command: IntentAlignmentCommand,
): boolean {
  return (
    receipt.confirmedAt === command.confirmedAt &&
    receipt.confirmationSourceRef === command.confirmationSourceRef &&
    receipt.humanAuthority === command.humanAuthority
  );
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export class IntentAlignmentService {
  constructor(
    private readonly artifacts: RepositoryProjectArtifactStore,
    private readonly hooks: AlignmentPersistenceHooks = {},
  ) {}

  async createFinalIntentReadback(
    expectedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>,
  ): Promise<FinalIntentReadback> {
    const resolved = await this.artifacts.resolveLocalPipRevision(
      expectedPipRef.projectId,
      expectedPipRef.revisionId,
    );
    if (resolved.reference.contentDigest !== expectedPipRef.contentDigest) {
      fail('PIP_REF_DIGEST_MISMATCH', 'expected PIP digest does not match the persisted revision');
    }
    if (!sameRef(resolved.reference, expectedPipRef)) {
      fail('PIP_REF_MISMATCH', 'expected PIP reference does not match the persisted revision');
    }
    if (resolved.artifact.lifecycle === 'ALIGNED') {
      fail(
        'ALIGNED_REVISION_IMMUTABLE',
        'an aligned revision cannot receive a new final read-back',
      );
    }
    return createFinalReadbackSnapshot(resolved.artifact, resolved.reference);
  }

  async align(
    readback: FinalIntentReadback,
    command: IntentAlignmentCommand,
  ): Promise<IntentAlignmentResult> {
    assertCommand(command);
    assertReadbackBinding(readback, command);
    const current = await this.artifacts.resolveLocalPipRevision(
      command.expectedPipRef.projectId,
      command.expectedPipRef.revisionId,
    );
    let sourcePip: ProjectIntentPackageV1;
    if (current.artifact.lifecycle === 'ALIGNED') {
      sourcePip = preAlignmentCandidate(current.artifact);
      if (sourcePip.contentDigest !== command.expectedPipRef.contentDigest) {
        fail(
          'ALIGNED_REVISION_IMMUTABLE',
          'persisted aligned revision does not derive from the confirmed PIP',
        );
      }
    } else {
      sourcePip = current.artifact;
      if (!sameRef(current.reference, command.expectedPipRef)) {
        if (current.reference.contentDigest !== command.expectedPipRef.contentDigest) {
          fail('PIP_REF_DIGEST_MISMATCH', 'expected PIP digest does not match persisted content');
        }
        fail('PIP_REF_MISMATCH', 'expected PIP reference does not match persisted content');
      }
    }

    const rebuiltReadback = createFinalReadbackSnapshot(sourcePip, command.expectedPipRef);
    if (rebuiltReadback.readbackDigest !== readback.readbackDigest) {
      fail(
        'FINAL_READBACK_INVALID',
        'final read-back does not derive from the exact persisted PIP',
      );
    }
    if (command.decision === 'REJECTED_FOR_CORRECTION') {
      if (current.artifact.lifecycle === 'ALIGNED') {
        fail(
          'ALIGNED_REVISION_IMMUTABLE',
          'an aligned revision cannot be retroactively rejected; create a material-change successor',
        );
      }
      return {
        outcome: 'REJECTED_FOR_CORRECTION',
        pipRef: structuredClone(command.expectedPipRef),
        correctionRequired: true,
        implementationAuthorized: false,
      };
    }

    assertReadyForAlignment(sourcePip);
    const candidate = alignedCandidate(sourcePip, command.confirmedAt);
    if (
      current.artifact.lifecycle === 'ALIGNED' &&
      current.artifact.contentDigest !== candidate.contentDigest
    ) {
      fail('ALIGNED_REVISION_IMMUTABLE', 'an aligned revision cannot be confirmed differently');
    }
    const persistedPip = await this.artifacts.writePip(candidate);

    try {
      await this.hooks.afterAlignedPipPersisted?.(persistedPip);
      await this.artifacts.writeAlignmentReceipt(
        {
          artifactType: 'INTENT_ALIGNMENT_RECEIPT',
          schemaVersion: '1.0',
          receiptId: alignmentReceiptId(candidate.revisionId),
          projectId: candidate.projectId,
          pipRef: persistedPip.reference,
          decision: 'PASS',
          humanAuthority: command.humanAuthority,
          confirmedAt: command.confirmedAt,
          confirmationSourceRef: command.confirmationSourceRef,
          contentDigest: ZERO_DIGEST,
        },
        persistedPip,
      );
      const verification = await this.verifyAlignmentPair(persistedPip.reference);
      if (verification.state !== 'PASS_VERIFIED') {
        fail('ALIGNMENT_PAIR_INVALID', `persisted alignment pair is ${verification.state}`);
      }
      if (!receiptMatchesCommand(verification.receipt.artifact, command)) {
        fail('ALIGNED_REVISION_IMMUTABLE', 'valid prior alignment uses another confirmation');
      }
      return {
        outcome: 'PASS',
        alignedPip: verification.alignedPip,
        receipt: verification.receipt,
        implementationAuthorized: false,
      };
    } catch (error) {
      if (error instanceof IntentAlignmentError && error.code === 'ALIGNMENT_PAIR_INVALID') {
        throw error;
      }
      const verification = await this.verifyAlignmentPair(persistedPip.reference);
      if (
        verification.state === 'PASS_VERIFIED' &&
        receiptMatchesCommand(verification.receipt.artifact, command)
      ) {
        return {
          outcome: 'PASS',
          alignedPip: verification.alignedPip,
          receipt: verification.receipt,
          implementationAuthorized: false,
        };
      }
      if (verification.state === 'PASS_VERIFIED') {
        fail('ALIGNED_REVISION_IMMUTABLE', 'valid prior alignment uses another confirmation');
      }
      fail(
        verification.state === 'INCOMPLETE'
          ? 'ALIGNMENT_PAIR_INCOMPLETE'
          : 'ALIGNMENT_PAIR_INVALID',
        `alignment persistence did not produce a valid pair: ${verification.reason}`,
      );
    }
  }

  async verifyAlignmentPair(
    alignedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>,
  ): Promise<AlignmentPairVerification> {
    let pip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>;
    try {
      pip = await this.artifacts.loadLocal(alignedPipRef);
    } catch (error) {
      return {
        state: 'INVALID',
        reason: `aligned PIP could not be verified: ${String(error)}`,
        implementationAuthorized: false,
      };
    }
    if (
      pip.artifact.lifecycle !== 'ALIGNED' ||
      pip.artifact.alignment.status !== 'ALIGNED' ||
      pip.artifact.alignment.receiptRef === undefined
    ) {
      return {
        state: 'INVALID',
        reason: 'PIP is not an aligned receipt-bound revision',
        implementationAuthorized: false,
      };
    }
    const receiptId = alignmentReceiptId(pip.artifact.revisionId);
    if (pip.artifact.alignment.receiptRef !== canonicalAlignmentReceiptPath(receiptId)) {
      return {
        state: 'INVALID',
        reason: 'PIP receipt path is not canonical for this revision',
        implementationAuthorized: false,
      };
    }
    let receipt: LocalProjectArtifact<'INTENT_ALIGNMENT_RECEIPT'>;
    try {
      receipt = await this.artifacts.resolveLocalAlignmentReceipt(
        pip.artifact.projectId,
        receiptId,
      );
    } catch (error) {
      if (isMissingFile(error)) {
        return {
          state: 'INCOMPLETE',
          reason: 'aligned PIP exists without its receipt',
          implementationAuthorized: false,
        };
      }
      return {
        state: 'INVALID',
        reason: `alignment receipt could not be verified: ${String(error)}`,
        implementationAuthorized: false,
      };
    }
    if (!receiptMatchesPair(receipt.artifact, pip)) {
      return {
        state: 'INVALID',
        reason: 'PIP and receipt do not form the exact alignment pair',
        implementationAuthorized: false,
      };
    }
    return {
      state: 'PASS_VERIFIED',
      alignedPip: pip,
      receipt,
      implementationAuthorized: false,
    };
  }

  async reopenAfterMaterialChange(
    alignedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>,
    input: IncrementalIntentRevisionInput,
  ): Promise<ReopenAlignedIntentResult> {
    const pair = await this.verifyAlignmentPair(alignedPipRef);
    if (pair.state !== 'PASS_VERIFIED') {
      fail(
        'ALIGNMENT_PAIR_INVALID',
        'material change requires a complete valid prior alignment pair',
      );
    }
    const materialProvenance = [
      ...input.updates.map((update) => update.provenance),
      ...(input.humanDecisions ?? []).map((decision) => decision.provenance),
    ];
    if (
      materialProvenance.length === 0 ||
      materialProvenance.some(
        (provenance) => provenance.length === 0 || !hasHumanAuthority(provenance),
      )
    ) {
      fail(
        'MATERIAL_CHANGE_PROVENANCE_REQUIRED',
        'material intent change requires valid human provenance',
      );
    }

    const reopenedBase = structuredClone(pair.alignedPip.artifact);
    reopenedBase.lifecycle = 'REOPENED_AFTER_MATERIAL_CHANGE';
    reopenedBase.alignment = { status: 'REOPENED' };
    const successor = createIncrementalIntentRevision(reopenedBase, input);
    successor.lifecycle = 'REOPENED_AFTER_MATERIAL_CHANGE';
    successor.alignment = { status: 'REOPENED' };
    successor.readiness = {
      state: 'NOT_READY',
      blockingUnknownIds: successor.unknowns
        .filter((unknown) => unknown.blocking)
        .map((unknown) => unknown.id)
        .sort(),
      assessedAt: input.createdAt,
    };
    successor.contentDigest = ZERO_DIGEST;
    const successorPip = await this.artifacts.writePip(successor);

    const preservedPair = await this.verifyAlignmentPair(pair.alignedPip.reference);
    if (preservedPair.state !== 'PASS_VERIFIED') {
      fail('ALIGNMENT_PAIR_INVALID', 'material change did not preserve the prior alignment pair');
    }
    return {
      priorAlignedPip: preservedPair.alignedPip,
      priorReceipt: preservedPair.receipt,
      successorPip,
      implementationAuthorized: false,
    };
  }
}
