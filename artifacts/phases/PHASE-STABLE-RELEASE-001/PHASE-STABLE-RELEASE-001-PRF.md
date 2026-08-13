# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** EM EXECUÇÃO — correção do boundary de publicação  
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

**Correção implementada:** login, GitHub user id e corpo do comentário devem corresponder exatamente à identidade verificada de LEANDRO e ao recibo literal. O workflow ainda executa um fixture negativo que rejeita impersonação, id divergente, quoting, prefixo/sufixo e corpo multilinha.

**Evidência executável:** `MCF v1.0.0 Stable Publication Gate` run `31675959798`, job `validate-publication-boundary`, passos de identidade, predicado e inspeção do HUMAN_GATE = PASS.

**Estado:** `CORRIGIDO_COM_PROVA_EXECUTAVEL_PENDENTE_DE_REVISAO_INDEPENDENTE`.

### P1-2 — Seed the publication workflow before relying on it

**Cenário reportado:** o workflow é introduzido no PR #133 e o PR não deve ser merged para publicar; um run anterior estava apenas `SKIPPED`.

**Correção/prova:** o workflow ganhou um job read-only independente do título de aprovação. No run `31675959798`, evento real `pull_request`, esse job executou e passou a prova de provenance/ref, identidade, lineage, ausência da stable e predicado de gate. O job mutável `publish-stable` permaneceu `SKIPPED`.

**Estado:** `CORRIGIDO_COM_PROVA_EXECUTAVEL_PENDENTE_DE_REVISAO_INDEPENDENTE`.

## 4. Evidências técnicas

```yaml
rc3_production_readiness_run: 31653194401
rc3_production_readiness: PASS
latest_health_before_boundary_fix_run: 31671899893
latest_health_before_boundary_fix: PASS
publication_boundary_execution_run: 31675959798
publication_boundary_validation_job: PASS
publication_job: SKIPPED
stable_created: false
```

A validação final do head corrigido de #133, a revisão independente e a reconfirmação final de produção/health serão adicionadas antes de qualquer retorno ao HUMAN_GATE.

## 5. Segurança e governança

- permissões padrão do workflow são read-only;
- `contents: write` existe apenas no job `publish-stable`;
- o job de publicação depende do job read-only PASS;
- o título necessário para publicação é igualdade exata: `[HUMAN-APPROVED] release: publish MCF v1.0.0`;
- o recibo precisa existir exatamente uma vez e pertencer ao login `leon337`, GitHub user id `25374535`;
- a identidade é revalidada contra o usuário GitHub e o owner do repositório antes de qualquer efeito;
- a publicação, se futuramente autorizada, continua fixada ao SHA da RC3.

## 6. Imutabilidade

**Governança:** `v1.0.0`, quando publicada, será identidade pública de versão e não deve ser retargetada.

**Proteção técnica observada:** não há evidência atual de undeletability administrativa; o snapshot auditado mostrou `immutable: false` na release RC3 e nenhum ruleset do repositório. Logo, a palavra “imutável” é uma invariante de governança/versionamento, não uma alegação de proteção absoluta configurada no GitHub.

## 7. Risco residual conhecido

- finding LOW histórico de PostgreSQL/SSL permanece como dívida técnica não bloqueante enquanto não houver falha operacional associada;
- nenhuma mudança no runtime ou no SHA RC3 foi introduzida pelas correções de publicação;
- a fase não pode ser marcada concluída enquanto revisão independente, CI final e reconfirmação operacional não estiverem fechadas.

## 8. Findings / gates atuais

```yaml
publication_P0_count: 0
publication_P1_count: 2
critical_findings: 0
high_findings: 0
independent_review_after_fix: PENDING
corrected_head_production_readiness: PENDING
production_reconfirmation: PENDING
health_monitor_reconfirmation: PENDING
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
```

A contagem de P1 acima permanece `2` deliberadamente até a revisão independente validar as provas dos cenários reportados.

## 9. Próximo checkpoint

`prova executável PASS → documentação reconciliada → CI final → revisão independente → tratar findings → reconfirmar produção/health → atualizar PRF/checkpoint para verdade final → novo pacote de decisão para LEANDRO`
