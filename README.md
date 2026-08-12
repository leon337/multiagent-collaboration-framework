# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.
- O protocolo operacional vigente está em `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

## Regras centrais

- ESEV obrigatório: atuação real deve ser exposta cronologicamente;
- CAF obrigatório para falhas recuperáveis;
- PRF rastreável para fases Classe B/C;
- sucesso sem evidência é proibido;
- evidência de gate pertence ao SHA exato;
- Leandro não é executor técnico padrão nem destinatário de handoff técnico;
- produção permanece bloqueada até gate material próprio.

## Runtime executável

```text
objetivo conversacional
→ Chat-to-Runtime Bridge
→ MissionRuntime
→ SkillRegistryLoader
→ Human Delegation Firewall
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ PostgreSQL / Event Ledger
→ Handoff / CAF
→ trace final verificado
```

## Estado canônico

```yaml
skills_registradas: 16
skills_executaveis: 16
skills_documentais: 0
remaining_documental: []

mcf_close_phase:
  executable: true
  planner_state: READY_AGENT
  primary_owner: Carmem
  owners: [Carmem, Emily, Leo, Mestre]
  handoff: Mestre
  permission_profile: SCOPED_WRITE
  provider: internal
  operation: close-phase
  resource: mcf-agent-runtime
  external_write: false
  truthful_terminal_state: REQUIRED
  hdf: ACTIVE

runtime_006_lote_4e:
  issue: 107
  technical_pr: 108
  technical_candidate: 3b202d26b08d8acb72538db77e0e3b86d540dc97
  technical_merge: 6cf9af35407b97d84028078ab6843570b47103fe
  candidate_merge_tree_equivalence: PASS
  canonical_pr: 109
  canonical_candidate: 7d571a4a19234b5e479b4e3b615e07ebb81d29a3
  canonical_merge: d0f4624a1c4f4b31eb625ddadadf523a4578b972
  canonical_sync: COMPLETE

gate_c_real_provider_write:
  issue: 111
  technical_pr: 112
  technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
  proof_head: f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4
  proof_run: 31537057206
  proof_artifact: 9119190464
  proof_stage: COMPLETE
  c1_real_write: PASS
  c2_real_write: PASS
  read_back: PASS
  idempotency: PASS
  ledger_receipts: PASS
  independent_audit: PASS
  leo_technical_gate: PASS
  technical_post_merge_documentation: PASS
  technical_post_merge_staging: PASS_DEPLOYED
  canonical_pr: 118
  canonical_merge: 3feff116a3bf66427cfdfcb10894c0f76f79ee11
  canonical_post_merge_documentation_run: 31539238013
  canonical_post_merge_documentation: PASS
  closeout_pr: 119
  closeout_merge: 303a4385aed51c531993613ca9d664d1599f538e
  closeout_post_merge_documentation_run: 31540925137
  closeout_post_merge_documentation: PASS
  canonical_state: COMPLETE
  mission_state: ENTREGUE

gate_e_release_candidate:
  mission: MCF-RELEASE-CANDIDATE-GATE-E
  issue: 121
  pr: 122
  audited_candidate: 13b5cb4f6b7a8369b0493fc3a51367d64b09c705
  candidate_merge_tree_equivalence: PASS
  release_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
  final_candidate_documentation_run: 31553244652
  final_candidate_container_smoke_run: 31553244682
  final_candidate_foundation_run: 31553244654
  final_candidate_qualification_run: 31553369253
  final_candidate_staging_run: 31553461208
  final_candidate_staging: PASS_DEPLOYED
  final_candidate_staging_recovery: false
  emily_independent_audit: PASS
  leo_gate: PASS
  merge: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
  post_merge_documentation_run: 31554021692
  post_merge_documentation: PASS
  post_merge_readonly_qualification_run: 31554089586
  post_merge_readonly_qualification: PASS
  post_merge_staging_run: 31554021695
  post_merge_staging: PASS_DEPLOYED
  post_merge_staging_recovery: false
  publication_run: 31554462243
  tag: v1.0.0-RC1
  tag_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
  github_release_id: 368946304
  prerelease: true
  gate_e: COMPLETE
  critical_findings_open: 0
  high_findings_open: 0
  human_action_required: false

