import type { McfProjectEntryMode, McfProjectRecoveryRoute } from '@rsa/contracts';

export type RepositoryEvidenceState = 'ABSENT' | 'PRESENT' | 'UNKNOWN' | 'CONFLICTING';
export type ContinuityEvidenceState = 'ABSENT' | 'VALID' | 'INVALID' | 'CONFLICTING';

export interface ProjectEntryEvidence {
  repository: RepositoryEvidenceState;
  projectArtifact: ContinuityEvidenceState;
  continuityCheckpoint: ContinuityEvidenceState;
  sourceReferences: string[];
  precedenceDecisions: string[];
  contradictions: string[];
}

interface EntryClassificationBase {
  sourceSkill: 'MCF-RECOVER-CONTEXT';
  reasons: string[];
  implementationAuthorized: false;
}

export interface ClassifiedProjectEntry extends EntryClassificationBase {
  status: 'CLASSIFIED';
  entryMode: McfProjectEntryMode;
  recoveryRoute: null;
  realityReconnaissanceRequired: boolean;
}

export interface ProjectRecoveryRequired extends EntryClassificationBase {
  status: 'RECOVERY_REQUIRED';
  entryMode: null;
  recoveryRoute: McfProjectRecoveryRoute;
  fullRecoveryExecutionAuthorized: false;
}

export interface UnresolvedProjectEntry extends EntryClassificationBase {
  status: 'UNRESOLVED';
  entryMode: null;
  recoveryRoute: null;
}

export type ProjectEntryClassification =
  ClassifiedProjectEntry | ProjectRecoveryRequired | UnresolvedProjectEntry;

function unresolved(reasons: string[]): UnresolvedProjectEntry {
  return {
    status: 'UNRESOLVED',
    entryMode: null,
    recoveryRoute: null,
    sourceSkill: 'MCF-RECOVER-CONTEXT',
    reasons,
    implementationAuthorized: false,
  };
}

function classified(entryMode: McfProjectEntryMode, reason: string): ClassifiedProjectEntry {
  return {
    status: 'CLASSIFIED',
    entryMode,
    recoveryRoute: null,
    sourceSkill: 'MCF-RECOVER-CONTEXT',
    reasons: [reason],
    realityReconnaissanceRequired: entryMode === 'ADOPT_EXISTING_PROJECT',
    implementationAuthorized: false,
  };
}

function recovery(reasons: string[]): ProjectRecoveryRequired {
  return {
    status: 'RECOVERY_REQUIRED',
    entryMode: null,
    recoveryRoute: 'RECOVER_MCF_PROJECT',
    sourceSkill: 'MCF-RECOVER-CONTEXT',
    reasons,
    fullRecoveryExecutionAuthorized: false,
    implementationAuthorized: false,
  };
}

function isConflicting(state: RepositoryEvidenceState | ContinuityEvidenceState): boolean {
  return state === 'CONFLICTING';
}

export function classifyProjectEntry(evidence: ProjectEntryEvidence): ProjectEntryClassification {
  const evidenceGaps: string[] = [];
  if (evidence.sourceReferences.length === 0) evidenceGaps.push('SOURCE_REFERENCES_MISSING');
  if (evidence.precedenceDecisions.length === 0) evidenceGaps.push('PRECEDENCE_DECISIONS_MISSING');
  if (evidenceGaps.length > 0) return unresolved(evidenceGaps);

  if (
    evidence.contradictions.length > 0 ||
    isConflicting(evidence.repository) ||
    isConflicting(evidence.projectArtifact) ||
    isConflicting(evidence.continuityCheckpoint)
  ) {
    return unresolved(['CONFLICTING_ENTRY_EVIDENCE', ...evidence.contradictions]);
  }

  if (evidence.repository === 'UNKNOWN') {
    return unresolved(['REPOSITORY_STATE_UNKNOWN']);
  }

  if (
    evidence.repository === 'PRESENT' &&
    evidence.projectArtifact === 'VALID' &&
    evidence.continuityCheckpoint === 'VALID'
  ) {
    return classified('RESUME_MCF_PROJECT', 'VALID_PROJECT_ARTIFACT_AND_CONTINUITY_CHECKPOINT');
  }

  if (
    evidence.repository === 'ABSENT' &&
    evidence.projectArtifact === 'ABSENT' &&
    evidence.continuityCheckpoint === 'ABSENT'
  ) {
    return classified('NEW_PROJECT', 'NO_EXISTING_REPOSITORY_OR_MCF_CONTINUITY');
  }

  if (
    evidence.repository === 'PRESENT' &&
    evidence.projectArtifact === 'ABSENT' &&
    evidence.continuityCheckpoint === 'ABSENT'
  ) {
    return classified('ADOPT_EXISTING_PROJECT', 'EXISTING_REPOSITORY_WITHOUT_MCF_CONTINUITY');
  }

  if (
    evidence.projectArtifact === 'INVALID' ||
    evidence.continuityCheckpoint === 'INVALID' ||
    evidence.projectArtifact === 'VALID' ||
    evidence.continuityCheckpoint === 'VALID'
  ) {
    return recovery(['INCOMPLETE_OR_INVALID_MCF_CONTINUITY']);
  }

  return unresolved(['ENTRY_EVIDENCE_DID_NOT_REACH_A_SAFE_CLASSIFICATION']);
}
