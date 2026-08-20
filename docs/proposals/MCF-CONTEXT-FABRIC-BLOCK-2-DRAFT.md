# MCF — Context Fabric — Architectural Block 2 Draft

**Status:** `DRAFT_ARCHITECTURAL_BLOCK`  
**Canonical:** `false`  
**Implementation authorized:** `false`  
**Architecture formally approved:** `false`  
**Depends on:**
- `docs/proposals/MCF-CONTEXT-FABRIC-DISCOVERY-CHECKPOINT-001.md`
- `docs/proposals/MCF-ZRCL-V0.3-DISCOVERY-ADDENDUM.md`

## 1. Goal

Definir a arquitetura concreta de persistência, descoberta e recuperação de contexto do MCF sem duplicar a fonte de verdade de cada projeto.

## 2. Core model

O Context Fabric deve funcionar como um sistema federado:

```text
MCF
├── Project Registry
├── Relationship Graphs
├── Capability Registry
├── Concept Memory
├── Context Recovery Engine
└── Freshness / Provenance Rules
      │
      ├── leon337/project-a
      ├── leon337/cloud-infrastructure
      └── leon337/project-n
```

O MCF conhece a existência, identidade, relações, localização e regras de recuperação. O estado detalhado e mutável permanece na fonte canônica apropriada.

## 3. GitHub discovery domain

```yaml
github_ecosystem:
  canonical_account: leon337
  repository_visibility_model:
    DISCOVERABLE: repository may be found and inspected when relevant
    REGISTERED: repository already classified in the MCF ecosystem
```

Nem todo repositório descoberto torna-se automaticamente projeto registrado.

## 4. Project Registry

Responsabilidades:

- identidade estável do projeto;
- repositório canônico;
- aliases e linguagem natural associada;
- finalidade resumida;
- owner/source of truth;
- relationship pointers;
- capsule location;
- freshness rules;
- discovery status.

Candidate shape:

```yaml
projects:
  cloud-infrastructure:
    status: REGISTERED
    repository: leon337/cloud-infrastructure
    aliases: [vps, infraestrutura, cloud infra, node-01]
    purpose: private_infrastructure_and_agent_platform
    canonical_entrypoint: CONTEXT.md
    capsule: state/project-capsule.yaml
    freshness:
      repository_head: LIVE_REQUIRED
      project_purpose: DURABLE
      operational_state: LIVE_OR_RECENT_CAPSULE
```

## 5. Project Capsule

Cada projeto registrado deve expor uma cápsula pequena, machine-readable e orientada a continuidade.

Candidate fields:

```yaml
project:
  id:
  purpose:
  repository:
  lifecycle:
  current_workstream:
  current_status:
  active_branch:
  active_pr:
  last_verified_state:
  next_action:
  blockers: []
  human_gates: []
  capabilities_provided: []
  capabilities_consumed: []
  relationships: []
  source_priority: []
  freshness: {}
  provenance: {}
```

A cápsula não substitui README, decisões, runbooks ou estado live. Ela é a porta de entrada operacional.

## 6. Three relationship graphs

### Project Graph

Relaciona projetos entre si:

```text
MCF → governed_by / integrates_with / deployed_on / reuses → Cloud Infrastructure / libraries / apps
```

### Capability Graph

Relaciona provedores, consumidores e escopo de capacidades:

```text
cloud-infrastructure
  └── provides → scoped_vps_operations
MCF
  └── consumes → scoped_vps_operations
```

### Knowledge Graph

Relaciona conceitos, padrões e artefatos:

```text
Design System
  ├── related_to → Design Tokens
  ├── related_to → Templates
  └── supports → Artifact System
```

## 7. Freshness classes

```yaml
freshness_classes:
  DURABLE:
    meaning: stable identity or long-lived decision
  SNAPSHOT:
    meaning: true at a dated point in time
  LIVE_REQUIRED:
    meaning: must be verified from provider/source before current-state claim
  DERIVED:
    meaning: computed from other sources and must record provenance
```

Examples:

- project purpose: `DURABLE`
- last verified KVM result: `SNAPSHOT`
- active branch head: `LIVE_REQUIRED`
- inferred project relationship: `DERIVED` until approved/verified

## 8. Provenance

Material claims should be traceable to source.

Candidate shape:

```yaml
provenance:
  source_type: github_file|github_live|provider_live|decision|human_instruction|derived
  source_ref:
  observed_at:
  confidence:
  supersedes:
```

## 9. Context recovery order

Candidate recovery flow:

```text
natural-language request
  ↓
resolve project/intent aliases
  ↓
Project Registry
  ↓
Project Capsule
  ↓
check freshness requirements
  ↓
query live source when required
  ↓
load only relevant deep documents
  ↓
reconcile contradictions by precedence
  ↓
construct recoverable current context
```

## 10. Context confidence states

```yaml
confidence:
  VERIFIED:
  HIGH_CONFIDENCE:
  PLAUSIBLE:
  AMBIGUOUS:
  UNKNOWN:
```

A material action may require `VERIFIED` or explicit authorization depending on risk.

## 11. Documentation parity hooks

Any material change should evaluate whether it affects:

- project capsule;
- project registry;
- capability registry;
- cross-project relationships;
- canonical current-state docs;
- concept memory;
- artifact standards.

A work item may be technically complete but remain contextually incomplete.

## 12. No duplication principle

The MCF must not mirror complete mutable state from every repository.

It should persist:

- identity;
- relationship;
- discovery metadata;
- recovery rules;
- durable decisions;
- pointers;
- validated summaries where useful.

Detailed mutable truth remains at the owning source.

## 13. Next design questions

Before canonicalization, resolve:

1. exact storage paths/schemas for Project Registry and Capsules;
2. how repositories become REGISTERED;
3. update propagation and drift detection;
4. capability lifecycle states;
5. conflict resolution between capsule, docs and live state;
6. Concept Memory promotion criteria;
7. Artifact System ownership and inheritance;
8. bootstrap behavior for isolated chats;
9. whether graphs are materialized files, runtime indexes, or both;
10. observability and audit trail for context recovery.

This file is a draft architectural block, not an approved specification.