/* global fetch */

const shaPattern = /^[a-f0-9]{40}$/u;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function blocked(reason, releaseSha) {
  return {
    state: 'BLOCKED',
    reason,
    targetSha: releaseSha,
  };
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCanonicalAuthorization(value, releaseSha) {
  return (
    value?.state === 'AUTHORIZED' &&
    value?.humanAuthority === 'LEANDRO' &&
    value?.operationalGate === 'LEO' &&
    value?.gateDecision === 'APPROVE' &&
    value?.provenance === 'MCF_RUNTIME_PERSISTED_AUTHORIZATION' &&
    value?.targetSha === releaseSha &&
    hasText(value?.sourceDecision) &&
    hasText(value?.authorizationId) &&
    hasText(value?.evidenceRef)
  );
}

export async function resolveProductionAuthorization({
  controlPlaneUrl,
  runtimeToken,
  missionId,
  phaseId,
  releaseSha,
  fetchImpl = fetch,
}) {
  if (
    !hasText(controlPlaneUrl) ||
    !hasText(runtimeToken) ||
    !uuidPattern.test(String(missionId ?? '')) ||
    !uuidPattern.test(String(phaseId ?? '')) ||
    !shaPattern.test(String(releaseSha ?? ''))
  ) {
    return blocked('AUTHORIZATION_RESOLUTION_INPUT_INVALID', releaseSha);
  }

  const endpoint = new URL('/v1/mcf/production-authorization/resolve', controlPlaneUrl);
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcf-runtime-token': runtimeToken,
      },
      body: JSON.stringify({ missionId, phaseId, releaseSha }),
    });
  } catch {
    return blocked('AUTHORIZATION_PROVENANCE_UNAVAILABLE', releaseSha);
  }

  if (!response.ok) {
    return blocked('AUTHORIZATION_PROVENANCE_UNAVAILABLE', releaseSha);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return blocked('AUTHORIZATION_PROVENANCE_INVALID', releaseSha);
  }

  if (payload?.targetSha !== releaseSha) {
    return blocked('AUTHORIZED_SHA_MISMATCH', releaseSha);
  }

  if (!isCanonicalAuthorization(payload, releaseSha)) {
    return blocked('PRODUCTION_AUTHORIZATION_REQUIRED', releaseSha);
  }

  return payload;
}
