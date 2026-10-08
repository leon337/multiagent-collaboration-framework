# STORYBOARD-CONSISTENCY-001

Issue: #248  
Human authority: **LEANDRO**  
Orchestrator: **MESTRE**

## Objective

Replace the abstract placeholder visuals from the multi-voice pilot with the **25 canonical storyboard scenes**, preserving character/world continuity and the already-approved multi-voice audio.

## Graph

```text
START
  ├─ RECOVER_STORYBOARD
  ├─ LOCK_ANCHORS
  └─ TIMING_MAP
          ↓
   EXTRACT_25_SCENES
          ↓
      VISUAL_QA
          ↓
    REMOTION_SPEC
          ↓
       RENDER
          ↓
      VALIDATE
          ↓
        END
```

## Current state

- [x] G0 mission registered; baseline preserved
- [x] G1 five original storyboard pages recovered
- [x] G2 twenty-five image scenes extracted
- [x] G3 crop/continuity QA and anchor policy defined
- [x] G4 9:16 composition built using storyboard imagery
- [x] G5 MP4 rendered and media-validated
- [ ] G6 human playback review / targeted refinements

## Canonical visual anchors

- **Lia:** s05, s07, s15, s21
- **Pai:** s06, s14
- **Vale / portal / red road:** s02, s03, s11, s17, s25
- **Workshop / bicycle:** s22, s23, s24

## Render receipt

Output: `chamado-amanhecer-v3-storyboard-consistente.mp4`

- duration: **62.045 s**
- resolution: **1080 × 1920**
- fps: **30**
- video: **H.264**
- audio: **AAC / 48 kHz / stereo**
- scenes: **25**
- SHA-256: `a035e074faceb26a987c812be44e20580c78444f9ae7f0a365905cb79b51dcb7`

The approved multi-voice/ambient audio from V2 was reused unchanged. Only the visual layer was replaced.

## Instavar / Remotion

Instavar template family: `social-remix`  
Target: `9:16 @ 30 fps`  
A deterministic VideoSpec and complete scene package were generated as mission artifacts. The storyboard remains the visual source of truth; Remotion is responsible for timing, motion, transitions and export, not for redefining character identity.

## VoiceHub

Progress reports use the existing local VoiceHub queue with:
- agent: `MESTRE`
- project: `O Chamado do Amanhecer`
- mission: `STORYBOARD-CONSISTENCY-001`

Queue semantics are used to avoid overlapping speech with other agents.
