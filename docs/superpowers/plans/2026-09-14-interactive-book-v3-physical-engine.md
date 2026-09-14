# Interactive Book V3 Physical Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a ready-to-use physical-book prototype inside ChatGPT, with progressive page curl, contact-aware drag, reactive local audio, readable responsive content, accessibility controls and an explicit human gate before external publication.

**Architecture:** Keep the prototype dependency-free: semantic HTML pages, CSS 3D/perspective, a segmented turning sheet driven by Pointer Events, and Web Audio API synthesis. The visible reading pages remain selectable; only edge handles own the page-turn gesture. GitHub Issue #211 is the live mission/checklist; the inline ChatGPT artifact is the acceptance surface.

**Tech Stack:** HTML5, CSS 3D transforms, Pointer Events, Web Audio API, Local Storage, vanilla JavaScript.

**Spec:** `docs/projects/interactive-book-physical-engine/README.md` and Issue #211.

## Global Constraints

- External publication is forbidden before LEANDRO explicitly approves the HUMAN_GATE.
- No paid API or external audio asset is required.
- Desktop uses a two-page spread; mobile uses one page.
- Text in the reading area must stay selectable.
- Mouse, touch, buttons and keyboard must remain supported.
- The prototype must remain usable with `prefers-reduced-motion`.

---

### Task 1: Physical page-turn engine

**Files:**
- Prototype surface: inline ChatGPT artifact derived from the V2 baseline.
- Evidence: `docs/projects/interactive-book-physical-engine/BASELINE-V2.md`

**Interfaces:**
- Produces: `prepare(dir, anchorY)`, `apply(progress)`, `settle(commit, velocity)`, edge-handle Pointer Event flow.

- [x] **Step 1: Define failing invariants**

```js
assert(localP(0, 1, 'next') === 0)
assert(localP(1, 0, 'next') === 1)
assert(THRESH > 0 && THRESH < 1)
```

- [x] **Step 2: Run invariants and confirm the curl function is monotonic**

Run: `node curl-invariants.js`
Expected: `PASS: curl progress, threshold, monotonicity`.

- [x] **Step 3: Implement segmented curl**

Use 14 vertical strips. For each strip compute delayed local progress from global progress and edge distance; transform with `rotateY`, `translateZ`, `translateY` and small `rotateZ` derived from contact Y.

- [x] **Step 4: Implement dynamic shadow and corner lift**

Shadow strength follows `sin(pi * progress)`; hover/touch near the lower edge exposes the lift affordance.

- [x] **Step 5: Preserve commit/return semantics**

Commit when progress crosses `0.34`, or when a fast gesture crosses the lower velocity-assisted threshold; otherwise animate back.

### Task 2: Physical-book reading UX

**Interfaces:**
- Produces: dynamic page-stack thickness, cover/back-cover, bookmark/resume, chapter ruffle transition, selectable reading surface.

- [x] **Step 1: Move pointer ownership to edge handles only**
- [x] **Step 2: Keep reading pages `user-select: text`**
- [x] **Step 3: Make page height content-driven with a minimum height**
- [x] **Step 4: Add page-stack thickness based on read/remaining pages**
- [x] **Step 5: Treat cover and back-cover as first-class pages**
- [x] **Step 6: Add bookmark and resume state using guarded Local Storage**

### Task 3: Audio and accessibility

**Interfaces:**
- Produces: `startRustle`, `updateRustle`, `stopRustle`, stereo page-drop, sound modes, font/contrast controls.

- [x] **Step 1: Generate paper texture locally with filtered noise**
- [x] **Step 2: Modulate filter/volume from drag speed and page progress**
- [x] **Step 3: Pan sound toward the page-turn direction when StereoPanner is available**
- [x] **Step 4: Add Mute/Discrete/Immersive modes and volume slider**
- [x] **Step 5: Add font-size, contrast, keyboard and reduced-motion support**

### Task 4: Content and acceptance

**Interfaces:**
- Produces: interactive notes, authentication flow diagram, provenance page and inline ChatGPT validation artifact.

- [x] **Step 1: Preserve interactive explanatory notes**
- [x] **Step 2: Add an in-page authentication flow diagram**
- [x] **Step 3: Add source/version provenance page**
- [ ] **Step 4: Deliver V3 inline in ChatGPT**
- [ ] **Step 5: LEANDRO validates desktop/touch behavior**
- [ ] **Step 6: Update Issue #211 with validation findings**
- [ ] **Step 7: Only after explicit approval, proceed to Vercel publication**
