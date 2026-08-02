import { describe, expect, it } from 'vitest';

import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns the server health contract', () => {
    const response = new HealthController().live();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('rede-social-agentes');
    expect(response.component).toBe('server');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
