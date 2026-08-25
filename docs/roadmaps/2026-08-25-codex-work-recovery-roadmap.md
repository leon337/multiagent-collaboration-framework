# MCF — Roadmap de Recuperação do Trabalho do Codex

**Mission ID:** `MCF-20260825-CODEX-WORK-RECOVERY`  
**Phase ID:** `PHASE-01-CODEX-WORK-RECOVERY`  
**Data de abertura:** 2026-08-25  
**Coordenador:** Mestre  
**Autoridade humana final:** Leandro  
**Autoridade operacional/gate:** Léo  
**Classe de risco:** `B`  
**Estado:** `EM_EXECUCAO / RECOVERY_PLANNING`  
**Branch da missão:** `mission/codex-work-recovery-20260825`

## 1. Objetivo

Recuperar sem perda, sem reconstrução inventada e sem sobrescrita silenciosa o trabalho NextGen produzido pelo Codex na worktree local durante a missão anterior; criar um checkpoint remoto verificável; reconciliar o pacote recuperado com a fonte de verdade atual do MCF; validar integridade e devolver o trabalho para a missão NextGen original em estado recuperável.

A missão de recuperação **não autoriza** implementação de runtime NextGen, VPS, produção, release nem merge direto em `main`.

## 2. Estado verificável na abertura

```yaml
repository: leon337/multiagent-collaboration-framework
main_head_at_open: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
latest_stable_release: v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
concurrent_pr_170:
  state: OPEN
  merged: false
  head_sha: 1da1a13bd8ca47bed2f4a4e560e64691788582f8
  purpose: zero-cost Phase 2 agent execution recovery
observed_local_worktree:
  path: /home/leo/Documentos/GitHub/multiagent-collaboration-framework-nextgen-reconciliation-20260824
  evidence_level: OBSERVED_IN_SCREENSHOTS_ONLY
observed_unpublished_diff:
  files_changed: 19
  additions: 1759
  deletions: 318
  evidence_level: OBSERVED_IN_SCREENSHOTS_ONLY
```

Os valores do GitHub acima foram relidos no início desta missão. O conteúdo dos 19 arquivos locais ainda **não está disponível no GitHub** e não será reconstruído a partir de screenshots.

## 3. Fontes de verdade e precedência

1. instrução explícita atual de Leandro;
2. GitHub live do repositório oficial;
3. bytes reais da worktree/patch/arquivo local recuperado;
4. SHA e histórico da branch de recuperação;
5. documentação canônica vigente do MCF;
6. screenshots e resumos da sessão anterior apenas como evidência auxiliar;
7. inferências — nunca usadas para reconstruir conteúdo ausente.

## 4. Escopo

### Dentro do escopo

- preservar o estado local do trabalho do Codex;
- adquirir os arquivos/patch exatos da worktree original;
- inventariar arquivos, hashes e diff antes de qualquer transformação;
- criar checkpoint remoto na branch desta missão;
- comparar o pacote recuperado com `main` live e trabalho concorrente aplicável;
- preservar lineage das decisões Q1–Q16 e das revisões já realizadas;
- validar documentação, schemas, links, testes aplicáveis, secret scanning e consistência arquitetural;
- registrar achados, divergências, correções mínimas e evidências;
- entregar checkpoint verificável para continuidade da missão NextGen.

### Fora do escopo

- reconstruir arquivos manualmente com base em screenshots;
- apagar ou resetar a worktree original;
- force-push;
- merge direto em `main` sem gates;
- iniciar NX-0 ou qualquer outro boundary de implementação;
- conectar/instalar executor pago;
- tocar VPS, produção ou release;
- declarar agentes/revisores como executados sem evidência real.

## 5. Critérios de aceite da recuperação

A missão só poderá fechar como `ENTREGUE` quando:

- [ ] o payload exato da worktree original estiver acessível;
- [ ] o estado original tiver inventário de arquivos + hashes + diff preservado;
- [ ] nenhum arquivo recuperado tiver sido reconstruído por aproximação;
- [ ] existir pelo menos um commit remoto de checkpoint na branch de recuperação;
- [ ] o commit de checkpoint tiver SHA registrado;
- [ ] a branch estiver comparada contra o `main` live no momento do freeze;
- [ ] PRs/Issues concorrentes relevantes tiverem sido relidos e classificados;
- [ ] o pacote recuperado tiver passado validações aplicáveis;
- [ ] secret scan reproduzível tiver resultado registrado;
- [ ] achados pendentes anteriores, inclusive consistência `state ↔ ledger`, estiverem explicitamente classificados como `RESOLVIDO`, `PENDENTE` ou `NAO_APLICAVEL`;
- [ ] auditoria final tiver evidência suficiente para aceitar o checkpoint;
- [ ] Léo tiver emitido gate de continuidade;
- [ ] o checkpoint final indicar exatamente como a missão NextGen deve retomar sem reiniciar trabalho.

