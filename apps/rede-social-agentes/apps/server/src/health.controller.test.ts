import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from './database.service.js';
import { HealthController } from './health.controller.js';

function createController(ping: () => Promise<void>): HealthController {
  const database = { ping } as unknown as DatabaseService;
  return new HealthController(database);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('HealthController', () => {
  it('returns the server liveness contract', () => {
    const response = createController(vi.fn()).live();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('rede-social-agentes');
    expect(response.component).toBe('server');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });

  it('returns ready when PostgreSQL responds', async () => {
    const ping = vi.fn().mockResolvedValue(undefined);
    const response = await createController(ping).ready();

    expect(ping).toHaveBeenCalledOnce();
    expect(response.status).toBe('ok');
  });

  it('returns a safe unavailable error when PostgreSQL fails', async () => {
    const ping = vi.fn().mockRejectedValue(new Error('sensitive database detail'));

    await expect(createController(ping).ready()).rejects.toMatchObject({
      status: 503,
    });
  });

  it('returns the validated Render commit and branch', () => {
    vi.stubEnv('RENDER', 'true');
    vi.stubEnv('RENDER_GIT_COMMIT', 'ABCDEF0123456789ABCDEF0123456789ABCDEF01');
    vi.stubEnv('RENDER_GIT_BRANCH', 'main');

    expect(createController(vi.fn()).version()).toEqual({
      service: 'rede-social-agentes',
      component: 'server',
      commitSha: 'abcdef0123456789abcdef0123456789abcdef01',
      branch: 'main',
      runtime: 'render',
    });
  });

  it('does not expose invalid environment values', () => {
    vi.stubEnv('RENDER', 'false');
    vi.stubEnv('RENDER_GIT_COMMIT', 'not-a-commit');
    vi.stubEnv('RENDER_GIT_BRANCH', 'main with secret=value');

    expect(createController(vi.fn()).version()).toEqual({
      service: 'rede-social-agentes',
      component: 'server',
      commitSha: null,
      branch: null,
      runtime: 'local',
    });
  });
});
