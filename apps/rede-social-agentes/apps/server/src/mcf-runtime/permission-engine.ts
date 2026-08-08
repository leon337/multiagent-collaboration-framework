import { Injectable } from '@nestjs/common';
import type { McfSkillDefinition } from '@rsa/contracts';

import { HumanDelegationGuard } from './human-delegation-guard.js';
import { McfPermissionDeniedError } from './mcf-runtime.errors.js';

export interface McfToolRequest {
  provider: string;
  operation: string;
  resource: string;
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function canonicalizeToolValue(value: string): string {
  return fold(value).trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

export function canonicalizeProvider(value: string): string {
  const normalized = canonicalizeToolValue(value);
  return normalized === 'github-actions' ? 'github' : normalized;
}

function operationMatches(operation: string, allowedPrefixes: string[]): boolean {
  const normalized = canonicalizeToolValue(operation);
  return allowedPrefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}-`),
  );
}

function isProductionTarget(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = canonicalizeToolValue(value);
  return normalized.includes('production') || normalized.includes('producao');
}

function isExplicitReadOnlyScopedOperation(skillId: string, operation: string): boolean {
  return skillId === 'MCF-RUN-TESTS' && canonicalizeToolValue(operation) === 'query-ci';
}

const canonicalGitHubRepositoryResource =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/u;

function isCanonicalGitHubRepositoryResource(value: string): boolean {
  return value === value.trim() && canonicalGitHubRepositoryResource.test(value);
}

function requiresCanonicalGitHubRepository(
  skillId: string,
  provider: string,
  operation: string,
): boolean {
  return (
    skillId === 'MCF-RUN-TESTS' &&
    provider === 'github' &&
    canonicalizeToolValue(operation) === 'query-ci'
  );
}

const readOperations = ['read', 'get', 'list', 'search', 'inspect', 'status', 'fetch'];
const proposalOperations = [...readOperations, 'draft', 'plan', 'design', 'create-contract'];
const destructiveOperations = [
  'delete',
  'drop',
  'truncate',
  'destroy',
  'charge',
  'publish',
  'release-public',
  'deploy-production',
  'rotate-secret',
  'expose-secret',
];

@Injectable()
export class PermissionEngine {
  private readonly humanDelegation = new HumanDelegationGuard();

  assertAllowed(
    skill: McfSkillDefinition,
    agentId: string,
    tool: McfToolRequest,
    inputs: Record<string, unknown>,
  ): void {
    this.humanDelegation.assertAllowed(agentId, inputs);

    if (!skill.ownerAgents.includes(agentId)) {
      throw new McfPermissionDeniedError(`agent ${agentId} is not an owner of ${skill.skillId}`);
    }

    const provider = canonicalizeProvider(tool.provider);
    const allowedProviders = new Set(skill.allowedTools.map(canonicalizeProvider));
    const forbidden = new Set(skill.forbiddenTools.map(canonicalizeToolValue));
    const operation = canonicalizeToolValue(tool.operation);
    const resource = canonicalizeToolValue(tool.resource);

    if (provider !== 'internal' && !allowedProviders.has(provider)) {
      throw new McfPermissionDeniedError(
        `provider ${tool.provider} is not allowed by ${skill.skillId}`,
      );
    }

    if (forbidden.has(provider) || forbidden.has(operation)) {
      throw new McfPermissionDeniedError(
        `tool or operation is explicitly forbidden by ${skill.skillId}`,
      );
    }

    if (operation === 'query-ci' && skill.skillId !== 'MCF-RUN-TESTS') {
      throw new McfPermissionDeniedError('query-ci is restricted to MCF-RUN-TESTS');
    }

    if (
      requiresCanonicalGitHubRepository(skill.skillId, provider, operation) &&
      !isCanonicalGitHubRepositoryResource(tool.resource)
    ) {
      throw new McfPermissionDeniedError(
        'GitHub CI query requires a canonical owner/repository resource',
      );
    }

    if (
      operationMatches(operation, destructiveOperations) ||
      destructiveOperations.some((candidate) => resource.includes(candidate))
    ) {
      throw new McfPermissionDeniedError('destructive or public action requires a human gate');
    }

    if (
      skill.skillId === 'MCF-DEPLOY-VALIDATE' &&
      (isProductionTarget(inputs.target_environment) || resource.includes('production')) &&
      inputs.humanGateApproved !== true
    ) {
      throw new McfPermissionDeniedError('production deployment requires humanGateApproved=true');
    }

    if (
      provider === 'github' &&
      resource.endsWith('/main') &&
      operationMatches(operation, ['write', 'update', 'push', 'commit'])
    ) {
      throw new McfPermissionDeniedError('direct writes to main are forbidden');
    }

    switch (skill.permissionProfile) {
      case 'READ_ONLY':
        if (!operationMatches(operation, readOperations)) {
          throw new McfPermissionDeniedError('READ_ONLY permits only read operations');
        }
        break;
      case 'READ_AND_PROPOSE':
        if (!operationMatches(operation, proposalOperations)) {
          throw new McfPermissionDeniedError(
            'READ_AND_PROPOSE permits reads and non-persistent proposals only',
          );
        }
        break;
      case 'SCOPED_WRITE':
        if (
          !isExplicitReadOnlyScopedOperation(skill.skillId, operation) &&
          inputs.authorizedScope !== true &&
          provider !== 'internal'
        ) {
          throw new McfPermissionDeniedError('SCOPED_WRITE requires inputs.authorizedScope=true');
        }
        break;
      case 'SENSITIVE_CONTROLLED':
        if (inputs.sensitiveAuthorization !== true) {
          throw new McfPermissionDeniedError(
            'SENSITIVE_CONTROLLED requires explicit sensitive authorization',
          );
        }
        break;
      case 'HUMAN_GATE':
        if (inputs.humanGateApproved !== true) {
          throw new McfPermissionDeniedError('HUMAN_GATE requires humanGateApproved=true');
        }
        break;
      default: {
        const exhaustive: never = skill.permissionProfile;
        throw new McfPermissionDeniedError(`unknown permission profile: ${String(exhaustive)}`);
      }
    }
  }
}
