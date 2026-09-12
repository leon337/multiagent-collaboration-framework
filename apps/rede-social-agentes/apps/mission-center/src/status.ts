export interface MissionEvidenceRef {
  type: string;
  value: string;
}

export interface MissionStage {
  id: string;
  label: string;
  status: string;
  decision?: string;
  evidence: MissionEvidenceRef[];
}

export interface MissionStatusSnapshot {
  schemaVersion: 1;
  missionId: string;
  title: string;
  state: string;
  deadline: string;
  humanAuthority: string;
  orchestrator: string;
  currentStage: { id: string; label: string; status: string };
  stages: MissionStage[];
  lastAction: {
    at: string;
    executor: string;
    summary: string;
    evidence: MissionEvidenceRef[];
  };
  blockers: string[];
  nextStep: string;
  humanGates: Record<string, string>;
  updatedAt: string;
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function isoDateTime(value: unknown, path: string): string {
  const parsed = text(value, path);
  if (Number.isNaN(Date.parse(parsed))) throw new Error(`${path} must be an ISO date-time`);
  return parsed;
}

function evidenceList(value: unknown, path: string): MissionEvidenceRef[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((entry, index) => {
    const item = record(entry, `${path}[${index}]`);
    return {
      type: text(item.type, `${path}[${index}].type`),
      value: text(item.value, `${path}[${index}].value`),
    };
  });
}

function stageId(value: unknown, path: string): string {
  const parsed = text(value, path);
  if (!/^G(?:10|[0-9])$/u.test(parsed)) throw new Error(`${path} has an invalid stage id`);
  return parsed;
}

export function parseMissionStatus(value: unknown): MissionStatusSnapshot {
  const root = record(value, 'mission');
  if (root.schemaVersion !== 1) throw new Error('schemaVersion must equal 1');

  const current = record(root.currentStage, 'currentStage');
  const currentStage = {
    id: stageId(current.id, 'currentStage.id'),
    label: text(current.label, 'currentStage.label'),
    status: text(current.status, 'currentStage.status'),
  };

  if (!Array.isArray(root.stages) || root.stages.length === 0) {
    throw new Error('stages must be a non-empty array');
  }

  const seen = new Set<string>();
  const stages = root.stages.map((entry, index): MissionStage => {
    const item = record(entry, `stages[${index}]`);
    const id = stageId(item.id, `stages[${index}].id`);
    if (seen.has(id)) throw new Error(`duplicate stage id: ${id}`);
    seen.add(id);
    const status = text(item.status, `stages[${index}].status`);
    const evidence = evidenceList(item.evidence, `stages[${index}].evidence`);
    if (status === 'ENTREGUE' && evidence.length === 0) {
      throw new Error(`stage ${id} is ENTREGUE but has no evidence`);
    }
    return {
      id,
      label: text(item.label, `stages[${index}].label`),
      status,
      ...(typeof item.decision === 'string' && item.decision.length > 0
        ? { decision: item.decision }
        : {}),
      evidence,
    };
  });

  if (!seen.has(currentStage.id)) {
    throw new Error(`currentStage ${currentStage.id} is not present in stages`);
  }

  const last = record(root.lastAction, 'lastAction');
  const lastEvidence = evidenceList(last.evidence, 'lastAction.evidence');
  if (lastEvidence.length === 0) throw new Error('lastAction must contain evidence');

  if (!Array.isArray(root.blockers) || !root.blockers.every((entry) => typeof entry === 'string')) {
    throw new Error('blockers must be an array of strings');
  }

  const gatesRecord = record(root.humanGates, 'humanGates');
  const humanGates: Record<string, string> = {};
  for (const [key, gateValue] of Object.entries(gatesRecord)) {
    humanGates[key] = text(gateValue, `humanGates.${key}`);
  }

  return {
    schemaVersion: 1,
    missionId: text(root.missionId, 'missionId'),
    title: text(root.title, 'title'),
    state: text(root.state, 'state'),
    deadline: text(root.deadline, 'deadline'),
    humanAuthority: text(root.humanAuthority, 'humanAuthority'),
    orchestrator: text(root.orchestrator, 'orchestrator'),
    currentStage,
    stages,
    lastAction: {
      at: isoDateTime(last.at, 'lastAction.at'),
      executor: text(last.executor, 'lastAction.executor'),
      summary: text(last.summary, 'lastAction.summary'),
      evidence: lastEvidence,
    },
    blockers: root.blockers as string[],
    nextStep: text(root.nextStep, 'nextStep'),
    humanGates,
    updatedAt: isoDateTime(root.updatedAt, 'updatedAt'),
  };
}
