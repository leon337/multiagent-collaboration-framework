import type {
  HumanDecisionRecord,
  IntentDimensionRecord,
  ProjectIntentPackageV1,
  ProvenanceRef,
} from '@rsa/contracts';

import type {
  LocalProjectArtifact,
  RepositoryProjectArtifactStore,
} from '../project-artifacts/repository-project-artifact.store.js';

export type IntentDimension = keyof ProjectIntentPackageV1['dimensions'];

export const CANONICAL_INTENT_DIMENSIONS = [
  'PROBLEM',
  'MOTIVATION',
  'DESIRED_OUTCOME',
  'TARGET_USERS',
  'CRITICAL_USER_JOURNEYS',
  'MUST_HAVE',
  'SHOULD_HAVE',
  'NON_GOALS',
  'PRIORITIES_AND_TRADEOFFS',
  'BUSINESS_RULES',
  'DATA_AND_SENSITIVITY',
  'ROLES_AND_PERMISSIONS',
  'AUTOMATION_LEVEL',
  'INTEGRATIONS',
  'PLATFORM_AND_USAGE_CONTEXT',
  'COST_AND_RESOURCE_CONSTRAINTS',
  'QUALITY_EXPECTATIONS',
  'FAILURE_TOLERANCE',
  'DEFINITION_OF_DONE',
  'FUTURE_VISION',
] as const satisfies readonly IntentDimension[];

const HUMAN_AUTHORITY_PROVENANCE = new Set([
  'HUMAN_DIRECT_STATEMENT',
  'HUMAN_CONFIRMED_SYNTHESIS',
  'PRIOR_VALID_HUMAN_DECISION',
]);

const ZERO_DIGEST = `sha256:${'0'.repeat(64)}`;

export type IntentDiscoveryErrorCode =
  | 'I4_BOUNDARY'
  | 'REVISION_REQUIRED'
  | 'PROVENANCE_REQUIRED'
  | 'MACHINE_AUTHORITY_BOUNDARY'
  | 'PRODUCT_DEFINITION_INVALID'
  | 'INVALID_QUESTION';

export class IntentDiscoveryError extends Error {
  constructor(
    readonly code: IntentDiscoveryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'IntentDiscoveryError';
  }
}

export interface ProductDefinitionSeed {
  sourceSkill: 'MCF-DEFINE-PRODUCT';
  problemStatement: string;
  requirements: string[];
  acceptanceCriteria: string[];
  provenance: ProvenanceRef[];
}

export interface CreateDiscoveryPipInput {
  projectId: string;
  revisionId: string;
  methodologyPin: ProjectIntentPackageV1['methodologyPin'];
  createdAt: string;
  identity?: ProjectIntentPackageV1['identity'] | undefined;
  originalIntent: ProjectIntentPackageV1['originalIntent'];
  productDefinition?: ProductDefinitionSeed | undefined;
}

export interface IntentDimensionUpdate {
  dimension: IntentDimension;
  state: IntentDimensionRecord['state'];
  value: unknown;
  provenance: ProvenanceRef[];
  readinessImpact: IntentDimensionRecord['readinessImpact'];
  notes?: string[] | undefined;
}

export interface IncrementalIntentRevisionInput {
  revisionId: string;
  createdAt: string;
  updates: IntentDimensionUpdate[];
  humanDecisions?: HumanDecisionRecord[] | undefined;
}

export interface IntentReadinessAssessment {
  pip: ProjectIntentPackageV1;
  blockingUnknownIds: string[];
  implementationAuthorized: false;
}

export interface IntentQuestionCandidate {
  questionId: string;
  prompt: string;
  questionClass: 'HUMAN_INTENT' | 'TEAM_FIRST_TECHNICAL';
  targetDimensions: IntentDimension[];
  informationGain: number;
  materialReason?: string | undefined;
}

export interface SelectedIntentQuestion {
  questionId: string;
  prompt: string;
  targetDimensions: IntentDimension[];
  unresolvedDimensions: IntentDimension[];
  blockingDimensions: IntentDimension[];
  informationGain: number;
  routing: 'HUMAN_AUTHORITY';
  selectionReason: string;
}

