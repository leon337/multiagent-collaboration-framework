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
gate_c_mutation_retry: NEVER
gate_c_unprovable_postwrite_state: PARTIAL_UNKNOWN
```

## 3. Estado canônico

```yaml
skills_registered: 16
skills_executable: 16
skills_documental: 0
remaining_documental: []
canonical_sync_lot_4e: COMPLETE
gate_c_technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
gate_c_canonical_state: CANONICAL_SYNC_CANDIDATE
```

## 4. Roadmap

| Boundary | Situação |
|---|---|
| Fundação / estabilização | COMPLETE |
| Gate A — contrato comum de adapters | COMPLETE |
| Gate B — leitura externa | COMPLETE |
| A1 — Code Review Read Only | COMPLETE |
| A2 — CI Query Read Only | COMPLETE |
| C1/C2 — escrita reversível | COMPLETE |
| Gate C — real provider write | TECHNICAL COMPLETE / CANONICAL SYNC CANDIDATE |
| Gate D — staging | COMPLETE |
| Observabilidade | COMPLETE |
| Lot 4-A — Recover/Product/UX/Architecture | COMPLETE |
| Lot 4-B — Evaluate Agents | COMPLETE |
| Lot 4-C — Security Review | COMPLETE |
| Lot 4-D — Debug Incident | COMPLETE |
| Lot 4-E — `MCF-CLOSE-PHASE` | COMPLETE |
| Release Candidate / Gate E | NEXT BOUNDARY |
| Produção | BLOCKED |

## 5. Lot 4-E — Close Phase

```yaml
mission: MCF-RUNTIME-006-LOT-4-E-CLOSE-PHASE
issue: 107
risk_class: C
technical_pr: 108
technical_merge: 6cf9af35407b97d84028078ab6843570b47103fe
canonical_pr: 109
canonical_merge: d0f4624a1c4f4b31eb625ddadadf523a4578b972
canonical_sync: COMPLETE
```

`MCF-CLOSE-PHASE` permanece governada por evidência, auditoria e gate de Léo. `ENTREGUE` só é válido quando não existe blocker, finding pendente, próxima ação ou ação humana requerida.

## 6. Gate C — real provider write

```yaml
mission: MCF-RUNTIME-006-GATE-C-REAL-PROVIDER-WRITE
issue: 111
risk_class: C
technical_pr: 112
technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
real_provider_proof_head: f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4
real_provider_proof_run: 31537057206
artifact_id: 9119190464
artifact_digest: sha256:6122eb9398ae0c1420e9257667f42d60badc995fe928459f3672815bf5ab84c2
artifact_stage: COMPLETE
proof_pr: 117
proof_comment_id: 5258957980
c1: PASS
c2: PASS
read_back: PASS
idempotency: PASS
ledger_receipts: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: APPROVE_TECHNICAL_GATE_C
technical_post_merge_documentation_run: 31538142320
technical_post_merge_documentation: PASS
technical_post_merge_staging_run: 31538142312
technical_post_merge_staging: PASS_DEPLOYED
canonical_state: CANONICAL_SYNC_CANDIDATE
production: BLOCKED
```

### Fail-safe permanente

```yaml
mutation_post_retry: NEVER
read_back_reconciliation: BOUNDED_GET_ONLY
transient_branch_read_back: PASS
transient_pr_read_back: PASS
postwrite_branch_auth_loss: PARTIAL_UNKNOWN
postwrite_pr_auth_loss: PARTIAL_UNKNOWN
unknown_when_unprovable: PRESERVED
```

C2 está conectado ao `AdapterRegistry` vivo. O adapter de staging continua fora desse registry, preservando o boundary do Gate D.

A infraestrutura temporária do teste real foi removida antes do merge; apenas implementação permanente, regressões e PRF foram integrados.

## 7. Sincronização canônica do Gate C

Esta branch é uma sincronização **somente documental** baseada no `main@0b060539eb152f0cf92bd146b853562407ab0a64`.

Critérios antes do merge:

- diff limitado a README/plano/PRF;
- Documentation validation PASS no SHA exato;
- consistência do manifest do PRF;
- revisão documental de Carmem;
- auditoria independente de Emily;
- decisão documental de Léo;
- produção permanece bloqueada.

Após o merge será feito um closeout documental final vinculado ao novo SHA de `main`, removendo o marcador `CANONICAL_SYNC_CANDIDATE` e registrando Gate C como `COMPLETE/ENTREGUE`.

## 8. Próximo boundary

**Release Candidate / Gate E**.

O Gate E não autoriza produção por si só. Produção permanece `BLOCKED` até gate material próprio.
