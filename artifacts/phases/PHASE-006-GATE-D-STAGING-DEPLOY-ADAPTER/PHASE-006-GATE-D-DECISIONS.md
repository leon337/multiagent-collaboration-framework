# PHASE-006-GATE-D — Decisões

## D-001 — Reutilizar GitHub Actions como control plane

O runtime não receberá o segredo `RENDER_DEPLOY_HOOK_URL`. O adapter formal falará com GitHub Actions; o workflow existente continuará responsável pelo deploy hook.

## D-002 — Separar implementação de ativação real

O adapter será implementado e testado com provider mockado/local, porém não será adicionado ao live registry nesta fase.

## D-003 — Correlação idempotente

O `workflow_dispatch` receberá identificador não secreto correlacionado à idempotency key, combinado ao SHA exato, para permitir read-back/reconciliação antes de retry.

## D-004 — Recovery não é rollback nativo

O único recovery aceito é o redeploy do SHA saudável anterior, conforme MCF-DEC-058.

## D-005 — Timeout deve respeitar o lease

O adapter não poderá usar deadline igual ou superior ao lease de ações externas. Em ausência de estado final verificável, o resultado será `UNKNOWN`.
