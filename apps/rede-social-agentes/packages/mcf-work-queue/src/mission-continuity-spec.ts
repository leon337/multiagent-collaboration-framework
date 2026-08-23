import { createHash } from 'node:crypto';

import type {
  McfContinuityMissionSpec,
  McfContinuityStepSpec,
} from '@rsa/contracts';

import { McfWorkSpecError } from './work-queue.errors.js';

export interface NormalizedMcfContinuityStepSpec extends McfContinuityStepSpec {
  dependsOn: string[];
  riskClass: McfContinuityMissionSpec['riskClass'];
  writeScopeProfile: string;
  verificationProfiles: string[];
  requiresGate: boolean;
  maxAttempts: number;
}

export interface NormalizedMcfContinuityMissionSpec extends McfContinuityMissionSpec {
  priority: number;
  steps: NormalizedMcfContinuityStepSpec[];
}

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const safeRefPattern = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$/u;
const shaPattern = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u;
const forbiddenKeys = ['command', 'commands', 'cwd', 'executable', 'args', 'shell', 'sudo'] as const;

function boundedString(value: unknown, field: string, minimum: number, maximum: number): string {
  if (typeof value !== 'string') throw new McfWorkSpecError(`${field} must be a string`);
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum || /\p{Cc}/u.test(normalized)) {
    throw new McfWorkSpecError(`${field} is invalid`);
  }
  return normalized;
}

function identifier(value: unknown, field: string): string {
  const normalized = boundedString(value, field, 1, 128);
  if (!identifierPattern.test(normalized)) throw new McfWorkSpecError(`${field} is invalid`);
  return normalized;
}

function stringList(value: unknown, field: string, minimum: number, maximum: number): string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new McfWorkSpecError(`${field} must contain between ${minimum} and ${maximum} items`);
  }
  const normalized = value.map((item, index) => boundedString(item, `${field}[${index}]`, 1, 1_000));
  if (new Set(normalized).size !== normalized.length) {
    throw new McfWorkSpecError(`${field} must not contain duplicates`);
  }
  return normalized;
}

function rejectForbiddenKeys(value: unknown, path: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const record = value as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (Object.hasOwn(record, key)) {
      throw new McfWorkSpecError(`${path}.${key} is forbidden; select a policy profile instead`);
    }
  }
}

function normalizeStep(
  input: McfContinuityStepSpec,
  mission: McfContinuityMissionSpec,
): NormalizedMcfContinuityStepSpec {
  rejectForbiddenKeys(input, `steps.${String(input.stepKey)}`);
  const riskClass = input.riskClass ?? mission.riskClass;
  if (!['A', 'B', 'C'].includes(riskClass)) throw new McfWorkSpecError('step riskClass is invalid');
  const maxAttempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new McfWorkSpecError('step maxAttempts must be an integer between 1 and 10');
  }
  return {
    stepKey: identifier(input.stepKey, 'stepKey'),
    objective: boundedString(input.objective, 'step objective', 10, 8_000),
    acceptanceCriteria: stringList(input.acceptanceCriteria, 'step acceptanceCriteria', 1, 50),
    dependsOn: input.dependsOn === undefined ? [] : stringList(input.dependsOn, 'step dependsOn', 0, 50).map(
      (dependency) => identifier(dependency, 'dependency stepKey'),
    ),
    riskClass,
    writeScopeProfile: boundedString(
      input.writeScopeProfile ?? mission.writeScopeProfile,
      'step writeScopeProfile',
      1,
      128,
    ),
    verificationProfiles:
      input.verificationProfiles === undefined
        ? [...mission.verificationProfiles]
        : stringList(input.verificationProfiles, 'step verificationProfiles', 1, 20),
    ...(input.agentId === undefined
      ? mission.agentId === undefined
        ? {}
        : { agentId: identifier(mission.agentId, 'agentId') }
      : { agentId: identifier(input.agentId, 'step agentId') }),
    requiresGate: riskClass === 'C' || input.requiresGate === true,
    maxAttempts,
  };
}

