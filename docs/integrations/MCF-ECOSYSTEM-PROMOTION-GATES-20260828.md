# MCF Ecosystem — roadmap de promoção e checklist

**Snapshot UTC:** `2026-08-28T18:33:40Z`
**Baseline MCF recuperado:** `main@b2be8eeb1c6753bea912cca741803f8497ab880a` (o commit documental deste relatório é posterior)
**Estado:** `REPOSITORY_ALIGNMENT_COMPLETE__LIVE_GATES_CLOSED`
**Política econômica:** `ZERO_PAID_AI_API`

## Resultado executivo

Os quatro repositórios formam um ecossistema recuperável e testado em laboratório, mas continuam em
linhas de release independentes. A analogia correta é uma ferrovia com quatro estações: os mapas e as
fichas de cada estação agora concordam; isso não dá ao trem autorização para entrar na VPS, conectar
providers ou publicar uma release.

- o MCF foi reconciliado após os PRs #180 e #184; o PR #185 foi mergeado em `0b900ee0` e o PR #186
  concluiu o alinhamento documental em `main@b2be8eeb`, ambos com todos os checks verdes;
- todo trabalho local-only conhecido foi preservado em branches remotas isoladas;
- Cloud PR #38 incorporou Capsule/evidência na linha de integração, merge `420ee7d2`, com CI verde;
- TriView PRs #79/#80 incorporaram Capsule/documentação na linha de release, culminando em
  `7b2440a6`, com CI verde;
- Cognitive Ledger PR #4 está draft/limpa e com dois checks verdes, mas permanece aberta porque
  atualizar a branch de design pode disparar o auto-deploy Render documentado;
- nenhuma linha provider foi promovida para `main`, provider live, VPS ou release por esses merges;
- o recovery final read-only passou 4/4 em Cloud
  `420ee7d26bc40159e3040a5319b16b21a6f02499`, Ledger
  `a3fc0d61737d4b0b55b265f34383c0e9b77d7334`, MCF
  `b2be8eeb1c6753bea912cca741803f8497ab880a` e TriView
  `7b2440a64d6519515100911f486547480b5ab9aa`, cada resultado com 17 claims, 6 sources, zero warnings
  e nenhuma ação material;
- a versão do roadmap incorporada pelo PR #186 foi confirmada byte a byte na Vercel, e os Receipts
  finais foram registrados na
  [evidência de recovery 4/4](evidence/MCF-ECOSYSTEM-RECOVERY-4OF4-20260828.md);
- o workflow automático de staging MCF, run `33198097882`, terminou com conclusion `failure` e
  resultado controlado `RECOVERED` depois de invocar o hook Render para uma tentativa real de
  staging; o novo SHA não foi confirmado e o saudável
  `5c7f9832f037f374ec3fe2d4160342a5f2cf8a06` foi preservado; não houve retry manual, acesso à VPS ou
  runtime de produção, e os follow-ons RC2/RC3 foram `immutable NOOP` sem criar ou redirecionar
  release;
- os gates G2-B/VPS e NextGen NX-0 são independentes e permanecem `NOT_AUTHORIZED`;
- nenhum agente desta missão acessou VPS, executou write de dados, ativou provider, publicou release
  ou usou API de IA paga; a tentativa automática de staging acima foi o único efeito externo de
  runtime disparado pelo merge.

## Snapshot exato dos quatro repositórios

| Projeto              | Linha principal observada | Linha segura atual                                   | Evidência atual                                                          | Decisão                             |
| -------------------- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| MCF                  | `main@b2be8eeb`           | `main@b2be8eeb`                                      | PR #186 mergeada; 7 checks verdes; roadmap publicado; recovery final 4/4 | `RECONCILED`                        |
| Cloud Infrastructure | `main@ce829067`           | `mcf/mission-001-control-bridge-g1@420ee7d2`         | PR #38 mergeada; checks pré e pós-merge verdes                           | `DOC_SYNC_DONE__NO_MAIN_PROMOTION`  |
| Cognitive Ledger     | `main@f95bcddd`           | PR #4 draft, head `a3fc0d61` → `design/...@a64cfc05` | PR limpa; 2/2 checks verdes; risco de auto-deploy no target              | `KEEP_OPEN__EXTERNAL_DEPLOY_GATE`   |
| TriView Workspace    | `main@60b7e86`            | `release/1.0.0a4@7b2440a6`                           | PRs #79/#80 mergeadas; PR #74 continua draft/clean e CI verde            | `DOC_SYNC_DONE__WAIT_R7_HUMAN_GATE` |

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
- [x] Capsules/documentação Cloud e TriView incorporadas nos targets não produtivos, com CI verde;
- [x] candidato Ledger validado e mantido fora do target ligado ao Render;
- [x] recovery preliminar dos quatro candidatos retornou `RECOVERED` 4/4, zero warnings,
      `read_only=true`, `evidence_only=true` e `material_action=false`.
