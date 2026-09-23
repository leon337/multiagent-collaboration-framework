# Shared World Core Boundary (draft)

Platform-neutral responsibilities:
- Three.js scene construction and lifecycle;
- terrain/sky/light definitions;
- PET entity and movement state;
- camera-follow rules;
- Local/portal domain model;
- proximity/interactions;
- navigation intents expressed as contracts, not platform calls.

Platform adapters own DOM, Electron IPC, persistence implementation, and external URL presentation.
