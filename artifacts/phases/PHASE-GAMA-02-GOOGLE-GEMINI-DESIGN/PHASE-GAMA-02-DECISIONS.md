# PHASE-GAMA-02 — Decisions

## D1 — Não reutilizar ExternalActionAdapter para inferência pura
A integração Gemini não deve confundir raciocínio/geração de modelo com efeito externo material.

## D2 — Arquitetura recomendada
Adotar um boundary próprio `ModelExecutionProvider` + registry, com Gemini como primeiro provider Google qualificado.

## D3 — External effects continuam no boundary atual
Function/tool calls emitidos pelo Gemini são intenções. Qualquer mutação real deve passar por Permission Engine, Human Delegation Firewall e External Action Dispatcher.

## D4 — SDK candidato
Para JavaScript/TypeScript, usar o SDK oficial `@google/genai` em G3, condicionado à verificação live no momento da implementação.

## D5 — Modelo não será hard-coded no design
O model ID será configurável e allowlisted. G3 selecionará um modelo oficialmente elegível no free tier no momento do teste e preservará o ID exato como evidência.

## D6 — Zero paid fallback
Nenhum fallback automático para rota/modelo pago. Se Cloud Billing ou custo novo se tornar necessário, a implementação para e escala para HUMAN_GATE de LEANDRO.

## D7 — Segredo server-side
`GEMINI_API_KEY` não pode aparecer em código, Git, receipt, ledger, log ou cliente.

## D8 — Claim de Google fit
Até uma chamada real e qualificada ocorrer em G3, `GOOGLE_MODEL_INTEGRATION = NOT_YET_PROVEN`.

## D9 — G2 gate
`DESIGN_PASS_OPTION_B_RECOMMENDED`.
G3 não está autorizado automaticamente. Requer HUMAN_GATE explícito de LEANDRO para implementação.