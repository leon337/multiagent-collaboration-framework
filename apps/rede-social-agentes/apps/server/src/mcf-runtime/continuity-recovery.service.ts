import type { McfArtifactRef, McfCheckpointV11Extension, McfResumeRoute } from '@rsa/contracts';

export type McfContinuityMaterialEvent =
  | 'MATERIAL_HUMAN_DECISION'
  | 'PHASE_OR_MISSION_BOUNDARY'
  | 'MATERIAL_MISSION_CONTRACT_CHANGE'
  | 'MATERIAL_STATE_CHANGE'
  | 'IMPORTANT_HANDOFF'
  | 'HUMAN_GATE_MATERIAL_CHANGE'
  | 'PLANNED_PAUSE'
  | 'PLANNED_CHAT_TRANSFER'
  | 'PLANNED_EXECUTION_ENVIRONMENT_TRANSFER'
  | 'MATERIAL_CONTEXT_LOSS_RISK';

export interface McfTransferableCheckpoint extends McfCheckpointV11Extension {
  schemaVersion: '1.1';
  projectId: string;
  missionId: string;
  methodologyPin: {
    version: string;
    immutableRef: string;
  };
  missionContractRef: string;
  repositoryState: {
    repository: string;
    branch: string;
    checkpointSha: string | null;
    capturedAt: string;
    volatile: true;
  };
  transferability: 'TRANSFERABLE' | 'BLOCKED_LOCAL_ONLY_STATE';
  resumeRouteHint: McfResumeRoute;
  pendingHumanGates: string[];
  activeStandingAuthorizationIds: string[];
  currentPhase: string;
  objective: string;
  currentState: string;
  materialDecisionRefs: string[];
  evidenceRefs: string[];
  openFindingRefs: string[];
  nextAction: string;
  responsibleAgent: string;
  resumeInstructions: string;
}

export interface McfCheckpointBuildInput {
  projectId: string;
  missionId: string;
  methodologyPin: {
    version: string;
    immutableRef: string;
  };
  missionContractRef: string;
  alignedPipRef?: McfArtifactRef | undefined;
  projectRealityReportRef?: McfArtifactRef | undefined;
  repositoryState: McfTransferableCheckpoint['repositoryState'];
  pendingHumanGates?: string[] | undefined;
  activeStandingAuthorizationIds?: string[] | undefined;
  currentPhase: string;
  objective: string;
  currentState: string;
  materialDecisionRefs?: string[] | undefined;
  evidenceRefs: string[];
  openFindingRefs?: string[] | undefined;
  nextAction: string;
  responsibleAgent: string;
  resumeInstructions: string;
  hasUncheckpointedLocalState: boolean;
}

export interface McfLiveRepositoryState {
  repository: string;
  branch: string;
  headSha: string;
  capturedAt: string;
}

export interface McfResumeDecisionInput {
  checkpoint: McfTransferableCheckpoint | null;
  liveRepositoryState: McfLiveRepositoryState | null;
  authoritativeRecordsResolved: boolean;
  methodologyPinValid: boolean;
  checkpointIntegrityValid: boolean;
  materialDriftExplainable: boolean;
}

export interface McfResumeCardV11 {
  classification: 'DERIVED_REBUILDABLE_VIEW';
  projectId: string;
  missionId: string;
  currentPhase: string;
  currentState: string;
  nextAction: string;
  responsibleAgent: string;
  checkpointSha: string | null;
  pendingHumanGates: string[];
  activeStandingAuthorizationIds: string[];
  resumeRouteHint: McfResumeRoute;
  authorityNotice: 'ORIENTATION_ONLY_CANONICAL_CHECKPOINT_WINS';
}

