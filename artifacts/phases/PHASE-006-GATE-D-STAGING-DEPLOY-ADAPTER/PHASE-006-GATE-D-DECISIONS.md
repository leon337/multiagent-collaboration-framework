# PHASE-006-GATE-D — Decisões

## D-001 — Reutilizar GitHub Actions como control plane

O runtime não recebe o segredo `RENDER_DEPLOY_HOOK_URL`. O adapter formal fala com GitHub Actions; o workflow continua responsável pelo deploy hook.

## D-002 — Separar implementação de ativação real

O adapter é implementado e testado, porém não é adicionado ao `AdapterRegistry` live nesta fase.

## D-003 — Correlação idempotente

O `workflow_dispatch` usa correlação não secreta por `request_id + release_sha + mission_id + phase_id`, permitindo read-back/reconciliação antes de retry.

## D-004 — Recovery não é rollback nativo

O único recovery aceito é o redeploy do SHA saudável anterior, conforme MCF-DEC-058.

## D-005 — Timeout deve respeitar o lease

O adapter usa deadline inferior ao lease de ações externas. Em ausência de estado final verificável, o resultado permanece `UNKNOWN`.

## D-006 — Workflow longo exige reconciliação assíncrona durável

A conclusão do workflow é reconciliada por callback autenticado de `workflow_run`, vinculado à tentativa durável. O callback não recebe o segredo do Render.

## D-007 — Release e control plane são revisões distintas

O release alvo é validado/buildado no SHA solicitado, mas o driver de deploy é executado a partir de `github.workflow_sha`, impedindo que um ancestor antigo substitua o protocolo de outputs do Gate D.

## D-008 — Provider disponível não significa provider live

`GitHubActionsStagingDeployAdapter` pode existir como provider interno para o serviço de reconciliação sem ser incluído no `AdapterRegistry`. Isso mantém o callback inicializável e preserva `live_registry: DISABLED`.

## D-009 — Retomada deve obedecer ao protocolo operacional 1.1

Em 2026-08-10, a missão foi retomada contra o estado real do GitHub. O ciclo 1 permanece histórico; o ciclo 2 passa a aplicar explicitamente `MCF-PROJECT-OPERATING-INSTRUCTIONS`, o Protocolo Operacional Unificado 1.1, a matriz dos 29 agentes e o Skill Registry vigentes.

## D-010 — Todos alinhados não significa todos participando

A composição oficial continua com 29 agentes, mas a metodologia proíbe participação decorativa. O ciclo 2 seleciona somente agentes com entrega concreta e mantém os demais disponíveis para ampliação por lacuna objetiva.

## D-011 — Reconciliar os gatilhos de controle e owners da skill

Por ser retomada e envolver autonomia/tool calling com potencial efeito externo em staging, o ciclo 2 inclui Miriam, Augusto, Beatriz e Júlia pelos gatilhos vigentes. Bruno e Gabriel representam os owners da skill `MCF-DEPLOY-VALIDATE`; Carmem coordena a consistência do PRF.

## D-012 — Aplicar TEAM_FIRST e preservar Leandro fora da operação rotineira

Nenhuma ação técnica rotineira será transferida a Leandro. A equipe deve tentar conectores, workflows, automação e fallbacks seguros antes de qualquer HUMAN_GATE. Produção continua fora do escopo.

## D-013 — Não reutilizar evidência de HEAD anterior como gate do novo HEAD

O HEAD `7b2b4184d3475fd741e4951f0373897a78b12030` possui Foundation PASS, Container Smoke PASS e revisão Codex sem major issues. Como a reconciliação documental altera o HEAD do PR, CI e revisão independente devem ser repetidas no SHA reconciliado antes do Gate de Léo.
