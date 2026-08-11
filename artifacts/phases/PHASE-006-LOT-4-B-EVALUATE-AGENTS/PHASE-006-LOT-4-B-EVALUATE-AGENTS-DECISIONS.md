# PHASE-006-LOT-4-B-EVALUATE-AGENTS — Decisões

## D1 — Boundary isolado
A avaliação de agentes foi convertida separadamente das skills sensíveis restantes.

## D2 — Classe C conservadora
A skill é READ_ONLY, mas altera critérios de avaliação do runtime; PRF completo e auditoria independente foram exigidos.

## D3 — READY_AGENT
O bridge não fabrica scorecard; o agente owner produz evidência real.

## D4 — READ_ONLY preservado
A tentativa `evaluate-agents` foi bloqueada corretamente. A solução foi `inspect-agent-evaluation`; o PermissionEngine não foi ampliado.

## D5 — Evidência reproduzível
`test_cases`/`scores` não vazios; `regressions` obrigatório e permitido vazio.

## D6 — Owners e handoff
Beatriz/Tiago são owners; sucesso validado entrega a Emily.

## D7 — Persistência no aceite
MissionRuntime prova recibo, evidência, eventos, handoff e versão 1→2.

## D8 — Gate preso ao HEAD
Foundation, Smoke, reviews, auditoria e Léo foram vinculados a `279a4b1e3b8e8b5b948d95481ec85e5223322278`.

## D9 — Squash preservou a tree
Merge `741abdad70432b9232256b7204156d96770c9b4d` e candidato compartilham `a0e676152c7070381480b9c5422f103887987eab`.

## D10 — Próximo boundary
`MCF-RUNTIME-006-LOT-4-C-SECURITY-REVIEW`; Gate C, produção e live staging permanecem inalterados.
