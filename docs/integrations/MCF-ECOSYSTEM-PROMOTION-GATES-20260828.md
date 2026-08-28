# MCF Ecosystem — roadmap de promoção e checklist

**Snapshot UTC:** `2026-08-28T17:24:58Z`  
**MCF canônico:** `main@0b900ee03a05153e2e4a795fce7b457f5b4bb812`  
**Estado:** `AUDITED__NO_DIRECT_PROVIDER_PROMOTION__HUMAN_GATES_PREPARED`  
**Política econômica:** `ZERO_PAID_AI_API`

## Resultado executivo

Os quatro repositórios formam um ecossistema recuperável e testado em laboratório, mas ainda não
formam uma única linha de release. A analogia correta é uma ferrovia com quatro estações: os trilhos
locais existem e os mapas concordam, porém três entroncamentos ainda precisam ser reconciliados antes
de liberar um trem para a linha principal.

- o MCF foi reconciliado após os PRs #180 e #184; o PR #185 foi mergeado com todos os checks verdes;
- todo trabalho local-only conhecido foi preservado em branches remotas isoladas;
- Cloud, Cognitive Ledger e TriView foram auditados contra seus respectivos `main`;
- nenhuma dessas três linhas pode ser promovida diretamente hoje;
- os gates G2-B/VPS e NextGen NX-0 são independentes e permanecem `NOT_AUTHORIZED`;
- esta missão não acessou VPS, não executou escrita real, não ativou provider, não fez release e não
  usou API de IA paga.

## Snapshot exato dos quatro repositórios

| Projeto              | Linha principal observada | Linha de integração observada                 | Relação                                              | Decisão                   |
| -------------------- | ------------------------- | --------------------------------------------- | ---------------------------------------------------- | ------------------------- |
| MCF                  | `main@0b900ee0`           | PR #185 / `afa7f099`                          | mergeada no `main`                                   | `RECONCILED`              |
| Cloud Infrastructure | `main@ce829067`           | `mcf/mission-001-control-bridge-g1@38cd22e0`  | integração `+370/-81`; recovery SSH é linha separada | `NO_DIRECT_MERGE`         |
| Cognitive Ledger     | `main@f95bcddd`           | `design/cognitive-ledger-foundation@a64cfc05` | design `+171/-9`; PR #1 draft/conflicting            | `RECONCILE_ON_CLEAN_MAIN` |
| TriView Workspace    | `main@60b7e86`            | `release/1.0.0a4@09a361d7`                    | release `+117/-0`; PR #74 clean/draft                | `WAIT_R7_AND_HUMAN_GATE`  |

As contagens são relativas ao snapshot acima. Devem ser recalculadas antes de qualquer promoção.

## O que está comprovado

- [x] Context Fabric/Registry/Capsules e recovery estrutural read-only 4/4 possuem evidência histórica;
- [x] adapter MCF → Ledger read-only passou em laboratório com embeddings desativados;
- [x] cockpit TriView consome recovery/capabilities por GET-only em laboratório;
- [x] adapter MCF → Cloud local read-only passou em ambiente descartável;
- [x] contratos e preparação MCF para G2-B existem sem adapter live registrado;
- [x] gate autenticado `HUMANO NO CONTROLE` da PR #184 intercepta novo bootstrap pelo chat;
- [x] reconciliação pós-PRs #180/#184 foi mergeada pelo PR #185;
- [x] preservação remota do payload SSH G2-B, da continuidade VPS do MCF e dos artefatos de auditoria;
- [x] auditoria read-only de promoção dos três providers concluída.

## O que não está comprovado

- [ ] Cloud integration lineage promovido com segurança para o `main` contemporâneo;
- [ ] G2-B SSH replayado em base canônica limpa, com Ansible syntax e CI verdes;
- [ ] qualquer instalação, freshness ou escrita real na VPS/NODE-01;
- [ ] Cognitive Ledger reconciliado com `main` sem conflito e com zero-cost enforcement revalidado;
- [ ] OAuth/live provider, dados reais ou write governado MCF → Ledger;
- [ ] R7 físico completo, LEA-197, smoke MCF, update/rollback e HUMAN_GATE do TriView;
- [ ] pausa persistente de missões em andamento, restart-safe resume, safe point ou admissão global;
- [ ] autorização do boundary NextGen NX-0;
- [ ] runtime, release ou produção integrados.

## Trilhas de promoção

### P1 — Cloud Infrastructure

**Situação:** bloqueada para merge direto.

1. decidir humanamente qual é o target canônico: `main` contemporâneo ou um release train Cloud
   explicitamente preservado;
