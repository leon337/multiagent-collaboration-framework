# MCF Content Studio N4 Evolution — Roadmap

**Mission:** `MCF-CONTENT-STUDIO-N4-EVOLUTION-001`  
**Issue:** #265  
**Parent:** `MCF-CONTENT-STUDIO-N4-001`  
**Base:** foundation branch `planning/mcf-content-studio-n4-20260919`

## Reconciliation against the canonical source chat

| Source vision | Foundation state | Evolution action |
|---|---|---|
| 1. templates ≠ components | IMPLEMENTED conceptually | preserve contract |
| 2. editable component library across families | PARTIAL | expand to canonical families |
| 3. parametrized templates | PARTIAL | implement real `TechnicalLessonTemplate` |
| 4. external templates/components | PARTIAL | expand governed importer patterns |
| 5. GitHub component catalog | PARTIAL | registry v2 + directory taxonomy + discovery |
| 6. Figma components/design system | NOT IMPLEMENTED | create Figma bridge contract + first synced spec |
| 7. Asset Library | NOT IMPLEMENTED | asset registry/schema/search |
| 8. Motion preset library | NOT IMPLEMENTED | reusable motion primitives/presets |
| 9. pedagogical components | PARTIAL | expand learning library |
| 10. real UI components | PARTIAL | add GitHub/VSCode/Chat/Mobile + interaction cues |
| 11. import governance | IMPLEMENTED MVP | generalize beyond single component |
| 12. Video Lab | PARTIAL | evolve catalog/preview/editor |
| 13. visual editor / timeline | NOT IMPLEMENTED | build minimal scene/timeline editor |
| 14. Instavar role | DOCUMENTED | encode boundary/preflight contract |
| 15. Template Registry search by intent | PARTIAL | implement query/search API |
| 16. four-phase evolution | FOUNDATION ONLY | complete remaining phases |

## Wave 1 — Engine contracts and libraries

- asset schema + asset registry;
- motion preset schema + runtime;
- registry v2 metadata;
- `TechnicalLessonTemplate` data contract and composition;
- component taxonomy expansion.

**Gate:** schemas/tests + demo composition using only data.

## Wave 2 — Component ecosystem

Target at least 20 MCF-native central components across:
- Typography;
- Layout;
- Learning;
- Diagram;
- UI;
- Motion;
- Media;
- Progress;
- Code;
- FX.

Priority additions:
- Title;
- Subtitle;
- Keyword;
- Caption;
- Stack;
- Grid;
- SplitScreen;
- FocusArea;
- Quiz;
- Definition;
- ProgressiveConcept;
- BuildArchitecture;
- Checkpoint;
- CodePanel;
- DiffViewer;
- GitHubWindow;
- VSCodeWindow;
- ChatWindow;
- MobileWindow;
- CursorCue / HighlightCue.

**Gate:** portrait/landscape/reduced-motion matrix + story/demo.

## Wave 3 — Discovery and authoring

- TemplateRegistry.search by intent;
- asset search;
- motion preset selection;
- Video Lab category browser;
- live props + template inputs;
- asset picker;
- motion picker;
- scene list;
- minimal visual timeline;
- JSON/VideoSpec export.

**Gate:** author a new lesson without writing a new TSX file.

## Wave 4 — Design system and external ecosystem

- Figma bridge contract;
- token/spec import proof;
- importer adapters for larger Remotion projects/components;
- provenance/license/dependency gates;
- explicit Instavar preflight boundary;
- Review Lab generated from the authoring output.

**Gate:** one external source + one Figma-derived spec integrated without bypassing governance.

## Wave 5 — Scale proof

Create two additional lesson payloads with the same engine:
- one architecture-heavy;
- one UI/code-heavy.

The same template/component engine must produce both.

**Gate:** no per-lesson bespoke composition required for core flow.

## Definition of Done

The mission closes only when every canonical source item is:
- IMPLEMENTED with evidence;
- DEFERRED with explicit reason and future gate; or
- BLOCKED by a real external dependency.

A foundation milestone is not sufficient for mission completion.
