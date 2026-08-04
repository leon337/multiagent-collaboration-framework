import { Injectable } from '@nestjs/common';
import type {
  McfChatDispatchRequest,
  McfChatPlanStep,
  McfExecutableSkillId,
  McfMissionContract,
  McfRiskClass,
} from '@rsa/contracts';

const skillAgent: Record<McfExecutableSkillId, string> = {
  'MCF-START-MISSION': 'Mestre',
  'MCF-IMPLEMENT-CHANGE': 'Rafael',
  'MCF-RUN-TESTS': 'Renato',
};

const skillHandoff: Record<McfExecutableSkillId, string> = {
  'MCF-START-MISSION': 'Miriam',
  'MCF-IMPLEMENT-CHANGE': 'Vinicius',
  'MCF-RUN-TESTS': 'Emily',
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
  'deploy',
];
const validationTerms = ['testar', 'validar', 'auditar', 'verificar', 'smoke', 'ci'];
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

function inferRisk(objective: string, requested?: McfRiskClass): McfRiskClass {
  const normalized = objective.toLowerCase();
  const inferred = includesAny(normalized, highRiskTerms)
    ? 'C'
    : includesAny(normalized, implementationTerms)
      ? 'B'
      : 'A';

  if (!requested || riskRank[requested] <= riskRank[inferred]) return inferred;
  return requested;
}

function inferSkills(request: McfChatDispatchRequest): McfExecutableSkillId[] {
  if (request.requestedSkills?.length) {
    return unique(['MCF-START-MISSION', ...request.requestedSkills]);
  }

  const normalized = request.objective.toLowerCase();
  if (request.repository || includesAny(normalized, implementationTerms)) {
    return ['MCF-START-MISSION', 'MCF-IMPLEMENT-CHANGE', 'MCF-RUN-TESTS'];
  }
  if (includesAny(normalized, validationTerms)) {
    return ['MCF-START-MISSION', 'MCF-RUN-TESTS'];
  }
  return ['MCF-START-MISSION'];
}

function stepFor(
  skillId: McfExecutableSkillId,
  order: number,
  repository: string | undefined,
): McfChatPlanStep {
  if (skillId === 'MCF-START-MISSION') {
    return {
      order,
      skillId,
      agentId: skillAgent[skillId],
      handoffTo: skillHandoff[skillId],
      toolProvider: 'internal',
      toolOperation: 'create-contract',
      toolResource: 'mcf-chat-bridge',
      state: 'COMPLETED',
      requiredEvidence: ['mission_id', 'phase_id', 'selected_agents', 'acceptance_criteria'],
    };
  }

  return {
    order,
    skillId,
    agentId: skillAgent[skillId],
    handoffTo: skillHandoff[skillId],
    toolProvider: 'github',
    toolOperation: skillId === 'MCF-IMPLEMENT-CHANGE' ? 'code-change' : 'workflow-result',
    toolResource: repository ?? 'repository-not-resolved',
    state: 'READY_EXTERNAL',
    requiredEvidence:
      skillId === 'MCF-IMPLEMENT-CHANGE'
        ? ['changed_files', 'commit_sha', 'test_results']
        : ['commands_or_workflows', 'passed', 'failed', 'logs'],
  };
}

export interface ChatMissionPlan {
  contract: McfMissionContract;
  steps: McfChatPlanStep[];
}

@Injectable()
export class ChatMissionPlanner {
  plan(request: McfChatDispatchRequest): ChatMissionPlan {
    const selectedSkills = inferSkills(request);
    const selectedAgents = unique(
      selectedSkills.flatMap((skill) => [skillAgent[skill], skillHandoff[skill]]),
    );
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
        'fase inicial executada pelo Mestre com recibo interno válido',
        'próximas fases exigem recibos externos verificáveis',
        'Leandro não é selecionado como agente executor',
        'risco solicitado nunca reduz o risco inferido',
      ],
      riskClass: inferRisk(request.objective, request.requestedRiskClass),
      selectedAgents,
      selectedSkills,
      sourceOfTruth,
    };

    return {
      contract,
      steps: selectedSkills.map((skill, index) => stepFor(skill, index + 1, request.repository)),
    };
  }
}
