# Decisions — MCF-MEMORY-LIVE-NEXT-STABLE-001

Status: product contract frozen for architecture
Authority: Leandro
Evidence source: issue #164 chronological onboarding decisions plus latest explicit mission directives

## Accepted decisions

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
11. **Latest** — after all gates, release and post-release proof pass, the stable v1.2.0 becomes `latest`.
12. **Git/privacy boundary** — Git is code/documentation/technical history; new real memories remain in private Supabase/Postgres and are not automatically exported to public Git.
13. **Original text location** — authorized original text is stored in private `fontes`; Evento Cognitivo stores the structured interpretation.
14. **Minimization** — persist the explicitly relevant excerpt plus only the minimum context necessary for meaning, not the full conversation by default.
15. **Keywords** — generate 3–8 concise keywords, preferably in `assuntos`, to make reading and absorption faster.
16. **Retrieval presentation** — compact cognitive card first; original text and provenance on demand or when needed to validate an interpretation.
17. **Definitive deletion** — normal corrections preserve history; an explicit definitive-delete command uses a separate privileged hard-delete flow that removes private content/dependents, with at most a content-free tombstone if audit requires it.
18. **Search/embeddings** — textual and structured search always works; external embeddings are disabled by default and require separate opt-in. Presence of an API key does not imply authorization.
19. **Operating model** — Leandro is not the team's technical operator; architecture and implementation are team responsibilities. The full 29-agent roster must contribute substantive artifacts to the mission, but role simulation is deterministically prohibited and no agent receives credit without real execution and evidence.

## Non-negotiable mission directives

- follow the MCF project instructions, unified protocol, ESEV and Human Delegation Firewall;
- no fabricated agent participation, fabricated tool use, fabricated receipts or relabeled artifacts;
- every agent that participates must create its own artifact during the work;
- because Leandro requires the entire roster for this goal, all 29 must eventually produce a real, competence-aligned mission artifact before terminal delivery;
- technical ambiguity is resolved by the team and specialists, not pushed to Leandro as operator questions;
- user escalation is reserved for actual authority gates or unavoidable external dependency;
- the mission is not complete until the stable release is published and post-release memory proof passes.

## Implementation gate

These decisions authorize architecture work, source recovery, threat modeling, planning and governance artifacts. They do **not** by themselves authorize implementation code before the architecture approval/gates required by the MCF workflow and the active design methodology.
