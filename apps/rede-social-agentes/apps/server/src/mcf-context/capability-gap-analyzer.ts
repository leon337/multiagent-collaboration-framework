import type {
  McfCapabilityGap,
  McfCapabilityGapItem,
  McfCapabilityGapReport,
  McfCapabilityGapRequest,
  McfCapabilityLiveVerification,
  McfCapabilityRegistryEntry,
  McfCapabilityRegistrySnapshot,
} from '@rsa/contracts';

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function matchesResource(pattern: string, resource: string): boolean {
  if (pattern === resource) return true;
  if (pattern.endsWith('*')) return resource.startsWith(pattern.slice(0, -1));
  if (pattern.startsWith('*')) return resource.endsWith(pattern.slice(1));
  return false;
}

function gap(
  code: McfCapabilityGap['code'],
  recommendedAction: string,
  requiredGate: string | null,
  blocking = true,
): McfCapabilityGap {
  return {
    code,
    blocking,
    recommended_action: recommendedAction,
    required_gate: requiredGate,
  };
}

function evaluateEntry(
  entry: McfCapabilityRegistryEntry,
  requirement: McfCapabilityGapRequest['requirements'][number],
  live: McfCapabilityLiveVerification | undefined,
  nowMs: number,
): McfCapabilityGap[] {
  const gaps: McfCapabilityGap[] = [];
  const requiredGate = entry.governance.required_gate;

  if (entry.lifecycle.implementation_state !== 'IMPLEMENTED') {
    gaps.push(gap('IMPLEMENTATION_NOT_READY', 'Implement and register the provider adapter', requiredGate));
  }

  if (entry.governance.authorization_state !== 'AUTHORIZED') {
    gaps.push(gap('AUTHORIZATION_REQUIRED', 'Request explicit authorization for this capability and scope', requiredGate));
  } else if (entry.governance.expiration !== null) {
    const expiresAt = Date.parse(entry.governance.expiration);
    if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
      gaps.push(gap('AUTHORIZATION_EXPIRED', 'Renew the capability authorization through its human gate', requiredGate));
    }
  }

  if (requirement.mode === 'BOUNDED_WRITE' && entry.capability.mode !== 'BOUNDED_WRITE') {
    gaps.push(gap('MODE_INSUFFICIENT', 'Implement a separately governed bounded-write capability', requiredGate));
  }

  if (
    requirement.environment !== undefined &&
    !entry.scope.environments.includes(requirement.environment)
  ) {
    gaps.push(gap('ENVIRONMENT_OUT_OF_SCOPE', 'Extend the capability scope through a reviewed registry change', requiredGate));
  }

  if (
    requirement.resource !== undefined &&
    !entry.scope.resources.some((pattern) => matchesResource(pattern, requirement.resource!))
  ) {
    gaps.push(gap('RESOURCE_OUT_OF_SCOPE', 'Add the exact resource to the reviewed capability scope', requiredGate));
  }

  for (const operation of requirement.required_operations ?? []) {
    if (entry.contract.prohibited_operations.includes(operation)) {
      gaps.push(gap('OPERATION_PROHIBITED', 'Do not use this capability; choose an explicitly permitted provider', requiredGate));
    } else if (!entry.contract.allowed_operations.includes(operation)) {
      gaps.push(gap('OPERATION_NOT_ALLOWED', 'Add the operation only after security review and explicit scope approval', requiredGate));
    }
  }

  if (entry.lifecycle.runtime_state === 'BLOCKED') {
    gaps.push(gap('RUNTIME_BLOCKED', 'Resolve the provider runtime block and re-verify', requiredGate));
  }

  if (live === undefined && requirement.require_live_verification !== false) {
    gaps.push(gap('LIVE_VERIFICATION_REQUIRED', 'Run a live provider health and permission check', requiredGate));
  } else if (live === undefined) {
    if (entry.lifecycle.connection_state !== 'CONNECTED') {
      gaps.push(gap('CONNECTION_NOT_READY', 'Connect the provider using its approved authentication flow', requiredGate));
    }
    if (entry.lifecycle.runtime_state !== 'ACTIVE') {
      gaps.push(gap('RUNTIME_NOT_READY', 'Activate the provider runtime on its authorized host', requiredGate));
    }
    if (entry.lifecycle.verification_state !== 'VERIFIED') {
      gaps.push(gap('LIVE_VERIFICATION_REQUIRED', 'Verify the provider against the current runtime', requiredGate));
    } else if (entry.lifecycle.last_verified_at === null) {
      gaps.push(gap('LIVE_VERIFICATION_STALE', 'Record a timestamped verification receipt', requiredGate));
    } else {
      const lastVerified = Date.parse(entry.lifecycle.last_verified_at);
      const maxAge = (requirement.max_verification_age_seconds ?? 3600) * 1000;
      if (!Number.isFinite(lastVerified) || lastVerified > nowMs || nowMs - lastVerified > maxAge) {
        gaps.push(gap('LIVE_VERIFICATION_STALE', 'Refresh the provider verification receipt', requiredGate));
      }
    }
  } else {
    const observedAt = Date.parse(live.observed_at);
    const maxAge = (requirement.max_verification_age_seconds ?? 300) * 1000;
    if (!Number.isFinite(observedAt) || observedAt > nowMs || nowMs - observedAt > maxAge) {
      gaps.push(gap('LIVE_VERIFICATION_STALE', 'Refresh the live provider verification evidence', requiredGate));
    }
    if (live.connection_state !== 'CONNECTED') {
      gaps.push(gap('LIVE_CONNECTION_NOT_READY', 'Reconnect the provider using its approved authentication flow', requiredGate));
    }
    if (live.runtime_state === 'BLOCKED') {
      gaps.push(gap('RUNTIME_BLOCKED', 'Resolve the provider runtime block and re-verify', requiredGate));
    } else if (live.runtime_state !== 'ACTIVE') {
      gaps.push(gap('LIVE_RUNTIME_NOT_READY', 'Activate the provider runtime on its authorized host', requiredGate));
    }
    if (live.verification_state !== 'VERIFIED') {
      gaps.push(gap('LIVE_VERIFICATION_NOT_CONFIRMED', 'Obtain a current provider verification receipt', requiredGate));
    }
  }

  const unique = new Map(gaps.map((item) => [item.code, item]));
  return [...unique.values()].sort((left, right) => compareText(left.code, right.code));
}

