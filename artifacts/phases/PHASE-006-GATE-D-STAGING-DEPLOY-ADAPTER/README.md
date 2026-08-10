# PHASE-006-GATE-D-STAGING-DEPLOY-ADAPTER

PRF da implementação do adapter formal de deploy verificado para staging do MCF-RUNTIME-006.

## Estado atual

`ESEV_REMEDIATED_PENDING_EXACT_HEAD_GATE`

A implementação está aplicada. A retomada do ciclo 2 foi reconciliada com a metodologia vigente e os findings de governança da revisão de `51e5b9b1...` foram remediados no PRF. O gate permanece aberto até CI completa, Container Smoke e revisão independente no **HEAD remediado final**, com zero P0/P1/P2 ativos.

## Ciclos

- **Ciclo 1:** execução técnica histórica preservada como ocorreu, sem reescrever participação retroativamente.
- **Ciclo 2:** retomada de 2026-08-10 alinhada ao protocolo operacional 1.1, matriz oficial de 29 agentes, seleção dinâmica, Skill Registry e HDF TEAM_FIRST.

O registro cronológico executável/auditável do ciclo 2 está em:

`PHASE-006-GATE-D-CYCLE-2-TRACE.yaml`

Os resumos retrospectivos anteriores não são usados como substituto da ESEV.

## Findings de governança tratados

- P1 — validações/smoke contraditórios: `REMEDIATED`;
- P1 — gatilhos de controle marcados antes da execução: `REMEDIATED` após execução read-only e registro de Beatriz, Júlia/Ricardo e Augusto;
- P2 — ciclo 2 retrospectivo em vez de ESEV: `REMEDIATED` com trace cronológico dedicado.

A evidência de execução dos controles também está registrada no PR #84, comment `5243200110`.

## Evidência pré-remediação ESEV

O HEAD `844ad2bb8aa4638d358944d1638fa12ccf391c6d` obteve:

- Foundation `31409926300`: PASS;
- Container Smoke `31409926272`: PASS;
- Vitest artifact `9071171402`, digest `sha256:da8ecefc1d93ab6f0263b9c0043134205ddf94d1de46bf19454531a5f92f8e85`.

Como a remediação ESEV altera o PRF, essa evidência não fecha o novo HEAD. O SHA remediado deve receber novos runs e revisão independente externa.

## Evidência exata do HEAD

CI/review do próprio HEAD final permanecem externas no PR #84 / GitHub Actions. Embutir aqui os IDs futuros de CI/review do commit que contém este arquivo mudaria o próprio SHA. O Gate de Léo deve verificar os IDs externos contra o HEAD corrente antes de decidir.

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
- nenhuma evidência de SHA anterior é promovida para um SHA posterior;
- todos os agentes oficiais permanecem disponíveis, mas participação decorativa é proibida.

## Arquivos

- `PHASE-006-GATE-D-PLAN.md`
- `PHASE-006-GATE-D-DECISIONS.md`
- `PHASE-006-GATE-D-REPORT.md`
- `PHASE-006-GATE-D-CYCLE-2-TRACE.yaml`
- `PHASE-006-GATE-D-VALIDATION.txt`
- `PHASE-006-GATE-D-VALIDATION-FULL.txt`
- `PHASE-006-GATE-D-SMOKE.txt`
- `PHASE-006-GATE-D-CHECKPOINT.yaml`
- `PHASE-006-GATE-D-ARTIFACT-MANIFEST.sha256`
