# RENDER-MULTIVOICE-001

Issue: #244  
PR: #247  
Human authority: **LEANDRO**  
Orchestrator: **MESTRE**  
Runtime boundary: cloud / GitHub Actions; no dependency on LEANDRO's notebook.

## Objective

Render a technical 9:16 MP4 for **O Chamado do Amanhecer** using 25 slides and three distinct generated voices:

- Narrador — `clear`
- Lia — `delicate`
- Pai — `deep`

## Graph

```text
              ┌→ AUDIO_RECOVERY ─┐
START ────────┼→ TIMING_PLAN ────┼→ CLOUD_RENDER → VALIDATE → END
              └→ VISUAL_PLAN ────┘
```

## Current evidence

The local bubble sandbox cannot resolve `storage.googleapis.com`, so direct materialization fails before HTTP. The cloud renderer therefore runs on GitHub Actions, which owns G1–G5 for this mission.

## Gates

- [x] G0 — issue + branch + HUMAN_GATE
- [x] G1 — recover 25 voice clips in cloud runner
- [x] G2 — measure durations / timing manifest
- [x] G3 — generate 25 1080×1920 slides
- [x] G4 — render technical multi-voice MP4
- [x] G5 — validate 25 scenes, 3 voices, 9:16 and duration
- [ ] G6 — refine soundtrack, SFX and transitions

## Outputs

Expected artifact:

`chamado-amanhecer-v2-multivoz.mp4`

Supporting evidence:

- `timing-manifest.json`
- `render-evidence.json`
- 25 generated slide PNGs

## Technical render receipt

- State: **G1–G5 PASS / G6 PENDING**
- Render executor: `mcf-render-multivoice-001` (Render free)
- Duration: 62.03 s
- Resolution: 1080×1920
- SHA-256: `337c90be8da06e9b3156b30d3003ab603cb47aabc3148dad2a629ae7e967c260`
- Evidence: `EVIDENCE.md`
