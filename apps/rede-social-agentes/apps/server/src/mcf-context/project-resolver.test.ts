import type { McfProjectRegistryEntry } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { resolveProject } from './project-resolver.js';

function registryEntry(
  projectId: string,
  canonicalRepository: string,
  aliases: string[],
): McfProjectRegistryEntry {
  return {
    schema_version: 1,
    project: { id: projectId, lifecycle: 'REGISTERED' },
    identity: { canonical_repository: canonicalRepository, aliases },
    ownership: { project_owner: 'LEANDRO' },
    context: {
      capsule_path: `.mcf/${projectId}.yaml`,
      canonical_entrypoints: ['README.md'],
    },
    freshness: {
      operational_state: 'LIVE_REQUIRED',
      project_identity: 'DURABLE',
    },
  };
}

const mcf = registryEntry(
  'multiagent-collaboration-framework',
  'leon337/multiagent-collaboration-framework',
  ['MCF', 'multiagent framework'],
);

describe('resolveProject', () => {
  it('resolves an exact stable project id with strongest precedence', () => {
    const collidingAlias = registryEntry('other-project', 'leon337/other-project', [
      'multiagent-collaboration-framework',
    ]);

    expect(resolveProject([collidingAlias, mcf], 'multiagent-collaboration-framework')).toEqual({
      outcome: 'RESOLVED',
      project_id: 'multiagent-collaboration-framework',
      registry_entry: mcf,
      match: {
        kind: 'PROJECT_ID',
        normalized_hint: 'multiagent-collaboration-framework',
        matched_value: 'multiagent-collaboration-framework',
      },
    });
  });

  it('resolves the exact canonical repository identity', () => {
    expect(resolveProject([mcf], ' LEON337/MultiAgent-Collaboration-Framework ')).toMatchObject({
      outcome: 'RESOLVED',
      project_id: 'multiagent-collaboration-framework',
      match: {
        kind: 'CANONICAL_REPOSITORY',
        normalized_hint: 'leon337/multiagent-collaboration-framework',
        matched_value: 'leon337/multiagent-collaboration-framework',
      },
    });
  });

  it('resolves aliases case-insensitively under trim, NFKC, and lowercase normalization', () => {
    expect(resolveProject([mcf], ' ｍＣＦ ')).toMatchObject({
      outcome: 'RESOLVED',
      project_id: 'multiagent-collaboration-framework',
      match: {
        kind: 'ALIAS',
        normalized_hint: 'mcf',
        matched_value: 'MCF',
      },
    });
  });

  it('returns deterministic ambiguity for equally strong alias candidates', () => {
    const second = registryEntry('mission-control', 'leon337/mission-control', ['MCF']);

    expect(resolveProject([second, mcf], 'mcf')).toEqual({
      outcome: 'AMBIGUOUS_CONTEXT',
      matched_by: 'ALIAS',
      normalized_hint: 'mcf',
      candidates: [
        {
          project_id: 'mission-control',
          canonical_repository: 'leon337/mission-control',
        },
        {
          project_id: 'multiagent-collaboration-framework',
          canonical_repository: 'leon337/multiagent-collaboration-framework',
        },
      ],
    });
  });

  it('does not infer fuzzy identity or choose a default for unknown input', () => {
    expect(resolveProject([mcf], 'multiagent')).toEqual({
      outcome: 'NOT_FOUND',
      normalized_hint: 'multiagent',
      candidates: [],
    });
    expect(resolveProject([mcf], '   ')).toEqual({
      outcome: 'NOT_FOUND',
      normalized_hint: '',
      candidates: [],
    });
  });

  it('keeps the stable project id when the canonical repository is renamed', () => {
    const renamed = registryEntry('multiagent-collaboration-framework', 'leon337/mcf-renamed', [
      'MCF',
    ]);

    expect(resolveProject([renamed], 'leon337/mcf-renamed')).toMatchObject({
      outcome: 'RESOLVED',
      project_id: 'multiagent-collaboration-framework',
      match: { kind: 'CANONICAL_REPOSITORY' },
    });
    expect(resolveProject([renamed], 'multiagent-collaboration-framework')).toMatchObject({
      outcome: 'RESOLVED',
      project_id: 'multiagent-collaboration-framework',
      match: { kind: 'PROJECT_ID' },
    });
  });

  it('does not mutate Registry entries while resolving', () => {
    const entries = [mcf];
    const before = structuredClone(entries);

    resolveProject(entries, 'MCF');

    expect(entries).toEqual(before);
  });
});
