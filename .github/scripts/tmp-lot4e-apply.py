from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old!r}")
    target.write_text(text.replace(old, new, 1))


def replace_n(path: str, old: str, new: str, expected: int) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{path}: expected {expected} matches, found {count}: {old!r}")
    target.write_text(text.replace(old, new))


contracts = "apps/rede-social-agentes/packages/contracts/src/mcf-runtime.ts"
replace_once(
    contracts,
    "  | 'MCF-DEBUG-INCIDENT';",
    "  | 'MCF-DEBUG-INCIDENT'\n  | 'MCF-CLOSE-PHASE';",
)

executor = "apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor.ts"
replace_n(
    executor,
    "  'MCF-DEBUG-INCIDENT',\n]);",
    "  'MCF-DEBUG-INCIDENT',\n  'MCF-CLOSE-PHASE',\n]);",
    2,
)

evidence = "apps/rede-social-agentes/apps/server/src/mcf-runtime/internal-skill-evidence.ts"
replace_once(
    evidence,
    "  'MCF-DEBUG-INCIDENT',\n]);",
    "  'MCF-DEBUG-INCIDENT',\n  'MCF-CLOSE-PHASE',\n]);",
)

close_helpers = r'''
const closeoutFinalStates = new Set([
  'ENTREGUE',
  'AGUARDANDO_DEPENDENCIA_EXTERNA',
  'BLOQUEADO_POR_RISCO',
  'CANCELADO_PELA_AUTORIDADE',
]);

const closeoutDecisions = new Set([
  'APROVAR',
  'APROVAR_COM_RESSALVAS',
  'RETORNAR_PARA_CORRECAO',
  'AMPLIAR_EQUIPE',
  'REDUZIR_EQUIPE',
  'BLOQUEAR',
  'ESCALAR_PARA_LEANDRO',
]);

function requireCloseString(
  record: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = record[key];
  if (!isMeaningfulDebugString(value)) return reject(message);
  return value.trim();
}

function requireCloseArray(
  record: Record<string, unknown>,
  key: string,
  message: string,
  allowEmpty = false,
): unknown[] {
  const value = record[key];
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) return reject(message);
  if (value.some((item) => !hasMeaningfulDebugValue(item))) return reject(message);
  return value;
}

function requireClosePhasePack(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  requireCloseArray(
    value,
    'artifacts',
    'MCF-CLOSE-PHASE phase_pack requires non-empty artifact references',
  );
  requireCloseString(
    value,
    'manifest_reference',
    'MCF-CLOSE-PHASE phase_pack requires a manifest_reference',
  );
  if (value.traceability_complete !== true) {
    return reject('MCF-CLOSE-PHASE phase_pack requires traceability_complete=true');
  }
  return value;
}

function requireCloseAuditVerdict(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  requireCloseString(value, 'verdict', 'MCF-CLOSE-PHASE audit_verdict requires a verdict');
  requireCloseString(
    value,
    'evidence_reference',
    'MCF-CLOSE-PHASE audit_verdict requires evidence_reference',
  );
  requireCloseArray(
    value,
    'blocking_findings',
    'MCF-CLOSE-PHASE audit_verdict requires blocking_findings, even when empty',
    true,
  );
  return value;
}

function requireCloseLeoDecision(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  const decision = requireCloseString(
    value,
    'decision',
    'MCF-CLOSE-PHASE leo_decision requires an explicit decision',
  ).toUpperCase();
  if (!closeoutDecisions.has(decision)) {
    return reject('MCF-CLOSE-PHASE leo_decision is not a canonical Léo gate decision');
  }
  requireCloseString(
    value,
    'justification',
    'MCF-CLOSE-PHASE leo_decision requires justification',
  );
  const nextState = requireCloseString(
    value,
    'next_state',
    'MCF-CLOSE-PHASE leo_decision requires next_state',
  ).toUpperCase();
  if (!closeoutFinalStates.has(nextState)) {
    return reject('MCF-CLOSE-PHASE leo_decision next_state must be a canonical terminal state');
  }
  requireCloseString(value, 'next_action', 'MCF-CLOSE-PHASE leo_decision requires next_action');
  requireCloseString(value, 'responsible', 'MCF-CLOSE-PHASE leo_decision requires responsible');
  return value;
}

function requireCloseCheckpoint(
  record: Record<string, unknown>,
  key: string,
  message: string,
): Record<string, unknown> {
  const value = asRecord(record[key], message);
  const finalState = requireCloseString(
    value,
    'final_state',
    'MCF-CLOSE-PHASE checkpoint requires final_state',
  ).toUpperCase();
  if (!closeoutFinalStates.has(finalState)) {
    return reject('MCF-CLOSE-PHASE checkpoint final_state must be canonical');
  }
  if (typeof value.objective_met !== 'boolean') {
    return reject('MCF-CLOSE-PHASE checkpoint requires objective_met boolean evidence');
  }
  const unresolved = requireCloseArray(
    value,
    'unresolved_findings',
    'MCF-CLOSE-PHASE checkpoint requires unresolved_findings, even when empty',
    true,
  );
  const blockers = requireCloseArray(
    value,
    'blockers',
    'MCF-CLOSE-PHASE checkpoint requires blockers, even when empty',
    true,
  );
  const nextAction = requireCloseString(
    value,
    'next_action',
    'MCF-CLOSE-PHASE checkpoint requires next_action',
  );
  const recipient = requireCloseString(
    value,
    'checkpoint_recipient',
    'MCF-CLOSE-PHASE checkpoint requires checkpoint_recipient',
  );
  if (recipient.trim().toLowerCase() !== 'mestre') {
    return reject(
      'MCF-CLOSE-PHASE checkpoint_recipient must be Mestre; Leandro is not a technical handoff target',
    );
  }
  if (typeof value.human_action_required !== 'boolean') {
    return reject('MCF-CLOSE-PHASE checkpoint requires human_action_required boolean evidence');
  }
  if (finalState === 'ENTREGUE') {
    const normalizedAction = nextAction.trim().toLowerCase();
    if (value.objective_met !== true) {
      return reject('MCF-CLOSE-PHASE cannot mark ENTREGUE when objective_met is false');
    }
    if (unresolved.length > 0 || blockers.length > 0) {
      return reject(
        'MCF-CLOSE-PHASE cannot mark ENTREGUE with unresolved findings or blockers',
      );
    }
    if (!['nenhuma', 'none'].includes(normalizedAction)) {
      return reject('MCF-CLOSE-PHASE cannot mark ENTREGUE with a pending next_action');
    }
    if (value.human_action_required !== false) {
      return reject('MCF-CLOSE-PHASE ENTREGUE requires human_action_required=false');
    }
  }
  return value;
}

'''
replace_once(evidence, "function validateEvidence(\n", close_helpers + "function validateEvidence(\n")

