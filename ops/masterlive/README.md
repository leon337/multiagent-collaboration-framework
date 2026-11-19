# MasterLive — execução local

Ver [runbook de F3–F5](../../docs/operations/MCF-MASTERLIVE-F3-F4-F5.md).

`bash ops/masterlive/check-readiness.sh` faz apenas leitura e retorna código não zero quando faltar saúde/serviço. Usa `MCF_MASTERLIVE_STAGE_URL`, `MCF_MASTERLIVE_PROD_URL` e `MCF_MASTERLIVE_STAGE_SERVICE` como parâmetros opcionais. Não contém segredo nem provisiona rede.
