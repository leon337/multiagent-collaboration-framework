# MCF OX Vision Bridge — Deferred Proposal

Status: **PROPOSAL / DEFERRED DECISION**

Decision authority: **LEANDRO**

Implementation status: **NOT AUTHORIZED**

This document preserves a design idea for later evaluation. It does not authorize implementation, model changes, provider changes, deployment, release, production use, or changes to the current OX session.

## Context

OX is an external agent operated through the documented MESTRE ↔ OX channel via DeepSeek Harness (DSH). During a live test, OX attempted to read generated PNG images and the DSH toolchain accepted the image-reading operation, but the active model reported that it did not declare image input support. The current working hypothesis is therefore that the immediate limitation is model capability rather than absence of an image path in the Harness.

Observed error from the live test:

```text
model "x-preview-f-free" does not declare image input; switch to an image-capable model
```

This observation must be revalidated before any implementation decision.

## Problem to solve

Allow OX to reason reliably about images, screenshots, UI states and other visual evidence while preserving MCF requirements for provenance, auditability, authority boundaries and provider agnosticism.

## Design directions to evaluate later

### 1. MESTRE as visual proxy

Use ChatGPT/MESTRE as an external visual sensor. Images are interpreted by MESTRE and converted into structured visual evidence before being sent to OX through the existing DSH session channel.

This can work immediately, but it is indirect evidence: OX reasons over MESTRE's interpretation rather than the original pixels.

### 2. Vision Observation Packet (VOP)

Define a normalized packet for indirect visual evidence. Candidate fields:

- mission_id
- artifact_id
- source
- image dimensions
- sha256
- observer
- evidence class
- scene summary
- detected objects and regions
- bounding boxes / normalized coordinates
- extracted text regions
- confidence
- uncertainties
- open questions

Candidate evidence classes:

```text
DIRECT_VISUAL_EVIDENCE
INDIRECT_VISUAL_EVIDENCE
```

The two classes must never be silently conflated.

### 3. Interactive visual dialogue

Allow OX to ask targeted follow-up questions such as:

- inspect a specific region;
- identify the text below a known element;
- determine whether a button appears enabled;
- return coordinates for an element;
- re-check a low-confidence observation.

This creates an iterative perception loop instead of a one-shot image description.

### 4. Native vision lab

Before changing OX's main session, create an isolated read-only test session such as `OX-VISION-LAB` using an image-capable model if one is available in the current deployment.

Suggested validation sequence:

1. generated RED image;
2. generated BLUE image;
3. real screenshot;
4. small text / OCR case;
5. UI-state interpretation;
6. multiple images;
7. large-image tiling.

The purpose is to verify capability without changing OX's current cognitive/runtime behavior.

### 5. Dedicated visual sensor

If changing the primary OX model would materially alter behavior, preserve the current OX model and add a dedicated multimodal sensor:

```text
OX
  ↓ visual request
OX-VISION / multimodal sensor
  ↓ normalized visual evidence
OX
```

This treats vision as an organ/sensor rather than replacing the current reasoning model.

### 6. MESTRE as sensory router

Longer-term option:

```text
LEANDRO
   ↓ image
MESTRE / ORCHESTRATOR
   ↓ sensor selection
┌───────────────────┬───────────────────┐
│ ChatGPT Vision    │ DSH Vision        │
└───────────────────┴───────────────────┘
          ↓ normalized evidence
                  OX
```

MESTRE would remain responsible for provenance, routing, cross-checking and handoff, not necessarily for primary perception.

### 7. Redundant visual evidence

For high-impact visual decisions, obtain independent observations from more than one visual sensor. Agreement increases confidence; disagreement triggers investigation instead of silent selection.

### 8. Large-image handling

For long screenshots or large images, evaluate tiling while preserving:

- original image hash;
- tile identifier;
- X/Y offset;
- original dimensions;
- relationship to the source artifact.

### 9. Security and privacy

Any future implementation should evaluate:

- EXIF stripping;
- secret/token detection;
- redaction policy;
- private-by-default handling;
- provider boundary controls;
- audit-safe logs;
- image size/type limits;
- avoidance of unnecessary propagation of sensitive screenshots to multiple providers.

## Candidate maturity path

| Level | Description | Status |
|---|---|---|
| 0 | MESTRE manually observes and describes images to OX | Available conceptually now |
| 1 | Structured VOP + interactive visual questions | Proposed MVP |
| 2 | Native or dedicated DSH multimodal sensor | Preferred capability to evaluate |
| 3 | Multi-sensor fusion, provenance, cross-check and computer-use integration | Future / NextGen candidate |

## First experiment to consider later

Before building new infrastructure, revalidate the live observation and discover which image-capable models, if any, are available in the current DSH deployment. If available, run an isolated read-only RED/BLUE test in a separate session.

Do **not** change OX's current main model or session as part of that discovery.

## Decision questions reserved for LEANDRO

1. Should OX receive native vision, a dedicated visual sensor, or both?
2. Should MESTRE remain a permanent fallback visual proxy?
3. What evidence class and schema should become canonical in MCF?
4. What images may cross provider boundaries without a HUMAN_GATE?
5. Should visual perception later integrate with computer-use/action coordinates?
6. Is this an MCF core capability, an optional adapter, or an external integration?

## Non-decision statement

Nothing in this proposal is approved merely by being recorded. It exists to preserve the idea and the evidence discovered during the conversation so that LEANDRO and the MCF team can evaluate it later with current runtime evidence.