production: BLOCKED
stable_v1_0_0: BLOCKED
live_staging_adapter: DISABLED
```

## Skills executáveis

1. `MCF-START-MISSION`
2. `MCF-SELECT-AGENTS`
3. `MCF-RECOVER-CONTEXT`
4. `MCF-DEFINE-PRODUCT`
5. `MCF-DESIGN-EXPERIENCE`
6. `MCF-DESIGN-ARCHITECTURE`
7. `MCF-IMPLEMENT-CHANGE`
8. `MCF-REVIEW-CODE`
9. `MCF-RUN-TESTS`
10. `MCF-GIT-PR-RELEASE`
11. `MCF-DEPLOY-VALIDATE`
12. `MCF-TRACE-MISSION`
13. `MCF-EVALUATE-AGENTS`
14. `MCF-SECURITY-REVIEW`
15. `MCF-DEBUG-INCIDENT`
16. `MCF-CLOSE-PHASE`

Não há skill documental remanescente no runtime integrado.

## Gate C — real provider write

A capacidade de escrita GitHub do runtime foi comprovada em provider real, integrada tecnicamente e reconciliada canonicamente.

### Evidência final

```yaml
technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
final_proof_head: f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4
proof_run: 31537057206
artifact_id: 9119190464
artifact_digest: sha256:6122eb9398ae0c1420e9257667f42d60badc995fe928459f3672815bf5ab84c2
proof_pr: 117
proof_comment_id: 5258957980
c1_read_back: PASS
c1_replay_no_duplicate_pr: PASS
c2_read_back: PASS
c2_duplicate_replay: RESERVATION_CONFLICT_BEFORE_NEW_ATTEMPT
ledger_attempts: 3_EVIDENCE_VALIDATED
receipts: 3
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
post_merge_documentation_run: 31538142320
post_merge_documentation: PASS
post_merge_staging_run: 31538142312
post_merge_staging: PASS_DEPLOYED
canonical_pr: 118
canonical_merge: 3feff116a3bf66427cfdfcb10894c0f76f79ee11
canonical_post_merge_documentation_run: 31539238013
canonical_post_merge_documentation: PASS
closeout_pr: 119
closeout_merge: 303a4385aed51c531993613ca9d664d1599f538e
closeout_post_merge_documentation_run: 31540925137
closeout_post_merge_documentation: PASS
canonical_state: COMPLETE
mission_state: ENTREGUE
objective_met: true
blocking_findings: 0
pending_actions: 0
human_action_required: false
historical_next_boundary_at_gate_c_closeout: RELEASE_CANDIDATE_GATE_E
production: BLOCKED
```

As mutações permanecem single-shot: o runtime nunca repete `POST` para tentar adivinhar o estado externo. A reconciliação pós-write é limitada a leituras `GET`; quando o efeito não pode ser provado, o estado permanece `PARTIAL/UNKNOWN`.

Os três workflows temporários de closeout que entraram indevidamente pelo PR #119 foram removidos. Permanecem apenas o runtime corrigido, os testes permanentes de regressão e o PRF canônico.

## Lot 4-E — Close Phase

`MCF-CLOSE-PHASE` opera como `READY_AGENT`, com Carmem como primary owner e Mestre como handoff técnico. O boundary integrado permanece:

```text
internal / close-phase / mcf-agent-runtime
```

A skill exige evidência semântica estruturada para `phase_pack`, `audit_verdict`, `leo_decision` e `checkpoint`. Um estado `ENTREGUE` é rejeitado se houver objetivo não atendido, blockers, findings não resolvidos ou bloqueantes, auditoria não-PASS, próxima ação pendente, ação humana pendente, decisão não aprovadora de Léo ou divergência entre decisão e checkpoint.

O antigo `handoff_to: Leandro` foi reconciliado para `handoff_to: Mestre`. LEANDRO permanece autoridade humana final e só pode ser acionado por um `HUMAN_GATE` explícito; não é executor nem handoff técnico.

### Evidência técnica e integração

```yaml
final_candidate: 3b202d26b08d8acb72538db77e0e3b86d540dc97
foundation_run: 31485695643
foundation: PASS
container_smoke_run: 31485695636
container_smoke: PASS
documentation_validation_run: 31485695606
documentation_validation: PASS
server_test_files: 125
server_tests: 562
failed_tests: 0
prf_manifest_audit_run: 31485724987
prf_manifest_audit: PASS
specialist_reviews: PASS
augusto_trace: PASS
carmem_prf_review: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_gate: PASS
technical_merge: 6cf9af35407b97d84028078ab6843570b47103fe
candidate_merge_tree_equivalence: PASS
technical_post_merge_documentation_run: 31486181380
technical_post_merge_documentation: PASS
technical_post_merge_staging_run: 31486181369
technical_post_merge_staging: PASS_DEPLOYED
canonical_candidate: 7d571a4a19234b5e479b4e3b615e07ebb81d29a3
canonical_documentation_run: 31486782247
canonical_documentation: PASS
canonical_manifest_audit_run: 31486845037
canonical_manifest_audit: PASS
canonical_merge: d0f4624a1c4f4b31eb625ddadadf523a4578b972
canonical_post_merge_documentation_run: 31487031172
canonical_post_merge_documentation: PASS
canonical_sync: COMPLETE
```

## Gate E — Release Candidate

O Gate E foi concluído como boundary Classe C de qualificação e publicação da primeira RC.

```yaml
mission: MCF-RELEASE-CANDIDATE-GATE-E
issue: 121
pr: 122
candidate: 13b5cb4f6b7a8369b0493fc3a51367d64b09c705
candidate_merge_tree_equivalence: PASS
merge_release_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
skills: 16_16_0
prf_manifest: PASS
full_validation: PASS
migrations_twice: PASS
final_candidate_staging: PASS_DEPLOYED
final_candidate_recovery: false
emily_independent_audit: PASS
leo_gate: PASS
post_merge_qualification: PASS
post_merge_staging: PASS_DEPLOYED
post_merge_recovery: false
tag: v1.0.0-RC1
github_release_id: 368946304
prerelease: true
critical_findings_open: 0
high_findings_open: 0
human_action_required: false
production: BLOCKED
stable_v1_0_0: BLOCKED
```

A tag `v1.0.0-RC1` permanece ligada ao SHA qualificado `9b4a759...`; atualizações documentais posteriores da `main` não alteram a identidade da RC.

## Documentação canônica

- `docs/runtime/README.md`
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `docs/decisions/MCF-DEC-062-GATE-E-RELEASE-CANDIDATE.md`
- `docs/releases/MCF-v1.0.0-RC1.md`
- `artifacts/phases/PHASE-006-LOT-4-E-CLOSE-PHASE/`
- `artifacts/phases/PHASE-006-GATE-C-REAL-PROVIDER-WRITE/`
- `artifacts/phases/PHASE-006-GATE-E-RELEASE-CANDIDATE/`

## Boundary atual

**Gate E concluído e `v1.0.0-RC1` publicada como prerelease.**

Este closeout não autoriza um próximo boundary técnico. Produção continua `BLOCKED` e `v1.0.0` estável continua `BLOCKED`. Qualquer promoção estável, produção ou nova missão exige boundary posterior próprio e autorização aplicável.
