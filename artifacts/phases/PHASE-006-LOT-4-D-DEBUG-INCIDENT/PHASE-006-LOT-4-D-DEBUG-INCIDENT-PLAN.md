# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Plan

```yaml
mission: MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT
issue: 103
risk_class: C
technical_pr: 104
technical_state: MERGED
canonical_pr: 105
canonical_sync: COMPLETE
closeout_recording: IN_PROGRESS
```

## Objetivo

Promover `MCF-DEBUG-INCIDENT` para capacidade executável governada, sem nova autoridade externa, e reconciliar canonicamente o estado após integração técnica e documental.

## Contrato

```yaml
skill_id: MCF-DEBUG-INCIDENT
primary_owner: Patricia
owners: [Patricia, Bruno, Rafael]
permission_profile: SCOPED_WRITE
planner_state: READY_AGENT
provider: internal
operation: inspect-debug-incident
resource: mcf-agent-runtime
handoff: Renato
required_evidence: [reproduction, root_cause, recovery_result]
```

Recuperação válida exige ação/mitigação, verificação, `blind_retry: false`, `retry_evidence` semântico e referência verificável de regressão. Evidência insuficiente leva a `RECOVERING` sem handoff de sucesso.

## Boundary

External/GitHub write, mutação de ambiente, deploy/produção, destructive fix, secret/public action e blind retry continuam proibidos.

## Integração técnica

```yaml
candidate: dccb41f146f5701f75d8762df89160bf2f1695a7
foundation_run: 31479541126
container_smoke_run: 31479541177
technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
technical_tree_equivalence: PASS
reviews_and_gates: PASS
```

## Integração documental

```yaml
candidate: 41f2ed1cda3e9cb2812bb7f8e8bee9553a0140b9
documentation_validation_run: 31481344101
documentary_gate: PASS
documentary_merge: 59b230e8ad834b88c1dc4363bc9a28499881e1fe
canonical_sync: COMPLETE
```

O micro-closeout pós-merge existe apenas para gravar a conclusão verdadeira na fonte canônica e no PRF. Não altera runtime e não implementa `MCF-CLOSE-PHASE`.

## Estado alvo final

```yaml
skills_registered: 16
skills_executable: 15
skills_documental: 1
remaining_documental:
  - MCF-CLOSE-PHASE
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
```
