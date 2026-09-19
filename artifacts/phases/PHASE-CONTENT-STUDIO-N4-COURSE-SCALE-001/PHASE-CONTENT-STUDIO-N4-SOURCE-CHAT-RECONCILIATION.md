# MCF Content Studio N4 — Reconciliation of all Project source chats

**Mission:** `MCF-CONTENT-STUDIO-N4-COURSE-SCALE-001`  
**Issue:** #277 · **PR:** #278  
**Validated code head:** `1ebe29ed95f95f87e7c7c7c178b55bb15ec15181`

This document reconciles source-defined improvements against implementation evidence. Requirements evidence is kept separate from implementation proof.

| Source-defined improvement | Final state | Evidence / boundary |
|---|---|---|
| reusable StickRig with joints, poses and actions | CLOSED | StickRig + registry + matrix QA |
| character language for agent stories | CLOSED | agent/operator/reviewer/human variants + avatar assets |
| fitText / minimum readable text | CLOSED | textFit + tests + stress renders |
| direct canvas editing | CLOSED | drag/resize/rotate/snap/alignment/nudge + persisted layout |
| complete motion vocabulary | CLOSED | 19/19 presets executable |
| semantic focus composition | CLOSED | focusIntent → automatic motion combination |
| SFX/music/ambient/narration + ducking | CLOSED | generic mix contract + FFmpeg executor + CI smoke |
| audio presence + loudness | CLOSED | ffprobe verifier + volumedetect QA |
| local/materializable TTS fallback | CLOSED | capability doctor + explicit espeak fallback smoke; approved narration voice is not replaced implicitly |
| Explain as parallel educational output | CLOSED FOR PILOT PROOF | finished pilot companion; future per-lesson companions depend on curriculum |
| Remotion Elements/ecosystem adapters | CLOSED | governed adapter catalog |
| high-fidelity Canvas Capture | BLOCKED_ENVIRONMENT | source records Apple Silicon dependency; non-blocking |
| concurrency control | CLOSED | cancel-in-progress + bounded component-matrix workers |
| Instavar native contract | CLOSED | real VideoSpec 1.0 scaffold/bridge + render proof |
| Adobe Express visual-source bridge | CLOSED | governed bridge + real derived Express document; no pixel-perfect claim |

## Course-source reconciliation

The exact curriculum remains a distinct source dependency. A deterministic source-exhaustion worker scanned all five materialized Project source chats; only `Aula 3.1` appears as a numbered lesson. Generic terms such as Context Engineering, MCP, Agents, Realtime and Evals are examples, not an ordered curriculum.

GitHub searches for `Aula 3.2`, `Aula 3.3` and `Aula 3.10` did not recover the missing canonical inventory. Five predecessor screenshots were also inspected; they document the earlier recovery attempt and chat-length limit but do not contain the lesson list.

Therefore:

```text
ENGINE TRACK = CLOSED FOR CURRENT SCOPE
COURSE TRACK = BLOCKED_SOURCE_DEPENDENCY
RULE = DO NOT INVENT
```

Publication, merge, deploy and HUMAN_GATE remain separate.
