export interface WebRuntimeConfig {
  apiBaseUrl: string | null;
  pilotMode: true;
}

export function resolveApiBaseUrl(value: string | undefined, production: boolean): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const parsed = new URL(normalized);
  if (parsed.origin !== normalized || parsed.username || parsed.password) {
    throw new Error('VITE_API_BASE_URL must be an exact origin without a path or credentials.');
  }
  if (production && parsed.protocol !== 'https:') {
    throw new Error('VITE_API_BASE_URL must use HTTPS in production.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('VITE_API_BASE_URL must use HTTP or HTTPS.');
  }

  return parsed.origin;
}

export const webRuntimeConfig: WebRuntimeConfig = Object.freeze({
  apiBaseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.PROD),
  pilotMode: true,
});
