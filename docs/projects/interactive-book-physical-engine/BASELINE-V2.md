# Interactive Book V2 — Technical Baseline

Observed baseline before V3 implementation.

## Implemented

- Inline ChatGPT artifact rendering.
- Desktop spread with two visible pages.
- Mobile single-page mode.
- Previous/next controls.
- Chapter jump controls.
- Pointer-based horizontal drag.
- Threshold decision: incomplete gesture returns; sufficient gesture commits.
- Web Audio API local sound synthesis.
- Continuous rustle during drag plus page-drop transient.
- Sound enable/disable control.
- Keyboard left/right navigation.
- Interactive fact buttons.

## Known gaps

1. Turning sheet rotates mostly as a rigid plane rather than visibly curling.
2. Gesture does not sufficiently encode the exact contact point/corner.
3. Dynamic shadow/occlusion does not fully follow the fold geometry.
4. Audio has limited physical variation and no user volume/intensity modes.
5. Fixed page height can crop future longer content.
6. Page stacks do not visually represent read/remaining thickness.
7. No convincing pre-grab corner lift.
8. Chapter jumps behave like UI navigation more than physical book navigation.
9. No durable bookmark/resume state.
10. Reduced-motion support is incomplete at runtime.
11. Selection is constrained by global interaction choices.
12. Cover/back-cover are not first-class physical objects.
13. Sources/version provenance are not represented as a dedicated book page.

## V3 target

Convert the V2 interaction from a page-themed UI into a convincing physical-book prototype while preserving content readability, accessibility and inline ChatGPT operation.