close_case = r'''    case 'MCF-CLOSE-PHASE': {
      const phasePack = requireClosePhasePack(
        evidence,
        'phase_pack',
        'MCF-CLOSE-PHASE requires structured phase_pack evidence',
      );
      const auditVerdict = requireCloseAuditVerdict(
        evidence,
        'audit_verdict',
        'MCF-CLOSE-PHASE requires structured audit_verdict evidence',
      );
      const leoDecision = requireCloseLeoDecision(
        evidence,
        'leo_decision',
        'MCF-CLOSE-PHASE requires structured leo_decision evidence',
      );
      const checkpoint = requireCloseCheckpoint(
        evidence,
        'checkpoint',
        'MCF-CLOSE-PHASE requires structured checkpoint evidence',
      );
      const nextState = String(leoDecision.next_state).trim().toUpperCase();
      const finalState = String(checkpoint.final_state).trim().toUpperCase();
      if (nextState !== finalState) {
        return reject(
          'MCF-CLOSE-PHASE leo_decision.next_state must match checkpoint.final_state',
        );
      }
      if (
        finalState === 'ENTREGUE' &&
        !['APROVAR', 'APROVAR_COM_RESSALVAS'].includes(
          String(leoDecision.decision).trim().toUpperCase(),
        )
      ) {
        return reject('MCF-CLOSE-PHASE ENTREGUE requires an approving Léo decision');
      }
      return {
        phase_pack: phasePack,
        audit_verdict: auditVerdict,
        leo_decision: leoDecision,
        checkpoint,
      };
    }
'''
replace_once(
    evidence,
    "    default:\n      return evidence;\n",
    close_case + "    default:\n      return evidence;\n",
)

