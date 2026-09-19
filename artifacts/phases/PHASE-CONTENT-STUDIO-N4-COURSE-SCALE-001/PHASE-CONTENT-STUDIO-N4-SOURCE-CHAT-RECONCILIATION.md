# MCF Content Studio N4 — Reconciliation of all Project source chats

**Mission:** `MCF-CONTENT-STUDIO-N4-COURSE-SCALE-001`  
**Issue:** #277  
**PR:** #278  
**State:** ACTIVE / SOURCE RECONCILIATION

## Why this exists

The predecessor evolution mission reconciled the 16-section chat in `Aprofundar documentação OpenAI.txt`, but the Project also contains the earlier Remotion/Instavar/Explain exploration chat. That second source carries additional concrete improvement decisions which were not all promoted into the evolution checklist.

This document treats the Project chats as requirements evidence, not implementation proof.

## Already covered by the N4 evolution

The following source-defined capabilities have material implementation evidence in the evolution branch:

- reusable component library and family taxonomy;
- data-driven `TechnicalLessonTemplate`;
- registry/discovery by intent;
- Asset Library contract/search;
- Motion Preset registry/runtime;
- pedagogical components;
- real UI components (Browser/Terminal/GitHub/VSCode/Chat/Mobile);
- Video Lab V3 authoring;
- minimal scene timeline/reorder/duration/component/props editing;
- governed project/component importer;
- preflight boundary;
- safe-area and mobile QA;
- Review Lab;
- Figma bridge contract (real Figma derivation remains externally blocked).

## Residual improvements found in the other Project chat

| Source-defined improvement | Current evidence | Reconciled state | Course-scale action |
|---|---|---|---|
| reusable `StickRig` with joints, poses and actions | `StickRig.tsx` + registry entry + discovery test added on #278 | IMPLEMENTED_PENDING_CI | validate portrait/landscape/reduced-motion matrix |
| MCF visual language using stick characters for agent stories | `character` registry category + `StickRig` introduced | PARTIAL_IMPLEMENTED | expand only when real lesson/story needs demand more rigs |
| `fitText` / minimum readable text constraints | deterministic text-fit utility applied to Title/FocusConcept/Keyword + tests | IMPLEMENTED_PENDING_CI | validate long-text stress renders |
| interactive canvas editing rather than raw x/y guessing | Video Lab has property/timeline editing; direct drag/resize/rotate not evidenced | PARTIAL | future editor increment, not required to block lesson authoring |
| complete motion vocabulary | 12 style presets IMPLEMENTED; underline/draw-arrow/connector/morph/typewriter/counter/progress remain DECLARED | PARTIAL | promote only with real executable behavior/tests |
| synchronized SFX/music/ducking | narration mux exists; no reusable SFX/music/ducking pipeline evidenced | NOT_IMPLEMENTED | add audio-mix contract and deterministic QA |
| local/materializable TTS fallback (Supertonic/Kokoro class) | current review workflow downloads externally generated narration segments | NOT_IMPLEMENTED | evaluate materializable local TTS path without silently changing approved voice |
| detect final video that should have audio but is silent | preflight checks narration cues, not encoded audio stream | PARTIAL | add media-level audio presence QA |
| Explain as parallel educational output, not chained after Remotion | architecture is documented; no per-lesson Explain output is part of course DoD | PARTIAL | preserve bifurcation; add optional Explain companion artifact after factual pack |
| Remotion Elements/ecosystem adapters | governed importer exists, but no explicit Elements adapter/catalog | PARTIAL | backlog; import only when a lesson has a real gap |
| high-fidelity UI capture / Canvas Capture | source itself records Apple Silicon dependency | BLOCKED_ENVIRONMENT | do not block Linux/bubble lesson production |
| concurrency benchmark rather than indiscriminate parallelism | benchmark harness exists | IMPLEMENTED_BASELINE | reuse for worker/render pool sizing |

## Execution policy for #277

The mission now runs two independent tracks where dependencies allow:

```text
TRACK A — COURSE CONTENT
predecessor curriculum recovery
  -> canonical inventory
  -> lesson content packs
  -> narrated lessons
  -> Review Labs
  -> lesson QA

TRACK B — RESIDUAL ENGINE IMPROVEMENTS
source-chat gap reconciliation
  -> character system / StickRig
  -> text-fit QA
  -> audio-mix + encoded-audio QA
  -> remaining motion semantics
  -> optional Explain companion path
```

Track B may progress while Track A is resolving the exact predecessor curriculum. No missing lesson title or objective may be invented.

## Sandbox workers

For this reconciliation, MESTRE created five sandbox-local deterministic workers:

- `curriculum_worker`
- `improvements_worker`
- `pipeline_worker`
- `governance_worker`
- `visual_language_worker`

They scan/materialize Project source text in parallel and emit evidence packs. They are **workers, not cognitive subagents** and receive no agent credit.

## First implementation increment

Start with `StickRig` because it is explicitly defined in the source chat, materially absent from the current registry, and directly improves the visual language of agent lessons without depending on the missing course inventory.

Publication, merge, deploy and HUMAN_GATE remain separate.

## Current implementation wave

- `StickRig`: implementation + registry/schema/discovery test landed on the mission branch; CI pending.
- text-fit readability floor: implementation + tests landed on the mission branch; CI pending.
- next residual candidates remain audio mix/audio-stream QA and semantic motion presets; they are not claimed complete.
