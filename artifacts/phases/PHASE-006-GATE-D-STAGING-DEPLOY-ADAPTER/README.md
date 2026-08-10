# PHASE-006-GATE-D-STAGING-DEPLOY-ADAPTER

PRF do adapter formal de deploy verificado para staging do MCF-RUNTIME-006.

## Estado
`CYCLE_4_GOVERNANCE_RECOVERY_PRF_MATERIALIZATION`

O código funcional está congelado neste recovery documental. O staging adapter
permanece fora do live `AdapterRegistry`; dispatch real não está autorizado e
produção permanece bloqueada.

## Ciclos e evidência

- **Cycle 1:** execução técnica histórica preservada.
- **Cycle 2:** reconstrução posterior; não vale como ESEV primária.
- **Cycle 3:** execução contemporânea real, porém Augusto C3-021 rejeitou o HDF
  final por handoff para reviewer externo/ator composto. O histórico não é reescrito.
- **Cycle 4:** novo boundary contemporâneo para PRF, validação e gates finais.

`PHASE-006-GATE-D-CYCLE-3-ESEV-RECEIPTS.md` indexa o histórico C3 e explicita
quais registros não servem como HDF final.

`PHASE-006-GATE-D-CYCLE-4-ESEV-RECEIPTS.md` indexa somente receipts C4 que já
existiam antes de sua materialização. Comentários do PR #84 permanecem a fonte
primária ESEV.

## Pre-documentation exact-head evidence

HEAD `42eb1e44d3c4344ec42865223421dd459c9cadc3`:

- Foundation `31429703728`: PASS;
- Container Smoke `31429703721`: PASS;
- artifact `9078625710`;
- digest `sha256:df34046df550fc6334ec965283099fec96f8e41aefc6fb71545277da784b613d`;
- Codex comment `5245728332`: no major issues on `42eb1e44d3`.

A escrita deste PRF cria novo HEAD. Essa evidência não será promovida como gate
do novo SHA; Renato/Augusto deverão produzir evidência exata posterior.

## Regras preservadas

- staging only;
- production blocked;
- Render secret permanece no GitHub Actions;
- live registry desativado para staging adapter;
- sem prova real antes da decisão de Léo;
- HDF TEAM_FIRST;
- `human_operator_actions: 0`;
- seleção dinâmica, sem participação decorativa;
- Codex é ferramenta/evidência, nunca target de handoff;
- CI/review vinculados ao SHA exato.

## Arquivos

- `PHASE-006-GATE-D-PLAN.md`
- `PHASE-006-GATE-D-DECISIONS.md`
- `PHASE-006-GATE-D-REPORT.md`
- `PHASE-006-GATE-D-CYCLE-2-TRACE.yaml`
- `PHASE-006-GATE-D-CYCLE-3-ESEV-RECEIPTS.md`
- `PHASE-006-GATE-D-CYCLE-4-ESEV-RECEIPTS.md`
- `PHASE-006-GATE-D-VALIDATION.txt`
- `PHASE-006-GATE-D-VALIDATION-FULL.txt`
- `PHASE-006-GATE-D-SMOKE.txt`
- `PHASE-006-GATE-D-CHECKPOINT.yaml`
- `PHASE-006-GATE-D-ARTIFACT-MANIFEST.sha256`
