import { orchestrateStagingDeployment } from './render-staging-deploy.mjs';

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasApplicableAuthorization(authorization) {
  return (
    authorization?.state === 'AUTHORIZED' &&
    authorization?.humanAuthority === 'LEANDRO' &&
    authorization?.operationalGate === 'LEO' &&
    authorization?.gateDecision === 'APPROVE' &&
    authorization?.provenance === 'MCF_RUNTIME_PERSISTED_AUTHORIZATION' &&
    hasText(authorization?.sourceDecision) &&
    hasText(authorization?.authorizationId) &&
    hasText(authorization?.evidenceRef)
  );
}

export function evaluateProductionPromotion({ releaseSha, authorization }) {
  if (!hasApplicableAuthorization(authorization)) {
    return {
      allowed: false,
      reason: 'PRODUCTION_AUTHORIZATION_REQUIRED',
      releaseSha,
    };
  }

  if (authorization.targetSha !== releaseSha) {
    return {
      allowed: false,
      reason: 'AUTHORIZED_SHA_MISMATCH',
      releaseSha,
    };
  }

  return {
    allowed: true,
    reason: 'AUTHORIZED_EXACT_SHA',
    releaseSha,
  };
}

export async function orchestrateProductionPromotion({
  runtimeUrl,
  deployHookUrl,
  releaseSha,
  authorization,
  fetchImpl,
  timeoutMs,
  intervalMs,
  sleepImpl,
}) {
  const decision = evaluateProductionPromotion({ releaseSha, authorization });

  if (!decision.allowed) {
    return {
      status: 'BLOCKED',
      reason: decision.reason,
      releaseSha,
    };
  }

  return orchestrateStagingDeployment({
    runtimeUrl,
    deployHookUrl,
    releaseSha,
    fetchImpl,
    timeoutMs,
    intervalMs,
    sleepImpl,
  });
}
