# PHASE-006-LOT-4-B-EVALUATE-AGENTS

PRF Classe C para a conversão de `MCF-EVALUATE-AGENTS` em capacidade executável do MCF Runtime.

## Estado
`CANDIDATE_READY_FOR_EXACT_HEAD_VALIDATION`

A presença destes artefatos não significa PASS final, aprovação de Léo, merge ou conclusão da fase.

## Contrato
- owners: Beatriz, Tiago;
- permission: READ_ONLY;
- planner: READY_AGENT;
- provider: internal;
- operation: `inspect-agent-evaluation`;
- evidence: `test_cases`, `scores`, `regressions`;
- handoff: Emily.

## Resultado esperado após integração
13 skills executáveis / 3 documentais.

## Regra de gate
O SHA exato que contém este PRF deve passar Foundation e Container Smoke. Depois, o mesmo HEAD passa por revisão de Beatriz, Sofia, Renato e Júlia, auditoria independente de Emily e gate de Léo.

## Próximo boundary
`MCF-RUNTIME-006-LOT-4-C-SECURITY-REVIEW`.

## Limites
Gate C permanece parcial; produção BLOCKED; live staging adapter DISABLED; `human_operator_actions=0`; HUMAN_GATE de LEANDRO não requerido.
