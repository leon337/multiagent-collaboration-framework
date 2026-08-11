from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    target.write_text(text.replace(old, new, 1))


evidence = "apps/rede-social-agentes/apps/server/src/mcf-runtime/internal-skill-evidence.ts"
replace_once(
    evidence,
    """  requireCloseString(value, 'next_action', 'MCF-CLOSE-PHASE leo_decision requires next_action');
  requireCloseString(value, 'responsible', 'MCF-CLOSE-PHASE leo_decision requires responsible');
  return value;
""",
    """  requireCloseString(value, 'next_action', 'MCF-CLOSE-PHASE leo_decision requires next_action');
  const responsible = requireCloseString(
    value,
    'responsible',
    'MCF-CLOSE-PHASE leo_decision requires responsible',
  );
  const responsibleIsLeandro = responsible.trim().toLowerCase() === 'leandro';
  if (responsibleIsLeandro && decision !== 'ESCALAR_PARA_LEANDRO') {
    return reject(
      'MCF-CLOSE-PHASE cannot assign Leandro as technical responsible without an explicit HUMAN_GATE escalation decision',
    );
  }
  if (decision === 'ESCALAR_PARA_LEANDRO' && !responsibleIsLeandro) {
    return reject('MCF-CLOSE-PHASE ESCALAR_PARA_LEANDRO must identify Leandro as responsible');
  }
  return value;
""",
)
replace_once(
    evidence,
    """      const nextState = String(leoDecision.next_state).trim().toUpperCase();
      const finalState = String(checkpoint.final_state).trim().toUpperCase();
      if (nextState !== finalState) {
""",
    """      const nextState = String(leoDecision.next_state).trim().toUpperCase();
      const finalState = String(checkpoint.final_state).trim().toUpperCase();
      const auditBlockingFindings = auditVerdict.blocking_findings as unknown[];
      const normalizedAuditVerdict = String(auditVerdict.verdict).trim().toUpperCase();
      if (nextState !== finalState) {
""",
)
replace_once(
    evidence,
    """      if (
        finalState === 'ENTREGUE' &&
        !['APROVAR', 'APROVAR_COM_RESSALVAS'].includes(
          String(leoDecision.decision).trim().toUpperCase(),
        )
      ) {
        return reject('MCF-CLOSE-PHASE ENTREGUE requires an approving Léo decision');
      }
""",
    """      if (finalState === 'ENTREGUE' && auditBlockingFindings.length > 0) {
        return reject('MCF-CLOSE-PHASE cannot mark ENTREGUE with blocking audit findings');
      }
      if (finalState === 'ENTREGUE' && !['PASS', 'PASSED'].includes(normalizedAuditVerdict)) {
        return reject('MCF-CLOSE-PHASE ENTREGUE requires a passing independent audit verdict');
      }
      if (
        finalState === 'ENTREGUE' &&
        !['APROVAR', 'APROVAR_COM_RESSALVAS'].includes(
          String(leoDecision.decision).trim().toUpperCase(),
        )
      ) {
        return reject('MCF-CLOSE-PHASE ENTREGUE requires an approving Léo decision');
      }
""",
)

test = "apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor-lot4-close-phase.test.ts"
marker = """    [
      'non-approving delivered decision',
"""
addition = """    [
      'blocking audit finding disguised as delivered',
      {
        ...validEvidence(),
        audit_verdict: {
          ...(validEvidence().audit_verdict as Record<string, unknown>),
          blocking_findings: ['P1 open'],
        },
      },
    ],
    [
      'non-passing audit verdict disguised as delivered',
      {
        ...validEvidence(),
        audit_verdict: {
          ...(validEvidence().audit_verdict as Record<string, unknown>),
          verdict: 'FAIL',
        },
      },
    ],
    [
      'Leandro assigned as technical responsible without escalation',
      {
        ...validEvidence(),
        leo_decision: {
          ...(validEvidence().leo_decision as Record<string, unknown>),
          responsible: 'Leandro',
        },
      },
    ],
"""
replace_once(test, marker, addition + marker)
