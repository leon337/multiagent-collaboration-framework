import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';

import { McfEvidenceRejectedError } from './mcf-runtime.errors.js';
import { canonicalizeProvider } from './permission-engine.js';

const governedInternalSkillIds = new Set([
  'MCF-RECOVER-CONTEXT',
  'MCF-DEFINE-PRODUCT',
  'MCF-DESIGN-EXPERIENCE',
  'MCF-DESIGN-ARCHITECTURE',
  'MCF-EVALUATE-AGENTS',
  'MCF-SECURITY-REVIEW',
  'MCF-DEBUG-INCIDENT',
  'MCF-CLOSE-PHASE',
]);

const debugEvidencePlaceholders = new Set([
  'todo',
  'tbd',
  'unknown',
  'n/a',
  'na',
  'none',
  'null',
  'ok',
  'done',
  'pass',
  'passed',
  'success',
  'true',
  'false',
]);

function reject(message: string): never {
  throw new McfEvidenceRejectedError(message);
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return reject(message);
  }
  return value as Record<string, unknown>;
}

function requireString(record: Record<string, unknown>, key: string, message: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    return reject(message);
  }
  return value.trim();
}

function isMeaningfulEvidenceItem(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return false;
}

function hasMeaningfulSecurityValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.some(hasMeaningfulSecurityValue);
  if (typeof value === 'object' && value !== null) {
    return Object.values(value as Record<string, unknown>).some(hasMeaningfulSecurityValue);
  }
  return false;
}

function isMeaningfulDebugString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !debugEvidencePlaceholders.has(normalized);
}

function hasMeaningfulDebugValue(value: unknown): boolean {
  if (isMeaningfulDebugString(value)) return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.length > 0 && value.every(hasMeaningfulDebugValue);
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length > 0 && entries.every(([, item]) => hasMeaningfulDebugValue(item));
  }
  return false;
}

function requireDebugField(record: Record<string, unknown>, key: string, message: string): unknown {
  const value = record[key];
  if (!hasMeaningfulDebugValue(value)) return reject(message);
  return value;
}

function requireArray(
  record: Record<string, unknown>,
  key: string,
  message: string,
  options: { allowEmpty?: boolean } = {},
): unknown[] {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    (!options.allowEmpty && value.length === 0) ||
    value.some((item) => !isMeaningfulEvidenceItem(item))
  ) {
    return reject(message);
  }
  return value;
}

function requireSecurityArray(
  record: Record<string, unknown>,
  key: string,
  message: string,
): unknown[] {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => !hasMeaningfulSecurityValue(item))
  ) {
    return reject(message);
  }
  return value;
}

function isMeaningfulScoreValue(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return false;
}

function requireScores(
  record: Record<string, unknown>,
  key: string,
  message: string,
): unknown[] | Record<string, unknown> {
  const value = record[key];
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every(isMeaningfulScoreValue)) return value;
    return reject(message);
  }
  if (typeof value === 'object' && value !== null) {
    const scores = value as Record<string, unknown>;
    const entries = Object.entries(scores);
    if (entries.length > 0 && entries.every(([, score]) => isMeaningfulScoreValue(score))) {
      return scores;
    }
  }
  return reject(message);
}

function requireReference(
  record: Record<string, unknown>,
  key: string,
  message: string,
): string | Record<string, unknown> {
  const value = record[key];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const reference = value as Record<string, unknown>;
    if (Object.keys(reference).length > 0) return reference;
  }
  return reject(message);
}

function requireResidualRisk(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  const level = value.level;
  if (typeof level !== 'string' || level.trim().length === 0) {
    return reject('MCF-SECURITY-REVIEW residual_risk requires a non-empty level');
  }
  if (typeof value.critical_unaddressed !== 'boolean') {
    return reject(
      'MCF-SECURITY-REVIEW residual_risk requires critical_unaddressed boolean evidence',
    );
  }
  if (value.critical_unaddressed === true && value.blocked !== true) {
    return reject(
      'MCF-SECURITY-REVIEW requires critical residual risks to be addressed or explicitly blocked',
    );
  }
  return value;
}

function requireDebugReproduction(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  if (Object.keys(value).length === 0) return reject(message);
  requireDebugField(
    value,
    'symptom',
    'MCF-DEBUG-INCIDENT reproduction requires a meaningful symptom',
  );
  requireDebugField(
    value,
    'method',
    'MCF-DEBUG-INCIDENT reproduction requires a meaningful reproduction or characterization method',
  );
  requireDebugField(
    value,
    'evidence_reference',
    'MCF-DEBUG-INCIDENT reproduction requires a verifiable evidence_reference',
  );
  return value;
}

