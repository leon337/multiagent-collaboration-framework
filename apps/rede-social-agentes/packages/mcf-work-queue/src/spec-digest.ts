import { createHash } from 'node:crypto';

import type { McfWorkJobSpec } from '@rsa/contracts';

import { McfWorkSpecError } from './work-queue.errors.js';

export interface NormalizedMcfWorkJobSpec extends McfWorkJobSpec {
  requiresGate: boolean;
  priority: number;
  maxAttempts: number;
}

const dispatchPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const keyPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const safeRefPattern = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$/u;
const shaPattern = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u;
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iu;
const forbiddenKeys = ['command', 'commands', 'cwd', 'executable', 'args', 'shell'] as const;

function boundedString(value: unknown, field: string, minimum: number, maximum: number): string {
  if (typeof value !== 'string') throw new McfWorkSpecError(`${field} must be a string`);
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new McfWorkSpecError(`${field} length must be between ${minimum} and ${maximum}`);
  }
  if (/\p{Cc}/u.test(normalized)) throw new McfWorkSpecError(`${field} contains control characters`);
  return normalized;
}

function boundedStringList(
  value: unknown,
  field: string,
  minimumItems: number,
  maximumItems: number,
): string[] {
  if (!Array.isArray(value) || value.length < minimumItems || value.length > maximumItems) {
    throw new McfWorkSpecError(`${field} must contain between ${minimumItems} and ${maximumItems} items`);
  }
  const normalized = value.map((item, index) => boundedString(item, `${field}[${index}]`, 1, 512));
  if (new Set(normalized).size !== normalized.length) {
    throw new McfWorkSpecError(`${field} must not contain duplicates`);
  }
  return normalized;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  const normalized = boundedString(value, field, 36, 36);
  if (!uuidPattern.test(normalized)) throw new McfWorkSpecError(`${field} must be a UUID`);
  return normalized;
}

export function normalizeMcfWorkJobSpec(input: McfWorkJobSpec): NormalizedMcfWorkJobSpec {
  const unknownInput = input as unknown as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (Object.hasOwn(unknownInput, key)) {
      throw new McfWorkSpecError(`${key} is forbidden; select a policy profile instead`);
    }
  }

  const dispatchId = boundedString(input.dispatchId, 'dispatchId', 1, 128);
  if (!dispatchPattern.test(dispatchId)) throw new McfWorkSpecError('dispatchId is invalid');

  const repositoryKey = boundedString(input.repositoryKey, 'repositoryKey', 1, 128);
  if (!keyPattern.test(repositoryKey)) throw new McfWorkSpecError('repositoryKey is invalid');

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
  if (!shaPattern.test(expectedBaseSha)) {
    throw new McfWorkSpecError('expectedBaseSha must be a lowercase 40- or 64-character SHA');
  }

  if (!['A', 'B', 'C'].includes(input.riskClass)) {
    throw new McfWorkSpecError('riskClass must be A, B or C');
  }

  const priority = input.priority ?? 0;
  if (!Number.isInteger(priority) || priority < -100 || priority > 100) {
    throw new McfWorkSpecError('priority must be an integer between -100 and 100');
  }
  const maxAttempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new McfWorkSpecError('maxAttempts must be an integer between 1 and 10');
  }

  const missionId = optionalUuid(input.missionId, 'missionId');
  const phaseId = optionalUuid(input.phaseId, 'phaseId');

  return {
    dispatchId,
    objective: boundedString(input.objective, 'objective', 10, 8_000),
    acceptanceCriteria: boundedStringList(input.acceptanceCriteria, 'acceptanceCriteria', 1, 50),
    repositoryKey,
    baseRef,
    expectedBaseSha,
    riskClass: input.riskClass,
    writeScopeProfile: boundedString(input.writeScopeProfile, 'writeScopeProfile', 1, 128),
    verificationProfiles: boundedStringList(input.verificationProfiles, 'verificationProfiles', 1, 20),
    ...(missionId ? { missionId } : {}),
    ...(phaseId ? { phaseId } : {}),
    ...(input.agentId === undefined
      ? {}
      : { agentId: boundedString(input.agentId, 'agentId', 1, 128) }),
    requiresGate: input.riskClass === 'C' || input.requiresGate === true,
    priority,
    maxAttempts,
  };
}

function canonicalJson(value: unknown, ancestors = new Set<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new McfWorkSpecError('specification contains a non-finite number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new McfWorkSpecError('specification contains a cycle');
    const next = new Set(ancestors).add(value);
    return `[${value.map((item) => canonicalJson(item, next)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (ancestors.has(record)) throw new McfWorkSpecError('specification contains a cycle');
    const next = new Set(ancestors).add(record);
    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key], next)}`);
    return `{${entries.join(',')}}`;
  }
  throw new McfWorkSpecError('specification contains an unsupported value');
}

export function computeMcfWorkSpecDigest(spec: NormalizedMcfWorkJobSpec): string {
  return createHash('sha256').update(canonicalJson(spec)).digest('hex');
}
