# MCF v1.0.0-RC1 — Release Candidate

**Status:** EM_REVISÃO  
**Missão:** `MCF-RELEASE-CANDIDATE-GATE-E`  
**Issue:** #121  
**Baseline inicial:** `c5758c2e38b599ae1673cda2691ef2ce0dc2a411`  
**Candidate SHA:** PENDING

## Finalidade

Registrar a qualificação e, somente após Gate E aprovador, a publicação da primeira Release Candidate do Multiagent Collaboration Framework.

Este documento não representa uma release publicada enquanto `Status` permanecer `EM_REVISÃO` e `Candidate SHA` permanecer `PENDING`.

## Escopo da RC

A RC consolida o estado integrado já alcançado pelo MCF:

- 16 skills registradas;
- 16 skills executáveis;
- 0 skills documentais;
- runtime persistente e governado;
- Human Delegation Firewall;
- Permission Engine;
- receipts e Event Ledger;
- handoffs e hierarquia persistentes;
- External Action Dispatcher;
- leitura e escrita GitHub governadas;
- staging verificado e recovery controlado;
- observabilidade;
- avaliação de agentes;
- revisão de segurança;
- debug de incidentes;
- close-phase governado.

## Critério de publicação

A `v1.0.0-RC1` somente pode ser marcada como publicada quando a Issue #121 e o PRF do Gate E comprovarem:

- validações técnicas aplicáveis em PASS no SHA candidato exato;
- staging/readiness/version no SHA candidato;
- zero finding crítico ou alto aberto;
- auditoria independente de Emily em PASS;
- decisão aprovadora de Léo;
- PRF e manifest íntegros;
- release notes e limitações conhecidas reconciliadas.

## Limitações conhecidas no início da qualificação

- produção: `BLOCKED`;
- versão estável `v1.0.0`: `BLOCKED`;
- `live_staging_adapter`: `DISABLED` conforme estado canônico de entrada;
- a Release Candidate não constitui autorização de produção;
- recovery permanece limitado às semânticas comprovadas e documentadas; não se deve inferir rollback nativo onde ele não foi provado.

## Evidências

Serão preenchidas somente após execução verificável:

```yaml
candidate_sha: PENDING
pull_request: PENDING
foundation: PENDING
container_smoke: PENDING
documentation_validation: PENDING
full_test_suite: PENDING
staging_exact_sha: PENDING
security_review: PENDING
independent_audit: PENDING
leo_gate: PENDING
tag: PENDING
github_release: PENDING
```

## Estado final permitido neste boundary

```yaml
release_candidate: v1.0.0-RC1
production: BLOCKED
stable_release: BLOCKED
```
