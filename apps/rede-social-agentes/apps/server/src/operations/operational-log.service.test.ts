import { describe, expect, it } from 'vitest';

import { createHttpCompletionLogEvent } from './operational-log.service.js';

describe('createHttpCompletionLogEvent', () => {
  it('emits only the approved operational fields', () => {
    const event = createHttpCompletionLogEvent({
      method: 'POST',
      route: '/v1/privacy/anonymize',
      statusCode: 409,
      durationMs: 17,
      correlationId: 'correlation-123',
      outcome: 'ERROR',
    });

    expect(event).toEqual({
      level: 'warn',
      service: 'rede-social-agentes',
      component: 'server',
      event: 'http_request_completed',
      method: 'POST',
      route: '/v1/privacy/anonymize',
      statusCode: 409,
      durationMs: 17,
      correlationId: 'correlation-123',
      outcome: 'ERROR',
    });
    expect(event).not.toHaveProperty('body');
    expect(event).not.toHaveProperty('query');
    expect(event).not.toHaveProperty('headers');
    expect(event).not.toHaveProperty('token');
    expect(event).not.toHaveProperty('ip');
    expect(event).not.toHaveProperty('url');
  });

  it('uses info level for successful responses', () => {
    expect(
      createHttpCompletionLogEvent({
        method: 'GET',
        route: '/health/ready',
        statusCode: 200,
        durationMs: 2,
        correlationId: 'correlation-ready',
        outcome: 'SUCCESS',
      }).level,
    ).toBe('info');
  });
});
