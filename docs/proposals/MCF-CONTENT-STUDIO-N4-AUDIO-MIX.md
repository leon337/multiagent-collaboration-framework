# N4 Audio Mix Contract

The Content Studio separates **audio authoring data** from the actual media bytes.

```text
LessonAudioMix
  ├─ narration
  ├─ SFX
  ├─ music
  ├─ ambient
  └─ ducking rules
       ↓
materialized media assets
       ↓
FFmpeg/Remotion mix runtime
       ↓
encoded-audio QA
```

The first contract establishes deterministic clip placement, gain, fades and narration-driven ducking.

Current state:
- contract/types/tests: IMPLEMENTED;
- encoded stream presence QA: IMPLEMENTED;
- reusable media registry for SFX/music: PENDING;
- actual generic FFmpeg/Remotion mix executor: PENDING;
- loudness/peak QA: PENDING.

The contract must not be marked as a finished audio/FX system until those runtime pieces exist.
