# PHASE-006-LOT-4-B-EVALUATE-AGENTS — Decisões

## D1 — Incremento isolado
`MCF-EVALUATE-AGENTS` permanece isolada das três skills documentais de maior sensibilidade operacional, reduzindo blast radius e permitindo gate específico.

## D2 — Classe C conservadora
A skill é `READ_ONLY`, mas altera critérios de comportamento e avaliação dos agentes no runtime. Por isso a fase usa PRF Classe C, auditoria independente e gate de Léo.

## D3 — `READY_AGENT`, não autoexecução
O planner pode inferir ou receber explicitamente `MCF-EVALUATE-AGENTS`, mas o bridge não fabrica scorecard. A execução depende do agente owner e de evidência real.

## D4 — Preservar `READ_ONLY`
A tentativa inicial usou `evaluate-agents`, que foi corretamente recusada pelo `PermissionEngine`. A correção não ampliou a política: a operação foi alinhada à taxonomia de leitura como `inspect-agent-evaluation`.

## D5 — Evidência reproduzível
`test_cases` e `scores` devem ser não vazios e significativos. `regressions` deve existir mesmo quando nenhuma regressão foi observada, caso em que `[]` é válido.

## D6 — Dois owners canônicos
Beatriz e Tiago continuam aceitos conforme `skills/registry.yaml`; o planner usa Beatriz como owner primário.

## D7 — Handoff para Emily
Sucesso validado produz handoff para Emily. Evidência inválida produz `RECOVERING` e nenhum handoff de sucesso.

## D8 — Persistência faz parte do aceite
Foi criado teste integrado do `MissionRuntime` para provar scorecard, recibo, eventos, handoff e progressão de versão 1→2.

## D9 — Resultados anteriores não são gate
O Foundation `31463062323` falhou antes da correção READ_ONLY; o Smoke `31463062318` e os workflows `action_required` de SHAs intermediários são históricos/superseded. O PASS em `791ed0f8114dd9d6e071fc668d4c9be2536dffa4` é intermediário e também será superseded pelo PRF.

## D10 — Sem expansão externa
Produção, live staging adapter, Gate C e escrita real C1/C2 permanecem inalterados.
