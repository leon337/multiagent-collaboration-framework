# MCF-ORG-049 — Canonicalize 49-agent roster

## Summary

Canonicalizes Leandro's approved expansion from 29 to 49 named MCF agents.

### Design & Experience Engineering
Adds UX Research, Brand, Art Direction, Design Systems, Motion, Content Design, Design Engineering and Visual QA.

### AI & Model Systems
Adds Asian/Open Model Intelligence, Frontier Radar, Free API Intelligence, Routers/Gateways, Protocol Adapters, Coding Models, Multimodal AI, Self-hosting/Inference, Agent Harnesses, Model Benchmarks, Quota/Cache/Cost and Provider Integration.

## Runtime truth

- registered skills: 22
- executable skills: 16
- documental-only skills: 6
- runtime source changed: no
- production changed: no

The six new skill IDs are intentionally `DOCUMENTAL_ONLY`; `SkillExecutor` still has an explicit allowlist of 16 executable IDs.

## Evidence

- MCF-DEC-053
- canonical 49-agent matrix
- 20 new individual contracts
- updated Evelyn/Tiago leadership contracts
- updated agent/tool matrix and registry
- updated README/current-state/docs index
- PRF, checkpoint, evidence manifest and independent pre-PR audit

## Review focus

1. roster/contract consistency;
2. YAML registry parsing with ignored `runtime_status` field;
3. truthful separation of registered vs executable skills;
4. no accidental runtime or production mutation.