## 6. Equipe selecionada e entregas reais

| Agente | Responsabilidade nesta missão | Entrega esperada |
|---|---|---|
| Mestre | coordenação e continuidade | contrato, checkpoints, handoffs e consolidação |
| Miriam | recuperação de contexto/provenance | mapa de fontes, lacunas e precedência |
| Gabriel | Git, branch, commits e integração | inventário Git, checkpoint remoto, comparação com `main` |
| Sofia | consistência arquitetural do pacote recuperado | parecer sobre drift, boundaries e invariantes |
| Ricardo | segurança e segredos | boundary de recuperação + secret-scan review |
| Beatriz | qualidade | critérios, regressões e veredito de validação |
| Emily | auditoria independente | matriz de evidências e não conformidades |
| Léo | gate operacional | decisão de continuidade/retorno para correção |

Nenhum agente deve receber crédito de execução sem ação verificável correspondente. Nesta abertura, apenas a coordenação e as ações GitHub efetivamente realizadas pela sessão são consideradas executadas.

## 7. Cronologia operacional

### T0 — Abertura e contenção

**Objetivo:** impedir perda ou divergência adicional.

- [x] reler `main` live;
- [x] reler release `latest`;
- [x] reler PR #170;
- [x] criar branch dedicada a partir do SHA exato de `main`;
- [x] publicar este roadmap;
- [ ] registrar phase checkpoint inicial.

**Regra de saída:** branch remota de recuperação existe e a missão possui plano canônico.

### T1 — Aquisição do payload local exato

**Objetivo:** obter a fonte primária do trabalho não publicado.

Ordem de preferência:

1. acesso direto aos arquivos reais da worktree original, se a superfície de ferramentas disponibilizar o filesystem;
2. pacote `.tar/.zip` da worktree ou patch/binário exportado preservando paths e conteúdo;
3. retomada da sessão original do Codex apenas para produzir checkpoint/export não destrutivo;
4. se nenhuma opção estiver disponível, declarar `AGUARDANDO_DEPENDENCIA_EXTERNA` — nunca reconstruir por screenshots.

Checklist:

- [ ] confirmar existência da worktree original;
- [ ] capturar `git status --porcelain=v2`, branch/HEAD e remotes;
- [ ] exportar `git diff --binary` e `git diff --stat`;
- [ ] listar untracked files;
- [ ] gerar SHA-256 dos arquivos recuperados;
- [ ] preservar cópia imutável do payload antes de qualquer rebase/correção.

**Regra de saída:** payload recuperado é byte-exato e reproduzível.

### T2 — Inventário e prova de continuidade

**Objetivo:** provar o que foi recuperado antes de modificar.

- [ ] comparar inventário real com a evidência anterior de `19 files / +1759 -318`;
- [ ] explicar qualquer diferença sem apagá-la;
- [ ] identificar arquivos novos, modificados, deletados e não rastreados;
- [ ] mapear cada artefato para roadmap, arquitetura, plano NX-0, PRF e revisões;
- [ ] registrar achados históricos preservados;
- [ ] marcar qualquer conteúdo ausente como `MISSING`, não reconstruído.

**Regra de saída:** existe uma matriz `evidência anterior ↔ payload recuperado`.

### T3 — Checkpoint remoto de segurança

**Objetivo:** eliminar o risco de perda local.

- [ ] aplicar o payload recuperado sobre esta branch sem alterar semanticamente o conteúdo;
- [ ] confirmar diff esperado;
- [ ] criar commit `recovery checkpoint` contendo somente material recuperado + metadados de provenance;
- [ ] push da branch;
- [ ] registrar SHA do commit remoto;
- [ ] confirmar que o GitHub contém o checkpoint exato.

**Regra de saída:** o trabalho deixa de depender exclusivamente da máquina/sessão original.

### T4 — Releitura live e reconciliação de drift

**Objetivo:** reconciliar sem misturar recovery com redesign.

- [ ] reler HEAD de `main`;
- [ ] reler estado e HEAD da PR #170;
- [ ] reler Issues/PRs que alterem contratos usados pelo NextGen;
- [ ] comparar branch de recovery × `main` live;
- [ ] separar conflito textual de conflito semântico;
- [ ] não incorporar mudanças concorrentes silenciosamente;
- [ ] registrar decisão por conflito.

**Regra de saída:** baseline de validação está congelado e documentado.

### T5 — Validação do pacote recuperado

