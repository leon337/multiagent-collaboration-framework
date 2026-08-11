# PHASE-006-LOT-4-C-SECURITY-REVIEW — Decisões

## D1 — Boundary independente

`MCF-SECURITY-REVIEW` foi promovida separadamente de `MCF-DEBUG-INCIDENT` e `MCF-CLOSE-PHASE`.

## D2 — SENSITIVE_CONTROLLED preservado

A implementação trabalha dentro do `PermissionEngine`. `sensitiveAuthorization=true` continua obrigatório; nenhum bypass global foi criado.

## D3 — Provider interno somente

O Lot 4-C usa exclusivamente `internal / inspect-security-review / mcf-agent-runtime`. Scanners e conectores externos permanecem fora do boundary.

## D4 — READY_AGENT

O bridge pode planejar a skill, mas não fabricar review nem evidência. A execução de domínio pertence ao owner selecionado.

## D5 — Piso Classe C

Selecionar `MCF-SECURITY-REVIEW` impõe Classe C e não aceita downgrade via `requestedRiskClass`.

## D6 — Evidência semântica reforçada

`threats` e `controls` exigem conteúdo semântico. Objetos vazios, strings vazias e placeholders somente booleanos não satisfazem o contrato.

`residual_risk` é estruturado e exige:
- `level` não vazio;
- `critical_unaddressed:boolean`.

## D7 — Risco crítico

Se `critical_unaddressed=true`, a fase só pode concluir quando `blocked=true`; caso contrário entra em `RECOVERING` e não entrega a Emily.

## D8 — Proibições comprovadas

`secret_exposure`, `unrestricted_write` e provider externo foram cobertos por provas negativas.

## D9 — Owners e handoff

Ricardo e Júlia são owners aceitos. O planner usa Ricardo como primário. O sucesso entrega a Emily.

## D10 — Persistência

MissionRuntime comprova receipt, evidência, eventos, handoff e progressão de versão.

## D11 — CAF visível

Falhas de formatting e findings de governança/evidência geraram novos SHAs. Nenhum PASS superseded foi reutilizado no gate final.

## D12 — Gate preso ao HEAD

Reviews, auditoria de Emily e gate de Léo foram vinculados ao HEAD final `323b69af4616cda0e4f9b1e47516a9cde37a3f0d`.

## D13 — Merge protegido

O PR #101 foi integrado por squash com expected-head e gerou `08c3e19e1b6408a164628e1bfaa5968e2070ccf0`.

Candidato e merge compartilham a tree `70f07a2c936ce166555e52b36366c810919f5b8c`.

## D14 — Limites globais

Gate C permanece parcial. C1/C2 real provider write continua não autorizado. Produção e live staging adapter permanecem bloqueados/desabilitados.

## D15 — HUMAN_GATE

Nenhum gatilho reservado exigiu LEANDRO. A autorização interna de Léo foi usada apenas dentro do boundary da Issue #100.

## D16 — Próximo boundary

Após o canonical sync, a próxima skill documental a formalizar é `MCF-DEBUG-INCIDENT`, conforme o registry vigente. Nenhuma Issue Lot 4-D existente foi presumida. `MCF-CLOSE-PHASE` permanece separada.
