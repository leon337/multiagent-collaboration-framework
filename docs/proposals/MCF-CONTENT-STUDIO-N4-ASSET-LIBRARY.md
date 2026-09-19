# MCF N4 Asset Library — versioning and deduplication

Approved assets are registry entries, not loose files. Every entry has a semantic version and stable dedupe key. New MCF assets also carry a SHA-256 content/spec fingerprint when deterministic.

- reuse when dedupe key/fingerprint are unchanged;
- byte/spec changes increment version;
- external assets require license/provenance review;
- procedural assets record generator + parameters and materialize deterministically;
- generated sound/music/video are reusable primitives/test fixtures, not claims of final editorial music quality.

The registry now covers background, texture, mockup, screenshot, logo, diagram, avatars, video, SFX/ambient sound and music.