**Objetivo:** distinguir recuperação bem-sucedida de conteúdo tecnicamente aprovado.

Gates mínimos:

- [ ] `git diff --check`;
- [ ] validação de links/documentação aplicável;
- [ ] testes Capsule/recovery aplicáveis;
- [ ] cobertura de schemas/contratos citada pelo plano;
- [ ] secret scanner gratuito, pinado e bloqueante;
- [ ] revisão de nomenclaturas/estados;
- [ ] revisão de Request/Receipt e autorização por tentativa;
- [ ] revisão de migration sidecar/pointers;
- [ ] revisão do fluxo downstream TriView;
- [ ] revisão explícita de consistência `state ↔ ledger`;
- [ ] revisão de Q13/Q14 e seus pacotes pré-declarados;
- [ ] nenhum PASS antigo reutilizado para diff novo.

**Regra de saída:** resultados vinculados ao SHA exato do candidato.

### T6 — Auditoria e gate

**Objetivo:** fechar a recuperação, não a implementação NextGen.

- [ ] Beatriz consolida qualidade e regressões;
- [ ] Emily audita evidência, provenance e lacunas;
- [ ] inconsistências materiais retornam para correção mínima;
- [ ] Léo decide `APROVAR`, `APROVAR_COM_RESSALVAS`, `RETORNAR_PARA_CORRECAO` ou `BLOQUEAR`;
- [ ] se houver matéria reservada, abrir HUMAN_GATE para Leandro.

**Regra de saída:** checkpoint recuperado tem veredito explícito.

### T7 — Handoff para a missão NextGen

**Objetivo:** retomar do ponto recuperado, sem recomeçar.

- [ ] gerar checkpoint final com branch/SHA/base/prs considerados;
- [ ] registrar pendências reais;
- [ ] indicar próximo boundary autorizado ou próximo gate;
- [ ] manter implementação NX-0 bloqueada até autorização específica;
- [ ] retornar ao objetivo original da missão NextGen.

**Estado final esperado da recuperação:** `ENTREGUE`.

## 8. Checklist mestre

### Preservação

- [x] Branch de recuperação criada do `main` verificado.
- [x] Roadmap versionado na branch.
- [ ] Worktree original congelada/extraída.
- [ ] Patch binário preservado.
- [ ] Inventário SHA-256 preservado.
- [ ] Untracked files preservados.

### Git

- [ ] Checkpoint do payload recuperado commitado.
- [ ] Checkpoint publicado remotamente.
- [ ] SHA remoto registrado.
- [ ] Comparação com `main` live registrada.
- [ ] Nenhum force-push.
- [ ] Nenhum merge em `main` durante a fase de recovery.

### Consistência

- [ ] 19 arquivos observados reconciliados com inventário real.
- [ ] `+1759/-318` explicado ou reconciliado.
- [ ] Achados das revisões anteriores preservados.
- [ ] Estado da PR #170 reconciliado.
- [ ] `state ↔ ledger` classificado explicitamente.

### Qualidade e segurança

- [ ] Formatação/diff check PASS.
- [ ] Links PASS.
- [ ] Testes aplicáveis PASS.
- [ ] Schemas/contratos cobertos.
- [ ] Secret scan PASS.
- [ ] Nenhum dado sensível introduzido no recovery log.

### Fechamento

- [ ] Auditoria final concluída.
- [ ] Gate de Léo registrado.
- [ ] Checkpoint de continuidade publicado.
- [ ] Handoff para NextGen realizado.

## 9. Política de mudanças durante recovery

O primeiro commit após aquisição do payload deve ser um **checkpoint forense**, sem “melhorias” misturadas. Correções posteriores devem ficar em commits separados, permitindo diferenciar:

```text
O QUE O CODEX HAVIA PRODUZIDO
          ↓
RECOVERY CHECKPOINT
          ↓
RECONCILIAÇÃO COM ESTADO LIVE
          ↓
CORREÇÕES PÓS-RECOVERY
```

Isso preserva autoria, lineage e auditabilidade.

## 10. Bloqueio conhecido

A sessão atual consegue operar o GitHub oficial, mas **não possui acesso direto ao filesystem da máquina onde a worktree local foi observada**. Portanto a recuperação dos bytes locais depende de uma superfície que exponha essa worktree ou de um pacote/export fiel. Até isso ocorrer, a branch e o roadmap podem avançar, mas o conteúdo dos 19 arquivos não será inventado.

## 11. Próxima ação

Produzir o checkpoint inicial da fase e, em seguida, iniciar `T1 — Aquisição do payload local exato` pelo primeiro mecanismo disponível que preserve os bytes originais.