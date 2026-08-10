# PHASE-006-GATE-D — Decisões

## D-001 — Reutilizar GitHub Actions como control plane
O runtime não recebe `RENDER_DEPLOY_HOOK_URL`; GitHub Actions continua responsável pelo deploy hook.

## D-002 — Separar implementação de ativação real
O staging adapter é implementado/testado, mas permanece fora do live `AdapterRegistry` até gate autorizado.

## D-003 — Correlação idempotente
`workflow_dispatch` usa correlação não secreta e reconciliação durável antes de qualquer retry.

## D-004 — Recovery não é rollback nativo
Recovery aceito = redeploy do SHA saudável anterior, conforme decisão vigente.

## D-005 — Timeout respeita lease e UNKNOWN é fail-closed
Ausência de estado final verificável não autoriza retry cego.

## D-006 — Workflow longo exige reconciliação assíncrona durável
Callback autenticado reconcilia a tentativa sem expor segredo Render.

## D-007 — Release e control plane são revisões distintas
O release é validado no SHA solicitado; o driver de deploy usa control plane confiável.

## D-008 — Provider disponível não significa provider live
`GitHubActionsStagingDeployAdapter` pode existir para reconciliação sem integrar o live `AdapterRegistry`.

## D-009 — Retomadas obedecem ao protocolo operacional vigente
Estado real do GitHub e documentação de `main` prevalecem sobre memória antiga.

## D-010 — Todos alinhados não significa todos participando
Seleção é dinâmica; participação decorativa é proibida.

## D-011 — Aplicar agentes de controle pelos gatilhos
Classe C exige Augusto e Julia; Carmem coordena PRF; Renato valida; Gabriel liga PRF a Git/PR.

## D-012 — TEAM_FIRST
Rotina técnica não é transferida a Leandro; `human_operator_actions=0`.

## D-013 — Evidência de HEAD anterior não fecha HEAD novo
Toda escrita que muda HEAD exige revalidação exata conforme o gate aplicável.

## D-014 — Review técnico limpo em `42eb1e44...`
Foundation `31429703728` e Container Smoke `31429703721` passaram; Codex comment
`5245728332` não encontrou major issues no reviewed commit `42eb1e44d3`.
A evidência é exata daquele SHA e permanece histórica após nova escrita documental.

## D-015 — Cycle 3 não fecha HDF final
Augusto C3-021 detectou handoffs para `independent Codex review` e ator composto
`Emily/external review`. O conteúdo técnico verificável é preservado, mas essas
passagens não satisfazem Protocol §6.

## D-016 — Abrir Cycle 4 em vez de reparar retrospectivamente
Cycle 3 não é reescrito. Cycle 4 começa em comentários timestamped e trata Codex
como ferramenta/evidência observada por agente real, nunca como target de handoff.

## D-017 — PRF materializado declara validação futura como pendente
Carmem não inventa CI do commit que ainda não existe. O HEAD documental resultante
é entregue a Renato; CI/Smoke e review exato são registrados depois, em ESEV
contemporânea.
