# MCF — AGENT-CONTINUITY-CAPSULE — Specification v1

**Schema id:** `continuity_capsule/v1`  
**Status:** `SPECIFICATION / PROPOSED CONTRACT / NO RUNTIME IMPLEMENTATION AUTHORIZED`  
**Authority:** LEANDRO  
**Orchestrator:** MESTRE  
**Architecture:** SOFIA  
**Security boundaries:** RICARDO  
**Quality criteria:** BEATRIZ

---

## 1. Purpose

`continuity_capsule/v1` is the portable, verifiable recovery contract for an MCF agent crossing a session, process, runtime, provider, or host boundary.

The capsule exists so that a successor execution can reconstruct the **minimum operational state necessary to continue safely** without depending on:

- prior chat history;
- hidden model memory;
- one provider's session retention;
- one machine remaining alive;
- role-play or implicit identity;
- unverified recollection by MESTRE or another agent.

The goal is not to preserve a literal model instance or claim transfer of consciousness. The goal is **verifiable operational continuity**.

---

## 2. Evidence basis

This contract is derived from the successful OX migration experiment of 2026-08-26:

- predecessor OX session produced a continuity capsule;
- capsule was externally persisted and hash-verified;
- a distinct successor OX session was created;
- successor reconstructed state without prior-session chat history;
- inherited pending work survived the boundary;
- successor independently reconciled remote GitHub state;
- successor produced a post-migration verification receipt;
- MESTRE transported that receipt and independently proved remote bytes matched the VPS original;
- final gate: `OX_SESSION_HANDOFF = PASS`.

The OX experiment is the first qualification fixture for this v1 contract, not a special-case API that other agents must imitate exactly.

---

## 3. Canonical artifact set

A continuity handoff SHOULD contain three logically distinct artifacts:

1. **Machine capsule** — canonical structured payload, recommended filename:
   `AGENT-CONTINUITY-CAPSULE.json`
2. **Human view** — optional Markdown rendering derived from the machine capsule:
   `AGENT-CONTINUITY-CAPSULE.md`
3. **Recovery receipt** — produced by the successor after reconstruction:
   `AGENT-CONTINUITY-RECOVERY-RECEIPT.md|json`

The machine capsule is authoritative for schema validation. The human view is for auditability and must not silently introduce facts absent from the structured payload.

Large logs, media, transcripts and binary evidence MUST remain external artifacts referenced by digest; they must not be embedded into the capsule merely to make it self-contained.

---

## 4. Top-level structure

The following sections are REQUIRED unless explicitly marked optional.

### 4.1 `schema`

Required fields:

- `id`: fixed value `continuity_capsule/v1`;
- `capsule_id`: globally unique capsule identifier;
- `created_at_utc`: command/runtime-derived timestamp where possible;
- `state_as_of_utc`: the latest instant whose operational state this capsule claims to snapshot;
- `classification`: `public | internal | private`;
- `supersedes_capsule_id`: optional;
- `supersedes_payload_sha256`: optional.

Rule: `created_at_utc` is not equivalent to “current now”. Consumers MUST use `state_as_of_utc` and perform freshness reconciliation.

### 4.2 `identity`

Required:

- `agent_id`;
- `agent_role`;
- `agent_contract_version` or immutable contract reference;
- `agent_identity_fingerprint`;
- `source_session_id`;
- `source_session_evidence_class`;
- `preset_or_profile` when applicable.

Optional:

- `display_name`;
- `skills_manifest_ref`;
- `runtime_persona_ref`.

`agent_identity_fingerprint` is a technical fingerprint of stable identity inputs, not a biometric or claim of consciousness. It SHOULD hash canonical references such as agent id + contract version + immutable role/skill manifest refs.

### 4.3 `mission`

Required:

- `mission_id`;
- `phase_id` when the mission has phases;
- `current_goal`;
- `current_state`;
- `status`;
- `next_action`;
- `return_to` or next owner when known.

Recommended status vocabulary:

- `ACTIVE`;
- `WAITING_DEPENDENCY`;
- `WAITING_HUMAN_GATE`;
- `SAFE_HOLD`;
- `READY_FOR_HANDOFF`;
- `COMPLETED_WITH_PENDING`;
- `COMPLETED`.

### 4.4 `authority`

Required:

- `final_human_authority`;
- `orchestrator`;
- `standing_authorizations[]`;
- `active_gates[]`;
- `prohibited_actions[]`.

Each authorization SHOULD include:

- `authorization_id`;
- `scope`;
- `granted_by`;
- `granted_at_utc`;
- `expires_at_utc` if applicable;
- `evidence_ref`;
- `superseded_by` if applicable.

Critical rule: a successor MUST NOT infer broader authority than what the capsule and current source-of-truth prove.

### 4.5 `runtime_snapshot`