2. criar branch limpa no target escolhido;
3. decompor G1, G2-A/context e G2-B em PRs pequenos, sem merge cego dos 370 commits;
4. replayar o payload SSH preservado somente depois de comparar contrato, grant, helper e schemas;
5. decidir separadamente se o patch `ef2d10a` ainda é necessário;
6. executar secret scanner real, 13 testes SSH, 7 testes bootstrap, 4 Ansible syntax checks e CI;
7. manter VPS/SSH/write bloqueados até o gate humano separado.

**Gate detalhado:**
[`MCF-CLOUD-G2B-VPS-HUMAN-GATE-20260828.md`](gates/MCF-CLOUD-G2B-VPS-HUMAN-GATE-20260828.md).

### P2 — Cognitive Ledger

**Situação:** PR #1 draft e conflitante.

1. criar branch de promoção a partir de `main@f95bcddd` ou baseline mais novo;
2. integrar a foundation por reconciliação explícita, preservando ambos os fatos do conflito em
   `README.md`;
3. manter `COGNITIVE_LEDGER_EMBEDDING_PROVIDER=disabled` e `REINDEXAR_NO_STARTUP=0`;
4. confirmar que `OPENAI_API_KEY` isolada não ativa embeddings ou fallback;
5. executar validações Deno/Node/MCP, migrations em ambiente descartável e scan de segredos;
6. abrir um novo PR limpo para `main`; não usar o PR #1 atual como merge automático;
7. tratar deploy, OAuth, reindex, dados reais e write live como gates posteriores.

### P3 — TriView Workspace

**Situação:** PR #74 é tecnicamente mergeável, mas a própria governança do release o mantém draft.

1. reconciliar Capsule/documentação com o MCF pós-PRs #180/#184/#185;
2. renovar o SHA candidato e executar o R7 físico completo no Linux Mint/X11;
3. executar matriz LEA-197 com 5 Terminais + 5 Xed;
4. executar smoke físico MCF;
5. executar update controlado e rollback dry-run/controlado;
6. resolver o bloqueio da Issue #26;
7. obter HUMAN_GATE novo para o SHA exato;
8. somente então retirar draft, considerar merge, tag e publicação.

### P4 — MCF NextGen

**Situação:** arquitetura e plano candidatos existem; implementação continua não autorizada.

1. LEANDRO revisa disposition F1.4, arquitetura e plano no SHA/digest exatos;
2. preflight relê `main`, PRs/Issues concorrentes e as quatro Capsules;
3. se autorizado, iniciar somente `NX-0_CONTRACTS_AND_CONFORMANCE`;
4. nenhum runtime wiring, migration, provider call, modelo/API, mutação externa, release ou produção.

**Gate detalhado:**
[`MCF-NEXTGEN-NX0-HUMAN-GATE-20260828.md`](gates/MCF-NEXTGEN-NX0-HUMAN-GATE-20260828.md).

## Ordem recomendada

```text
Capsules e documentos atuais
  -> PRs documentais nos targets seguros
  -> recovery estrutural read-only 4/4
  -> promoção Cloud/Ledger/TriView em lineages independentes
  -> gate local/disposable de cada provider
  -> decisão humana separada para VPS, live write, release ou NX-0
```

As trilhas P1, P2 e P3 podem avançar em paralelo porque pertencem a repositórios diferentes. P4
também pode ser revisada em paralelo, mas nenhum código NX-0 começa por consequência do avanço dos
providers.

## Checklist de fechamento desta missão

- [x] preservar trabalho local-only em refs remotas exatas;
- [x] reconciliar e mergear o MCF pós-PRs #180/#184;
- [x] auditar branches de integração dos três providers;
- [x] rejeitar promoção direta onde a evidência não sustenta o merge;
- [ ] mergear as atualizações documentais/Capsules nos targets seguros;
- [ ] repetir recovery read-only 4/4 contra os novos SHAs documentais;
- [ ] publicar o roadmap atualizado a partir do `main` do MCF;
- [ ] registrar os Receipts finais e links de PR/checks;
- [ ] apresentar a LEANDRO os gates G2-B/VPS e NX-0 sem executá-los.

## Regra de autoridade

`MERGED != DEPLOYED != CONNECTED != AUTHORIZED != VERIFIED != ACTIVE`.

CI verde autoriza apenas a conclusão do gate descrito por aquele CI. Nenhum agente, modelo, Capsule,
documento, UI ou branch pode transformar essa evidência em permissão para VPS, escrita, provider,
release, produção ou API paga.
