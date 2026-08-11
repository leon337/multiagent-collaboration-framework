import { Injectable } from '@nestjs/common';
import type {
  McfChatDispatchRequest,
  McfChatPlanStep,
  McfExecutableSkillId,
  McfMissionContract,
  McfRiskClass,
} from '@rsa/contracts';

interface SkillPlanConfig {
  agentId: string;
  handoffTo: string;
  toolProvider: McfChatPlanStep['toolProvider'];
  toolOperation: string;
  internal: boolean;
  requiredEvidence: string[];
}

const skillConfig: Record<McfExecutableSkillId, SkillPlanConfig> = {
  'MCF-START-MISSION': {
    agentId: 'Mestre',
    handoffTo: 'Miriam',
    toolProvider: 'internal',
    toolOperation: 'create-contract',
    internal: true,
    requiredEvidence: ['mission_id', 'phase_id', 'selected_agents', 'acceptance_criteria'],
  },
  'MCF-SELECT-AGENTS': {
    agentId: 'Mestre',
    handoffTo: 'selected_domain_agent',
    toolProvider: 'internal',
    toolOperation: 'inspect-selection',
    internal: true,
    requiredEvidence: ['selection_justifications'],
  },
  'MCF-RECOVER-CONTEXT': {
    agentId: 'Miriam',
    handoffTo: 'Mestre',
    toolProvider: 'internal',
    toolOperation: 'inspect-context',
    internal: false,
    requiredEvidence: ['source_references', 'precedence_decisions', 'contradictions'],
  },
  'MCF-DEFINE-PRODUCT': {
    agentId: 'Leonardo',
    handoffTo: 'Sofia',
    toolProvider: 'internal',
    toolOperation: 'plan-product',
    internal: false,
    requiredEvidence: ['problem_statement', 'requirements', 'acceptance_criteria'],
  },
  'MCF-DESIGN-EXPERIENCE': {
    agentId: 'Evelyn',
    handoffTo: 'Sofia',
    toolProvider: 'internal',
    toolOperation: 'design-experience',
    internal: false,
    requiredEvidence: ['flow_reference', 'screen_reference', 'accessibility_findings'],
  },
  'MCF-DESIGN-ARCHITECTURE': {
    agentId: 'Sofia',
    handoffTo: 'Rafael',
    toolProvider: 'internal',
    toolOperation: 'design-architecture',
    internal: false,
    requiredEvidence: ['architecture_diagram', 'decisions', 'risks'],
  },
  'MCF-IMPLEMENT-CHANGE': {
    agentId: 'Rafael',
    handoffTo: 'Vinicius',
    toolProvider: 'github',
    toolOperation: 'code-change',
    internal: false,
    requiredEvidence: ['changed_files', 'commit_sha', 'test_results'],
  },
  'MCF-REVIEW-CODE': {
    agentId: 'Vinicius',
    handoffTo: 'Rafael',
    toolProvider: 'github',
    toolOperation: 'inspect-code',
    internal: false,
    requiredEvidence: ['reviewed_commit_sha', 'reviewed_files', 'findings', 'verdict'],
  },
  'MCF-RUN-TESTS': {
    agentId: 'Renato',
    handoffTo: 'Emily',
    toolProvider: 'github-actions',
    toolOperation: 'workflow-result',
    internal: false,
    requiredEvidence: ['commands_or_workflows', 'passed', 'failed', 'logs'],
  },
  'MCF-GIT-PR-RELEASE': {
    agentId: 'Gabriel',
    handoffTo: 'Mestre',
    toolProvider: 'github',
    toolOperation: 'pull-request',
    internal: false,
    requiredEvidence: ['branch', 'head_sha', 'pr_number', 'ci_status', 'gate_decision'],
  },
  'MCF-DEPLOY-VALIDATE': {
    agentId: 'Bruno',
    handoffTo: 'Augusto',
    toolProvider: 'render',
    toolOperation: 'deploy-validate',
    internal: false,
    requiredEvidence: ['deployment_id', 'commit_sha', 'smoke_result', 'rollback_state'],
  },
  'MCF-TRACE-MISSION': {
    agentId: 'Augusto',
    handoffTo: 'Beatriz',
    toolProvider: 'internal',
    toolOperation: 'inspect-mission',
    internal: true,
    requiredEvidence: ['chronological_trace', 'handoff_status', 'recovery_status'],
  },
  'MCF-EVALUATE-AGENTS': {
    agentId: 'Beatriz',
    handoffTo: 'Emily',
    toolProvider: 'internal',
    toolOperation: 'inspect-agent-evaluation',
    internal: false,
    requiredEvidence: ['test_cases', 'scores', 'regressions'],
  },
  'MCF-SECURITY-REVIEW': {
    agentId: 'Ricardo',
    handoffTo: 'Emily',
    toolProvider: 'internal',
    toolOperation: 'inspect-security-review',
    internal: false,
    requiredEvidence: ['threats', 'controls', 'residual_risk'],
  },
  'MCF-DEBUG-INCIDENT': {
    agentId: 'Patricia',
    handoffTo: 'Renato',
    toolProvider: 'internal',
    toolOperation: 'inspect-debug-incident',
    internal: false,
    requiredEvidence: ['reproduction', 'root_cause', 'recovery_result'],
  },
};