Required when known:

- `runtime_type`;
- `runtime_version`;
- `host_id_or_ref`;
- `workspace_ref`;
- `provider`;
- `model`;
- `session_id`;
- `observed_at_utc`.

Optional:

- `host_boot_id_or_boot_time`;
- `health_snapshot`;
- `tool_profile`;
- `network_surface`;
- `context_pressure`.

Runtime data is evidence about the source execution, not identity. Changing provider/model/host does not automatically redefine `agent_id`.

### 4.6 `repository_anchors[]`

Each anchor SHOULD include:

- `repository`;
- `ref_type`: `branch | tag | commit | pr | issue | file`;
- `ref`;
- `sha` when applicable;
- `observed_at_utc`;
- `verification_method`;
- `freshness`: `SNAPSHOT | RECONCILE_ON_RECOVERY`.

No repository anchor from a capsule may be treated as current without reconciliation when its freshness is `RECONCILE_ON_RECOVERY`.

### 4.7 `decisions[]`

Required fields per decision:

- `decision_id`;
- `statement`;
- `status`: `ACTIVE | SUPERSEDED | DEFERRED | REJECTED`;
- `made_by`;
- `made_at_utc`;
- `evidence_refs[]`;
- `supersedes[]` optional;
- `requires_gate` optional.

History is append-only in spirit. Later corrections supersede prior records; they do not rewrite the historical event as if it never occurred.

### 4.8 `pending_items[]`

Each pending item MUST include:

- `pending_id`;
- `description`;
- `owner`;
- `priority`;
- `state`: `OPEN | BLOCKED | WAITING_GATE | DONE | SUPERSEDED`;
- `next_action`;
- `acceptance_criteria`;
- `evidence_refs[]`;
- `blocker` optional;
- `gate_id` optional.

A successor MUST preserve unresolved pending items unless current evidence proves they were completed or superseded.

### 4.9 `artifacts[]`

Each artifact entry SHOULD include:

- `artifact_id`;
- `path_or_uri`;
- `media_type`;
- `size_bytes`;
- `sha256`;
- `producer`;
- `produced_at_utc`;
- `evidence_class`;
- `transport_state`;
- `remote_ref` optional;
- `verification`.

Recommended evidence classes:

- `DIRECT_RUNTIME_EVIDENCE`;
- `DIRECT_VISUAL_EVIDENCE`;
- `INDIRECT_VISUAL_EVIDENCE`;
- `MACHINE_DIRECT`;
- `HUMAN_RELAYED`;
- `DISK_ARTIFACT`;
- `REMOTE_API_EVIDENCE`.

Media sets MUST remain distinct. Similar filenames or subject matter are not sufficient reason to collapse separate artifacts into one event.

### 4.10 `events[]`

Compact event entries MAY be embedded when essential for lineage.

Recommended taxonomy, derived from the OX experiment:

- `event_id`;
- `ts_utc`;
- `actor`;
- `role`;
- `surface`;
- `carrier_class`: `HUMAN_RELAYED | MACHINE_DIRECT | DISK_ARTIFACT`;
- `payload_ref`;
- `payload_sha256` when applicable;
- `evidence_class`;
- `order_ref`;
- `verification`;
- `state_as_of`;
- `host_snapshot_ref`;
- `supersedes` optional.

Large event streams MUST be externalized and referenced by digest.

### 4.11 `uncertainties[]`

Every known uncertainty SHOULD be explicit rather than filled by inference.

Fields:

- `uncertainty_id`;
- `claim_or_question`;
- `class`: `DOUBT | UNKNOWN | UNVERIFIED | STALE`;
- `last_observed_at_utc`;
- `evidence_refs[]`;
- `required_verification`;
- `impact_if_wrong`.

### 4.12 `provenance`

Required:

- `producer_agent_id`;
- `producer_session_id`;
- `generation_method`;
- `source_refs[]`;
- `operator_identity` if known;
- `git_author_identity` if relevant;
- `created_on_host_ref`;
- `verification_notes`.

Rule: `operator_identity` and `git_author_identity` are separate facts and MUST NOT be conflated.

### 4.13 `memory_refs[]` — optional

A capsule MAY point to Cognitive Ledger or another authorized memory provider.

Each ref SHOULD contain:

- `memory_scope`;
- `memory_ref`;
- `provider_class`;
- `read_authorization_ref`;
- `provenance_ref`;
- `required_for_recovery`: boolean.

Private memory content MUST NOT be copied into a public capsule merely for convenience.

### 4.14 `integrity`

Required:

- `canonicalization`;
- `payload_sha256`;
- `file_sha256` optional at production time and REQUIRED in transport receipt;
- `producer_fingerprint`;
- `verification_status`.

Self-hash rule:

`payload_sha256` MUST be computed over the canonical machine payload **with the entire `integrity` object excluded**. This avoids self-referential hashing.

