# MCF — Context Fabric Block 2 — Review Checklist

**Status:** `DRAFT_REVIEW_AID`  
**Canonical:** `false`  
**Purpose:** checklist de revisão humana antes de transformar o Block 2 em arquitetura aprovada.

## Review questions

- [ ] O Project Registry resolve descoberta sem duplicar estado mutável?
- [ ] Project Capsule é pequena o suficiente para bootstrap rápido?
- [ ] `DURABLE`, `SNAPSHOT`, `LIVE_REQUIRED`, `DERIVED` são suficientes para freshness?
- [ ] Provenance permite saber de onde veio cada afirmação material?
- [ ] Aliases em linguagem natural evitam perguntas desnecessárias a LEANDRO?
- [ ] O modelo DISCOVERABLE/REGISTERED evita tanto cegueira quanto poluição?
- [ ] Project, Capability e Knowledge Graphs têm responsabilidades distintas?
- [ ] Context recovery order privilegia live state quando necessário?
- [ ] Documentation Parity possui hooks suficientes para cross-project reconciliation?
- [ ] O desenho evita transformar inferência em fato?
- [ ] O desenho preserva HUMAN_GATE/HDF?
- [ ] O bootstrap de chat isolado pode ser testado objetivamente?
- [ ] O modelo é extensível a Artifact System sem acoplamento prematuro?
- [ ] Há um caminho claro para detectar stale capsule/documentation drift?
- [ ] O MCF consegue descobrir reuso na conta `leon337` antes de propor duplicação?

## Verdict

`PENDING_HUMAN_REVIEW`
