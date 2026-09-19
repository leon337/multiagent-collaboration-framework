# MCF Content Studio N4 — Adobe Express Bridge

**Mission:** `MCF-CONTENT-STUDIO-N4-COURSE-SCALE-001`

## Decision

Adobe Express is the preferred visual authoring source for the Content Studio. It replaces Figma operationally, but the bridge must preserve the difference between a visual reference and machine-readable design-system introspection.

## Verified connector surface

The current Adobe Express integration used by the mission can:
- search templates/designs;
- fill text;
- replace images;
- change background color;
- animate a design;
- export a design as PDF.

It does **not** expose verified node-level or token-level introspection comparable to the existing Figma bridge.

## Governed handoff

```text
ADOBE EXPRESS TEMPLATE
  ↓ search_design
DERIVED EXPRESS DOCUMENT
  ↓ fill / image / background / animation
ADOBE EXPRESS BRIDGE SPEC
  ├─ source provenance
  ├─ temporary-document flag
  ├─ verified capability/non-capability flags
  ├─ N4 target component
  ├─ N4 target tokens
  └─ authoring evidence
  ↓
N4 REACT/REMOTION COMPONENT
  ↓
VIDEO LAB / QA / RENDER
```

## First real proof

Source template:
`urn:aaid:sc:VA6C2:1a487348-7767-4b43-9ac1-22d1918dbb8b`

Derived document:
`urn:aaid:sc:VA6C2:b0b20f81-59b6-4508-ba43-b45b3b022261`

The derived document was authored with MCF Video Engine copy in a 9:16 technology template. The bridge fixture maps that visual reference to the approved N4 `title` component.

This proves the governed route **Express → intermediate spec → existing React/Remotion component target**.

It does **not** prove pixel-perfect visual parity or automatic extraction of Adobe Express layout/tokens.

## Figma disposition

The Figma bridge remains OPTIONAL/LEGACY until a later cleanup gate. It is no longer the preferred operational visual source.
