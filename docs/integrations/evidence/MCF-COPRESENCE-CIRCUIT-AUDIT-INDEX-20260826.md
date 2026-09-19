# MCF Copresence Circuit Audit — Index

Status: **DRAFT AUDIT PACKAGE**

Date: 2026-08-26

Authority: **LEANDRO**

Orchestrator: **MESTRE**

External agent: **OX**

Audit branch: `docs/copresence-circuit-audit-20260826`

## Start here

1. **Forensic chronology and divergence report**
   - `MCF-COPRESENCE-CIRCUIT-FORENSIC-CHRONOLOGY-20260826.md`
   - human-readable reconstruction, conclusions, contradictions, corrections, remaining gaps.

2. **Canonical event ledger — primary segment**
   - `MCF-COPRESENCE-CIRCUIT-EVENT-LEDGER-20260826.jsonl`
   - chronological events from antecedent channel evidence through the start of the independent audit.

3. **Canonical event ledger — audit addendum**
   - `MCF-COPRESENCE-CIRCUIT-EVENT-LEDGER-ADDENDUM-20260826.jsonl`
   - OX independent audit, context-window safeguard, audit self-error and correction, provenance preservation.

4. **DSH provenance excerpt**
   - `MCF-COPRESENCE-CIRCUIT-DSH-PROVENANCE-EXCERPT-20260826.jsonl`
   - selected same-session RPC identifiers and payloads proving MESTRE-driven machine delivery to OX.

5. **LEANDRO human evidence manifest**
   - `MCF-COPRESENCE-CIRCUIT-HUMAN-EVIDENCE-MANIFEST-20260826.json`
   - exact byte counts, SHA-256, SHA-512, BLAKE2b-256, image metadata and MP4 ffprobe metadata for 9 JPEGs + 1 MP4 supplied in the audit turn.

6. **Manifest errata**
   - `MCF-COPRESENCE-CIRCUIT-MANIFEST-ERRATA-20260826.md`
   - records the initial secondary-hash error and its correction without rewriting Git history.

7. **OX continuity checkpoint**
   - `MCF-COPRESENCE-CIRCUIT-CONTINUITY-CHECKPOINT-20260826.md`
   - continuous OX session id, context pressure, completed findings, next actions and safety state.

## Existing evidence referenced by this audit

- `docs/integrations/MCF-HARNESS-MESTRE-OX-CHANNEL.md`
- `docs/integrations/evidence/MCF-HARNESS-MESTRE-OX-E2E-20260825.md`
- PR #172 and its proposal/evidence artifacts.

## Key corrections established

- The MESTRE↔OX machine channel already existed and was exercised before the disputed 2026-08-26 claim that it had never carried a direct exchange.
- Today's verified novelty was a narrower artifact transaction: OX authors → MESTRE authenticated transport → OX independent remote byte verification → LEANDRO observation.
- "No human carried content" applies only to that specific artifact payload path, not to the entire day.
- "100%" must be scoped to an explicit criterion and cannot be universally certified by agents without LEANDRO.
- GitHub transport was operated by MESTRE under LEANDRO's connected GitHub principal; Git metadata alone does not prove operator identity.
- SentinelX connector loss must not be equated with VPS shutdown or attributed to a paid-plan requirement without provider-side evidence.
- OX's lack of image input is OX/model-specific; MESTRE can directly inspect image pixels and serve as a structured visual proxy.

## Binary durability warning

Cryptographic hashes identify bytes but do not reconstruct them. The human-supplied binary files are not yet stored in this Git repository. A future decision is required for Git LFS / immutable object store / MCF evidence vault if provider-loss resilience must include the actual media bytes.

## Merge policy

This audit package is documentation only. It should remain a draft review surface until LEANDRO explicitly approves any merge.

Nothing in this package authorizes implementation, model/provider change, deploy, release, production, paid-plan changes, credential changes, or destructive actions.

— MESTRE
