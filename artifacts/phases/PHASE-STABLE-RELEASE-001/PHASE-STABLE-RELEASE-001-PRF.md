# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** REQUALIFYING — correção e reteste do boundary de publicação  
**Autoridade humana:** LEANDRO  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## 1. Objetivo da fase

Qualificar e preparar a promoção pública de `v1.0.0` no SHA exato da RC3, sem publicar antes do HUMAN_GATE de LEANDRO e sem alterar RC1, RC2 ou RC3.

## 2. Estado verificável

```yaml
qualified_rc3_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_v1_0_0: NAO_PUBLICADA
publication_target_if_authorized: 7f741e10d0e745a90c732e084400b11e3f5e6794
publication_authorized: false
```

Os commits do PR #133 são control plane de publicação e não modificam o SHA candidato da release.

## 3. Findings do boundary

### P1-1 — Authenticate the human-gate comment author

**Cenário reportado:** qualquer comentário contendo a substring de aprovação poderia satisfazer o gate.

**Correção:** o predicado foi substituído por identidade GitHub canônica de LEANDRO (`login=leon337`, user id `25374535`) e corpo exato; fixtures negativos rejeitam impersonação, id divergente, quoting e conteúdo adicional.

**Prova:** run `31676208679`, job read-only `validate-publication-boundary` PASS. A revisão independente do head `24980e02cccf9f45041237540f9d0598bb67175e` não registrou recorrência desse P1.

**Estado:** `CORRIGIDO_COM_PROVA_E_REVISAO_SEM_RECORRENCIA`.

### P1-2 — Seed the publication workflow before relying on it

**Cenário reportado:** o workflow é introduzido no PR #133 e o PR não deve ser merged para publicar; um run anterior estava apenas `SKIPPED`.

**Correção/prova:** o workflow possui job read-only independente do título de aprovação. Run `31676208679`, evento real `pull_request`, executou a partir de `refs/pull/133/merge`, provou provenance/ref e terminou PASS; o job mutável permaneceu `SKIPPED`. A revisão independente do head `24980e02...` não registrou recorrência desse P1.

**Estado:** `CORRIGIDO_COM_PROVA_E_REVISAO_SEM_RECORRENCIA`.

### P1-3 — Bind the human approval receipt to the reviewed head

**Cenário reportado na revisão independente do head `f34a58cec64b7bda23a6d0cdcfb82c3c91e3724b`:** um recibo humano válido para um HEAD anterior continuaria satisfazendo o predicado após um evento `synchronize`.

**Correção implementada:** o recibo agora é específico simultaneamente para a release e para o `PR_HEAD` do evento. O corpo esperado é exatamente:

```text
LEANDRO_HUMAN_GATE: APPROVED
RELEASE: v1.0.0
PR_HEAD: <SHA exato do HEAD revisado do PR #133>
```

O workflow também reconsulta o HEAD atual do PR imediatamente antes do job mutável, impedindo um run antigo de publicar depois de um novo push. O fixture negativo inclui recibo com HEAD obsoleto.

**Estado:** `CORRIGIDO_PENDENTE_DE_TESTE_DEDICADO_E_REVISAO_INDEPENDENTE_NO_NOVO_HEAD`.

### P2-1 — Recovery após criação parcial da stable

**Cenário:** se a tag/release correta fosse criada e a verificação final falhasse transitoriamente, o validador anterior rejeitaria qualquer rerun porque exigia ausência absoluta de `v1.0.0`.

**Correção implementada:** o validador aceita estado de recovery somente quando tag e release já existem exatamente no SHA RC3, a release é não-draft/não-prerelease, o título do PR continua no valor aprovado e existe exatamente um recibo HUMAN_GATE válido para o HEAD corrente. Qualquer stable divergente continua fail-closed.

**Estado:** `CORRIGIDO_PENDENTE_DE_TESTE_E_REVISAO`.

### P2-2 — Reconciliação dos artefatos canônicos

PRF, REPORT, README e checkpoint estavam descrevendo estados diferentes após as rodadas intermediárias de review.

**Correção:** este ciclo reconcilia todos os artefatos para o mesmo estado `REQUALIFYING`, registra os findings novos e mantém a stable não autorizada.

**Estado:** `CORRIGINDO_NESTE_HEAD`.

## 4. Evidências técnicas preservadas

```yaml
rc3_production_readiness_run: 31653194401
rc3_production_readiness: PASS
latest_health_run: 31671899893
latest_health_result: PASS
latest_health_detail: INITIAL_TIMEOUT_THEN_COLD_START_RECOVERY
prior_boundary_execution_run: 31676208679
prior_boundary_validation_job: PASS
prior_publication_job: SKIPPED
stable_created: false
```

A evidência do novo HEAD somente será adicionada depois que o workflow executar novamente. Nenhuma correção deste PR altera o runtime nem o SHA `7f741e10...` da RC3.

## 5. Segurança e governança

- permissões padrão do workflow são read-only;
- `contents: write` existe apenas no job `publish-stable`;
- o job de publicação depende do job read-only PASS;
- o título necessário para publicação é igualdade exata: `[HUMAN-APPROVED] release: publish MCF v1.0.0`;
- o recibo HUMAN_GATE é autenticado por login + user id + corpo exato e agora é vinculado ao `PR_HEAD` corrente e à release `v1.0.0`;
- o HEAD remoto atual do PR é revalidado antes de qualquer efeito;
- a identidade é revalidada contra o usuário GitHub e o owner do repositório;
- a publicação, se futuramente autorizada, continua fixada ao SHA da RC3;
- o mecanismo de publicação marca `v1.0.0` como `latest`; esse efeito permanece proibido enquanto HUMAN_GATE não for aprovado.

## 6. Imutabilidade

**Imutabilidade de governança:** `v1.0.0`, quando publicada, será identidade pública de versão e não deve ser retargetada.

**Proteção técnica observada:** não há evidência de undeletability administrativa. A RC3 expõe `immutable: false`, `main` não está marcada como branch protegida e a API de rulesets retorna lista vazia. Portanto não é feita alegação de proteção técnica absoluta.

## 7. Produção e monitor

- produção qualificada permanece vinculada ao SHA RC3 `7f741e10...` conforme evidência da missão;
- monitor agendado mais recente verificado: run `31671899893`, `SUCCESS`;
- o probe inicial expirou após 20 s, seguido de recuperação na segunda tentativa tolerante a cold start;
- o workflow não abriu novo incidente nesse ciclo;
- Issue operacional #129 permanece `CLOSED / completed`.

Esse comportamento é reportado como sinal operacional relevante, não como incidente material aberto.

## 8. Findings / gates atuais

```yaml
publication_P0_count: 0
publication_P1_count: 1
critical_findings: 0
high_findings: 0
p2_open_or_pending_review: 2
independent_review_current_corrected_head: PENDING
corrected_head_ci: PENDING
production_reconfirmation: PARTIAL_PASS
health_monitor_reconfirmation: PASS_WITH_COLD_START_RECOVERY
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
```

A contagem de P1 só poderá voltar a zero depois de teste dedicado no novo HEAD e nova revisão independente confirmarem a eliminação do cenário de aprovação obsoleta.

## 9. Próxima ação

`finalizar reconciliação documental → validar novo HEAD em CI → provar fixture de HEAD obsoleto + recovery fail-closed → revisão independente → tratar qualquer finding → renovar auditoria multiagente Classe C/LÉO → reconfirmar produção/monitor/stable absence → somente então preparar novo pacote de decisão para LEANDRO`.

Nenhum conteúdo deste PRF constitui autorização humana para publicar `v1.0.0`.