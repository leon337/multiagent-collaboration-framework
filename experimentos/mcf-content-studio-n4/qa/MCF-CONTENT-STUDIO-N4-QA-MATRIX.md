# N4 QA Matrix

## Contract tests

| Area | Check | Evidence |
|---|---|---|
| registry | schema valid | automated |
| registry | unique component ids | automated |
| registry | APPROVED entries have license evidence | automated |
| import | no wildcard/latest on approved imports | automated |
| import | security/license/performance reviewed | automated |

## Component tests

For each of 10 components:

- mounts in 9:16;
- mounts in 16:9;
- default props are valid;
- editable props do not crash preview;
- reduced-motion variant does not rely on motion for meaning;
- essential content stays inside safe area;
- long strings use overflow strategy.

## Video Lab

- component selection works;
- aspect switching works;
- prop editing works;
- invalid JSON-like edits preserve last valid value;
- Player error is isolated;
- keyboard navigation reaches controls;
- mobile smoke at <=720px.

## Pilot

- no syntax/runtime error;
- no black animation panel;
- no essential text under player controls;
- no caption/visual collision;
- active recall preserves a real pause;
- one concept active at a time;
- final architecture rebuild matches lesson claims.

## Master rule

`PREVIEW_PASS != MASTER_PASS`.

Master needs a render/still validation pass after preview QA.