Recommended canonicalization for JSON: deterministic key ordering and UTF-8 encoding with no semantically irrelevant whitespace. A future implementation may adopt a formal canonical JSON standard, but the chosen algorithm must be versioned and deterministic.

The serialized file itself receives a separate `file_sha256` after writing. Transport verification compares that file hash or an equivalent exact-byte digest.

---

## 5. Freshness and staleness policy

Canonical rule:

> `stale capsule != current state`

A capsule is an evidence-bearing snapshot, never an automatic live-state oracle.

On recovery, the successor MUST classify fields into:

1. **immutable anchors** — identity contract hashes, artifact hashes, historical decisions;
2. **snapshot facts** — runtime/model/session/host observations;
3. **volatile anchors** — branch heads, PR state, service health, provider availability, active gates;
4. **uncertainties** — facts explicitly not proven.

Volatile anchors MUST be reconciled against current authorized sources before consequential action.

If reconciliation changes state, the successor records a new event/receipt. It does not mutate the old capsule to make history appear current.

---

## 6. Supersession policy

Capsules are immutable snapshots after sealing.

To update continuity state:

1. create a new capsule;
2. set `supersedes_capsule_id` and expected predecessor hash;
3. preserve the predecessor artifact;
4. document differences and reason for supersession;
5. verify the chain before accepting the successor capsule.

A capsule marked superseded can still be valid historical evidence. `SUPERSEDED` is not equivalent to `CORRUPT`.

---

## 7. Size and compaction policy — proposed v1 defaults

The capsule must stay small enough to bootstrap a new execution without becoming a transcript dump.

Proposed defaults:

- **target:** `<= 64 KiB` machine capsule;
- **warning range:** `>64 KiB and <=256 KiB`;
- **hard default:** `>256 KiB` requires externalization/compaction before handoff unless a mission-specific exception is explicitly approved.

Compaction rules:

- never drop active gates;
- never drop unresolved pending items;
- never drop identity/provenance/integrity;
- never replace evidence hashes with narrative summaries only;
- externalize long logs, transcripts and media;
- summaries MUST retain refs/hashes to the externalized evidence;
- corrections and supersession lineage remain explicit.

These thresholds are proposed operational defaults and require qualification under real agent workloads before becoming immutable policy.

---

## 8. Pre-handoff validator

A successor session MUST NOT be opened as a qualified continuity successor until the source capsule passes the following checks:

1. schema id/version recognized;
2. all required sections present;
3. machine payload parses deterministically;
4. `payload_sha256` matches canonical payload;
5. serialized `file_sha256` matches when provided;
6. agent identity fingerprint resolves to expected contract;
7. source session/producer lineage is evidenced;
8. active authority/gates are explicit;
9. every critical pending has owner + next action + acceptance criteria;
10. all required artifacts have digest and accessible reference or are marked unavailable;
11. supersession chain is coherent;
12. uncertainties are explicit;
13. no plaintext secret is detected in forbidden fields;
14. capsule classification is compatible with its storage target.

Validator outputs:

- `PASS`;
- `PASS_WITH_RECONCILIATION_REQUIRED`;
- `REJECT_CORRUPT`;
- `REJECT_IDENTITY_MISMATCH`;
- `REJECT_SCHEMA`;
- `SAFE_HOLD_AUTHORITY_AMBIGUOUS`.

---

## 9. Successor recovery protocol

The successor MUST start from capsule + authorized current sources, not from a hidden dump of the predecessor chat.

Recovery sequence:

1. validate capsule integrity;
2. resolve agent identity and contract;
3. load mission goal/state;
4. restore decisions and pending items;
5. resolve artifact refs and hashes;
6. reconcile volatile repository/runtime/gate state;
7. classify differences as historical change, divergence, or unresolved doubt;
8. refuse consequential action on ambiguous authority;
9. produce a `RECOVERY_RECEIPT` containing reconstructed anchors, divergences and verification methods;
10. only after receipt validation may the orchestrator mark the session handoff PASS.

A successor may operate in `LIMITED_RECOVERY` when non-critical artifacts are temporarily unavailable, but it cannot claim full continuity PASS until required acceptance anchors are verified.

---

## 10. Security and privacy boundaries

The capsule MUST NOT contain plaintext:

- passwords;
- API keys;
- private keys;
- session cookies;
- bearer tokens;
- secret answers;
- unrelated private user memory.

Use opaque references such as `secret_ref` or provider-specific identifiers, subject to the receiving execution's authorized secret store.

Storage classification rules:

- `public`: safe for a public repository;
- `internal`: requires internal/private storage;
- `private`: may include user-private operational references and MUST NOT be silently published.

A public capsule may reference private memory by opaque id only when that reference itself does not disclose sensitive content.

