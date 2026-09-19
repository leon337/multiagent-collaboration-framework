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
- generic FFmpeg mix executor: IMPLEMENTED + sandbox smoke PASS;
- CI synthetic narration/music/SFX/ducking smoke: IMPLEMENTED;
- loudness/peak QA: PENDING.

The contract must not be marked as a finished audio/FX system until those runtime pieces exist.

## Sandbox proof

The generic executor was exercised locally with synthetic narration, music and SFX. It produced a 4.0 s AAC mix and passed ffprobe stream/duration verification before being promoted to the mission branch.