export interface ProgressiveIntentReadback {
  viewType: 'DERIVED_PROGRESSIVE_READBACK';
  sourceArtifact: {
    artifactType: 'PROJECT_INTENT_PACKAGE';
    revisionId: string;
  };
  reusedSkillSemantics: 'MCF-DEFINE-PRODUCT';
  dimensions: Array<{ dimension: IntentDimension; record: IntentDimensionRecord }>;
  unknowns: ProjectIntentPackageV1['unknowns'];
  blockers: ProjectIntentPackageV1['blockers'];
  conflicts: ProjectIntentPackageV1['conflicts'];
  readiness: ProjectIntentPackageV1['readiness'];
  implementationAuthorized: false;
}

function fail(code: IntentDiscoveryErrorCode, message: string): never {
  throw new IntentDiscoveryError(code, message);
}

function hasHumanAuthority(provenance: ProvenanceRef[]): boolean {
  return provenance.some((item) => HUMAN_AUTHORITY_PROVENANCE.has(item.type));
}

function assertProvenance(provenance: ProvenanceRef[]): void {
  if (provenance.length === 0) {
    fail('PROVENANCE_REQUIRED', 'intent assertions require non-empty classified provenance');
  }
}

function unresolvedDimension(record: IntentDimensionRecord): boolean {
  return record.state === 'UNKNOWN' || record.state === 'PARTIAL' || record.state === 'CONFLICTING';
}

function dimensionUnknownId(dimension: IntentDimension): string {
  return `dimension:${dimension}`;
}

function defaultDimension(provenance: ProvenanceRef[]): IntentDimensionRecord {
  return {
    state: 'UNKNOWN',
    value: null,
    provenance: structuredClone(provenance),
    readinessImpact: 'BLOCKING',
  };
}

function seedDimension(
  value: unknown,
  provenance: ProvenanceRef[],
  note: string,
): IntentDimensionRecord {
  return {
    state: hasHumanAuthority(provenance) ? 'CLEAR' : 'PARTIAL',
    value: structuredClone(value),
    provenance: structuredClone(provenance),
    readinessImpact: 'BLOCKING',
    notes: [note],
  };
}

function assertI3WorkingPip(pip: ProjectIntentPackageV1): void {
  if (pip.lifecycle !== 'DISCOVERY_IN_PROGRESS' && pip.lifecycle !== 'READY_FOR_ALIGNMENT') {
    fail('I4_BOUNDARY', `I3 cannot handle PIP lifecycle ${pip.lifecycle}`);
  }
  if (pip.alignment.status !== 'NOT_ALIGNED') {
    fail('I4_BOUNDARY', 'I3 cannot create or persist final alignment state');
  }
}

export function createDiscoveryPip(input: CreateDiscoveryPipInput): ProjectIntentPackageV1 {
  assertProvenance(input.originalIntent.provenance);
  const dimensions = Object.fromEntries(
    CANONICAL_INTENT_DIMENSIONS.map((dimension) => [
      dimension,
      defaultDimension(input.originalIntent.provenance),
    ]),
  ) as unknown as ProjectIntentPackageV1['dimensions'];

  if (input.productDefinition !== undefined) {
    assertProvenance(input.productDefinition.provenance);
    if (
      input.productDefinition.problemStatement.trim().length === 0 ||
      input.productDefinition.requirements.length === 0 ||
      input.productDefinition.acceptanceCriteria.length === 0
    ) {
      fail(
        'PRODUCT_DEFINITION_INVALID',
        'MCF-DEFINE-PRODUCT seed requires problem, requirements and acceptance criteria',
      );
    }
    const note = 'Seeded from MCF-DEFINE-PRODUCT; authority remains bound to provenance.';
    dimensions.PROBLEM = seedDimension(
      input.productDefinition.problemStatement,
      input.productDefinition.provenance,
      note,
    );
    dimensions.MUST_HAVE = seedDimension(
      input.productDefinition.requirements,
      input.productDefinition.provenance,
      note,
    );
    dimensions.DEFINITION_OF_DONE = seedDimension(
      input.productDefinition.acceptanceCriteria,
      input.productDefinition.provenance,
      note,
    );
  }

  const unknowns = CANONICAL_INTENT_DIMENSIONS.filter((dimension) =>
    unresolvedDimension(dimensions[dimension]),
  ).map((dimension) => ({
    id: dimensionUnknownId(dimension),
    statement: `${dimension} remains unresolved`,
    blocking: dimensions[dimension].readinessImpact === 'BLOCKING',
  }));

  return {
    artifactType: 'PROJECT_INTENT_PACKAGE',
    schemaVersion: '1.0',
    projectId: input.projectId,
    revisionId: input.revisionId,
    lifecycle: 'DISCOVERY_IN_PROGRESS',
    methodologyPin: structuredClone(input.methodologyPin),
    createdAt: input.createdAt,
    identity: structuredClone(input.identity ?? {}),
    originalIntent: structuredClone(input.originalIntent),
    dimensions,
    humanDecisions: [],
    technicalDelegations: [],
    assumptions: [],
    unknowns,
    blockers: [],
    conflicts: [],
    readiness: {
      state: 'NOT_READY',
      blockingUnknownIds: unknowns
        .filter((unknown) => unknown.blocking)
        .map((unknown) => unknown.id),
      assessedAt: input.createdAt,
    },
    alignment: { status: 'NOT_ALIGNED' },
    contentDigest: ZERO_DIGEST,
  };
}

