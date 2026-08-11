# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Decisions

## D1 — GitHub vence o checkpoint transferido
O início revalidou `main`, Issue `#103`, registry, protocolo, runtime plan e encerramento do Lot 4-C. Não havia branch/PR pré-existente do Lot 4-D.

## D2 — Planner usa Patricia como primary owner
Patricia, Bruno e Rafael são owners canônicos; Patricia é domínio primário. Handoff: Renato.

## D3 — READY_AGENT, nunca auto-completion pelo bridge
A skill usa provider interno, mas não é bootstrap. O planner marca `READY_AGENT`.

## D4 — SCOPED_WRITE permanece canônico
O Lot 4-D não muda o perfil do registry e não relaxa o PermissionEngine global.

## D5 — Internal-only
A única combinação autorizada é `internal / inspect-debug-incident / mcf-agent-runtime`. External/GitHub write, environment mutation, deploy, produção, destructive fix, secret/public action e blind retry permanecem proibidos.

## D6 — Evidência semântica estruturada
- reproduction: `symptom`, `method`, `evidence_reference`;
- root_cause: `cause`, `supporting_evidence`;
- recovery_result: `action_or_mitigation`, `verification`, `blind_retry: false`, `retry_evidence`, `regression_test_added`.

## D7 — Evidência insuficiente recupera
Falha semântica retorna `RECOVERING`, `handoffTo: null`, sem `PHASE_COMPLETED` nem handoff de sucesso.

## D8 — CAF #1 preservado
`3ea30e9a...` falhou em formatação; `81c1f1c9...` foi diagnóstico-only; a formatação exata foi aplicada e revalidada.

## D9 — Regra de SHA
CI/review só vale para o SHA exato. Candidatos superseded ficam históricos.

## D10 — Sem HUMAN_GATE
Nenhum gatilho reservado surgiu. `human_operator_actions: 0`.

## D11 — `blind_retry: false` não basta
Vinicius bloqueou o primeiro candidato PRF porque o booleano isolado não demonstrava ausência de blind retry. `retry_evidence` semântico passou a ser obrigatório; ausência, booleano ou placeholder recuperam, nunca concluem.

## D12 — Debug não captura incidente genérico
Beatriz encontrou sobreposição: termos genéricos `incidente`/`incident`, avaliados antes de security review, poderiam capturar um objetivo de segurança e remover seu piso Classe C.

Decisão:
- remover `incidente` e `incident` da inferência genérica de Debug Incident;
- manter sinais explícitos: `debug`, `diagnosticar incidente`, `diagnose incident`, `root cause`, `causa raiz`, `reproduzir falha`, `investigar erro`;
- provar por regressão que `revisão de segurança do incidente` continua em `MCF-SECURITY-REVIEW`, owner Ricardo, `READY_AGENT`, Classe C;
- não alterar a precedência de security review além do necessário para eliminar a ambiguidade.

A tentativa de substituição completa do planner foi bloqueada pelo conector antes de chegar ao GitHub. A correção foi então aplicada por blob/tree/commit Git granular e atualização fast-forward da branch, sem force-push.
