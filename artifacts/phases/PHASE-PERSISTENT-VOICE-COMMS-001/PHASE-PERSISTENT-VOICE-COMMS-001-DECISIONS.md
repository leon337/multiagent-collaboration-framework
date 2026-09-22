# Decisions

## D1 — Prefer rendered clear audio

The preferred human-facing voice is the existing natural `clear` profile rendered upstream. VoiceHub does not impersonate this capability; it accepts a local rendered file through a bounded ingress.

## D2 — One serialized queue

Rendered audio and text-to-speech share the same VoiceHub queue to prevent overlapping mission announcements.

## D3 — Fail-closed file ingress

VoiceHub accepts only absolute local files resolving under `~/.cache/voicehub-linux/generated/`, with an extension allowlist and a 25 MB cap. Remote URLs are rejected by design.

## D4 — MESTRE identity is separate from voice profile

Receipts carry both `agent=MESTRE` and `voice_profile=clear`. Voice profile never grants authority.

## D5 — Immediate checkpoint plus persistent recovery

`mcf-voice-checkpoint` is the primary path. `mcf-voice-reporter.service` remains a recovery worker and deduplicates using the same persisted fingerprint.

## D6 — Existing authorization is respected

Within this mission, LEANDRO explicitly authorized continued reversible implementation, merge and production deployment. This does not authorize charges, new external disclosure of sensitive data, or scope expansion.