export function createIncrementalIntentRevision(
  current: ProjectIntentPackageV1,
  input: IncrementalIntentRevisionInput,
): ProjectIntentPackageV1 {
  assertI3WorkingPip(current);
  if (input.revisionId === current.revisionId) {
    fail('REVISION_REQUIRED', 'material discovery updates require a successor PIP revision');
  }

  const successor = structuredClone(current);
  successor.revisionId = input.revisionId;
  successor.supersedesRevisionId = current.revisionId;
  successor.createdAt = input.createdAt;
  successor.lifecycle = 'DISCOVERY_IN_PROGRESS';
  successor.alignment = { status: 'NOT_ALIGNED' };
  successor.contentDigest = ZERO_DIGEST;

  for (const update of input.updates) {
    assertProvenance(update.provenance);
    if (update.state === 'CLEAR' && !hasHumanAuthority(update.provenance)) {
      fail(
        'MACHINE_AUTHORITY_BOUNDARY',
        `machine-only provenance cannot make ${update.dimension} a clear human-intent assertion`,
      );
    }
    successor.dimensions[update.dimension] = {
      state: update.state,
      value: structuredClone(update.value),
      provenance: structuredClone(update.provenance),
      readinessImpact: update.readinessImpact,
      ...(update.notes === undefined ? {} : { notes: structuredClone(update.notes) }),
    };
  }

  for (const decision of input.humanDecisions ?? []) {
    assertProvenance(decision.provenance);
    if (!hasHumanAuthority(decision.provenance)) {
      fail(
        'MACHINE_AUTHORITY_BOUNDARY',
        'machine inference or evidence cannot create a human decision',
      );
    }
    successor.humanDecisions.push(structuredClone(decision));
  }

  const otherUnknowns = successor.unknowns.filter(
    (unknown) => !unknown.id.startsWith('dimension:'),
  );
  successor.unknowns = [
    ...CANONICAL_INTENT_DIMENSIONS.filter((dimension) =>
      unresolvedDimension(successor.dimensions[dimension]),
    ).map((dimension) => ({
      id: dimensionUnknownId(dimension),
      statement: `${dimension} remains unresolved`,
      blocking: successor.dimensions[dimension].readinessImpact === 'BLOCKING',
    })),
    ...otherUnknowns,
  ];
  return successor;
}

export function assessIntentReadiness(
  input: ProjectIntentPackageV1,
  assessedAt: string,
): IntentReadinessAssessment {
  assertI3WorkingPip(input);
  const pip = structuredClone(input);
  const blockingDimensions = CANONICAL_INTENT_DIMENSIONS.filter((dimension) => {
    const record = pip.dimensions[dimension];
    return unresolvedDimension(record) && record.readinessImpact === 'BLOCKING';
  }).map(dimensionUnknownId);
  const blockingUnknowns = pip.unknowns
    .filter((unknown) => unknown.blocking)
    .map((unknown) => unknown.id);
  const blockingUnknownIds = [...new Set([...blockingDimensions, ...blockingUnknowns])].sort();
  const allDimensionsResolved = CANONICAL_INTENT_DIMENSIONS.every(
    (dimension) => !unresolvedDimension(pip.dimensions[dimension]),
  );

  const state =
    blockingUnknownIds.length > 0 || pip.blockers.length > 0
      ? 'NOT_READY'
      : allDimensionsResolved && pip.conflicts.length === 0
        ? 'READY_FOR_ALIGNMENT'
        : 'CONDITIONALLY_READY';
  pip.readiness = { state, blockingUnknownIds, assessedAt };
  pip.lifecycle = state === 'READY_FOR_ALIGNMENT' ? 'READY_FOR_ALIGNMENT' : 'DISCOVERY_IN_PROGRESS';
  pip.alignment = { status: 'NOT_ALIGNED' };

  return { pip, blockingUnknownIds, implementationAuthorized: false };
}

