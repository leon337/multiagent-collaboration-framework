# MCF — Correction & Human Evidence — 2026-08-26

**Authority:** LEANDRO  
**Orchestrator:** MESTRE  
**Status:** `HUMAN CORRECTION + DIRECT VISUAL EVIDENCE / NO MERGE OR DEPLOY AUTHORIZED`

## 1. Human correction

LEANDRO corrected an ambiguity from the prior exchange: when he said he had added an instruction “na pasta do projeto”, he meant the **Project configuration Instructions field** (`Configurações do projeto -> Instruções`), not a newly uploaded file or repository folder.

Audit correction: MESTRE's earlier search for a newly added Project file was based on a misunderstanding of the user's wording. It must not be interpreted as failure by LEANDRO to provide the instruction.

The operational requirement remains: execution must be externally followable through concise evidence-bearing checkpoints — objective, action, evidence, decision/status, next action — without exposing private chain-of-thought.

## 2. Human visual artifacts supplied by LEANDRO

### Artifact A — Project Instructions + OX Cloud Workstation

- source: LEANDRO upload in MESTRE chat
- dimensions: `1366x768`
- size: `207139 bytes`
- SHA-256: `ac4e460fc3a3042a80650ce81bd824f2a5a5b05c81e55fadbff5ae468de0b7bc`
- evidence class for MESTRE: `DIRECT_VISUAL_EVIDENCE`
- observed: ChatGPT Project settings for `MCF NextGen`; Instructions field visibly begins with `# PROTOCOLO OPERACIONAL DO MCF`; Cloud Workstation on the right shows the successor OX continuity session.

### Artifact B — SentinelX dashboard + OX Cloud Workstation

- source: LEANDRO upload in MESTRE chat
- dimensions: `1366x768`
- size: `265069 bytes`
- SHA-256: `824cf6fcfcea2ae07b5ef39e663ce96db26e405229b1bf25b4e15397cbdf56f1`
- evidence class for MESTRE: `DIRECT_VISUAL_EVIDENCE`
- observed: SentinelX dashboard displays `2 online`, including `leo-N43SM` and `vmi3506102`; Cloud Workstation shows the successor OX session.

For OX these pixels remain `INDIRECT_VISUAL_EVIDENCE` unless OX later gains a verified image-capable sensor; MESTRE can relay hash + structured observation.

## 3. New evidence about successor OX

The Cloud Workstation portion visibly shows OX produced a local artifact:

`artifacts/continuity/OX-POST-MIGRATION-REMOTE-VERIFY-2026-08-26.md`

Visible size: `7369 bytes`.

The screen also states, in substance, that the successor OX (`session-89dedcc5...`) hands the artifact to MESTRE for authenticated transport if approved, while merges/errata C1–C4 remain LEANDRO gates and the session remains available.

Important boundary: the artifact's exact bytes and SHA-256 are **not accepted from visual transcription alone**. MESTRE must read/hash the actual file from the authorized runtime before authenticated transport.

## 4. Runtime reconciliation after the screenshots

- SentinelX briefly returned both hosts, including `vmi3506102`.
- The first read-only command to that host failed with `agent_disconnected / read_loop_ended`.
- Subsequent host inventory again exposed only `leo-N43SM`.

Therefore:

- existence of the post-migration artifact is supported by direct human visual evidence;
- exact bytes/hash remain pending runtime read-back;
- direct notification to OX about this correction remains pending until the MESTRE↔OX runtime channel is reachable;
- no claim of delivered OX notification is made yet.

## 5. Authorization

LEANDRO explicitly authorized the next step on 2026-08-26: continue the continuity mission, notify OX of the correction/artifacts, recover and verify the successor post-migration artifact, transport it if integrity checks pass, and evaluate the `OX_SESSION_HANDOFF` gate.

This authorization does not silently authorize merge, production deploy, release, model/provider change, or deferred vision implementation.
