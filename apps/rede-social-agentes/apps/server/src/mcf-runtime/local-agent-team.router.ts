import { McfPermissionDeniedError } from './mcf-runtime.errors.js';

export const LOCAL_AGENT_TEAM_PROVIDER = 'local-agent-runtime';
export const LOCAL_AGENT_TEAM_OPERATION = 'execute-agent-team';
export const LOCAL_AGENT_TEAM_RESOURCE = 'mcf-agent-runtime';

export const LOCAL_AGENT_TEAM_AGENTS = [
  'Sofia',
  'Beatriz',
  'Emily',
  'Carmem',
  'Bruno',
  'Gabriel',
  'Ricardo',
  'Renato',
] as const;

export type LocalAgentTeamAgent = (typeof LOCAL_AGENT_TEAM_AGENTS)[number];

export interface LocalAgentProfile {
  agentId: LocalAgentTeamAgent;
  role: string;
  domains: readonly string[];
  focus: readonly string[];
}
const profiles: readonly LocalAgentProfile[] = [
  {
    agentId: 'Sofia',
    role: 'Arquitetura de Software',
    domains: ['arquitetura', 'componentes', 'interface', 'boundary', 'handoff'],
    focus: ['arquitetura', 'contratos', 'boundaries', 'handoffs'],
  },
  {
    agentId: 'Beatriz',
    role: 'Avaliação de Agentes',
    domains: ['avaliacao', 'evidencia', 'criterios', 'metricas', 'validacao', 'falso positivo'],
    focus: ['claims', 'evidências', 'critérios', 'falsos positivos'],
  },
  {
    agentId: 'Emily',
    role: 'Auditoria Independente',
    domains: ['auditoria', 'governanca', 'compliance', 'receipt', 'risco', 'limites'],
    focus: ['governança', 'limites', 'rastreabilidade', 'non-claims'],
  },
  {
    agentId: 'Carmem',
    role: 'Documentação Técnica',
    domains: ['documentacao', 'continuidade', 'checkpoint', 'registro', 'contexto'],
    focus: ['documentação', 'continuidade', 'checkpoint', 'rastreabilidade'],
  },
  {
    agentId: 'Bruno',
    role: 'Plataforma, DevOps e SRE',
    domains: ['infra', 'vercel', 'render', 'vps', 'deploy', 'container', 'rede'],
    focus: ['runtime', 'infraestrutura', 'deploy boundary', 'recursos'],
  },
  {
    agentId: 'Gabriel',
    role: 'Integração, Versionamento e Release',
    domains: ['github', 'git', 'pr', 'issue', 'branch', 'commit', 'webhook', 'release'],
    focus: ['branch', 'PR/Issue', 'webhook', 'release/commit'],
  },
  {
    agentId: 'Ricardo',
    role: 'Segurança',
    domains: ['seguranca', 'security', 'permissao', 'permissoes', 'secret', 'token', 'autorizacao'],
    focus: ['permissões', 'segredos', 'trust boundary', 'autorização'],
  },
  {
    agentId: 'Renato',
    role: 'Qualidade e Testes',
    domains: ['qa', 'teste', 'testes', 'quality', 'dod', 'regressao', 'validacao'],
    focus: ['testes', 'regressão', 'DoD', 'evidência de PASS'],
  },
];

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}
export function isLocalAgentTeamAgent(value: string): value is LocalAgentTeamAgent {
  return (LOCAL_AGENT_TEAM_AGENTS as readonly string[]).includes(value);
}

export function selectLocalAgentTeam(objective: string): LocalAgentTeamAgent[] {
  const normalized = fold(objective);
  if (!normalized) {
    throw new McfPermissionDeniedError('local agent team objective must be non-empty');
  }

  const forceAllTerms = [
    'todos os agentes',
    '8 agentes',
    'oito agentes',
    'capacidade total',
    'forced all',
  ];
  if (forceAllTerms.some((term) => normalized.includes(term))) {
    return [...LOCAL_AGENT_TEAM_AGENTS];
  }

  const scored = profiles
    .map((profile) => ({
      agentId: profile.agentId,
      score: profile.domains.filter((term) => normalized.includes(fold(term))).length,
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.agentId.localeCompare(right.agentId, 'pt-BR'),
    );

  const selected = scored.map((candidate) => candidate.agentId);
  if (selected.length === 0) return ['Beatriz'];
  if (selected.length > 1 && !selected.includes('Beatriz')) selected.push('Beatriz');
  return selected.slice(0, LOCAL_AGENT_TEAM_AGENTS.length);
}

export function localAgentProfile(agentId: LocalAgentTeamAgent): LocalAgentProfile {
  const profile = profiles.find((candidate) => candidate.agentId === agentId);
  if (!profile) {
    throw new McfPermissionDeniedError(`unknown local agent team member: ${agentId}`);
  }
  return profile;
}
export function assertLocalAgentTeamWithinMission(
  objective: string,
  missionAgents: readonly string[],
): LocalAgentTeamAgent[] {
  const selected = selectLocalAgentTeam(objective);
  const missing = selected.filter((agentId) => !missionAgents.includes(agentId));
  if (missing.length > 0) {
    throw new McfPermissionDeniedError(
      `local agent team members were not selected by mission contract: ${missing.join(', ')}`,
    );
  }
  return selected;
}