export function selectNextIntentQuestion(
  pip: ProjectIntentPackageV1,
  candidates: IntentQuestionCandidate[],
): SelectedIntentQuestion | null {
  assertI3WorkingPip(pip);
  const ranked = candidates
    .map((candidate) => {
      if (
        candidate.questionId.trim().length === 0 ||
        candidate.prompt.trim().length === 0 ||
        candidate.targetDimensions.length === 0 ||
        !Number.isFinite(candidate.informationGain) ||
        candidate.informationGain < 0
      ) {
        fail('INVALID_QUESTION', 'question candidates require identity, prompt, targets and gain');
      }
      if (candidate.questionClass === 'TEAM_FIRST_TECHNICAL') return null;
      const targetDimensions = [...new Set(candidate.targetDimensions)];
      const unresolvedDimensions = targetDimensions.filter((dimension) =>
        unresolvedDimension(pip.dimensions[dimension]),
      );
      const materialReason = candidate.materialReason?.trim() ?? '';
      if (unresolvedDimensions.length === 0 && materialReason.length === 0) return null;
      const blockingDimensions = unresolvedDimensions.filter(
        (dimension) => pip.dimensions[dimension].readinessImpact === 'BLOCKING',
      );
      return {
        candidate,
        targetDimensions,
        unresolvedDimensions,
        blockingDimensions,
        materialReason,
      };
    })
    .filter((candidate) => candidate !== null)
    .sort((left, right) => {
      if (left.blockingDimensions.length !== right.blockingDimensions.length) {
        return right.blockingDimensions.length - left.blockingDimensions.length;
      }
      if (left.unresolvedDimensions.length !== right.unresolvedDimensions.length) {
        return right.unresolvedDimensions.length - left.unresolvedDimensions.length;
      }
      if (left.candidate.informationGain !== right.candidate.informationGain) {
        return right.candidate.informationGain - left.candidate.informationGain;
      }
      return left.candidate.questionId < right.candidate.questionId
        ? -1
        : left.candidate.questionId > right.candidate.questionId
          ? 1
          : 0;
    });

  const selected = ranked[0];
  if (selected === undefined) return null;
  const reason =
    selected.unresolvedDimensions.length === 0
      ? `material revisit: ${selected.materialReason}`
      : `${selected.blockingDimensions.length} blocking and ${selected.unresolvedDimensions.length} total unresolved dimensions; information gain ${selected.candidate.informationGain}`;
  return {
    questionId: selected.candidate.questionId,
    prompt: selected.candidate.prompt,
    targetDimensions: selected.targetDimensions,
    unresolvedDimensions: selected.unresolvedDimensions,
    blockingDimensions: selected.blockingDimensions,
    informationGain: selected.candidate.informationGain,
    routing: 'HUMAN_AUTHORITY',
    selectionReason: reason,
  };
}

export function createProgressiveIntentReadback(
  pip: ProjectIntentPackageV1,
): ProgressiveIntentReadback {
  assertI3WorkingPip(pip);
  return {
    viewType: 'DERIVED_PROGRESSIVE_READBACK',
    sourceArtifact: {
      artifactType: 'PROJECT_INTENT_PACKAGE',
      revisionId: pip.revisionId,
    },
    reusedSkillSemantics: 'MCF-DEFINE-PRODUCT',
    dimensions: CANONICAL_INTENT_DIMENSIONS.map((dimension) => ({
      dimension,
      record: structuredClone(pip.dimensions[dimension]),
    })),
    unknowns: structuredClone(pip.unknowns),
    blockers: structuredClone(pip.blockers),
    conflicts: structuredClone(pip.conflicts),
    readiness: structuredClone(pip.readiness),
    implementationAuthorized: false,
  };
}

export class HumanIntentDiscoveryService {
  constructor(private readonly artifacts: RepositoryProjectArtifactStore) {}

  async persistInitialPip(
    input: CreateDiscoveryPipInput,
  ): Promise<LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>> {
    return this.artifacts.writePip(createDiscoveryPip(input));
  }

  async persistIncrementalRevision(
    current: ProjectIntentPackageV1,
    input: IncrementalIntentRevisionInput,
  ): Promise<LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>> {
    const successor = createIncrementalIntentRevision(current, input);
    return this.artifacts.writePip(assessIntentReadiness(successor, input.createdAt).pip);
  }
}