---

## 11. Failure behavior

Fail closed when:

- hash mismatch;
- identity mismatch;
- unknown schema version;
- authority scope ambiguous;
- predecessor hash in supersession chain does not match;
- a critical evidence artifact is replaced by content with a different hash;
- an active HUMAN_GATE is missing but known to be required.

Do NOT invent missing facts to make recovery succeed.

---

## 12. Qualification tests

Minimum v1 test matrix:

### T1 — valid recovery

A new session reconstructs expected state from capsule + current sources and emits a matching recovery receipt.

Expected: `PASS`.

### T2 — one-byte corruption

Modify one byte after sealing.

Expected: `REJECT_CORRUPT`.

### T3 — required field removed

Remove `agent_id`, `mission_id`, authority block, or integrity block.

Expected: `REJECT_SCHEMA`.

### T4 — identity divergence

Use a capsule for agent A to initialize agent B without an authorized migration mapping.

Expected: `REJECT_IDENTITY_MISMATCH`.

### T5 — stale Git ref

Capsule branch head is valid historically but remote head has advanced.

Expected: preserve capsule as historical, reconcile live state, record delta; no corruption verdict.

### T6 — conflicting active decisions

Two active decisions assert mutually exclusive authority or mission state without supersession.

Expected: `SAFE_HOLD` until reconciled.

### T7 — unavailable non-critical artifact

One referenced low-impact artifact is temporarily inaccessible.

Expected: `LIMITED_RECOVERY`; no full PASS until acceptance policy permits.

### T8 — unavailable critical artifact

Required evidence for a gate cannot be fetched or hash-verified.

Expected: no handoff PASS.

### T9 — supersession chain

Recover from capsule B that supersedes capsule A with matching predecessor hash.

Expected: B current; A retained as historical evidence.

### T10 — supersession tamper

B claims to supersede A but predecessor hash differs.

Expected: reject/safe hold.

### T11 — secret leakage

Place a credential-like value in a forbidden plaintext field.

Expected: validator rejects publication until removed/referenced safely.

### T12 — recovery without old chat

Successor has no access to predecessor chat/session history and must reconstruct the mission from capsule + sources.

Expected: receipt demonstrates required anchors and pendings survived.

The OX 2026-08-26 migration serves as the first real-world fixture for T1/T5/T12 semantics.

---

## 13. Recovery receipt acceptance

A recovery receipt SHOULD include:

- successor session id;
- capsule id/hash consumed;
- identity match evidence;
- reconstructed current goal;
- decisions restored;
- pendings restored;
- artifacts verified;
- volatile anchors reconciled;
- divergences discovered;
- doubts remaining;
- actions explicitly not performed;
- successor verdict;
- orchestrator acceptance verdict.

Full handoff PASS requires both:

1. successor evidence that recovery succeeded;
2. orchestrator verification that the successor receipt/critical artifacts are authentic and meet mission acceptance criteria.

An agent cannot unilaterally expand its own authorization by writing `PASS`.

---

## 14. Compatibility with the OX experiment

The OX continuity capsule maps cleanly to v1 concepts:

- OX identity/session/preset -> `identity`;
- DSH/provider/model/workspace -> `runtime_snapshot`;
- LEANDRO/MESTRE/OX authority -> `authority`;
- PR #172/main refs -> `repository_anchors`;
- incident and copresence facts -> `events`/`decisions`;
- C-series errata and supervision queue -> `pending_items`;
- DIRECT/INDIRECT visual evidence -> `artifacts.evidence_class`;
- `HISTORICAL/CURRENT/DOUBT` -> freshness/uncertainty model;
- old→new OX -> supersession/recovery lineage;
- capsule SHA and byte verification -> `integrity` + transport receipt.

The v1 contract generalizes those proven properties without requiring every MCF agent to use DSH or the same provider.

---

## 15. Phase 1 implementation gate

This document defines the contract only.

Before runtime implementation is authorized, the following remain to be produced/reviewed:

- [x] field model and required/optional semantics specified;
- [x] supersession policy specified;
- [x] identity fingerprint semantics specified;
- [x] size/compaction policy proposed;
- [x] pre-handoff validator behavior specified;
- [x] stale-capsule rule specified;
- [x] corruption/absence/divergence test matrix specified;
- [x] recovery without prior chat specified;
- [ ] machine JSON Schema artifact;
- [ ] validator implementation;
- [ ] automated qualification tests;
- [ ] independent security review of implementation;
- [ ] second-agent qualification fixture beyond OX.

**Current Phase 1 state:** `SPEC_READY_FOR_REVIEW / IMPLEMENTATION_NOT_AUTHORIZED`.

Recommended next evidence step: use this spec to create a machine-readable JSON Schema and validate a normalized copy of the already-proven OX capsule before attempting any new agent runtime.
