const URI_SCHEME = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export function normalizeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('URL must be a non-empty string');
  }

  const trimmed = value.trim();
  const candidate = URI_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new TypeError('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('Only HTTP(S) URLs are allowed');
  }

  return url.href;
}

export function movementVector({ forward = 0, right = 0 } = {}) {
  const x = Number(right) || 0;
  const z = -(Number(forward) || 0);
  const length = Math.hypot(x, z);

  if (length === 0) {
    return { x: 0, z: 0 };
  }

  return {
    x: x / length,
    z: z / length,
  };
}

export function createLocalAhead({
  id,
  petPosition,
  forward,
  distance,
  url,
}) {
  const forwardX = Number(forward?.x) || 0;
  const forwardZ = Number(forward?.z) || 0;
  const forwardLength = Math.hypot(forwardX, forwardZ);

  if (forwardLength === 0) {
    throw new RangeError('Forward vector must be non-zero');
  }

  const placementDistance = Number(distance);
  if (!Number.isFinite(placementDistance)) {
    throw new TypeError('Distance must be finite');
  }

  return {
    id,
    position: {
      x:
        Number(petPosition?.x ?? 0) +
        (forwardX / forwardLength) * placementDistance,
      y: Number(petPosition?.y ?? 0),
      z:
        Number(petPosition?.z ?? 0) +
        (forwardZ / forwardLength) * placementDistance,
    },
    url: normalizeHttpUrl(url),
  };
}

export function isWithinDistance(a, b, distance) {
  const deltaX = Number(a?.x ?? 0) - Number(b?.x ?? 0);
  const deltaZ = Number(a?.z ?? 0) - Number(b?.z ?? 0);
  return Math.hypot(deltaX, deltaZ) <= Number(distance);
}
