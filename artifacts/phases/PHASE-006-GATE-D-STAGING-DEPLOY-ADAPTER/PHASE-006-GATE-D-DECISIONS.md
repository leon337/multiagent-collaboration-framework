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
