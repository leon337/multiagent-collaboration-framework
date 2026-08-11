# MCF-RUNTIME-006 — Plano canônico

## 1. Objetivo

Expandir o MCF para execução real governada por contratos de permissão, evidência verificável, recuperação, observabilidade, handoffs persistentes e gates proporcionais ao risco.

## 2. Invariantes

```yaml
source_of_truth: GitHub
human_final_authority: Leandro
orchestrator: Mestre
internal_gate_authority: Leo
human_delegation_firewall: ACTIVE
success_without_evidence: FORBIDDEN
stale_sha_gate_evidence: FORBIDDEN
team_first: REQUIRED
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
```

## 3. Estado canônico

```yaml
skills_registered: 16
skills_executable: 15
skills_documental: 1
remaining_documental:
  - MCF-CLOSE-PHASE
```

## 4. Roadmap

| Boundary | Situação |
|---|---|
| Fundação / estabilização | COMPLETE |
| Gate A — contrato comum de adapters | COMPLETE |
| Gate B — leitura externa | COMPLETE |
| A1 — Code Review Read Only | COMPLETE |
| A2 — CI Query Read Only | COMPLETE |
| C1/C2 — escrita reversível | IMPLEMENTED |
| Gate C — real provider write | PARTIAL / NOT AUTHORIZED |
| Gate D — staging | COMPLETE |
| Observabilidade | COMPLETE |
| Lot 4-A — Recover/Product/UX/Architecture | COMPLETE |
| Lot 4-B — Evaluate Agents | COMPLETE |
| Lot 4-C — Security Review | COMPLETE |
| Lot 4-D — Debug Incident | COMPLETE |
| `MCF-CLOSE-PHASE` | PENDING / NEXT BOUNDARY |
| Release Candidate | PENDING |
| Produção | BLOCKED |

## 5. Lot 4-D — Debug Incident

```yaml
mission: MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT
issue: 103
risk_class: C
baseline_main: 79c1a1644742cf22af60384b64685adbb1f017a3
technical_pr: 104
technical_candidate: dccb41f146f5701f75d8762df89160bf2f1695a7
technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
technical_tree_equivalence: PASS
canonical_pr: 105
canonical_candidate: 41f2ed1cda3e9cb2812bb7f8e8bee9553a0140b9
canonical_merge: 59b230e8ad834b88c1dc4363bc9a28499881e1fe
canonical_sync: COMPLETE
```

### Skill

```yaml
skill_id: MCF-DEBUG-INCIDENT
primary_owner: Patricia
owners: [Patricia, Bruno, Rafael]
required_inputs: [symptom_or_evidence]
permission_profile: SCOPED_WRITE
planner_state: READY_AGENT
provider: internal
operation: inspect-debug-incident
resource: mcf-agent-runtime
handoff_to: Renato
required_evidence: [reproduction, root_cause, recovery_result]
acceptance_criteria: [cause_supported, regression_test_added]
```

### Boundary

```yaml
external_write: FORBIDDEN
github_provider_write: FORBIDDEN
environment_mutation: FORBIDDEN
deploy: FORBIDDEN
production_action: FORBIDDEN
destructive_fix: FORBIDDEN
secret_access: FORBIDDEN
public_action: FORBIDDEN
blind_retry: FORBIDDEN
```

### Evidência semântica

`reproduction` exige sintoma, método e referência verificável. `root_cause` exige causa e evidência de suporte. `recovery_result` exige ação/mitigação, verificação, `blind_retry: false`, `retry_evidence` semântico independente e referência verificável do teste de regressão.

Ausência, vazio, whitespace, placeholder, objeto vazio ou booleano usado como substituto de evidência gera `RECOVERING`, nunca sucesso fabricado.

### Planner e ownership

- objetivos inequívocos de debug selecionam `MCF-DEBUG-INCIDENT`;
- Patricia é primary owner;
- Bruno e Rafael também são owners válidos;
- non-owner é negado;
- bridge não auto-completa;
- handoff Renato somente após sucesso válido;
- objetivo explicitamente de security review continua em Ricardo / `MCF-SECURITY-REVIEW` / Classe C.

## 6. Evidência técnica

```yaml
foundation_run: 31479541126
foundation: PASS
container_smoke_run: 31479541177
container_smoke: PASS
server_test_files: 122
server_tests: 527
web_tests: 5
ops_tests: 20
failed_tests: 0
technical_manifest: PASS
specialist_reviews: PASS
augusto_trace: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
technical_merge: COMPLETE
technical_tree_equivalence: PASS
```

## 7. Canonical documentation sync

```yaml
documentary_pr: 105
documentary_candidate: 41f2ed1cda3e9cb2812bb7f8e8bee9553a0140b9
documentation_validation_run: 31481344101
documentation_validation: PASS
documentary_manifest: PASS
carmem_review: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_documentary_gate: PASS
documentary_merge: 59b230e8ad834b88c1dc4363bc9a28499881e1fe
canonical_sync: COMPLETE
```

Um micro-closeout documental pós-merge registra este estado `COMPLETE` de forma verdadeira, sem alterar código/runtime e sem implementar o próximo boundary.

## 8. CAFs do Lot 4-D

1. formatting corrigido e revalidado;
2. prova de ausência de blind retry fortalecida com `retry_evidence` semântico;
3. roteamento de incidente corrigido para não sobrepor security review;
4. marcadores pré-merge `IN_PROGRESS/CANDIDATE` removidos da fonte canônica após o merge documental.

## 9. Próximo boundary

`MCF-CLOSE-PHASE`

Deve ser formalizado e executado separadamente. O Lot 4-D não o implementa.