- [x] recovery final contra Cloud `420ee7d2`, Ledger `a3fc0d61`, MCF `b2be8eeb` e TriView
      `7b2440a6` retornou `RECOVERED` 4/4, com 17 claims, 6 sources e zero warnings por repositório;
- [x] versão PR #186 do roadmap confirmada byte a byte na Vercel e Receipts finais registrados na
      evidência auditável;
- [x] staging automático MCF run `33198097882` invocou o hook Render, não confirmou o novo SHA e
      recuperou de forma controlada o SHA saudável `5c7f9832`, sem retry manual, VPS ou runtime de
      produção.

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

**Situação:** Capsule/evidência atualizadas na linha de integração pelo PR #38; promoção da linha para
`main` continua bloqueada.

1. tratar `420ee7d26bc40159e3040a5319b16b21a6f02499` como snapshot documental da linha de integração,
   não como candidato automático a `main`;
2. decidir humanamente qual é o target canônico: `main` contemporâneo ou um release train Cloud
   explicitamente preservado;
3. criar branch limpa no target escolhido e decompor G1, G2-A/context e G2-B em PRs pequenos, sem
   merge cego da história divergente;
4. replayar o payload SSH preservado somente depois de comparar contrato, grant, helper e schemas;
5. decidir separadamente se o patch `ef2d10a` ainda é necessário;
6. executar secret scanner real, 13 testes SSH, 7 testes bootstrap, 4 Ansible syntax checks e CI;
7. manter VPS/SSH/write bloqueados até o gate humano separado.

**Gate detalhado:**
[`MCF-CLOUD-G2B-VPS-HUMAN-GATE-20260828.md`](gates/MCF-CLOUD-G2B-VPS-HUMAN-GATE-20260828.md).

### P2 — Cognitive Ledger

**Situação:** PR #4 está draft/`CLEAN`, com os dois jobs verdes, mas foi mantida fora do target
`design/cognitive-ledger-foundation` porque essa branch possui auto-deploy Render documentado. O PR
#1 histórico continua draft/conflitante e não é candidato automático.

1. não mergear o PR #4 enquanto o auto-deploy Render não estiver comprovadamente desabilitado ou
   houver autorização humana específica para esse efeito externo;
2. depois desse gate, incorporar somente a atualização documental na linha de design;
3. criar uma futura branch de promoção a partir de `main@f95bcddd` ou baseline mais novo;
4. integrar a foundation por reconciliação explícita, preservando ambos os fatos do conflito em
   `README.md`;
5. manter `COGNITIVE_LEDGER_EMBEDDING_PROVIDER=disabled` e `REINDEXAR_NO_STARTUP=0`;
6. confirmar que `OPENAI_API_KEY` isolada não ativa embeddings ou fallback;
7. tratar deploy, OAuth, reindex, dados reais e write live como gates posteriores.

### P3 — TriView Workspace

**Situação:** Capsule/documentação foram atualizadas pelos PRs #79/#80; `release/1.0.0a4` está em
`7b2440a64d6519515100911f486547480b5ab9aa`. O PR #74 continua tecnicamente mergeável e draft,
preservando o gate físico da release.

1. usar `7b2440a64d6519515100911f486547480b5ab9aa` como candidato exato e executar o R7 físico completo
   no Linux Mint/X11;
2. executar matriz LEA-197 com 5 Terminais + 5 Xed;
3. executar smoke físico MCF;
4. executar update controlado e rollback dry-run/controlado;
5. resolver o bloqueio da Issue #26;
6. obter HUMAN_GATE novo para o SHA exato;
7. somente então retirar draft, considerar merge, tag e publicação.

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
  -> Cloud/TriView documentados nos targets seguros; Ledger preservado atrás do gate Render
  -> recovery estrutural read-only 4/4
  -> futura promoção Cloud/Ledger/TriView em lineages independentes
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
- [x] mergear atualizações documentais/Capsules de Cloud e TriView nos targets seguros;
- [x] validar o PR documental Ledger e mantê-lo aberto atrás do gate Render;
- [x] repetir recovery read-only 4/4 contra os novos SHAs documentais;
- [x] publicar e confirmar byte a byte a versão PR #186 do roadmap a partir do `main` do MCF;
- [x] registrar os Receipts finais e links de PR/checks;
- [x] apresentar a LEANDRO os gates G2-B/VPS e NX-0 sem executá-los.

## Regra de autoridade

`MERGED != DEPLOYED != CONNECTED != AUTHORIZED != VERIFIED != ACTIVE`.

CI verde autoriza apenas a conclusão do gate descrito por aquele CI. Nenhum agente, modelo, Capsule,
documento, UI ou branch pode transformar essa evidência em permissão para VPS, escrita, provider,
release, produção ou API paga.
