# MCF Content Studio N4 — Review Delivery Standard

**Mission:** `MCF-CONTENT-STUDIO-N4-001`  
**Status:** EXPERIMENTAL / VALIDATED AS REVIEW DELIVERY IN THIS MISSION

## Decision

For iterative audiovisual validation, the primary review artifact is a self-contained HTML page when technically practical.

```text
REMOTION COMPOSITION
       +
SCENE-ALIGNED NARRATION
       ↓
MP4 WITH AUDIO
       ↓
SELF-CONTAINED REVIEW HTML
       ├── embedded video
       ├── playback controls
       ├── mission/version metadata
       ├── QA notes
       └── narration timeline
```

## Why

This preserves the Content Studio delivery contract:

- LEANDRO can review directly from the primary artifact;
- video and context remain together;
- MP4 stays available as a secondary asset;
- review metadata does not need to be encoded into the video itself;
- later versions can add side-by-side comparisons, QA annotations and version history without changing the master video.

## Current pilot evidence

- composition: `RuntimeAgenticoPilot`
- format: 1080×1920
- fps: 30
- duration: 67 s
- narration: PT-BR, voice `clear`
- narration model: 12 scene-aligned segments
- video/audio streams: H.264 + AAC
- HTML: video embedded as a data URI
- GitHub Actions run: `35431478491`
- workflow result: SUCCESS
- artifact: `runtime-agentico-n4-audio-review`

## Status semantics

`REVIEW_HTML_READY != MASTER_PUBLISHED`

The pilot remains experimental. This delivery method does not authorize merge, deploy or external publication.

## Next evolution

Potential additions:
- version selector;
- A/B comparison;
- per-scene comments;
- waveform/timeline;
- QA pass/fail panel;
- download buttons as secondary actions;
- still gallery;
- source/commit references.
