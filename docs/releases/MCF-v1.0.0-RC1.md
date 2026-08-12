# MCF v1.0.0-RC1 — Release Candidate

**Status:** EM_REVISÃO  
**Missão:** `MCF-RELEASE-CANDIDATE-GATE-E`  
**Issue:** #121  
**Pull Request:** #122  
**Baseline inicial:** `c5758c2e38b599ae1673cda2691ef2ce0dc2a411`  
**Technical Candidate:** `c321b01e9220d19e8ecb31ad6afcf39b6a259fcc`  
**Final Candidate SHA:** vinculado externamente ao head final do PR #122

## Finalidade

Registrar a qualificação e, somente após Gate E aprovador, a publicação da primeira Release Candidate do Multiagent Collaboration Framework.

Este documento não representa uma release publicada enquanto `Status` permanecer `EM_REVISÃO`.

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

## Evidência técnica pré-final

```yaml
technical_candidate_sha: c321b01e9220d19e8ecb31ad6afcf39b6a259fcc
foundation:
  run: 31551841728
  result: PASS
documentation_validation:
  run: 31551841725
  result: PASS
container_smoke:
  run: 31551841724
  result: PASS
full_validation:
  run: 31552850053
  result: PASS
staging:
  run: 31552113642
  result: PASS_DEPLOYED
  recovery: false
skills:
  registered: 16
  executable: 16
  documental: 0
```

Essa evidência qualifica o technical candidate; ela não substitui o reteste do head final do PR.

## Critério de publicação

A `v1.0.0-RC1` somente pode ser marcada como publicada quando a Issue #121 e o PRF do Gate E comprovarem:

- validações técnicas aplicáveis em PASS no SHA candidato final exato;
- staging/readiness/version no SHA candidato final;
- zero finding crítico ou alto aberto;
- auditoria independente de Emily em PASS;
- decisão aprovadora de Léo;
- PRF e manifest íntegros;
- release notes e limitações conhecidas reconciliadas.

## Limitações conhecidas

- produção: `BLOCKED`;
- versão estável `v1.0.0`: `BLOCKED`;
- `live_staging_adapter`: `DISABLED` conforme estado canônico de entrada;
- a Release Candidate não constitui autorização de produção;
- recovery permanece limitado às semânticas comprovadas e documentadas; não se deve inferir rollback nativo onde ele não foi provado.

## Estado de gates

```yaml
prf_structure: COMPLETE_PENDING_MANIFEST_COMMIT
final_candidate_exact_retest: PENDING
security_final_ratification: PENDING
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
