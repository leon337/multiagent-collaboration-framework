import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemasDirectory = join(repositoryRoot, 'schemas/context');
const registryPath = join(
  repositoryRoot,
  'context/projects/multiagent-collaboration-framework.yaml',
);
const capsulePath = join(repositoryRoot, '.mcf/project-capsule.yaml');

function readYamlRecord(path: string): Record<string, unknown> {
  return parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value === null || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}

describe('canonical MCF Context Fabric fixtures', () => {
  it('registers stable MCF identity and repository-native recovery entrypoints', () => {
    const registry = readYamlRecord(registryPath);

    expect(registry).toMatchObject({
      schema_version: 1,
      project: {
        id: 'multiagent-collaboration-framework',
        lifecycle: 'REGISTERED',
      },
      identity: {
        canonical_repository: 'leon337/multiagent-collaboration-framework',
        aliases: expect.arrayContaining(['MCF']),
      },
      ownership: { project_owner: 'LEANDRO' },
      context: {
        capsule_path: '.mcf/project-capsule.yaml',
        canonical_entrypoints: expect.arrayContaining(['README.md', 'docs/MCF-CURRENT-STATE.md']),
      },
      freshness: {
        operational_state: 'LIVE_REQUIRED',
        project_identity: 'DURABLE',
      },
    });
  });

  it('pairs the Capsule with Registry identity and records only a sourced snapshot', () => {
    const registry = readYamlRecord(registryPath);
    const capsule = readYamlRecord(capsulePath);

    expect(capsule.project_id).toBe((registry.project as Record<string, unknown>).id);
    expect(capsule).toMatchObject({
      schema_version: 1,
      project_id: 'multiagent-collaboration-framework',
      lifecycle: 'ACTIVE',
      snapshot: {
        current_workstream: 'nextgen-reconciliation-and-memory-live-planning',
        current_status:
          'NEXTGEN_F14_PLANNING_COMPLETE_CANDIDATE__V1_2_HUMAN_CONTROL_AUTHORITY_AND_GUI_DELTAS_RECONCILED__IMPLEMENTATION_NOT_AUTHORIZED',
        next_action:
          'Review the exact reconciled NextGen planning package published by this mission; re-read Issues 164 and 165 plus PRs 170, 174, 176, 177, and 182 live; preserve PRs 175, 179, 180, and 181 as current compatibility surfaces; and require explicit LEANDRO disposition, F1.4, and implementation-boundary decisions before NX-0.',
        blockers: [
          'NextGen F1.4 is PROPOSED_FOR_LEANDRO_REVIEW; prototype, implementation, provider activation, release, and production remain unauthorized.',
          'Human Control v1.2 is active governance with an internal tested checkpoint primitive, but its nominal actor recognizer is not authentication and persistent MissionRuntime pause, restart-safe resume, safe-point, and admission blocking are not implemented.',
          'PRs 179 and 180 merged the GUI/window protocol, schema, fixtures, pure qualifier, and post-merge status reconciliation. They still provide no runtime producer, consumer, automatic window control, or UI authority.',
          'PR 181 binds terminal human decisions in the implemented route to the reserved authenticated account and server-generated source provenance. Generic NextGen Authority Envelope, Human Decision chain, and contractual authority binding remain unimplemented.',
          'Issue 164 confirms that Brainbase task runs are billable and ineligible for this zero-cost plan; PR 169 is closed without merge. Provider-side Ledger write exists, while governed MCF write, auth, live activation, real-data proof, semver, and release remain separately gated.',
          'PR 170 prepares a local Ollama zero-cost harness. Its first actual run rejected Miriam for a missing handoff heading; run 32710207078 was cancelled before agent execution; run 32710229432 on head 1da1a13bd8ca47bed2f4a4e560e64691788582f8 reached 6/15 and failed on Tiago for two missing headings at 2026-08-24T09:23:42Z.',
          'PR 170 job 97379873672 preserves six attributable, structurally validated partial outputs and handoffs, but uploaded no artifact, emitted no terminal success, promoted nothing into the mission PRF, and skipped the repository-nonmutation proof. It is not a completed chain, accepted artifact, contribution credit, or satisfied origin gate.',
          'cloud.context.local.read and cognitive-ledger.memory.read remain DISCONNECTED, INACTIVE, HISTORICALLY_VERIFIED, and LIVE_REQUIRED after the recorded lab teardown.',
          'cloud.workspace.g2a.read remains NOT_AUTHORIZED, DISCONNECTED, UNKNOWN, and LIVE_REQUIRED; cloud.workspace.g2b.write, Tasks 9 and 10 remain NOT_AUTHORIZED, DISCONNECTED, BLOCKED, and LIVE_REQUIRED.',
          'Draft PRs 174, 176, 177, and 182 are outside main and remain noncanonical inputs; they do not authorize continuity duplication, qualification claims, runtime, provider, or VPS action.',
          'Mission Control Issue 141, Cloud remote or VPS, TriView commands, paid AI APIs, runtime production, and NODE-01 are not authorized by the planning package.',
        ],
      },
      sources: { current_state: 'docs/MCF-CURRENT-STATE.md' },
      observed_at: '2026-08-28T16:04:15Z',
    });

    const forbiddenOperationalKeys = new Set([
      'commit_sha',
      'deployment',
      'deployment_state',
      'health',
      'production',
      'production_health',
      'provider',
      'provider_state',
      'readiness',
      'reported_commit',
    ]);
    expect(collectKeys(capsule).filter((key) => forbiddenOperationalKeys.has(key))).toEqual([]);
  });

  it('validates both canonical documents against their isolated schemas', () => {
    const registryValidator = new ContextSchemaValidator(
      join(schemasDirectory, 'project-registry-entry.schema.json'),
    );
    const capsuleValidator = new ContextSchemaValidator(
      join(schemasDirectory, 'project-capsule.schema.json'),
    );

    expect(registryValidator.validate(readYamlRecord(registryPath))).toEqual({
      valid: true,
      errors: [],
    });
    expect(capsuleValidator.validate(readYamlRecord(capsulePath))).toEqual({
      valid: true,
      errors: [],
    });
  });
});
