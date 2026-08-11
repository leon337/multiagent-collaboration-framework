# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Decisions

## D1 — GitHub vence checkpoints transferidos
Estado real foi verificado antes de cada gate/merge.

## D2 — Ownership
Patricia é primary owner; Bruno e Rafael também são owners; Renato recebe handoff após sucesso válido.

## D3 — READY_AGENT
A skill não é auto-completada pelo bridge.

## D4 — SCOPED_WRITE preservado
O Lot permanece internal-only sem relaxar o PermissionEngine global.

## D5 — Evidência semântica
Booleano, placeholder, vazio, whitespace ou objeto vazio não substituem evidência.

## D6 — No-blind-retry demonstrável
`blind_retry: false` exige também `retry_evidence` semântico independente.

## D7 — Evidência insuficiente recupera
Retorna `RECOVERING` sem handoff de sucesso.

## D8 — CAF #1
Falha de formatação foi capturada, corrigida e revalidada.

## D9 — CAF #2
CI verde não impediu review de encontrar lacuna semântica; gate foi bloqueado e evidência antiga superseded.

## D10 — CAF #3
Termos genéricos `incidente/incident` foram removidos para preservar security review Classe C.

## D11 — Limitação de conector
Recuperada por Git blob/tree/commit/ref fast-forward, sem force-push e sem HUMAN_GATE.

## D12 — SHA exato
Gate técnico pertence a `dccb41f146f5701f75d8762df89160bf2f1695a7`.

## D13 — Merge técnico protegido
PR #104 foi squash-merged com expected head e tree equivalence PASS.

## D14 — Sync documental separado
PR #105 partiu do merge técnico, validou documentação/manifesto e recebeu gate documental antes do merge.

## D15 — Canonical sync concluído
PR #105 foi mesclado em `59b230e8ad834b88c1dc4363bc9a28499881e1fe`. O estado canônico alvo é `16 / 15 / 1`, restando somente `MCF-CLOSE-PHASE`.

## D16 — CAF #4 pós-merge
Os documentos do PR #105 foram corretamente escritos como `IN_PROGRESS/CANDIDATE` antes do merge para não fabricar conclusão. Após o merge, esses marcadores ficaram defasados. Um micro-closeout documental foi aberto exclusivamente para registrar a conclusão já verdadeira.

## D17 — Closeout não altera runtime
O micro-closeout só modifica documentação/PRF, não implementa `MCF-CLOSE-PHASE` e não amplia permissões.

## D18 — Issue #103
Só deve ser fechada após validação, gate e merge do micro-closeout, para que a fonte canônica e o estado do GitHub coincidam.

## D19 — Limites externos
Produção bloqueada, live staging adapter desabilitado e Gate C real provider write não autorizado.

## D20 — Sem HUMAN_GATE
Nenhum gatilho reservado surgiu; `human_operator_actions=0`.
