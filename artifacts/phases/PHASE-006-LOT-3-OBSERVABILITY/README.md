# PHASE-006-LOT-3-OBSERVABILITY

PRF da missão `MCF-RUNTIME-006-LOT-3-OBSERVABILITY` (issue #88, PR original #89 e recuperação pós-merge #92).

## Artefatos

- `PHASE-006-LOT-3-OBSERVABILITY-PLAN.md`
- `PHASE-006-LOT-3-OBSERVABILITY-REPORT.md`
- `PHASE-006-LOT-3-OBSERVABILITY-VALIDATION.txt`
- `PHASE-006-LOT-3-OBSERVABILITY-VALIDATION-FULL.txt`
- `PHASE-006-LOT-3-OBSERVABILITY-SMOKE.txt`
- `PHASE-006-LOT-3-OBSERVABILITY-CHECKPOINT.yaml`
- `PHASE-006-LOT-3-OBSERVABILITY-DECISIONS.md`
- `PHASE-006-LOT-3-OBSERVABILITY-ARTIFACT-MANIFEST.sha256`

## Recuperação registrada

Um P2 assíncrono chegou após o merge do PR #89 e demonstrou risco de persistir alerta baseado em snapshot obsoleto. A issue #88 foi reaberta e o PR #92 adiciona rechecagem atômica de estado+versão e regressão PostgreSQL.

## Limites

Este pacote documenta uma fase Classe B. Não autoriza produção, ativação do live staging adapter, notificação externa, escrita real C1/C2 pelo provider ou uso de credencial pessoal de LEANDRO.

A evidência final deve permanecer vinculada ao HEAD exato validado; nenhum PASS de SHA anterior pode ser promovido.
