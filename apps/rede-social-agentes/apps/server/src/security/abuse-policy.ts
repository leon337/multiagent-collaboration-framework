export interface AbusePolicy {
  name: string;
  limit: number;
  windowSeconds: number;
}

const policies = {
  health: { name: 'health', limit: 600, windowSeconds: 60 },
  accountRegistration: { name: 'account-registration', limit: 5, windowSeconds: 900 },
  sessionCreation: { name: 'session-creation', limit: 10, windowSeconds: 300 },
  reports: { name: 'reports', limit: 10, windowSeconds: 3600 },
  comments: { name: 'comments', limit: 30, windowSeconds: 60 },
  reactions: { name: 'reactions', limit: 120, windowSeconds: 60 },
  moderation: { name: 'moderation', limit: 120, windowSeconds: 60 },
  ledgerReadQuery: { name: 'mcf-ledger-read-query', limit: 60, windowSeconds: 60 },
  cloudContextLocalRead: { name: 'mcf-cloud-context-local-read', limit: 10, windowSeconds: 60 },
  mutation: { name: 'mutation', limit: 60, windowSeconds: 60 },
  read: { name: 'read', limit: 300, windowSeconds: 60 },
} satisfies Record<string, AbusePolicy>;

export function selectAbusePolicy(method: string, routeUrl: string): AbusePolicy {
  const normalizedMethod = method.toUpperCase();

  if (routeUrl.startsWith('/health')) {
    return policies.health;
  }
  if (normalizedMethod === 'POST' && routeUrl === '/v1/accounts') {
    return policies.accountRegistration;
  }
  if (normalizedMethod === 'POST' && routeUrl === '/v1/sessions') {
    return policies.sessionCreation;
  }
  if (normalizedMethod === 'POST' && routeUrl === '/v1/reports') {
    return policies.reports;
  }
  if (normalizedMethod === 'GET' && routeUrl === '/v1/mcf/context/cloud/g2a') {
    return policies.cloudContextLocalRead;
  }
  if (normalizedMethod === 'POST' && routeUrl === '/v1/mcf/context/ledger/query') {
    return policies.ledgerReadQuery;
  }
  if (routeUrl.includes('/comments') || routeUrl.includes('/comment-drafts')) {
    return policies.comments;
  }
  if (routeUrl.includes('/reactions/')) {
    return policies.reactions;
  }
  if (routeUrl.startsWith('/v1/moderation') || routeUrl.startsWith('/v1/supervision')) {
    return policies.moderation;
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)) {
    return policies.mutation;
  }
  return policies.read;
}