const materialEvents = new Set<McfContinuityMaterialEvent>([
  'MATERIAL_HUMAN_DECISION',
  'PHASE_OR_MISSION_BOUNDARY',
  'MATERIAL_MISSION_CONTRACT_CHANGE',
  'MATERIAL_STATE_CHANGE',
  'IMPORTANT_HANDOFF',
  'HUMAN_GATE_MATERIAL_CHANGE',
  'PLANNED_PAUSE',
  'PLANNED_CHAT_TRANSFER',
  'PLANNED_EXECUTION_ENVIRONMENT_TRANSFER',
  'MATERIAL_CONTEXT_LOSS_RISK',
]);

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function exactRemoteCheckpointAvailable(input: McfCheckpointBuildInput): boolean {
  return (
    input.repositoryState.checkpointSha !== null &&
    hasText(input.repositoryState.checkpointSha) &&
    !input.hasUncheckpointedLocalState
  );
}

export class ContinuityRecoveryService {
  shouldCreateCheckpoint(event: McfContinuityMaterialEvent): boolean {
    return materialEvents.has(event);
  }

  createCheckpoint(input: McfCheckpointBuildInput): McfTransferableCheckpoint {
    const transferable = exactRemoteCheckpointAvailable(input);
    return {
      schemaVersion: '1.1',
      projectId: input.projectId,
      missionId: input.missionId,
      methodologyPin: input.methodologyPin,
      alignedPipRef: input.alignedPipRef,
      missionContractRef: input.missionContractRef,
      projectRealityReportRef: input.projectRealityReportRef,
      pendingHumanGates: [...(input.pendingHumanGates ?? [])],
      activeStandingAuthorizationIds: [...(input.activeStandingAuthorizationIds ?? [])],
      repositoryState: { ...input.repositoryState },
      resumeRouteHint: transferable ? 'FAST_RESUME' : 'RECOVER_MCF_PROJECT',
      transferability: transferable ? 'TRANSFERABLE' : 'BLOCKED_LOCAL_ONLY_STATE',
      currentPhase: input.currentPhase,
      objective: input.objective,
      currentState: input.currentState,
      materialDecisionRefs: [...(input.materialDecisionRefs ?? [])],
      evidenceRefs: [...input.evidenceRefs],
      openFindingRefs: [...(input.openFindingRefs ?? [])],
      nextAction: input.nextAction,
      responsibleAgent: input.responsibleAgent,
      resumeInstructions: input.resumeInstructions,
    };
  }

  deriveResumeCard(checkpoint: McfTransferableCheckpoint): McfResumeCardV11 {
    return {
      classification: 'DERIVED_REBUILDABLE_VIEW',
      projectId: checkpoint.projectId,
      missionId: checkpoint.missionId,
      currentPhase: checkpoint.currentPhase,
      currentState: checkpoint.currentState,
      nextAction: checkpoint.nextAction,
      responsibleAgent: checkpoint.responsibleAgent,
      checkpointSha: checkpoint.repositoryState.checkpointSha,
      pendingHumanGates: [...checkpoint.pendingHumanGates],
      activeStandingAuthorizationIds: [...checkpoint.activeStandingAuthorizationIds],
      resumeRouteHint: checkpoint.resumeRouteHint ?? 'RECOVER_MCF_PROJECT',
      authorityNotice: 'ORIENTATION_ONLY_CANONICAL_CHECKPOINT_WINS',
    };
  }

  decideResumeRoute(input: McfResumeDecisionInput): McfResumeRoute {
    const checkpoint = input.checkpoint;
    const live = input.liveRepositoryState;

    if (
      checkpoint === null ||
      live === null ||
      !input.authoritativeRecordsResolved ||
      !input.methodologyPinValid ||
      !input.checkpointIntegrityValid ||
      checkpoint.transferability !== 'TRANSFERABLE' ||
      checkpoint.repositoryState.checkpointSha === null
    ) {
      return 'RECOVER_MCF_PROJECT';
    }

    if (checkpoint.repositoryState.repository !== live.repository) {
      return 'RECOVER_MCF_PROJECT';
    }

    const exactLiveMatch =
      checkpoint.repositoryState.branch === live.branch &&
      checkpoint.repositoryState.checkpointSha === live.headSha;
    if (exactLiveMatch) {
      return 'FAST_RESUME';
    }

    return input.materialDriftExplainable ? 'RECONCILE' : 'RECOVER_MCF_PROJECT';
  }
}
