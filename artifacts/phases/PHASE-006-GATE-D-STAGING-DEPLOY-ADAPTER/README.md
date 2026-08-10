# PHASE-006-GATE-D-STAGING-DEPLOY-ADAPTER

PRF do adapter formal de deploy verificado para staging do MCF-RUNTIME-006.

## Estado

`CYCLE_3_CONTEMPORANEOUS_ESEV_PENDING_EXACT_HEAD_GATE`

A implementação técnica permanece aplicada. O Gate D continua aberto. O adapter
de staging não está no live `AdapterRegistry`, o dispatch real ainda não foi
autorizado e produção permanece bloqueada.

## Ciclos e fonte de evidência

- **Ciclo 1:** execução técnica histórica preservada.
- **Ciclo 2:** reconstrução histórica posterior; **não** vale como ESEV primária.
- **Ciclo 3:** recuperação válida iniciada no PR #84 com receipts individuais e
  timestampados publicados no ponto de cada atuação.

`PHASE-006-GATE-D-CYCLE-2-TRACE.yaml` é contexto histórico somente.

`PHASE-006-GATE-D-CYCLE-3-ESEV-RECEIPTS.md` é um índice dos comentários
contemporâneos já existentes no PR #84. O índice não cria prova retroativa.

## Findings que motivaram o ciclo 3

Review do HEAD `79006472f88e1d54f4f0647df95464b657cfd644`:

- P2 — Cycle 2 post-hoc/grouped: recuperação por **novo ciclo 3**, sem promoção retroativa;
- P2 — checkpoint one step behind: corrigido nesta materialização.

## Evidência anterior ao novo HEAD

Em `79006472f88e1d54f4f0647df95464b657cfd644`:

- Foundation `31410778208`: PASS;
- Container Smoke `31410778237`: PASS;
- artifact `9071498590`;
- digest `sha256:dcd21681b07eeca09b7b684ee2548ae7c7ba3b309ba424280c788f8fb3e84bb7`.

Como este PRF muda o commit, essa evidência não será promovida. O novo HEAD exige
CI/Smoke e revisão independente próprios.

## Regras preservadas

- staging only;
- produção bloqueada;
- Render secret fica no GitHub Actions;
- live registry desativado para o staging adapter;
- nenhuma prova real antes do Gate de Léo;
- HDF TEAM_FIRST;
- `human_operator_actions: 0`;
- seleção dinâmica dos 29 agentes, sem participação decorativa;
- CI/review sempre vinculadas ao SHA exato.

## Arquivos

- `PHASE-006-GATE-D-PLAN.md`
- `PHASE-006-GATE-D-DECISIONS.md`
- `PHASE-006-GATE-D-REPORT.md`
- `PHASE-006-GATE-D-CYCLE-2-TRACE.yaml`
- `PHASE-006-GATE-D-CYCLE-3-ESEV-RECEIPTS.md`
- `PHASE-006-GATE-D-VALIDATION.txt`
- `PHASE-006-GATE-D-VALIDATION-FULL.txt`
- `PHASE-006-GATE-D-SMOKE.txt`
- `PHASE-006-GATE-D-CHECKPOINT.yaml`
- `PHASE-006-GATE-D-ARTIFACT-MANIFEST.sha256`