function requireDebugRootCause(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  if (Object.keys(value).length === 0) return reject(message);
  requireDebugField(value, 'cause', 'MCF-DEBUG-INCIDENT root_cause requires a meaningful cause');
  requireDebugField(
    value,
    'supporting_evidence',
    'MCF-DEBUG-INCIDENT root_cause requires meaningful supporting_evidence',
  );
  return value;
}

function requireRegressionTestReference(value: unknown): unknown {
  if (isMeaningfulDebugString(value)) return value.trim();
  const record = asRecord(
    value,
    'MCF-DEBUG-INCIDENT recovery_result requires regression_test_added evidence',
  );
  if (Object.keys(record).length === 0) {
    return reject('MCF-DEBUG-INCIDENT regression_test_added cannot be empty');
  }
  requireDebugField(
    record,
    'reference',
    'MCF-DEBUG-INCIDENT regression_test_added requires a verifiable reference',
  );
  if (Object.hasOwn(record, 'result')) {
    requireDebugField(
      record,
      'result',
      'MCF-DEBUG-INCIDENT regression_test_added result must contain semantic evidence',
    );
  }
  return record;
}

function requireDebugRecovery(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  if (Object.keys(value).length === 0) return reject(message);
  requireDebugField(
    value,
    'action_or_mitigation',
    'MCF-DEBUG-INCIDENT recovery_result requires the action, isolation or mitigation performed',
  );
  requireDebugField(
    value,
    'verification',
    'MCF-DEBUG-INCIDENT recovery_result requires semantic verification of the result',
  );
  if (value.blind_retry !== false) {
    return reject('MCF-DEBUG-INCIDENT recovery_result must declare blind_retry=false');
  }
  requireDebugField(
    value,
    'retry_evidence',
    'MCF-DEBUG-INCIDENT recovery_result requires semantic evidence proving no blind retry occurred',
  );
  requireRegressionTestReference(value.regression_test_added);
  return value;
}


const closeoutFinalStates = new Set([
  'ENTREGUE',
  'AGUARDANDO_DEPENDENCIA_EXTERNA',
  'BLOQUEADO_POR_RISCO',
  'CANCELADO_PELA_AUTORIDADE',
]);

const closeoutDecisions = new Set([
  'APROVAR',
  'APROVAR_COM_RESSALVAS',
  'RETORNAR_PARA_CORRECAO',
  'AMPLIAR_EQUIPE',
  'REDUZIR_EQUIPE',
  'BLOQUEAR',
  'ESCALAR_PARA_LEANDRO',
]);

function requireCloseString(
  record: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = record[key];
  if (!isMeaningfulDebugString(value)) return reject(message);
  return value.trim();
}

function requireCloseArray(
  record: Record<string, unknown>,
  key: string,
  message: string,
  allowEmpty = false,
): unknown[] {
  const value = record[key];
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) return reject(message);
  if (value.some((item) => !hasMeaningfulDebugValue(item))) return reject(message);
  return value;
}

function requireClosePhasePack(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  requireCloseArray(
    value,
    'artifacts',
    'MCF-CLOSE-PHASE phase_pack requires non-empty artifact references',
  );
  requireCloseString(
    value,
    'manifest_reference',
    'MCF-CLOSE-PHASE phase_pack requires a manifest_reference',
  );
  if (value.traceability_complete !== true) {
    return reject('MCF-CLOSE-PHASE phase_pack requires traceability_complete=true');
  }
  return value;
}

function requireCloseAuditVerdict(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  requireCloseString(value, 'verdict', 'MCF-CLOSE-PHASE audit_verdict requires a verdict');
  requireCloseString(
    value,
    'evidence_reference',
    'MCF-CLOSE-PHASE audit_verdict requires evidence_reference',
  );
  requireCloseArray(
    value,
    'blocking_findings',
    'MCF-CLOSE-PHASE audit_verdict requires blocking_findings, even when empty',
    true,
  );
  return value;
}

function requireCloseLeoDecision(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  const decision = requireCloseString(
    value,
    'decision',
    'MCF-CLOSE-PHASE leo_decision requires an explicit decision',
  ).toUpperCase();
  if (!closeoutDecisions.has(decision)) {
    return reject('MCF-CLOSE-PHASE leo_decision is not a canonical Léo gate decision');
  }
  requireCloseString(
    value,
    'justification',
    'MCF-CLOSE-PHASE leo_decision requires justification',
  );
  const nextState = requireCloseString(
    value,
    'next_state',
    'MCF-CLOSE-PHASE leo_decision requires next_state',
  ).toUpperCase();
  if (!closeoutFinalStates.has(nextState)) {
    return reject('MCF-CLOSE-PHASE leo_decision next_state must be a canonical terminal state');
  }
  requireCloseString(value, 'next_action', 'MCF-CLOSE-PHASE leo_decision requires next_action');
  requireCloseString(value, 'responsible', 'MCF-CLOSE-PHASE leo_decision requires responsible');
  return value;
}