const riskRank: Record<McfRiskClass, number> = { A: 1, B: 2, C: 3 };

const implementationTerms = [
  'implementar',
  'corrigir',
  'integrar',
  'criar',
  'adicionar',
  'alterar',
  'refatorar',
];
const validationTerms = ['testar', 'validar', 'auditar', 'verificar', 'smoke', 'ci'];
const evaluationTerms = [
  'avaliar agentes',
  'avaliar agente',
  'benchmark',
  'regressão de prompt',
  'regressao de prompt',
  'scorecard',
];
const debugTerms = [
  'debug',
  'debugar',
  'debugue',
  'diagnosticar incidente',
  'diagnostico de incidente',
  'diagnóstico de incidente',
  'incidente',
  'incident',
  'root cause',
  'causa raiz',
  'reproduzir falha',
  'investigar erro',
];
const securityTerms = [
  'revisão de segurança',
  'revisao de seguranca',
  'security review',
  'threat model',
  'ameaça',
  'ameaca',
  'ameaças',
  'ameacas',
  'permissões',
  'permissoes',
  'privacidade',
  'compliance',
];
const deploymentTerms = ['deploy', 'publicar', 'ambiente', 'rollback', 'produção', 'production'];
const highRiskTerms = [
  'produção',
  'production',
  'segredo',
  'secret',
  'deletar',
  'excluir',
  'drop',
  'pagamento',
  'cobrança',
  'publicar',
];

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function titleFromObjective(objective: string): string {
  const compact = objective.replace(/\s+/gu, ' ').trim();
  return compact.length <= 120 ? compact : `${compact.slice(0, 117)}...`;
}

function inferRisk(
  objective: string,
  selectedSkills: McfExecutableSkillId[],
  requested?: McfRiskClass,
): McfRiskClass {
  const normalized = objective.toLowerCase();
  const inferred =
    selectedSkills.includes('MCF-SECURITY-REVIEW') || includesAny(normalized, highRiskTerms)
      ? 'C'
      : includesAny(normalized, implementationTerms)
        ? 'B'
        : 'A';

  if (!requested || riskRank[requested] <= riskRank[inferred]) return inferred;
  return requested;
}

