import type {
  McfCapabilityGapRequest,
  McfCapabilityGapRequirement,
  McfCapabilityLiveVerification,
  McfProjectBootstrapRequest,
} from '@rsa/contracts';

const STABLE_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/u;
const OPERATION = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;
const ENVIRONMENTS = new Set(['dev', 'lab', 'staging']);
const MODES = new Set(['READ_ONLY', 'BOUNDED_WRITE']);
const CONNECTION_STATES = new Set(['DISCONNECTED', 'CONNECTED']);
const RUNTIME_STATES = new Set(['UNKNOWN', 'INACTIVE', 'ACTIVE', 'BLOCKED']);
const VERIFICATION_STATES = new Set(['NOT_VERIFIED', 'HISTORICALLY_VERIFIED', 'VERIFIED']);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
function text(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.length >= min && value.length <= max && value.trim() === value;
}
function stableId(value: unknown): value is string {
  return text(value, 1, 128) && STABLE_ID.test(value);
}
function stringArray(value: unknown, maxItems: number, pattern: RegExp): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => typeof item === 'string' && pattern.test(item)) &&
    new Set(value).size === value.length
  );
}
function invalid(): never {
  throw new Error('MCF_CAPABILITY_ANALYSIS_INPUT_INVALID');
}

function parseRequirement(value: unknown): McfCapabilityGapRequirement {
  if (
    !record(value) ||
    !exactKeys(value, [
      'capability_id',
      'required_operations',
      'environment',
      'resource',
      'mode',
      'require_live_verification',
      'max_verification_age_seconds',
    ]) ||
    !stableId(value.capability_id)
  ) return invalid();

  const result: McfCapabilityGapRequirement = { capability_id: value.capability_id };
  if (value.required_operations !== undefined) {
    if (!stringArray(value.required_operations, 32, OPERATION)) return invalid();
    result.required_operations = [...value.required_operations];
  }
  if (value.environment !== undefined) {
    if (typeof value.environment !== 'string' || !ENVIRONMENTS.has(value.environment)) return invalid();
    result.environment = value.environment as NonNullable<McfCapabilityGapRequirement['environment']>;
  }
  if (value.resource !== undefined) {
    if (!text(value.resource, 1, 1024)) return invalid();
    result.resource = value.resource;
  }
  if (value.mode !== undefined) {
    if (typeof value.mode !== 'string' || !MODES.has(value.mode)) return invalid();
    result.mode = value.mode as NonNullable<McfCapabilityGapRequirement['mode']>;
  }
  if (value.require_live_verification !== undefined) {
    if (typeof value.require_live_verification !== 'boolean') return invalid();
    result.require_live_verification = value.require_live_verification;
  }
  if (value.max_verification_age_seconds !== undefined) {
    if (
      typeof value.max_verification_age_seconds !== 'number' ||
      !Number.isInteger(value.max_verification_age_seconds) ||
      value.max_verification_age_seconds < 1 ||
      value.max_verification_age_seconds > 31_536_000
    ) return invalid();
    result.max_verification_age_seconds = value.max_verification_age_seconds;
  }
  return result;
}

function parseLiveVerification(value: unknown): McfCapabilityLiveVerification {
  if (
    !record(value) ||
    !exactKeys(value, [
      'capability_id',
      'connection_state',
      'runtime_state',
      'verification_state',
      'observed_at',
      'source_ref',
    ]) ||
    !stableId(value.capability_id) ||
    typeof value.connection_state !== 'string' ||
    !CONNECTION_STATES.has(value.connection_state) ||
    typeof value.runtime_state !== 'string' ||
    !RUNTIME_STATES.has(value.runtime_state) ||
    typeof value.verification_state !== 'string' ||
    !VERIFICATION_STATES.has(value.verification_state) ||
    !text(value.observed_at, 20, 40) ||
    !Number.isFinite(Date.parse(value.observed_at)) ||
    !text(value.source_ref, 1, 1024)
  ) return invalid();

  return {
    capability_id: value.capability_id,
    connection_state: value.connection_state as McfCapabilityLiveVerification['connection_state'],
    runtime_state: value.runtime_state as McfCapabilityLiveVerification['runtime_state'],
    verification_state: value.verification_state as McfCapabilityLiveVerification['verification_state'],
    observed_at: value.observed_at,
    source_ref: value.source_ref,
  };
}

function parseBase(value: unknown): McfCapabilityGapRequest {
  if (
    !record(value) ||
    !exactKeys(value, ['project_id', 'requirements', 'live_verifications']) ||
    !stableId(value.project_id) ||
    !Array.isArray(value.requirements) ||
    value.requirements.length < 1 ||
    value.requirements.length > 64
  ) return invalid();

  const requirements = value.requirements.map(parseRequirement);
  if (new Set(requirements.map((item) => item.capability_id)).size !== requirements.length) return invalid();

  const liveVerifications =
    value.live_verifications === undefined
      ? undefined
      : Array.isArray(value.live_verifications) && value.live_verifications.length <= 64
        ? value.live_verifications.map(parseLiveVerification)
        : invalid();
  if (
    liveVerifications &&
    (new Set(liveVerifications.map((item) => item.capability_id)).size !== liveVerifications.length ||
      liveVerifications.some((item) => !requirements.some((requirement) => requirement.capability_id === item.capability_id)))
  ) return invalid();

  return {
    project_id: value.project_id,
    requirements,
    ...(liveVerifications === undefined ? {} : { live_verifications: liveVerifications }),
  };
}

export function parseMcfCapabilityGapRequest(value: unknown): McfCapabilityGapRequest {
  return parseBase(value);
}

export function parseMcfProjectBootstrapRequest(value: unknown): McfProjectBootstrapRequest {
  if (
    !record(value) ||
    !exactKeys(value, [
      'project_id',
      'requirements',
      'live_verifications',
      'project_name',
      'objective',
      'environment',
      'paid_services_required',
      'allow_paid_services',
      'external_actions_authorized',
      'production_requested',
      'production_authorized',
    ]) ||
    !text(value.project_name, 1, 128) ||
    !text(value.objective, 1, 2048) ||
    typeof value.environment !== 'string' ||
    !ENVIRONMENTS.has(value.environment)
  ) return invalid();

  const base = parseBase({
    project_id: value.project_id,
    requirements: value.requirements,
    ...(value.live_verifications === undefined ? {} : { live_verifications: value.live_verifications }),
  });
  const booleanKeys = [
    'paid_services_required',
    'allow_paid_services',
    'external_actions_authorized',
    'production_requested',
    'production_authorized',
  ] as const;
  for (const key of booleanKeys) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') return invalid();
  }

  return {
    ...base,
    project_name: value.project_name,
    objective: value.objective,
    environment: value.environment as McfProjectBootstrapRequest['environment'],
    paid_services_required: value.paid_services_required === true,
    allow_paid_services: value.allow_paid_services === true,
    external_actions_authorized: value.external_actions_authorized === true,
    production_requested: value.production_requested === true,
    production_authorized: value.production_authorized === true,
  };
}
