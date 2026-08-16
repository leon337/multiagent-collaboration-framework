import { createHash } from 'node:crypto';

import type {
  McfArtifactRef,
  ProjectRealityReportV1,
  ProvenanceRef,
  RealityAssertionKind,
} from '@rsa/contracts';

import {
  type CanonicalArtifactRef,
  type LocalProjectArtifact,
  RepositoryProjectArtifactStore,
} from '../project-artifacts/repository-project-artifact.store.js';
import { IntentAlignmentService } from './intent-alignment.service.js';

const ZERO_DIGEST = `sha256:${'0'.repeat(64)}`;
const EXACT_SHA = /^[0-9a-f]{40}$/iu;
const MACHINE_EVIDENCE = 'MACHINE_EVIDENCE';

export type RealityObservation = ProjectRealityReportV1['observations'][number];
export type RealityBaseline = ProjectRealityReportV1['baseline'];

export interface ReconnaissanceDraftInput {
  projectId: string;
  revisionId: string;
  methodologyPin: ProjectRealityReportV1['methodologyPin'];
  createdAt: string;
  baseline: RealityBaseline;
  observations: RealityObservation[];
  unresolvedFacts: ProjectRealityReportV1['unresolvedFacts'];
}

export interface WorkingReconnaissanceDraft extends ReconnaissanceDraftInput {
  viewType: 'WORKING_RECONNAISSANCE_DRAFT';
  authorityClass: 'WORKING_PROPOSED_ARTIFACT';
  readOnlyFirst: true;
  implementationAuthorized: false;
}

export interface RealityReadback {
  viewType: 'DERIVED_REALITY_READBACK';
  authorityClass: 'DERIVED_REBUILDABLE_VIEW';
  projectId: string;
  revisionId: string;
  methodologyPin: ProjectRealityReportV1['methodologyPin'];
  exactBaseline: RealityBaseline;
  observations: RealityObservation[];
  unresolvedFacts: ProjectRealityReportV1['unresolvedFacts'];
  factObservationIds: string[];
  inferenceObservationIds: string[];
  unknownObservationIds: string[];
  conflictingObservationIds: string[];
  confirmationStatement: 'REALITY CONFIRMATION = AS_IS VALIDATION';
  intentBoundaryStatement: 'REALITY CONFIRMATION != TO_BE HUMAN INTENT';
  implementationAuthorized: false;
  readbackDigest: string;
}

export interface RealityConfirmationCommand {
  humanAuthority: string;
  confirmationSourceRef: string;
  confirmedAt: string;
  expectedRepository: string;
  expectedCommitSha: string;
  finalReadbackDigest: string;
  decision: 'CONFIRMED' | 'CONFIRMED_WITH_CORRECTIONS';
  correctionRefs?: string[] | undefined;
}

export interface GapComparisonInput {
  gapId: string;
  statement: string;
  material: boolean;
  asIsObservationIds: string[];
  toBeIntentDimensionRefs: string[];
  toBeHumanDecisionIds: string[];
  unresolved: boolean;
}

export interface DerivedGapMap {
  viewType: 'DERIVED_GAP_MAP';
  authorityClass: 'DERIVED_REBUILDABLE_VIEW';
  projectId: string;
  analysisVersion: string;
  sourcePrrRef: CanonicalArtifactRef<'PROJECT_REALITY_REPORT'>;
  sourceAlignedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;
  baseline: RealityBaseline;
  materialGaps: GapComparisonInput[];
  nonMaterialGaps: GapComparisonInput[];
  unresolvedComparisons: GapComparisonInput[];
  implementationAuthorized: false;
  gapMapDigest: string;
}

export interface CompletionPlanItem {
  itemId: string;
  gapId: string;
  statement: string;
}

export interface WorkingCompletionRecoveryPlan {
  viewType: 'WORKING_COMPLETION_RECOVERY_PLAN';
  authorityClass: 'WORKING_PROPOSED_ARTIFACT';
  projectId: string;
  sourceGapMapDigest: string;
  sourcePrrRef: CanonicalArtifactRef<'PROJECT_REALITY_REPORT'>;
  sourceAlignedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;
  items: CompletionPlanItem[];
  implementationAuthorized: false;
}

export type ProjectRealityErrorCode =
  | 'BASELINE_INVALID'
  | 'OBSERVATION_INVALID'
  | 'FACT_EVIDENCE_REQUIRED'
  | 'FACT_MACHINE_EVIDENCE_REQUIRED'
  | 'REALITY_READBACK_INVALID'
  | 'REALITY_CONFIRMATION_INVALID'
  | 'REALITY_AUTHORITY_INVALID'
  | 'PRR_NOT_CONFIRMED'
  | 'PRR_REF_MISMATCH'
  | 'ALIGNMENT_PAIR_REQUIRED'
  | 'GAP_COMPARISON_INVALID'
  | 'NO_MATERIAL_GAP'
  | 'PLAN_INVALID';