function statusFor(gaps: readonly McfCapabilityGap[]): McfCapabilityGapItem['status'] {
  if (gaps.length === 0) return 'READY';
  if (gaps.some((item) => item.code === 'CAPABILITY_NOT_REGISTERED')) return 'MISSING';
  if (
    gaps.some((item) =>
      [
        'IMPLEMENTATION_NOT_READY',
        'CONNECTION_NOT_READY',
        'RUNTIME_NOT_READY',
        'LIVE_CONNECTION_NOT_READY',
        'LIVE_RUNTIME_NOT_READY',
        'AUTHORIZATION_REQUIRED',
        'AUTHORIZATION_EXPIRED',
        'RUNTIME_BLOCKED',
        'OPERATION_PROHIBITED',
        'OPERATION_NOT_ALLOWED',
        'ENVIRONMENT_OUT_OF_SCOPE',
        'RESOURCE_OUT_OF_SCOPE',
        'MODE_INSUFFICIENT',
      ].includes(item.code),
    )
  ) return 'BLOCKED';
  return 'NEEDS_VERIFICATION';
}

export class McfCapabilityGapAnalyzer {
  analyze(
    snapshot: McfCapabilityRegistrySnapshot,
    request: McfCapabilityGapRequest,
    now: string = new Date().toISOString(),
  ): McfCapabilityGapReport {
    const nowMs = Date.parse(now);
    if (!Number.isFinite(nowMs)) throw new Error('CAPABILITY_GAP_CLOCK_INVALID');
    const entries = new Map(snapshot.entries.map((entry) => [entry.capability.id, entry]));
    const liveVerifications = new Map(
      (request.live_verifications ?? []).map((verification) => [verification.capability_id, verification]),
    );

    const requirements: McfCapabilityGapItem[] = request.requirements
      .map((requirement) => {
        const entry = entries.get(requirement.capability_id);
        if (!entry) {
          const missing = gap(
            'CAPABILITY_NOT_REGISTERED',
            'Register the provider capability with explicit owner, operations, scope and governance',
            'CAPABILITY_REGISTRATION_REVIEW',
          );
          return {
            capability_id: requirement.capability_id,
            status: 'MISSING',
            gaps: [missing],
            provider_project_id: null,
            mode: null,
            allowed_operations: [],
            source_refs: [],
          };
        }
        const gaps = evaluateEntry(
          entry,
          requirement,
          liveVerifications.get(requirement.capability_id),
          nowMs,
        );
        return {
          capability_id: requirement.capability_id,
          status: statusFor(gaps),
          gaps,
          provider_project_id: entry.capability.provider_project_id,
          mode: entry.capability.mode,
          allowed_operations: [...entry.contract.allowed_operations].sort(compareText),
          source_refs: entry.evidence.map(({ source_ref }) => source_ref).sort(compareText),
        };
      })
      .sort((left, right) => compareText(left.capability_id, right.capability_id));

    return {
      schema_version: 1,
      analyzed_at: new Date(nowMs).toISOString(),
      project_id: request.project_id,
      read_only: true,
      evidence_only: true,
      summary: {
        total: requirements.length,
        ready: requirements.filter((item) => item.status === 'READY').length,
        missing: requirements.filter((item) => item.status === 'MISSING').length,
        blocked: requirements.filter((item) => item.status === 'BLOCKED').length,
        needs_verification: requirements.filter((item) => item.status === 'NEEDS_VERIFICATION').length,
      },
      requirements,
    };
  }
}
