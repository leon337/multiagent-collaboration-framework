import { describe, expect, it } from 'vitest';

import { selectAbusePolicy } from './abuse-policy.js';

describe('selectAbusePolicy', () => {
  it.each([
    ['POST', '/v1/accounts', 'account-registration', 5, 900],
    ['POST', '/v1/sessions', 'session-creation', 10, 300],
    ['POST', '/v1/reports', 'reports', 10, 3600],
    ['GET', '/v1/mcf/context/cloud/g2a', 'mcf-cloud-context-local-read', 10, 60],
    ['POST', '/v1/content/:contentId/comments', 'comments', 30, 60],
    ['PUT', '/v1/content/:contentId/reactions/:reactionType', 'reactions', 120, 60],
    ['GET', '/v1/moderation/cases', 'moderation', 120, 60],
    ['POST', '/v1/communities', 'mutation', 60, 60],
    ['GET', '/v1/feed', 'read', 300, 60],
  ])('selects %s %s policy', (method, route, name, limit, windowSeconds) => {
    expect(selectAbusePolicy(method, route)).toEqual({ name, limit, windowSeconds });
  });
});
