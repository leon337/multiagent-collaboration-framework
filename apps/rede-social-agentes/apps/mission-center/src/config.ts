export interface MissionCenterConfig {
  host: string;
  port: number;
  statusUrl: string;
  cacheTtlMs: number;
}

const DEFAULT_STATUS_URL =
  'https://api.github.com/repos/leon337/multiagent-collaboration-framework/contents/artifacts/missions/MCF-GAMA-FUND-2026-001/mission-status.json?ref=mission%2Fgama-fund-2026-001';

function integer(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
  label: string,
): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function statusUrl(value: string | undefined): string {
  const raw = value?.trim() || DEFAULT_STATUS_URL;
  const parsed = new URL(raw);
  const localHttp =
    parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !localHttp) {
    throw new Error('Mission status URL must use HTTPS or localhost HTTP');
  }
  return parsed.toString();
}

export function loadMissionCenterConfig(
  env: Record<string, string | undefined>,
): MissionCenterConfig {
  const host = env.MCF_MISSION_CENTER_HOST?.trim() || '127.0.0.1';
  if (host.length === 0) throw new Error('Mission Center host must not be empty');
  return {
    host,
    port: integer(env.MCF_MISSION_CENTER_PORT, 4174, 1, 65_535, 'Mission Center port'),
    statusUrl: statusUrl(env.MCF_MISSION_STATUS_URL),
    cacheTtlMs: integer(
      env.MCF_MISSION_CENTER_CACHE_TTL_MS,
      120_000,
      1_000,
      3_600_000,
      'Mission Center cache TTL',
    ),
  };
}
