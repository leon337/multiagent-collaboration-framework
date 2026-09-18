# EVIDENCE — RENDER-MULTIVOICE-001

State: **G1–G5 PASS / G6 PENDING**

Human authority: **LEANDRO**  
Orchestrator: **MESTRE**  
Issue: #244  
PR: #247  
Branch: `mission/render-multivoice-001`

## Cloud executor

- Provider: Render
- Workspace: `Leandro's workspace`
- Service: `mcf-render-multivoice-001`
- Service ID: `srv-damrpv3ncjis73ck2t5g`
- Plan: free
- Region: Virginia
- Canonical deploy: `dep-damrqisss21s73a5eib0`
- Commit: `2aea1cf270c80c95fc915683b80dc744c8c3e340`
- Public base URL: `https://mcf-render-multivoice-001.onrender.com`

No existing Render service was modified.

## Graph receipts

### G1 — Audio recovery
**PASS**

Recovered: 25/25 generated voice MP3 clips.

Speaker distribution:
- Narrador: 15
- Lia: 7
- Pai: 3

### G2 — Timing manifest
**PASS**

Scene duration is derived from measured audio duration plus bounded visual margin. No voice clip is intentionally truncated.

### G3 — Visual slides
**PASS**

Generated: 25/25 PNG slides at 1080×1920.

### G4 — Cloud render
**PASS**

Artifact:
`chamado-amanhecer-v2-multivoz.mp4`

### G5 — Validation
**PASS**

- Duration: **62.03 s**
- Resolution: **1080×1920**
- Video: **H.264**
- Audio: **AAC-LC**
- Audio sample rate: **48 kHz**
- Layout: **stereo**
- Observed FPS: **29.96**
- Scenes: **25**
- SHA-256: `337c90be8da06e9b3156b30d3003ab603cb47aabc3148dad2a629ae7e967c260`
- Size: **7,572,374 bytes**
- Runtime HTTP probe: **200**

Direct artifact URL:
`https://mcf-render-multivoice-001.onrender.com/chamado-amanhecer-v2-multivoz.mp4`

## G6 — Creative refinement
**PENDING**

Next pass:
- soundtrack/ambient bed;
- scene-specific SFX;
- improved transitions;
- visual review;
- optional Instagram-optimized encode.

## Resolved blocker

The ChatGPT sandbox could not resolve `storage.googleapis.com` or `onrender.com`. The mission recovered the voice assets and rendered entirely in a governed isolated cloud executor, without LEANDRO's notebook.

## Remaining engineering debt

The new GitHub Actions workflow introduced on PR #247 did not schedule while present only on the PR branch. This is not blocking the rendered artifact and remains a separate problem to diagnose after the creative G6 pass.
