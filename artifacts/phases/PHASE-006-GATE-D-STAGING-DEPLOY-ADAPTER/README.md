# PHASE-006-GATE-D-STAGING-DEPLOY-ADAPTER

PRF da implementação do adapter formal de deploy verificado para staging do MCF-RUNTIME-006.

## Estado atual

`PRF_MATERIALIZATION_PENDING_FINAL_EXACT_HEAD_GATE`

A implementação está aplicada e a reconciliação metodológica do ciclo 2 foi incorporada. O gate permanece aberto até CI completa, Container Smoke e revisão independente no **HEAD final materializado**, com zero P0/P1/P2.

## Ciclos

- **Ciclo 1:** execução técnica histórica preservada como ocorreu, sem reescrever participação retroativamente.
- **Ciclo 2:** retomada de 2026-08-10 alinhada ao protocolo operacional 1.1, matriz oficial de 29 agentes, seleção dinâmica, Skill Registry e HDF TEAM_FIRST.

## Evidência pré-finalização

O HEAD `51e5b9b1a503221d31053a30409ae9408ef75949` obteve:

- Foundation `31409337150`: PASS;
- Container Smoke `31409326589`: PASS;
- Vitest artifact `9070945331`, digest `sha256:606b23d7946deaae565c7a0af36c05d720b434bb433ece373b35ad15b1b479c7`.

A finalização deste PRF gera um novo HEAD. A evidência desse HEAD final deve permanecer externa no PR #84 / GitHub Actions; embuti-la neste commit alteraria novamente o próprio SHA. O Gate de Léo deve sempre verificar os IDs externos contra o HEAD atual antes de decidir.

## Regras preservadas

- staging only;
- produção bloqueada;
- Render secret permanece no GitHub Actions;
- live registry desativado durante implementação;
- provider interno pode existir para reconciliação sem entrar no `AdapterRegistry`;
- nenhuma prova real do novo adapter antes do Gate de Léo;
- recovery significa redeploy do SHA saudável anterior;
- driver de deploy vem da revisão confiável do control plane, não do release histórico;
- HDF TEAM_FIRST e `human_operator_actions: 0` enquanto houver ação executável pela equipe;
- nenhuma evidência de SHA anterior é promovida para um SHA posterior.

## Arquivos

- `PHASE-006-GATE-D-PLAN.md`
- `PHASE-006-GATE-D-DECISIONS.md`
- `PHASE-006-GATE-D-REPORT.md`
- `PHASE-006-GATE-D-VALIDATION.txt`
- `PHASE-006-GATE-D-VALIDATION-FULL.txt`
- `PHASE-006-GATE-D-SMOKE.txt`
- `PHASE-006-GATE-D-CHECKPOINT.yaml`
- `PHASE-006-GATE-D-ARTIFACT-MANIFEST.sha256`
