# PHASE-006-LOT-4-C-SECURITY-REVIEW — Decisões

## D1 — Boundary isolado

`MCF-SECURITY-REVIEW` é promovida separadamente das duas skills documentais restantes.

## D2 — SENSITIVE_CONTROLLED preservado

A implementação trabalha dentro do `PermissionEngine`; `sensitiveAuthorization=true` continua obrigatório e não foi criado bypass global.

## D3 — Provider interno somente

Neste incremento a skill usa exclusivamente `internal / inspect-security-review / mcf-agent-runtime`. Scanners e conectores externos ficam fora do boundary.

## D4 — READY_AGENT

O bridge planeja a capacidade, mas não fabrica review nem evidência; execução de domínio permanece com o owner selecionado.

## D5 — Evidência semântica

`threats`, `controls` e `residual_risk` são obrigatórios e significativos. Placeholder não conclui a fase.

## D6 — Piso Classe C

A revisão de governança identificou que a seleção de uma skill `SENSITIVE_CONTROLLED` não podia depender apenas de palavras de alto risco no objetivo. O planner agora impõe Classe C para `MCF-SECURITY-REVIEW`, inclusive contra tentativa de downgrade.

## D7 — Risco crítico

Risco crítico explicitamente não tratado só pode prosseguir se estiver explicitamente bloqueado. Caso contrário a fase entra em `RECOVERING` sem handoff de sucesso.

## D8 — Proibições comprovadas

`secret_exposure`, `unrestricted_write` e provider externo possuem prova negativa no lote.

## D9 — Owners e handoff

Ricardo e Júlia são owners canônicos; planner primário usa Ricardo; sucesso entrega a Emily.

## D10 — Persistência no aceite

MissionRuntime comprova receipt, evidência, eventos, handoff e progressão de versão.

## D11 — CAF de formatação

Falhas de formatting em `6827fbff...` e `958da151...` foram expostas. `2622a8ec...` foi diagnóstico temporário, não evidência de gate. O tooling original foi restaurado antes do candidato funcional.

## D12 — Gate preso ao HEAD

`772fcb71...` possui PASS pré-PRF, mas ficará superseded para gate assim que este PRF gerar um novo HEAD. Reviews finais, auditoria e decisão de Léo só podem valer para o HEAD PRF revalidado.

## D13 — HUMAN_GATE

A autorização interna de Léo na Issue #100 cobre o boundary atual. Nenhum gatilho reservado de Leandro surgiu; `human_operator_actions=0`.