function requireCloseCheckpoint(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  const finalState = requireCloseString(
    value,
    'final_state',
    'MCF-CLOSE-PHASE checkpoint requires final_state',
  ).toUpperCase();
  if (!closeoutFinalStates.has(finalState)) {
    return reject('MCF-CLOSE-PHASE checkpoint final_state must be canonical');
  }
  if (typeof value.objective_met !== 'boolean') {
    return reject('MCF-CLOSE-PHASE checkpoint requires objective_met boolean evidence');
  }
  const unresolved = requireCloseArray(
    value,
    'unresolved_findings',
    'MCF-CLOSE-PHASE checkpoint requires unresolved_findings, even when empty',
    true,
  );
  const blockers = requireCloseArray(
    value,
    'blockers',
    'MCF-CLOSE-PHASE checkpoint requires blockers, even when empty',
    true,
  );
  const nextAction = requireCloseString(
    value,
    'next_action',
    'MCF-CLOSE-PHASE checkpoint requires next_action',
  );
  const recipient = requireCloseString(
    value,
    'checkpoint_recipient',
    'MCF-CLOSE-PHASE checkpoint requires checkpoint_recipient',
  );
  if (recipient.trim().toLowerCase() !== 'mestre') {
    return reject(
      'MCF-CLOSE-PHASE checkpoint_recipient must be Mestre; Leandro is not a technical handoff target',
    );
  }
  if (typeof value.human_action_required !== 'boolean') {
    return reject('MCF-CLOSE-PHASE checkpoint requires human_action_required boolean evidence');
  }
  if (finalState === 'ENTREGUE') {
    const normalizedAction = nextAction.trim().toLowerCase();
    if (value.objective_met !== true) {
      return reject('MCF-CLOSE-PHASE cannot mark ENTREGUE when objective_met is false');
    }
    if (unresolved.length > 0 || blockers.length > 0) {
      return reject(
        'MCF-CLOSE-PHASE cannot mark ENTREGUE with unresolved findings or blockers',
      );
    }
    if (!['nenhuma', 'none'].includes(normalizedAction)) {
      return reject('MCF-CLOSE-PHASE cannot mark ENTREGUE with a pending next_action');
    }
    if (value.human_action_required !== false) {
      return reject('MCF-CLOSE-PHASE ENTREGUE requires human_action_required=false');
    }
  }
  return value;
}

