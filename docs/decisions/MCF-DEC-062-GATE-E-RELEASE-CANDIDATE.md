# MCF-DEC-062 — Gate E e Release Candidate v1.0.0-RC1

**Status:** VIGENTE  
**Classificação:** DECISÃO OPERACIONAL CLASSE C  
**Missão:** MCF-RELEASE-CANDIDATE-GATE-E  
**Issue:** #121  
**PR técnico/documental do Gate:** #122  
**Baseline:** `main@c5758c2e38b599ae1673cda2691ef2ce0dc2a411`  
**Candidate auditado:** `13b5cb4f6b7a8369b0493fc3a51367d64b09c705`  
**Merge qualificado:** `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`  
**Release:** `v1.0.0-RC1`

## 1. Problema observado

O MCF havia concluído os boundaries técnicos previstos antes do Release Candidate, mas ainda não possuía uma versão candidata formal, tag/release registrada nem um Gate E executado sobre evidência nova vinculada ao SHA exato do candidato.

## 2. Regra anterior

O plano canônico do `MCF-RUNTIME-006` encerrou os boundaries técnicos anteriores com `Release Candidate / Gate E` como próximo boundary e produção bloqueada.

## 3. Decisão executada

Foi realizada uma fase de qualificação de release, sem expansão funcional, que produziu a primeira versão candidata formal:

`v1.0.0-RC1`

O Gate E foi aprovado por Léo somente depois de satisfeitos os critérios da Issue #121 no candidate exato, com PRF Classe C, reteste, staging e auditoria independente.

A publicação ocorreu somente após:

1. merge governado do PR #122 com proteção de `expected_head_sha`;
2. equivalência de árvore candidate→merge;
3. revalidação da `main` pós-merge;
4. staging exato da `main` pós-merge sem recovery;
5. criação e verificação de tag/release no SHA qualificado.

## 4. Boundary

Executado e permitido:

- documentação e PRF do Gate E;
- validação integral aplicável;
- reteste e auditoria independente;
- staging no SHA exato do candidato;
- correção mínima via CAF para blockers reais do Gate;
- branch, PR e merge governados;
- tag e GitHub Release da RC após gate aprovador e revalidação pós-merge.

Permanece proibido por esta decisão:

- produção;
- promoção para `v1.0.0` estável;
- nova funcionalidade sem novo boundary autorizado;
- mudança de autoridade, finalidade ou público;
- ação destrutiva;
- sucesso com evidência de SHA supersedido.

## 5. Critérios materiais — resultado

```yaml
skills_registered: 16
skills_executable: 16
skills_documental: 0
foundation: PASS
container_smoke: PASS
documentation: PASS
migrations_twice: PASS
full_validation: PASS
staging_exact_sha: PASS
staging_recovery: false
architecture: PASS
agent_evaluation: PASS
security: PASS
mission_trace: PASS
prf_manifest: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_gate: PASS
critical_findings_open: 0
high_findings_open: 0
blocking_process_findings_open: 0
```

## 6. Evidência do candidate final

```yaml
candidate_sha: 13b5cb4f6b7a8369b0493fc3a51367d64b09c705
documentation_run: 31553244652
container_smoke_run: 31553244682
foundation_run: 31553244654
final_qualification_run: 31553369253
final_staging_run: 31553461208
final_staging_outcome: DEPLOYED
final_staging_recovery: false
```

## 7. Evidência pós-merge

```yaml
merge_sha: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
candidate_merge_tree_equivalence: PASS
post_merge_documentation_run: 31554021692
post_merge_documentation: PASS
post_merge_readonly_qualification_run: 31554089586
post_merge_readonly_qualification: PASS
post_merge_staging_run: 31554021695
post_merge_staging: PASS_DEPLOYED
post_merge_staging_recovery: false
```

## 8. Publicação da RC1

```yaml
tag: v1.0.0-RC1
tag_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
github_release_id: 368946304
release_name: MCF v1.0.0-RC1
draft: false
prerelease: true
publication_run: 31554462243
publication_result: PASS
```

A tag permanece fixada no SHA qualificado `9b4a759...`. A sincronização documental posterior não retargeta a release.

## 9. CAFs relevantes

- falsos negativos dos helpers de qualificação foram diagnosticados como defeitos do controle auxiliar, sem falha do candidate e sem duplicar efeito externo;
- a publicação teve duas tentativas auxiliares que falharam antes de criar tag/release válida;
- a causa final foi a detecção incorreta de HTTP `404` pelo corpo da resposta em vez do exit status;
- depois da correção, a tag e a prerelease foram criadas e verificadas exatamente uma vez;
- helpers efêmeros foram removidos após os respectivos PASS.

## 10. Impacto

O Gate E conclui o boundary formal de qualificação da primeira Release Candidate. Ele não altera contratos de execução do runtime nem concede nova autoridade de produção.

## 11. Limitações vigentes

```yaml
release_candidate: v1.0.0-RC1
release_candidate_state: PUBLISHED_PRERELEASE
production: BLOCKED
stable_v1_0_0: BLOCKED
live_staging_adapter: DISABLED
human_action_required_for_gate_e: false
```

Qualquer promoção estável, liberação de produção ou novo desenvolvimento exige boundary posterior próprio e não é autorizada por esta decisão.

## 12. Artefatos afetados

- Issue #121;
- PR #122;
- `artifacts/phases/PHASE-006-GATE-E-RELEASE-CANDIDATE/` — histórico imutável do Gate;
- `docs/releases/MCF-v1.0.0-RC1.md`;
- `README.md`;
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`.
