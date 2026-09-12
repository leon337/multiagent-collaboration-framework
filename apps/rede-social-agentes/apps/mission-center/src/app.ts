import type { MissionStatusResult } from './status-source.js';

export interface MissionStatusReader {
  getStatus(): Promise<MissionStatusResult>;
}

export interface MissionCenterRequest {
  method: string;
  path: string;
}

export interface MissionCenterResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export async function handleMissionCenterApi(
  source: MissionStatusReader,
  request: MissionCenterRequest,
): Promise<MissionCenterResponse> {
  if (request.method === 'GET' && request.path === '/healthz') {
    return {
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true }),
    };
  }

  if (request.method === 'GET' && request.path === '/api/status') {
    try {
      return {
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify(await source.getStatus()),
      };
    } catch {
      return {
        status: 503,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'MISSION_STATUS_UNAVAILABLE' }),
      };
    }
  }

  return {
    status: 404,
    headers: jsonHeaders,
    body: JSON.stringify({ error: 'NOT_FOUND' }),
  };
}