planner = "apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-mission-planner.ts"
debug_config = """  'MCF-DEBUG-INCIDENT': {
    agentId: 'Patricia',
    handoffTo: 'Renato',
    toolProvider: 'internal',
    toolOperation: 'inspect-debug-incident',
    internal: false,
    requiredEvidence: ['reproduction', 'root_cause', 'recovery_result'],
  },
"""
close_config = """  'MCF-CLOSE-PHASE': {
    agentId: 'Carmem',
    handoffTo: 'Mestre',
    toolProvider: 'internal',
    toolOperation: 'close-phase',
    internal: false,
    requiredEvidence: ['phase_pack', 'audit_verdict', 'leo_decision', 'checkpoint'],
  },
"""
replace_once(planner, debug_config, debug_config + close_config)
replace_once(
    planner,
    "const debugTerms = [\n",
    "const closePhaseTerms = [\n  'fechar fase',\n  'concluir fase',\n  'encerrar fase',\n  'close phase',\n  'phase closeout',\n  'gerar rastreabilidade',\n];\nconst debugTerms = [\n",
)
replace_once(
    planner,
    "    selectedSkills.includes('MCF-SECURITY-REVIEW') || includesAny(normalized, highRiskTerms)",
    "    selectedSkills.includes('MCF-SECURITY-REVIEW') ||\n    selectedSkills.includes('MCF-CLOSE-PHASE') ||\n    includesAny(normalized, highRiskTerms)",
)
replace_once(
    planner,
    "  const normalized = request.objective.toLowerCase();\n  if (includesAny(normalized, debugTerms)) {",
    "  const normalized = request.objective.toLowerCase();\n  if (includesAny(normalized, closePhaseTerms)) {\n    return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-CLOSE-PHASE', 'MCF-TRACE-MISSION'];\n  }\n  if (includesAny(normalized, debugTerms)) {",
)

permissions = "apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.ts"
close_boundary = r'''
const closePhaseForbiddenInputs = new Set([
  'external-write',
  'github-write',
  'github-provider-write',
  'environment-mutation',
  'deploy',
  'production-action',
  'destructive-action',
  'secret-access',
  'public-action',
  'human-as-technical-operator',
]);

function requestsForbiddenClosePhaseAction(inputs: Record<string, unknown>): string | null {
  for (const [rawKey, value] of Object.entries(inputs)) {
    const key = canonicalizeToolValue(rawKey);
    if (!closePhaseForbiddenInputs.has(key)) continue;
    if (value === undefined || value === null || value === false) continue;
    return key;
  }
  return null;
}

function assertClosePhaseBoundary(
  skill: McfSkillDefinition,
  provider: string,
  operation: string,
  resource: string,
  inputs: Record<string, unknown>,
): void {
  if (skill.skillId !== 'MCF-CLOSE-PHASE') return;
  if (skill.permissionProfile !== 'SCOPED_WRITE') {
    throw new McfPermissionDeniedError(
      'MCF-CLOSE-PHASE must preserve the canonical SCOPED_WRITE permission profile',
    );
  }
  if (provider !== 'internal') {
    throw new McfPermissionDeniedError(
      'MCF-CLOSE-PHASE is restricted to the internal provider in Lot 4E',
    );
  }
  if (operation !== 'close-phase') {
    throw new McfPermissionDeniedError('MCF-CLOSE-PHASE permits only close-phase in Lot 4E');
  }
  if (resource !== 'mcf-agent-runtime') {
    throw new McfPermissionDeniedError(
      'MCF-CLOSE-PHASE is restricted to mcf-agent-runtime in Lot 4E',
    );
  }
  const forbiddenInput = requestsForbiddenClosePhaseAction(inputs);
  if (forbiddenInput) {
    throw new McfPermissionDeniedError(
      `MCF-CLOSE-PHASE forbids ${forbiddenInput} in the Lot 4E internal-only boundary`,
    );
  }
}

'''
replace_once(
    permissions,
    "const readOperations = ['read', 'get', 'list', 'search', 'inspect', 'status', 'fetch'];\n",
    close_boundary
    + "const readOperations = ['read', 'get', 'list', 'search', 'inspect', 'status', 'fetch'];\n",
)
replace_once(
    permissions,
    "    assertDebugIncidentBoundary(skill, provider, operation, resource, inputs);\n",
    "    assertDebugIncidentBoundary(skill, provider, operation, resource, inputs);\n"
    "    assertClosePhaseBoundary(skill, provider, operation, resource, inputs);\n",
)

registry = "skills/registry.yaml"
replace_once(registry, "    handoff_to: Leandro\n", "    handoff_to: Mestre\n")
