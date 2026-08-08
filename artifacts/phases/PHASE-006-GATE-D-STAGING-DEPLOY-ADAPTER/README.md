# PHASE-006-GATE-D-STAGING-DEPLOY-ADAPTER

PRF da implementação do adapter formal de deploy verificado para staging do MCF-RUNTIME-006.

## Regras preservadas

- staging only;
- produção bloqueada;
- Render secret permanece no GitHub Actions;
- live registry desativado durante implementação;
- nenhuma prova real do novo adapter antes do gate;
- recovery significa redeploy do SHA saudável anterior.

## Arquivos

- `PHASE-006-GATE-D-PLAN.md`
- `PHASE-006-GATE-D-DECISIONS.md`
- `PHASE-006-GATE-D-REPORT.md`
- `PHASE-006-GATE-D-VALIDATION.txt`
- `PHASE-006-GATE-D-VALIDATION-FULL.txt`
- `PHASE-006-GATE-D-SMOKE.txt`
- `PHASE-006-GATE-D-CHECKPOINT.yaml`
- `PHASE-006-GATE-D-ARTIFACT-MANIFEST.sha256`
