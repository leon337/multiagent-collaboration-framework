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
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(hasMeaningfulSecurityValue);
  if (typeof value === 'object' && value !== null) {
    return Object.values(value as Record<string, unknown>).some(hasMeaningfulSecurityValue);
  }
  return false;
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
