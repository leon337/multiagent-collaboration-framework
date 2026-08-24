import { isAbsolute, join } from 'node:path';

import { Injectable } from '@nestjs/common';
import type { McfContextRecoveryReceipt } from '@rsa/contracts';
import { z } from 'zod';

import { ContextRecoveryService, type ContextLiveVerifier } from './context-recovery.service.js';
import { GitRepositoryLiveVerifier } from './git-repository-live-verifier.js';

const MAX_CONTEXT_CONFIG_BYTES = 64 * 1024;
const projectIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]*$/u)
  .max(128);
const absolutePathSchema = z.string().min(1).max(4096).refine(isAbsolute, 'path must be absolute');
const sourceReferenceSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(
    /^(?![A-Za-z]:)(?!\/)(?!.*\\)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\/\/)(?=.*\S)[^/]+(?:\/[^/]+)*$/u,
  );
const gitRevisionSchema = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u);
const contextApiConfigurationSchema = z
  .object({
    registry_repository_root: absolutePathSchema,
    schema_directory: absolutePathSchema.optional(),
    registry_sources: z
      .array(
        z
          .object({
            source_ref: sourceReferenceSchema,
            source_revision: gitRevisionSchema,
          })
          .strict(),
      )
      .min(1)
      .max(255),
    capability_sources: z
      .array(
        z
          .object({
            source_ref: sourceReferenceSchema,
            source_revision: gitRevisionSchema,
          })
          .strict(),
      )
      .min(1)
      .max(128)
      .optional(),
    project_repositories: z.record(
      projectIdSchema,
      z
        .object({
          repository_root: absolutePathSchema,
          source_revision: gitRevisionSchema,
        })
        .strict(),
    ),
  })
  .strict();

export type McfContextApiConfiguration = z.infer<typeof contextApiConfigurationSchema>;

export function loadMcfContextApiConfiguration(
  env: NodeJS.ProcessEnv,
): McfContextApiConfiguration | null {
  const rawConfiguration = env.MCF_CONTEXT_CONFIG_JSON;
  if (
    rawConfiguration === undefined ||
    Buffer.byteLength(rawConfiguration, 'utf8') > MAX_CONTEXT_CONFIG_BYTES
  ) {
    return null;
  }

  try {
    return contextApiConfigurationSchema.parse(JSON.parse(rawConfiguration));
  } catch {
    return null;
  }
}

export class McfContextRecoveryUnavailableError extends Error {
  constructor() {
    super('MCF context recovery is not configured for this environment.');
    this.name = 'McfContextRecoveryUnavailableError';
  }
}

@Injectable()
export class McfContextRecoveryApiService {
  constructor(private readonly recovery: ContextRecoveryService | null) {}

  static fromEnvironment(
    env: NodeJS.ProcessEnv = process.env,
    liveVerifier: ContextLiveVerifier = new GitRepositoryLiveVerifier(),
  ): McfContextRecoveryApiService {
    const configuration = loadMcfContextApiConfiguration(env);
    if (configuration === null) return new McfContextRecoveryApiService(null);

    try {
      return new McfContextRecoveryApiService(
        new ContextRecoveryService(
          {
            repositoryRoot: configuration.registry_repository_root,
            schemaDirectory:
              configuration.schema_directory ??
              join(configuration.registry_repository_root, 'schemas/context'),
            registrySources: configuration.registry_sources,
            capsuleSourceRevisions: {},
            projectRepositories: Object.fromEntries(
              Object.entries(configuration.project_repositories).map(([projectId, repository]) => [
                projectId,
                {
                  repositoryRoot: repository.repository_root,
                  sourceRevision: repository.source_revision,
                },
              ]),
            ),
          },
          { liveVerifier },
        ),
      );
    } catch {
      return new McfContextRecoveryApiService(null);
    }
  }

  async recoverReadOnly(
    projectHint: string,
    requiresCurrentOperationalState: boolean,
  ): Promise<McfContextRecoveryReceipt> {
    if (!this.recovery) throw new McfContextRecoveryUnavailableError();
    return this.recovery.recoverWithLiveVerification({
      project_hint: projectHint,
      read_only: true,
      material_action: false,
      requires_current_operational_state: requiresCurrentOperationalState,
    });
  }
}
