# MCF MESTRE Voice Checkpoints

Status: ACTIVE candidate for production in mission `MCF-PERSISTENT-VOICE-COMMS-001`.

## Objective

Make audible mission progress a first-class MCF communication behavior instead of an ad-hoc side effect.

The human authority remains LEANDRO. MESTRE remains the orchestrator. VoiceHub is only a local delivery surface.

## Default contract

Every unified MCF mission inherits a `communication_contract.voice_checkpoints` block.

The default behavior is:

- speaker identity: `MESTRE`;
- transport: local VoiceHub;
- preferred delivery: pre-rendered audio;
- preferred voice profile: `clear`;
- fallback: VoiceHub text-to-speech;
- queueing: serialized with every other VoiceHub utterance;
- duplicate suppression: enabled;
- execution: mission continues without asking again for permission on reversible actions already covered by the mission authorization.

## When to speak

A voice checkpoint is expected for meaningful execution boundaries, not for every shell command.

Canonical events:

1. mission started;
2. phase started;
3. meaningful progress or a completed work package;
4. blocker or recovery that materially changes the plan;
5. phase completed;
6. mission completed.

The written chat remains authoritative. Voice is a synchronized progress channel.

## Preferred delivery path

When the current MESTRE runtime can render the preferred voice:

```text
MESTRE
  -> render checkpoint with voice_profile=clear
  -> save file under ~/.cache/voicehub-linux/generated/
  -> mcf-voice-checkpoint --audio <file>
  -> VoiceHub POST /api/audio/enqueue
  -> shared serialized audio queue
  -> notebook speakers
  -> delivery receipt
```

VoiceHub does not create the `clear` voice by itself. The upstream MESTRE runtime provides the rendered file.

## Fallback path

If a rendered file is absent, invalid, unavailable, or rejected, the checkpoint may fall back to:

```text
mcf-voice-checkpoint
  -> VoiceHub POST /api/speech/enqueue
  -> configured local/free TTS router
```

The receipt must indicate `fallback_used=true` when this happens.

## Immediate command

Installed command:

```bash
mcf-voice-checkpoint \
  --project MCF \
  --mission MCF-EXAMPLE-001 \
  --phase validation \
  --voice-profile clear \
  --audio ~/.cache/voicehub-linux/generated/checkpoint.mp3 \
  "Validação concluída; iniciando auditoria."
```

Without `--audio`, the command uses the TTS fallback.

## Persistent recovery worker

The existing `mcf-voice-reporter.service` remains a recovery mechanism.

It watches the persisted mission status and announces a changed ACTIVE state that was not already delivered. A successful immediate checkpoint writes the same fingerprint used by the worker, preventing duplicate replay.

## Security boundary

Rendered-audio ingress is fail-closed:

- VoiceHub accepts only local absolute paths;
- path must resolve under `~/.cache/voicehub-linux/generated/`;
- remote URLs are not accepted;
- allowed formats are MP3, WAV, OGG, M4A and FLAC;
- maximum file size is 25 MB;
- mission identity metadata is mandatory;
- private voice recordings, model artifacts, API keys and provider credentials remain outside Git;
- audio delivery cannot approve HUMAN_GATEs or mutate mission authority.

## Identity boundary

Voice is not authorship.

A checkpoint receipt records both:

- `agent=MESTRE`;
- `voice_profile=clear` (or fallback profile).

This prevents a voice profile from being confused with the actor that made a decision.

## Evidence

A successful immediate checkpoint produces a local receipt at:

```text
~/.local/state/mcf-voice-reporter/last-delivery.json
```

Expected fields include:

- mission;
- phase;
- agent;
- voice_profile;
- delivery;
- fallback_used;
- VoiceHub job receipt;
- delivered_at.

The VoiceHub job itself records `kind=rendered_audio` or `kind=speech`.

## Governance

This protocol changes communication, not authority.

It does not:

- grant MESTRE new permissions;
- waive a HUMAN_GATE that was not already authorized;
- authorize payments or new external data disclosure;
- turn VoiceHub into Mission Control;
- require LEANDRO to become the technical operator.

Once LEANDRO has explicitly authorized a mission scope, reversible implementation steps inside that scope proceed without repetitive permission prompts. New irreversible or materially expanded actions still follow the governing mission authorization.
