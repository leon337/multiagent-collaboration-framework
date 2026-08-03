import { describe, expect, it } from 'vitest';

import type { CommunityRepository } from './community.repository.js';
import { CommunityService, normalizeCommunitySlug } from './community.service.js';

describe('CommunityService', () => {
  it('normalizes accents, spaces and punctuation in community slugs', () => {
    expect(normalizeCommunitySlug('  Agentes de IA — Recife!  ')).toBe('agentes-de-ia-recife');
  });

  it('creates the owner community with normalized fields', async () => {
    let received: Parameters<CommunityRepository['create']>[0] | null = null;
    const repository = {
      create: async (input: Parameters<CommunityRepository['create']>[0]) => {
        received = input;
        return {
          id: input.communityId,
          slug: input.slug,
          name: input.name,
          description: input.description,
          ownerAccountId: input.ownerAccountId,
          status: 'ACTIVE' as const,
          createdAt: new Date('2026-08-03T05:00:00.000Z'),
          archivedAt: null,
        };
      },
    } as CommunityRepository;

    const response = await new CommunityService(repository).create(
      {
        slug: ' Comunidade de Agentes ',
        name: ' Comunidade de Agentes ',
        description: ' Construção coletiva ',
      },
      'account-1',
      'correlation-1',
    );

    expect(received).toMatchObject({
      ownerAccountId: 'account-1',
      slug: 'comunidade-de-agentes',
      name: 'Comunidade de Agentes',
      description: 'Construção coletiva',
      correlationId: 'correlation-1',
    });
    expect(response).toMatchObject({
      slug: 'comunidade-de-agentes',
      ownerAccountId: 'account-1',
      status: 'ACTIVE',
    });
  });
});
