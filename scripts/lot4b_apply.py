from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f"expected text not found in {path}: {old[:100]!r}")
    target.write_text(text.replace(old, new, 1))


contracts = "apps/rede-social-agentes/packages/contracts/src/mcf-runtime.ts"
replace_once(
    contracts,
    "  | 'MCF-TRACE-MISSION';",
    "  | 'MCF-TRACE-MISSION'\n  | 'MCF-EVALUATE-AGENTS';",
)

planner = "apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-mission-planner.ts"
replace_once(
    planner,
    """  'MCF-TRACE-MISSION': {
    agentId: 'Augusto',
    handoffTo: 'Beatriz',
    toolProvider: 'internal',
    toolOperation: 'inspect-mission',
    internal: true,
    requiredEvidence: ['chronological_trace', 'handoff_status', 'recovery_status'],
  },
};""",
    """  'MCF-TRACE-MISSION': {
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
    toolOperation: 'evaluate-agents',
    internal: false,
    requiredEvidence: ['test_cases', 'scores', 'regressions'],
  },
};""",
)
replace_once(
    planner,
    "const validationTerms = ['testar', 'validar', 'auditar', 'verificar', 'smoke', 'ci'];",
    """const validationTerms = ['testar', 'validar', 'auditar', 'verificar', 'smoke', 'ci'];
const evaluationTerms = [
  'avaliar agentes',
  'avaliar agente',
  'benchmark',
  'regressão de prompt',
  'regressao de prompt',
  'scorecard',
];""",
)
replace_once(
    planner,
    "  const normalized = request.objective.toLowerCase();\n  if (includesAny(normalized, deploymentTerms)) {",
    """  const normalized = request.objective.toLowerCase();
  if (includesAny(normalized, evaluationTerms)) {
    return [
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-EVALUATE-AGENTS',
      'MCF-TRACE-MISSION',
    ];
  }
  if (includesAny(normalized, deploymentTerms)) {""",
)

executor = "apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor.ts"
replace_once(
    executor,
    "  'MCF-TRACE-MISSION',\n]);",
    "  'MCF-TRACE-MISSION',\n  'MCF-EVALUATE-AGENTS',\n]);",
)
replace_once(
    executor,
    "  'MCF-TRACE-MISSION',\n]);\n\ntype CiQueryConclusion",
    "  'MCF-TRACE-MISSION',\n  'MCF-EVALUATE-AGENTS',\n]);\n\ntype CiQueryConclusion",
)
replace_once(
    executor,
    "`${skill.skillId} Lot 4A execution is restricted to the governed internal provider`,",
    "`${skill.skillId} governed execution is restricted to the internal provider`,",
)

evidence = "apps/rede-social-agentes/apps/server/src/mcf-runtime/internal-skill-evidence.ts"
replace_once(
    evidence,
    "  'MCF-DESIGN-ARCHITECTURE',\n]);",
    "  'MCF-DESIGN-ARCHITECTURE',\n  'MCF-EVALUATE-AGENTS',\n]);",
)
replace_once(
    evidence,
    """function requireReference(
  record: Record<string, unknown>,
  key: string,
  message: string,
): string | Record<string, unknown> {""",
    """function isMeaningfulScoreValue(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return false;
}

function requireScores(
  record: Record<string, unknown>,
  key: string,
  message: string,
): unknown[] | Record<string, unknown> {
  const value = record[key];
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every(isMeaningfulScoreValue)) return value;
    return reject(message);
  }
  if (typeof value === 'object' && value !== null) {
    const scores = value as Record<string, unknown>;
    const entries = Object.entries(scores);
    if (entries.length > 0 && entries.every(([, score]) => isMeaningfulScoreValue(score))) {
      return scores;
    }
  }
  return reject(message);
}

function requireReference(
  record: Record<string, unknown>,
  key: string,
  message: string,
): string | Record<string, unknown> {""",
)
replace_once(
    evidence,
    "    default:\n      return evidence;",
    """    case 'MCF-EVALUATE-AGENTS':
      return {
        test_cases: requireArray(
          evidence,
          'test_cases',
          'MCF-EVALUATE-AGENTS requires non-empty test_cases evidence',
        ),
        scores: requireScores(
          evidence,
          'scores',
          'MCF-EVALUATE-AGENTS requires non-empty scores evidence',
        ),
        regressions: requireArray(
          evidence,
          'regressions',
          'MCF-EVALUATE-AGENTS requires regressions evidence, even when empty',
          { allowEmpty: true },
        ),
      };
    default:
      return evidence;""",
)
replace_once(
    evidence,
    "reject(`${skill.skillId} Lot 4A execution requires the governed internal provider`);",
    "reject(`${skill.skillId} governed execution requires the internal provider`);",
)
