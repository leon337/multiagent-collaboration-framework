# Pilot narration contract

The pilot separates timing metadata from audio bytes.

```text
CaptionCue frames
      │
      ├── visual scene timing
      ├── caption overlay
      └── future narration audio alignment
```

Rules:
- captions stay in the reserved bottom safe area;
- one cue should express one cognitive unit;
- audio is optional until a source is approved;
- adding audio must not change factual content silently;
- audio duration and scene timing are reconciled before master render.
