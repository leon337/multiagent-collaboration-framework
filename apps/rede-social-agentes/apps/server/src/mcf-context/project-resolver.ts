import type { McfProjectRegistryEntry } from '@rsa/contracts';

export type ProjectMatchKind = 'PROJECT_ID' | 'CANONICAL_REPOSITORY' | 'ALIAS';

export interface ResolvedProject {
  outcome: 'RESOLVED';
  project_id: string;
  registry_entry: McfProjectRegistryEntry;
  match: {
    kind: ProjectMatchKind;
    normalized_hint: string;
    matched_value: string;
  };
}

export interface AmbiguousProjectResolution {
  outcome: 'AMBIGUOUS_CONTEXT';
  matched_by: ProjectMatchKind;
  normalized_hint: string;
  candidates: Array<{
    project_id: string;
    canonical_repository: string;
  }>;
}

export interface ProjectNotFound {
  outcome: 'NOT_FOUND';
  normalized_hint: string;
  candidates: [];
}

export type ProjectResolution = ResolvedProject | AmbiguousProjectResolution | ProjectNotFound;

interface ProjectMatch {
  entry: McfProjectRegistryEntry;
  matchedValue: string;
}

export function normalizeProjectHint(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function findMatches(
  entries: readonly McfProjectRegistryEntry[],
  normalizedHint: string,
  kind: ProjectMatchKind,
): ProjectMatch[] {
  const matches: ProjectMatch[] = [];

  for (const entry of entries) {
    if (kind === 'PROJECT_ID') {
      if (normalizeProjectHint(entry.project.id) === normalizedHint) {
        matches.push({ entry, matchedValue: entry.project.id });
      }
      continue;
    }

    if (kind === 'CANONICAL_REPOSITORY') {
      if (normalizeProjectHint(entry.identity.canonical_repository) === normalizedHint) {
        matches.push({ entry, matchedValue: entry.identity.canonical_repository });
      }
      continue;
    }

    const matchedAlias = entry.identity.aliases
      .filter((alias) => normalizeProjectHint(alias) === normalizedHint)
      .toSorted(compareText)[0];
    if (matchedAlias !== undefined) matches.push({ entry, matchedValue: matchedAlias });
  }

  return matches.toSorted((left, right) => {
    const projectOrder = compareText(left.entry.project.id, right.entry.project.id);
    if (projectOrder !== 0) return projectOrder;
    const repositoryOrder = compareText(
      left.entry.identity.canonical_repository,
      right.entry.identity.canonical_repository,
    );
    if (repositoryOrder !== 0) return repositoryOrder;
    return compareText(left.matchedValue, right.matchedValue);
  });
}

export function resolveProject(
  entries: readonly McfProjectRegistryEntry[],
  hint: string,
): ProjectResolution {
  const normalizedHint = normalizeProjectHint(hint);
  if (normalizedHint.length === 0) {
    return { outcome: 'NOT_FOUND', normalized_hint: normalizedHint, candidates: [] };
  }

  const precedence: ProjectMatchKind[] = ['PROJECT_ID', 'CANONICAL_REPOSITORY', 'ALIAS'];
  for (const kind of precedence) {
    const matches = findMatches(entries, normalizedHint, kind);
    if (matches.length === 0) continue;

    if (matches.length === 1) {
      const match = matches[0];
      if (!match) break;
      return {
        outcome: 'RESOLVED',
        project_id: match.entry.project.id,
        registry_entry: match.entry,
        match: {
          kind,
          normalized_hint: normalizedHint,
          matched_value: match.matchedValue,
        },
      };
    }

    return {
      outcome: 'AMBIGUOUS_CONTEXT',
      matched_by: kind,
      normalized_hint: normalizedHint,
      candidates: matches.map(({ entry }) => ({
        project_id: entry.project.id,
        canonical_repository: entry.identity.canonical_repository,
      })),
    };
  }

  return { outcome: 'NOT_FOUND', normalized_hint: normalizedHint, candidates: [] };
}