function validateEvidence(
  skillId: string,
  evidence: Record<string, unknown>,
): Record<string, unknown> {
  switch (skillId) {
    case 'MCF-RECOVER-CONTEXT':
      return {
        source_references: requireArray(
          evidence,
          'source_references',
          'MCF-RECOVER-CONTEXT requires non-empty source_references evidence',
        ),
        precedence_decisions: requireArray(
          evidence,
          'precedence_decisions',
          'MCF-RECOVER-CONTEXT requires non-empty precedence_decisions evidence',
        ),
        contradictions: requireArray(
          evidence,
          'contradictions',
          'MCF-RECOVER-CONTEXT requires contradictions evidence, even when empty',
          { allowEmpty: true },
        ),
      };
    case 'MCF-DEFINE-PRODUCT':
      return {
        problem_statement: requireString(
          evidence,
          'problem_statement',
          'MCF-DEFINE-PRODUCT requires problem_statement evidence',
        ),
        requirements: requireArray(
          evidence,
          'requirements',
          'MCF-DEFINE-PRODUCT requires non-empty requirements evidence',
        ),
        acceptance_criteria: requireArray(
          evidence,
          'acceptance_criteria',
          'MCF-DEFINE-PRODUCT requires non-empty acceptance_criteria evidence',
        ),
      };
    case 'MCF-DESIGN-EXPERIENCE':
      return {
        flow_reference: requireReference(
          evidence,
          'flow_reference',
          'MCF-DESIGN-EXPERIENCE requires flow_reference evidence',
        ),
        screen_reference: requireReference(
          evidence,
          'screen_reference',
          'MCF-DESIGN-EXPERIENCE requires screen_reference evidence',
        ),
        accessibility_findings: requireArray(
          evidence,
          'accessibility_findings',
          'MCF-DESIGN-EXPERIENCE requires accessibility_findings evidence, even when empty',
          { allowEmpty: true },
        ),
      };
    case 'MCF-DESIGN-ARCHITECTURE':
      return {
        architecture_diagram: requireReference(
          evidence,
          'architecture_diagram',
          'MCF-DESIGN-ARCHITECTURE requires architecture_diagram evidence',
        ),
        decisions: requireArray(
          evidence,
          'decisions',
          'MCF-DESIGN-ARCHITECTURE requires non-empty decisions evidence',
        ),
        risks: requireArray(
          evidence,
          'risks',
          'MCF-DESIGN-ARCHITECTURE requires risks evidence, even when empty',
          { allowEmpty: true },
        ),
      };
    case 'MCF-EVALUATE-AGENTS':
      return {
        test_cases: requireArray(
          evidence,
          'test_cases',
          'MCF-EVALUATE-AGENTS requires non-empty test_cases evidence',
        ),
        scores: requireScores(
          evidence,
          'scores',
          'MCF-EVALUATE-AGENTS requires non-empty scores evidence',
        ),
        regressions: requireArray(
          evidence,
          'regressions',
          'MCF-EVALUATE-AGENTS requires regressions evidence, even when empty',
          { allowEmpty: true },
        ),
      };
    case 'MCF-SECURITY-REVIEW':
      return {
        threats: requireSecurityArray(
          evidence,
          'threats',
          'MCF-SECURITY-REVIEW requires non-empty meaningful threats evidence',
        ),
        controls: requireSecurityArray(
          evidence,
          'controls',
          'MCF-SECURITY-REVIEW requires non-empty meaningful controls evidence',
        ),
        residual_risk: requireResidualRisk(
          evidence,
          'residual_risk',
          'MCF-SECURITY-REVIEW requires structured meaningful residual_risk evidence',
        ),
      };
    case 'MCF-DEBUG-INCIDENT':
      return {
        reproduction: requireDebugReproduction(
          evidence,
          'reproduction',
          'MCF-DEBUG-INCIDENT requires structured meaningful reproduction evidence',
        ),
        root_cause: requireDebugRootCause(
          evidence,
          'root_cause',
          'MCF-DEBUG-INCIDENT requires structured meaningful root_cause evidence',
        ),
        recovery_result: requireDebugRecovery(
          evidence,
          'recovery_result',
          'MCF-DEBUG-INCIDENT requires structured meaningful recovery_result evidence',
        ),
      };
    case 'MCF-CLOSE-PHASE': {
      const phasePack = requireClosePhasePack(
        evidence,
        'phase_pack',
        'MCF-CLOSE-PHASE requires structured phase_pack evidence',
      );
      const auditVerdict = requireCloseAuditVerdict(
        evidence,
        'audit_verdict',
        'MCF-CLOSE-PHASE requires structured audit_verdict evidence',
      );
      const leoDecision = requireCloseLeoDecision(
        evidence,
        'leo_decision',
        'MCF-CLOSE-PHASE requires structured leo_decision evidence',
      );
      const checkpoint = requireCloseCheckpoint(
        evidence,
        'checkpoint',
        'MCF-CLOSE-PHASE requires structured checkpoint evidence',
      );
      const nextState = String(leoDecision.next_state).trim().toUpperCase();
      const finalState = String(checkpoint.final_state).trim().toUpperCase();
      if (nextState !== finalState) {
        return reject(
          'MCF-CLOSE-PHASE leo_decision.next_state must match checkpoint.final_state',
        );
      }
      if (
        finalState === 'ENTREGUE' &&
        !['APROVAR', 'APROVAR_COM_RESSALVAS'].includes(
          String(leoDecision.decision).trim().toUpperCase(),
        )
      ) {
        return reject('MCF-CLOSE-PHASE ENTREGUE requires an approving Léo decision');
      }
      return {
        phase_pack: phasePack,
        audit_verdict: auditVerdict,
        leo_decision: leoDecision,
        checkpoint,
      };
    }
    default:
      return evidence;
  }
}

export function isGovernedAgentInternalSkill(skillId: string): boolean {
  return governedInternalSkillIds.has(skillId);
}

export function collectInternalExecutionEvidence(
  skill: McfSkillDefinition,
  inputs: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!isGovernedAgentInternalSkill(skill.skillId)) return null;
  const evidence = asRecord(
    inputs.execution_evidence,
    `${skill.skillId} requires execution_evidence produced by the selected agent`,
  );
  return validateEvidence(skill.skillId, evidence);
}

export function verifyInternalExecutionReceipt(
  receipt: McfToolReceipt,
  skill: McfSkillDefinition,
): void {
  if (!isGovernedAgentInternalSkill(skill.skillId)) return;
  if (canonicalizeProvider(receipt.provider) !== 'internal') {
    reject(`${skill.skillId} governed execution requires the internal provider`);
  }
  const evidence = asRecord(
    receipt.metadata.executionEvidence,
    `${skill.skillId} receipt requires executionEvidence metadata`,
  );
  validateEvidence(skill.skillId, evidence);
}
