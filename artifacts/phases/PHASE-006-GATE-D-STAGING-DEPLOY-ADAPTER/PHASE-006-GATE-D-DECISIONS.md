# PHASE-006-GATE-D — Decisões

## D-001 — Reutilizar GitHub Actions como control plane
O runtime não recebe `RENDER_DEPLOY_HOOK_URL`; GitHub Actions permanece responsável pelo
hook protegido de staging.

## D-002 — Separar implementação, prova e ativação live
O adapter é implementado e validado, mas continua fora do live `AdapterRegistry`.

## D-003 — Correlação idempotente e UNKNOWN fail-closed
`workflow_dispatch` usa correlação não secreta, reserva durável e reconciliação antes de
retry. Ambiguidade pós-mutation não é convertida em sucesso.

## D-004 — Recovery não é rollback nativo
Recovery aceito = redeploy do SHA saudável anterior.

## D-005 — Release e control plane são revisões distintas
O release solicitado é verificado por SHA; o driver mutante vem do control plane confiável.

## D-006 — Evidência de HEAD anterior não fecha HEAD novo
Toda escrita documental que muda o HEAD exige nova validação/revisão exata.

## D-007 — Cycle 2 permanece reconstrução histórica
A reconstrução retrospectiva não é promovida a ESEV primária.

## D-008 — Cycle 3 preserva seus defeitos de HDF
Os handoffs inválidos/ator composto detectados por Augusto são mantidos como história.

## D-009 — Cycle 4 é o boundary ESEV final
A cadeia C4 usa agentes reais; Codex aparece somente como ferramenta/evidência.

## D-010 — TEAM_FIRST
Rotina técnica não é transferida para Leandro; alvo `human_operator_actions=0`.

## D-011 — Gate técnico exact-head c787 aprovado antes da prova
Foundation `31431820713`, Container Smoke `31431820709`, artifact `9079437876`,
digest `sha256:3cf0373f66f71bc41681d3a1bfbe6fb4d1c448c0c97c694cda01de617b31dd71`
e review Codex `5246038796` sustentaram os controles C4-010 a C4-013.

## D-012 — Léo autorizou uma única prova real controlada
C4-013 autorizou staging somente no SHA
`c787179e126a93af96dd67604cb24f91235c4320`, sem produção, merge ou ativação live.

## D-013 — Limitação do conector não aciona HUMAN_GATE automaticamente
C4-014 registrou ausência de `workflow_dispatch` na superfície conectada e manteve
`human_action_required=false`.

## D-014 — Fallback one-shot TEAM_FIRST
A RC encontrou uma rota com `GITHUB_TOKEN` efêmero do Actions, permissão mínima
`actions:write`, ref isolado, duplicate guard e single dispatch. O padrão passa a ser
formalizado por `MCF-DEC-061`.

## D-015 — Prova real de staging PASS
Helper `31438190773` PASS; staging `31438199266` PASS; resultado `DEPLOYED` no SHA exato
`c787179e...`; previous SHA `0a7909b...`; `NOOP` e `RECOVERED` não ocorreram.

## D-016 — `DEPLOYED` exige SHA + readiness
O driver somente produz `DEPLOYED` depois de observar `/health/version` no SHA solicitado e
`/health/ready` saudável. Falha pós-deploy aciona recovery pelo SHA saudável anterior.

## D-017 — Gate D pós-prova aprovado
Renato C4-016, Augusto C4-017, Julia C4-018 e Emily C4-019 passaram. Léo C4-020 decidiu
`APROVAR`, `gate_d: PASS`, `real_staging_proof: PASS`, com P0/P1/P2 ativos = 0/0/0.

## D-018 — Gate D e integração são boundaries distintos
O closeout do Gate D não fabrica autorização de merge. Integração na `main`, ativação live
do adapter e produção permanecem fora desta decisão.