function validateDag(steps: NormalizedMcfContinuityStepSpec[]): void {
  const keys = new Set(steps.map((step) => step.stepKey));
  if (keys.size !== steps.length) throw new McfWorkSpecError('stepKey values must be unique');
  for (const step of steps) {
    for (const dependency of step.dependsOn) {
      if (!keys.has(dependency)) throw new McfWorkSpecError(`step ${step.stepKey} has unknown dependency ${dependency}`);
      if (dependency === step.stepKey) throw new McfWorkSpecError(`step ${step.stepKey} depends on itself`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byKey = new Map(steps.map((step) => [step.stepKey, step]));
  const visit = (key: string): void => {
    if (visited.has(key)) return;
    if (visiting.has(key)) throw new McfWorkSpecError('mission steps contain a dependency cycle');
    visiting.add(key);
    for (const dependency of byKey.get(key)?.dependsOn ?? []) visit(dependency);
    visiting.delete(key);
    visited.add(key);
  };
  for (const step of steps) visit(step.stepKey);
}

export function normalizeMcfContinuityMissionSpec(
  input: McfContinuityMissionSpec,
): NormalizedMcfContinuityMissionSpec {
  rejectForbiddenKeys(input, 'mission');
  if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 100) {
    throw new McfWorkSpecError('steps must contain between 1 and 100 items');
  }
  if (!['A', 'B', 'C'].includes(input.riskClass)) throw new McfWorkSpecError('riskClass is invalid');
  const baseRef = boundedString(input.baseRef, 'baseRef', 1, 256);
  if (
    !safeRefPattern.test(baseRef) ||
    baseRef.includes('..') ||
    baseRef.includes('@{') ||
    baseRef.endsWith('.') ||
    baseRef.endsWith('/')
  ) {
    throw new McfWorkSpecError('baseRef is unsafe');
  }
  const expectedBaseSha = boundedString(input.expectedBaseSha, 'expectedBaseSha', 40, 64);
  if (!shaPattern.test(expectedBaseSha)) throw new McfWorkSpecError('expectedBaseSha is invalid');
  const priority = input.priority ?? 0;
  if (!Number.isInteger(priority) || priority < -100 || priority > 100) {
    throw new McfWorkSpecError('priority must be an integer between -100 and 100');
  }
  const verificationProfiles = stringList(input.verificationProfiles, 'verificationProfiles', 1, 20);
  const preliminary: McfContinuityMissionSpec = {
    dispatchId: identifier(input.dispatchId, 'dispatchId'),
    projectKey: identifier(input.projectKey, 'projectKey'),
    title: boundedString(input.title, 'title', 3, 256),
    objective: boundedString(input.objective, 'objective', 10, 8_000),
    acceptanceCriteria: stringList(input.acceptanceCriteria, 'acceptanceCriteria', 1, 100),
    repositoryKey: identifier(input.repositoryKey, 'repositoryKey'),
    baseRef,
    expectedBaseSha,
    riskClass: input.riskClass,
    writeScopeProfile: boundedString(input.writeScopeProfile, 'writeScopeProfile', 1, 128),
    verificationProfiles,
    ...(input.agentId === undefined ? {} : { agentId: identifier(input.agentId, 'agentId') }),
    steps: [],
  };
  const steps = input.steps.map((step) => normalizeStep(step, preliminary));
  validateDag(steps);
  return { ...preliminary, priority, steps };
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new McfWorkSpecError('mission specification has a non-finite number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  throw new McfWorkSpecError('mission specification has an unsupported value');
}

export function computeMcfContinuityMissionSpecDigest(
  spec: NormalizedMcfContinuityMissionSpec,
): string {
  return createHash('sha256').update(canonicalJson(spec)).digest('hex');
}
