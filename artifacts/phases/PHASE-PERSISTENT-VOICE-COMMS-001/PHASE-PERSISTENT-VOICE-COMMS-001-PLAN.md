# Plan

## Objective

Promote audible MESTRE progress reporting from an ad-hoc workflow to a persistent MCF mission contract.

## Work packages

1. Add fail-closed rendered-audio ingress to VoiceHub.
2. Serialize rendered audio with existing TTS jobs.
3. Add immediate `mcf-voice-checkpoint` delivery with receipts.
4. Evolve persistent reporter into recovery/deduplication worker.
5. Add default voice communication contract to unified MCF mission template.
6. Validate local-team runtime, security boundaries, queue behavior and fallback.
7. Merge both repositories and deploy notebook services.

## Acceptance

- production VoiceHub receipt is DONE with `agent=MESTRE` and `voice_profile=clear`;
- no remote URL ingestion;
- no secret or private voice artifact committed;
- deterministic recovery worker remains non-authoritative;
- MCF tests and targeted canonical runtime tests pass;
- persistent service is enabled and active after deployment.
