import type { FastifyRequest } from 'fastify';

import type { AuthenticatedHumanRecord } from './identity.repository.js';

export type AuthenticatedHumanRequest = FastifyRequest & {
  authenticatedHuman: AuthenticatedHumanRecord;
};
