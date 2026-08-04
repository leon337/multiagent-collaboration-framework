import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import type { McfPermissionProfile, McfSkillDefinition } from '@rsa/contracts';

import { McfSkillNotFoundError } from './mcf-runtime.errors.js';

const permissionProfiles = new Set<McfPermissionProfile>([
  'READ_ONLY',
  'READ_AND_PROPOSE',
  'SCOPED_WRITE',
  'SENSITIVE_CONTROLLED',
  'HUMAN_GATE',
]);

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineList(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return trimmed.length > 0 ? [unquote(trimmed)] : [];
  }

  const body = trimmed.slice(1, -1).trim();
  if (!body) {
    return [];
  }

  return body
    .split(',')
    .map((item) => unquote(item))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

interface MutableSkill {
  skillId?: string;
  name?: string;
  version?: string;
  purpose?: string;
  ownerAgents?: string[];
  requiredInputs?: string[];
  allowedTools?: string[];
  forbiddenTools?: string[];
  permissionProfile?: string;
  executionSteps?: string[];
  requiredEvidence?: string[];
  acceptanceCriteria?: string[];
  failureModes?: string[];
  fallback?: string;
  handoffTo?: string;
}

function finalizeSkill(skill: MutableSkill): McfSkillDefinition {
  const requiredScalars: Array<[keyof MutableSkill, string | undefined]> = [
    ['skillId', skill.skillId],
    ['name', skill.name],
    ['version', skill.version],
    ['purpose', skill.purpose],
    ['permissionProfile', skill.permissionProfile],
    ['fallback', skill.fallback],
    ['handoffTo', skill.handoffTo],
  ];

  const missing = requiredScalars.filter(([, value]) => !value).map(([key]) => String(key));
  if (missing.length > 0) {
    throw new Error(`Invalid MCF skill entry. Missing fields: ${missing.join(', ')}`);
  }

  if (!permissionProfiles.has(skill.permissionProfile as McfPermissionProfile)) {
    throw new Error(`Invalid MCF permission profile: ${skill.permissionProfile ?? 'undefined'}`);
  }

  return {
    skillId: skill.skillId as string,
    name: skill.name as string,
    version: skill.version as string,
    purpose: skill.purpose as string,
    ownerAgents: skill.ownerAgents ?? [],
    requiredInputs: skill.requiredInputs ?? [],
    allowedTools: skill.allowedTools ?? [],
    forbiddenTools: skill.forbiddenTools ?? [],
    permissionProfile: skill.permissionProfile as McfPermissionProfile,
    executionSteps: skill.executionSteps ?? [],
    requiredEvidence: skill.requiredEvidence ?? [],
    acceptanceCriteria: skill.acceptanceCriteria ?? [],
    failureModes: skill.failureModes ?? [],
    fallback: skill.fallback as string,
    handoffTo: skill.handoffTo as string,
  };
}

export function parseMcfSkillRegistry(content: string): McfSkillDefinition[] {
  const skills: McfSkillDefinition[] = [];
  let current: MutableSkill | null = null;
  let insideSkills = false;

  const pushCurrent = (): void => {
    if (!current) {
      return;
    }
    skills.push(finalizeSkill(current));
    current = null;
  };

  for (const rawLine of content.split(/\r?\n/u)) {
    if (rawLine.trim() === 'skills:') {
      insideSkills = true;
      continue;
    }
    if (!insideSkills) {
      continue;
    }

    const skillStart = /^  - skill_id:\s*(.+)$/u.exec(rawLine);
    if (skillStart) {
      pushCurrent();
      current = { skillId: unquote(skillStart[1] ?? '') };
      continue;
    }

    if (!current) {
      continue;
    }

    const field = /^    ([a-z_]+):\s*(.*)$/u.exec(rawLine);
    if (!field) {
      continue;
    }

    const key = field[1];
    const value = field[2] ?? '';
    switch (key) {
      case 'name':
        current.name = unquote(value);
        break;
      case 'version':
        current.version = unquote(value);
        break;
      case 'purpose':
        current.purpose = unquote(value);
        break;
      case 'owner_agents':
        current.ownerAgents = parseInlineList(value);
        break;
      case 'required_inputs':
        current.requiredInputs = parseInlineList(value);
        break;
      case 'allowed_tools':
        current.allowedTools = parseInlineList(value);
        break;
      case 'forbidden_tools':
        current.forbiddenTools = parseInlineList(value);
        break;
      case 'permission_profile':
        current.permissionProfile = unquote(value);
        break;
      case 'execution_steps':
        current.executionSteps = parseInlineList(value);
        break;
      case 'required_evidence':
        current.requiredEvidence = parseInlineList(value);
        break;
      case 'acceptance_criteria':
        current.acceptanceCriteria = parseInlineList(value);
        break;
      case 'failure_modes':
        current.failureModes = parseInlineList(value);
        break;
      case 'fallback':
        current.fallback = unquote(value);
        break;
      case 'handoff_to':
        current.handoffTo = unquote(value);
        break;
      default:
        break;
    }
  }

  pushCurrent();

  const ids = new Set<string>();
  for (const skill of skills) {
    if (ids.has(skill.skillId)) {
      throw new Error(`Duplicate MCF skill id: ${skill.skillId}`);
    }
    ids.add(skill.skillId);
  }

  return skills;
}

function registryCandidates(): string[] {
  const configured = process.env.MCF_SKILL_REGISTRY_PATH;
  const candidates = [
    configured,
    resolve(process.cwd(), 'skills/registry.yaml'),
    resolve(process.cwd(), '../../skills/registry.yaml'),
    resolve(process.cwd(), '../../../skills/registry.yaml'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return [
    ...new Set(
      candidates.map((candidate) => (isAbsolute(candidate) ? candidate : resolve(candidate))),
    ),
  ];
}

@Injectable()
export class SkillRegistryLoader {
  private cachedSkills: Map<string, McfSkillDefinition> | null = null;

  async loadAll(): Promise<Map<string, McfSkillDefinition>> {
    if (this.cachedSkills) {
      return this.cachedSkills;
    }

    const failures: string[] = [];
    for (const candidate of registryCandidates()) {
      try {
        const content = await readFile(candidate, 'utf8');
        const parsed = parseMcfSkillRegistry(content);
        if (parsed.length === 0) {
          throw new Error('The registry contains no skills.');
        }
        this.cachedSkills = new Map(parsed.map((skill) => [skill.skillId, skill]));
        return this.cachedSkills;
      } catch (error) {
        failures.push(`${candidate}: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }

    throw new Error(`Unable to load MCF skill registry. ${failures.join(' | ')}`);
  }

  async load(skillId: string): Promise<McfSkillDefinition> {
    const skill = (await this.loadAll()).get(skillId);
    if (!skill) {
      throw new McfSkillNotFoundError(skillId);
    }
    return skill;
  }

  clearCache(): void {
    this.cachedSkills = null;
  }
}
