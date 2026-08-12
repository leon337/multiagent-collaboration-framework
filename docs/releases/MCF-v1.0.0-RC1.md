# MCF v1.0.0-RC1 — Release Candidate

**Status:** PUBLICADA — PRERELEASE  
**Missão:** `MCF-RELEASE-CANDIDATE-GATE-E`  
**Issue:** #121  
**Pull Request:** #122  
**Baseline inicial:** `c5758c2e38b599ae1673cda2691ef2ce0dc2a411`  
**Candidate auditado:** `13b5cb4f6b7a8369b0493fc3a51367d64b09c705`  
**Merge/release target:** `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`  
**Tag:** `v1.0.0-RC1`  
**GitHub Release ID:** `368946304`

## Finalidade

Registrar a qualificação e a publicação verificada da primeira Release Candidate do Multiagent Collaboration Framework.

A `v1.0.0-RC1` é uma **prerelease**. Ela não constitui versão estável nem autorização de produção.

## Escopo da RC

A RC consolida:

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

## Gate E — resultado final

```yaml
gate_e: PASS
candidate_sha: 13b5cb4f6b7a8369b0493fc3a51367d64b09c705
candidate_merge_tree_equivalence: PASS
merge_sha: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
skills_registered: 16
skills_executable: 16
skills_documental: 0
critical_findings_open: 0
high_findings_open: 0
blocking_process_findings_open: 0
emily_independent_audit: PASS
leo_gate: PASS
```

## Evidência do candidate final

```yaml
documentation:
  run: 31553244652
  result: PASS
container_smoke:
  run: 31553244682
  result: PASS
foundation:
  run: 31553244654
  result: PASS
full_validation:
  run: 31553369253
  result: PASS
prf_manifest: PASS
migrations_twice: PASS
skills_16_16_0: PASS
staging:
  run: 31553461208
  result: PASS_DEPLOYED
  recovery: false
```

## Evidência pós-merge

```yaml
main_sha_qualified: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
candidate_merge_tree_equivalence: PASS
documentation:
  run: 31554021692
  result: PASS
readonly_qualification:
  run: 31554089586
  result: PASS
  manifest: PASS
  migrations_twice: PASS
  skills_16_16_0: PASS
  external_writes: 0
  human_operator_actions: 0
staging:
  run: 31554021695
  result: PASS_DEPLOYED
  recovery: false
```

## Publicação

```yaml
publication_run: 31554462243
publication_result: PASS
tag: v1.0.0-RC1
tag_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
release_id: 368946304
release_name: MCF v1.0.0-RC1
draft: false
prerelease: true
published: true
```

A tag aponta para o SHA pós-merge que recebeu a requalificação final. A sincronização documental pós-publicação pode avançar a `main`, mas **não altera nem retargeta** a tag da RC1.

## CAF da publicação

Duas tentativas auxiliares anteriores falharam antes de existir tag/release válida. O diagnóstico comprovou que a detecção de ausência tratava o corpo JSON de um HTTP `404` como se fosse uma referência existente. O helper foi corrigido para usar o exit status HTTP e a execução `31554462243` criou/verificou tag e prerelease com sucesso.

Não houve tag com target incorreto, release duplicada ou ação técnica humana.

## Limitações conhecidas e vigentes

- produção: `BLOCKED`;
- versão estável `v1.0.0`: `BLOCKED`;
- `live_staging_adapter`: `DISABLED`;
- a Release Candidate não concede autoridade de produção;
- recovery permanece limitado às semânticas comprovadas e documentadas;
- não inferir rollback nativo onde ele não foi provado.

## Estado final deste boundary

```yaml
release_candidate: v1.0.0-RC1
release_candidate_state: PUBLISHED_PRERELEASE
gate_e: COMPLETE
production: BLOCKED
stable_release: BLOCKED
human_action_required: false
```

Nenhum próximo boundary de produção ou versão estável é autorizado por este documento.