export class ProjectRealityError extends Error {
  constructor(
    readonly code: ProjectRealityErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ProjectRealityError';
  }
}

function fail(code: ProjectRealityErrorCode, message: string): never {
  throw new ProjectRealityError(code, message);
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

function digest(value: unknown): string {
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(sortJson(value)), 'utf8')
    .digest('hex')}`;
}

function withoutDigest<T extends { readbackDigest?: string; gapMapDigest?: string }>(value: T): T {
  const copy = structuredClone(value);
  delete copy.readbackDigest;
  delete copy.gapMapDigest;
  return copy;
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

function assertTimestamp(value: string, label: string): void {
  if (value.trim().length === 0 || Number.isNaN(Date.parse(value))) {
    fail('BASELINE_INVALID', `${label} must be a valid timestamp`);
  }
}

function assertBaseline(baseline: RealityBaseline): void {
  if (baseline.repository.trim().length === 0 || !EXACT_SHA.test(baseline.commitSha)) {
    fail('BASELINE_INVALID', 'reconnaissance requires an exact repository and 40-hex commit SHA');
  }
  assertTimestamp(baseline.capturedAt, 'baseline.capturedAt');
}

function assertObservation(observation: RealityObservation): void {
  if (
    observation.observationId.trim().length === 0 ||
    observation.domain.trim().length === 0 ||
    observation.statement.trim().length === 0 ||
    observation.provenance.length === 0
  ) {
    fail(
      'OBSERVATION_INVALID',
      'reality observations require identity, domain, statement and provenance',
    );
  }
  if (observation.kind === 'FACT') {
    if (observation.evidenceRefs.length === 0) {
      fail('FACT_EVIDENCE_REQUIRED', 'FACT requires at least one concrete evidence reference');
    }
    if (!observation.provenance.some((entry) => entry.type === MACHINE_EVIDENCE)) {
      fail(
        'FACT_MACHINE_EVIDENCE_REQUIRED',
        'a human-only technical assertion cannot be promoted automatically to FACT',
      );
    }
  }
}

function classifyIds(observations: RealityObservation[], kind: RealityAssertionKind): string[] {
  return observations
    .filter((observation) => observation.kind === kind)
    .map((observation) => observation.observationId)
    .sort();
}

export function calculateRealityReadbackDigest(
  readback: Omit<RealityReadback, 'readbackDigest'> | RealityReadback,
): string {
  return digest(withoutDigest(readback as RealityReadback));
}

export function calculateGapMapDigest(
  gapMap: Omit<DerivedGapMap, 'gapMapDigest'> | DerivedGapMap,
): string {
  return digest(withoutDigest(gapMap as DerivedGapMap));
}

export function createReconnaissanceDraft(
  input: ReconnaissanceDraftInput,
): WorkingReconnaissanceDraft {
  assertBaseline(input.baseline);
  assertTimestamp(input.createdAt, 'createdAt');
  if (input.projectId.trim().length === 0 || input.revisionId.trim().length === 0) {
    fail('BASELINE_INVALID', 'projectId and revisionId are required');
  }
  input.observations.forEach(assertObservation);
  const observationIds = new Set<string>();
  for (const observation of input.observations) {
    if (observationIds.has(observation.observationId)) {
      fail('OBSERVATION_INVALID', `duplicate observationId: ${observation.observationId}`);
    }
    observationIds.add(observation.observationId);
  }
  return {
    ...structuredClone(input),
    viewType: 'WORKING_RECONNAISSANCE_DRAFT',
    authorityClass: 'WORKING_PROPOSED_ARTIFACT',
    readOnlyFirst: true,
    implementationAuthorized: false,
  };
}

export function createRealityReadback(draft: WorkingReconnaissanceDraft): RealityReadback {
  assertBaseline(draft.baseline);
  draft.observations.forEach(assertObservation);
  const without: Omit<RealityReadback, 'readbackDigest'> = {
    viewType: 'DERIVED_REALITY_READBACK',
    authorityClass: 'DERIVED_REBUILDABLE_VIEW',
    projectId: draft.projectId,
    revisionId: draft.revisionId,
    methodologyPin: structuredClone(draft.methodologyPin),
    exactBaseline: structuredClone(draft.baseline),
    observations: structuredClone(draft.observations),
    unresolvedFacts: structuredClone(draft.unresolvedFacts),
    factObservationIds: classifyIds(draft.observations, 'FACT'),
    inferenceObservationIds: classifyIds(draft.observations, 'INFERENCE'),
    unknownObservationIds: classifyIds(draft.observations, 'UNKNOWN'),
    conflictingObservationIds: classifyIds(draft.observations, 'CONFLICTING'),
    confirmationStatement: 'REALITY CONFIRMATION = AS_IS VALIDATION',
    intentBoundaryStatement: 'REALITY CONFIRMATION != TO_BE HUMAN INTENT',
    implementationAuthorized: false,
  };
  return { ...without, readbackDigest: calculateRealityReadbackDigest(without) };
}

function assertRealityConfirmation(
  readback: RealityReadback,
  command: RealityConfirmationCommand,
): void {
  if (command.humanAuthority !== 'LEANDRO') {
    fail('REALITY_AUTHORITY_INVALID', 'Reality Confirmation must come from LEANDRO');
  }
  if (
    command.confirmationSourceRef.trim().length === 0 ||
    command.confirmedAt.trim().length === 0 ||
    Number.isNaN(Date.parse(command.confirmedAt))
  ) {
    fail(
      'REALITY_CONFIRMATION_INVALID',
      'Reality Confirmation requires traceable source and timestamp',
    );
  }
  if (
    command.expectedRepository !== readback.exactBaseline.repository ||
    command.expectedCommitSha !== readback.exactBaseline.commitSha
  ) {
    fail(
      'REALITY_READBACK_INVALID',
      'Reality Confirmation is not bound to the exact read-back baseline',
    );
  }
  if (
    command.finalReadbackDigest !== readback.readbackDigest ||
    calculateRealityReadbackDigest(readback) !== readback.readbackDigest
  ) {
    fail('REALITY_READBACK_INVALID', 'Reality Read-Back digest does not verify');
  }
  if (
    command.decision === 'CONFIRMED_WITH_CORRECTIONS' &&
    (command.correctionRefs === undefined || command.correctionRefs.length === 0)
  ) {
    fail('REALITY_CONFIRMATION_INVALID', 'CONFIRMED_WITH_CORRECTIONS requires correctionRefs');
  }
}

export class ProjectRealityReportService {
  constructor(
    private readonly artifacts: RepositoryProjectArtifactStore,
    private readonly alignment: IntentAlignmentService,
  ) {}

  async confirmAndPersist(
    readback: RealityReadback,
    command: RealityConfirmationCommand,
  ): Promise<LocalProjectArtifact<'PROJECT_REALITY_REPORT'>> {
    assertRealityConfirmation(readback, command);
    readback.observations.forEach(assertObservation);
    const candidate: ProjectRealityReportV1 = {
      artifactType: 'PROJECT_REALITY_REPORT',
      schemaVersion: '1.0',
      projectId: readback.projectId,
      revisionId: readback.revisionId,
      methodologyPin: structuredClone(readback.methodologyPin),
      createdAt: readback.exactBaseline.capturedAt,
      baseline: structuredClone(readback.exactBaseline),
      observations: structuredClone(readback.observations),
      unresolvedFacts: structuredClone(readback.unresolvedFacts),
      realityConfirmation: {
        status: command.decision,
        confirmedAt: command.confirmedAt,
        ...(command.decision === 'CONFIRMED_WITH_CORRECTIONS'
          ? { correctionRefs: structuredClone(command.correctionRefs ?? []) }
          : {}),
      },
      contentDigest: ZERO_DIGEST,
    };
    const persisted = await this.artifacts.writePrr(candidate);
    const loaded = await this.artifacts.loadLocal(persisted.reference);
    if (!sameRef(loaded.reference, persisted.reference)) {
      fail(
        'PRR_REF_MISMATCH',
        'persisted PRR did not round-trip with its exact canonical reference',
      );
    }
    return loaded;
  }

  async createGapMap(input: {
    prrRef: CanonicalArtifactRef<'PROJECT_REALITY_REPORT'>;
    alignedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;
    analysisVersion: string;
    comparisons: GapComparisonInput[];
  }): Promise<DerivedGapMap> {
    const prr = await this.artifacts.loadLocal(input.prrRef);
    if (
      prr.artifact.realityConfirmation.status !== 'CONFIRMED' &&
      prr.artifact.realityConfirmation.status !== 'CONFIRMED_WITH_CORRECTIONS'
    ) {
      fail('PRR_NOT_CONFIRMED', 'authoritative Gap Map requires an exact confirmed PRR');
    }
    const pair = await this.alignment.verifyAlignmentPair(input.alignedPipRef);
    if (pair.state !== 'PASS_VERIFIED') {
      fail(
        'ALIGNMENT_PAIR_REQUIRED',
        'Gap Map requires the exact verified aligned PIP + receipt pair',
      );
    }
    if (prr.artifact.projectId !== pair.alignedPip.artifact.projectId) {
      fail('PRR_REF_MISMATCH', 'PRR and aligned PIP belong to different projects');
    }
    if (input.analysisVersion.trim().length === 0) {
      fail('GAP_COMPARISON_INVALID', 'analysisVersion is required');
    }

    const observationIds = new Set(prr.artifact.observations.map((item) => item.observationId));
    const dimensionIds = new Set(Object.keys(pair.alignedPip.artifact.dimensions));
    const currentDecisionIds = new Set(
      pair.alignedPip.artifact.humanDecisions
        .filter((decision) => decision.status === 'CURRENT')
        .map((decision) => decision.decisionId),
    );
    const gapIds = new Set<string>();
    for (const comparison of input.comparisons) {
      if (
        comparison.gapId.trim().length === 0 ||
        comparison.statement.trim().length === 0 ||
        gapIds.has(comparison.gapId) ||
        comparison.asIsObservationIds.some((id) => !observationIds.has(id)) ||
        comparison.toBeIntentDimensionRefs.some((id) => !dimensionIds.has(id)) ||
        comparison.toBeHumanDecisionIds.some((id) => !currentDecisionIds.has(id))
      ) {
        fail(
          'GAP_COMPARISON_INVALID',
          `gap comparison is not bound to exact PRR/PIP inputs: ${comparison.gapId}`,
        );
      }
      gapIds.add(comparison.gapId);
    }

    const without: Omit<DerivedGapMap, 'gapMapDigest'> = {
      viewType: 'DERIVED_GAP_MAP',
      authorityClass: 'DERIVED_REBUILDABLE_VIEW',
      projectId: prr.artifact.projectId,
      analysisVersion: input.analysisVersion,
      sourcePrrRef: structuredClone(prr.reference),
      sourceAlignedPipRef: structuredClone(pair.alignedPip.reference),
      baseline: structuredClone(prr.artifact.baseline),
      materialGaps: structuredClone(input.comparisons.filter((gap) => gap.material)),
      nonMaterialGaps: structuredClone(input.comparisons.filter((gap) => !gap.material)),
      unresolvedComparisons: structuredClone(input.comparisons.filter((gap) => gap.unresolved)),
      implementationAuthorized: false,
    };
    return { ...without, gapMapDigest: calculateGapMapDigest(without) };
  }

  createCompletionRecoveryPlan(
    gapMap: DerivedGapMap,
    items: CompletionPlanItem[],
  ): WorkingCompletionRecoveryPlan {
    if (
      gapMap.authorityClass !== 'DERIVED_REBUILDABLE_VIEW' ||
      gapMap.implementationAuthorized !== false ||
      calculateGapMapDigest(gapMap) !== gapMap.gapMapDigest
    ) {
      fail('PLAN_INVALID', 'Completion/Recovery Plan requires a valid derived Gap Map');
    }
    if (gapMap.materialGaps.length === 0) {
      fail(
        'NO_MATERIAL_GAP',
        'no Completion/Recovery Plan is created without a material validated gap',
      );
    }
    const materialGapIds = new Set(gapMap.materialGaps.map((gap) => gap.gapId));
    if (
      items.length === 0 ||
      items.some(
        (item) =>
          item.itemId.trim().length === 0 ||
          item.statement.trim().length === 0 ||
          !materialGapIds.has(item.gapId),
      )
    ) {
      fail('PLAN_INVALID', 'plan items must reference material gaps from the exact Gap Map');
    }
    return {
      viewType: 'WORKING_COMPLETION_RECOVERY_PLAN',
      authorityClass: 'WORKING_PROPOSED_ARTIFACT',
      projectId: gapMap.projectId,
      sourceGapMapDigest: gapMap.gapMapDigest,
      sourcePrrRef: structuredClone(gapMap.sourcePrrRef),
      sourceAlignedPipRef: structuredClone(gapMap.sourceAlignedPipRef),
      items: structuredClone(items),
      implementationAuthorized: false,
    };
  }
}

export function isGapMapStale(
  gapMap: DerivedGapMap,
  currentPrrRef: CanonicalArtifactRef<'PROJECT_REALITY_REPORT'>,
  currentAlignedPipRef: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>,
): boolean {
  return (
    !sameRef(gapMap.sourcePrrRef, currentPrrRef) ||
    !sameRef(gapMap.sourceAlignedPipRef, currentAlignedPipRef)
  );
}

export function isCompletionPlanStale(
  plan: WorkingCompletionRecoveryPlan,
  currentGapMap: DerivedGapMap,
): boolean {
  return plan.sourceGapMapDigest !== currentGapMap.gapMapDigest;
}

export function machineEvidence(
  sourceRef: string,
  capturedAt: string,
  actor = 'MESTRE',
): ProvenanceRef {
  return { type: 'MACHINE_EVIDENCE', sourceRef, capturedAt, actor };
}
