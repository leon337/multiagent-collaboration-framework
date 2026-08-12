# PHASE-PRODUCTION-READINESS-001

Mission: `MCF-PRODUCTION-READINESS-001`  
Issue: `#124`  
Risk class: `C`  
State: `IN_PROGRESS`

## Ordem de leitura

1. `PHASE-PRODUCTION-READINESS-001-PLAN.md`
2. `PRODUCTION-READINESS-MATRIX.md`
3. `PHASE-PRODUCTION-READINESS-001-REPORT.md`
4. `PHASE-PRODUCTION-READINESS-001-DECISIONS.md`
5. `PHASE-PRODUCTION-READINESS-001-CHECKPOINT.yaml`
6. `PHASE-PRODUCTION-READINESS-001-VALIDATION.txt` — a produzir com evidência atual
7. `PHASE-PRODUCTION-READINESS-001-VALIDATION-FULL.txt` — a produzir com evidência atual
8. `PHASE-PRODUCTION-READINESS-001-SMOKE.txt` — a produzir conforme estágio/rollout
9. `PHASE-PRODUCTION-READINESS-001-ARTIFACT-MANIFEST.sha256` — somente após fechamento dos artefatos

## Regra de verdade

Nenhum arquivo futuro deve registrar `PASS` sem evidência verificável. Evidência histórica é referência de baseline e deve ser revalidada quando o critério depender do estado atual.

## Boundary

Esta é uma fase de **Prontidão para Produção** pós-RC1. Não é `Gate F`. Produção real e `v1.0.0` estável são milestones separados.
