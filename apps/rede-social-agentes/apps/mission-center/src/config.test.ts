import { describe, expect, it } from 'vitest';

import { loadMissionCenterConfig } from './config.js';

describe('loadMissionCenterConfig', () => {
  it('defaults to localhost-only binding and a bounded upstream cache', () => {
    const config = loadMissionCenterConfig({});

    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(4174);
    expect(config.cacheTtlMs).toBe(120000);
    expect(config.statusUrl).toMatch(/^https:\/\/api\.github\.com\//u);
  });

  it('rejects invalid port, cache TTL and unsafe upstream protocol', () => {
    expect(() => loadMissionCenterConfig({ MCF_MISSION_CENTER_PORT: '0' })).toThrow(/port/u);
    expect(() => loadMissionCenterConfig({ MCF_MISSION_CENTER_CACHE_TTL_MS: '10' })).toThrow(
      /cache TTL/u,
    );
    expect(() =>
      loadMissionCenterConfig({ MCF_MISSION_STATUS_URL: 'file:///tmp/status.json' }),
    ).toThrow(/status URL/u);
  });
});
