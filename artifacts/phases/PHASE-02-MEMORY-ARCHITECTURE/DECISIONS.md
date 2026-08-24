# PHASE-02 DECISIONS — Memory Architecture

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Status: product contract frozen for architecture; executor ready; billable-run gate pending
Authority: Leandro for reserved human matters / Léo for delegated operational gates

## Accepted product decisions

1. **Provider** — reuse the existing Cognitive Ledger Supabase/Postgres project as the official operational provider; preserve existing data.
2. **Capture trigger** — explicit user request or intelligent suggestion followed by confirmation; never automatic silent persistence.
3. **Write authority** — Mestre initiates governed writes; Miriam governs memory/provenance/reconciliation; other agents have no direct write by default.
4. **Memory representation** — preserve authorized original wording plus structured semantic representation; original wording remains primary when interpretations diverge.
5. **Correction** — corrections/supersessions preserve history and never silently overwrite prior meaning.
6. **Confirmation** — short user-facing confirmation plus auditable Receipt; no success statement without persistence and read-back.
7. **Proof sequence** — synthetic proof first; real memory only after gates and explicit authorization.
8. **Existing live data** — current provider is evolved in place with backup/restore/schema inventory and compatible/reversible migrations; no destructive reset/reseed.
9. **AuthN/AuthZ** — MCF write uses a dedicated OAuth/capability boundary such as `cognitive-ledger.memory.write`; MCF does not receive `service_role`; legacy admin write remains separate until governed migration/deprecation is designed.
10. **SemVer target** — target `v1.2.0` if changes remain additive/compatible; engineering determines SemVer correction if a real breaking change is found.
11. **Latest** — after all gates, release and post-release proof pass, the new stable becomes `latest`.
12. **Git/privacy boundary** — Git is code/documentation/technical history; new real memories remain in private Supabase/Postgres and are not automatically exported to public Git.
13. **Original text location** — authorized original text is stored in private `fontes`; Evento Cognitivo stores the structured interpretation.
14. **Minimization** — persist the explicitly relevant excerpt plus only the minimum context necessary for meaning, not the full conversation by default.
15. **Keywords** — generate concise keywords, preferably in `assuntos`, to improve retrieval/readability.
16. **Retrieval presentation** — compact cognitive card first; original text and provenance on demand or when needed to validate an interpretation.
17. **Definitive deletion** — normal corrections preserve history; explicit definitive deletion uses a separate privileged hard-delete flow that removes private content/dependents, with at most a content-free tombstone if audit requires it.
18. **Search/embeddings** — textual and structured search always works; external embeddings are disabled by default and require separate opt-in. Presence of an API key does not imply authorization.
19. **Operating model** — Leandro is not the team's technical operator. The official roster is an available pool; only agents with real phase delivery are selected, executed and credited.

## Governance correction

Any earlier wording that required all 29 agents to produce substantive artifacts regardless of actual phase need conflicts with the current project operating instructions and unified protocol, which require selective participation and prohibit decorative work.

Under source precedence, that earlier wording is superseded.

The 29 official identities may exist in the executor pool without being participants. Existence, convocation or configuration is not execution credit.

## Executor decision

Brainbase MCP is selected as the immediate mission-only managed-agent execution harness for Phase 2.

Verified configuration:

- organization/team resolved;
- 29/29 official MCF managed-agent identities created;
- private orchestration `33296bb3-2020-43cf-8d62-e5c1d364f6b0` created for selected Phase 2 roles;
- no automatic trigger configured;
- no billable task run executed yet;
- no private memory content, raw `fontes.conteudo_bruto`, Supabase `service_role`, token or secret sent to Brainbase.

`GATE-RUNTIME-REALITY = SATISFIED_FOR_EXECUTOR_IDENTITY_AND_CONFIGURATION`.

## Financial gate

Brainbase task runs are billable. New financial cost is reserved to human authority by the Human Delegation Firewall.

`GATE-BRAINBASE-BILLABLE-RUN = PENDING_HUMAN_AUTHORIZATION`.

This gate requires only an authority decision; no technical operation is delegated to Leandro.

## Non-negotiable directives

- follow project instructions, unified protocol, ESEV and Human Delegation Firewall;
- no fabricated agent participation, tool use, receipts or relabeled artifacts;
- every participating agent must create its own artifact from a real execution;
- technical ambiguity is resolved by the team and specialists, not pushed to Leandro as operator work;
- escalation is reserved for genuine authority gates or unavoidable external dependency;
- the mission is not complete until stable release publication and post-release memory proof pass.

## Implementation gate

These decisions authorize architecture work, source recovery, threat modeling, planning and governance artifacts. They do not authorize implementation before specialist execution, audit, Léo's phase gate and design approval.