function inferSkills(request: McfChatDispatchRequest): McfExecutableSkillId[] {
  if (request.requestedSkills?.length) {
    return unique([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      ...request.requestedSkills,
      'MCF-TRACE-MISSION',
    ]);
  }

  const normalized = request.objective.toLowerCase();
  if (includesAny(normalized, debugTerms)) {
    return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-DEBUG-INCIDENT', 'MCF-TRACE-MISSION'];
  }
  if (includesAny(normalized, securityTerms)) {
    return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-SECURITY-REVIEW', 'MCF-TRACE-MISSION'];
  }
  if (includesAny(normalized, evaluationTerms)) {
    return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-EVALUATE-AGENTS', 'MCF-TRACE-MISSION'];
  }
  if (includesAny(normalized, deploymentTerms)) {
    return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-DEPLOY-VALIDATE', 'MCF-TRACE-MISSION'];
  }
  if (request.repository || includesAny(normalized, implementationTerms)) {
    return [
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-IMPLEMENT-CHANGE',
      'MCF-REVIEW-CODE',
      'MCF-RUN-TESTS',
      'MCF-GIT-PR-RELEASE',
      'MCF-TRACE-MISSION',
    ];
  }
  if (includesAny(normalized, validationTerms)) {
    return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-RUN-TESTS', 'MCF-TRACE-MISSION'];
  }
  return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-TRACE-MISSION'];
}

function resourceFor(skillId: McfExecutableSkillId, repository: string | undefined): string {
  const config = skillConfig[skillId];
  if (config.toolProvider === 'internal') {
    if (skillId === 'MCF-TRACE-MISSION') return 'mcf-mission-timeline';
    return config.internal ? 'mcf-chat-bridge' : 'mcf-agent-runtime';
  }
  if (skillId === 'MCF-DEPLOY-VALIDATE') {
    return repository ?? 'deployment-target-not-resolved';
  }
  return repository ?? 'repository-not-resolved';
}

function buildSteps(
  selectedSkills: McfExecutableSkillId[],
  repository: string | undefined,
): McfChatPlanStep[] {
  return selectedSkills.map((skillId, index) => {
    const config = skillConfig[skillId];
    const nextSkill = selectedSkills[index + 1];
    const handoffTo =
      config.handoffTo === 'selected_domain_agent' && nextSkill
        ? skillConfig[nextSkill].agentId
        : config.handoffTo;
    const state: McfChatPlanStep['state'] = config.internal
      ? 'PLANNED_INTERNAL'
      : config.toolProvider === 'internal'
        ? 'READY_AGENT'
        : 'READY_EXTERNAL';

    return {
      order: index + 1,
      skillId,
      agentId: config.agentId,
      handoffTo,
      toolProvider: config.toolProvider,
      toolOperation: config.toolOperation,
      toolResource: resourceFor(skillId, repository),
      state,
      requiredEvidence: config.requiredEvidence,
    };
  });
}

export interface ChatMissionPlan {
  contract: McfMissionContract;
  steps: McfChatPlanStep[];
}

@Injectable()
export class ChatMissionPlanner {
  plan(request: McfChatDispatchRequest): ChatMissionPlan {
    const selectedSkills = inferSkills(request);
    const steps = buildSteps(selectedSkills, request.repository);
    const selectedAgents = unique(steps.flatMap((step) => [step.agentId, step.handoffTo]));
    const sourceOfTruth = unique([
      'chat-objective',
      ...(request.repository ? [request.repository] : []),
      ...(request.sourceOfTruth ?? []),
    ]);

    const contract: McfMissionContract = {
      title: titleFromObjective(request.objective),
      objective: request.objective.trim(),
      expectedOutcome:
        request.expectedOutcome?.trim() ||
        'Objetivo executado com evidências verificáveis, passagens registradas e nenhuma operação técnica delegada a Leandro.',
      scope: unique([
        'chat-to-runtime-bridge',
        ...(request.repository ? [`repository:${request.repository}`] : []),
      ]),
      outOfScope: [
        'public-release-without-gate',
        'destructive-action-without-backup',
        'human-as-technical-operator',
        'fabricated-tool-evidence',
      ],
      acceptanceCriteria: [
        'missão persistida com identificador recuperável',
        'bloco interno inicial executado com recibos válidos',
        'fases externas exigem recibos específicos por skill',
        'Leandro não é selecionado como agente executor',
        'risco solicitado nunca reduz o risco inferido',
      ],
      riskClass: inferRisk(request.objective, selectedSkills, request.requestedRiskClass),
      selectedAgents,
      selectedSkills,
      sourceOfTruth,
    };

    return { contract, steps };
  }
}
