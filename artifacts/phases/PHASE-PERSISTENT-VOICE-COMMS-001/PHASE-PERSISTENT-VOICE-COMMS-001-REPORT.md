# PHASE-PERSISTENT-VOICE-COMMS-001 — Readiness Report

## Status

**READY_FOR_MERGE**

The implementation establishes persistent MESTRE voice checkpoints as an MCF mission communication contract.

## Delivered

- VoiceHub rendered-audio ingress merged and active in production.
- Local file allowlist, extension allowlist and 25 MB cap.
- Shared serialized queue for rendered audio and TTS.
- Receipts distinguish actor `MESTRE` from voice profile `clear`.
- Immediate `mcf-voice-checkpoint` command.
- Persistent reporter V3 as recovery/deduplication path.
- Unified mission template defaults voice checkpoints to enabled.
- Protocol and operational documentation updated.
- MCF VoiceHub mirror reconciled with the production VoiceHub implementation.

## Validation

- VoiceHub repository: 12/12 unit tests before merge; GitHub Actions PASS.
- VoiceHub production E2E: `rendered_audio` receipt `DONE`.
- MCF reporter V3: 6/6 tests PASS.
- MCF VoiceHub concurrency/lock validation: PASS.
- Canonical `MCF-EXECUTE-LOCAL-TEAM`: 7/7 targeted tests PASS across 3 files.
- Python compile: PASS.
- YAML parse: PASS.
- `git diff --check`: PASS.
- changed-file secret-pattern scan: 0 hits.

## Governance

LEANDRO explicitly authorized implementation continuity, merge and production for this mission. The authorization does not expand to charges, secret disclosure or unrelated external data sharing.

Voice checkpoints do not change MCF authority. VoiceHub remains a delivery surface.

## Environment note

The repository requests Node `>=24.18.0 <25`. The notebook currently reports Node `22.23.2`; the targeted runtime tests used by this mission pass under that environment. This is recorded as an environment warning, not hidden.

## Remaining production closeout

After the MCF PR is merged:

1. install the merged reporter/status/checkpoint scripts;
2. reload and enable `mcf-voice-reporter.service`;
3. issue one `clear` checkpoint through the installed command;
4. confirm the persistent worker deduplicates the already-spoken fingerprint;
5. update final closeout evidence.
