# PHASE-MCF-VOICE-REPORTER-V2-001 — Mission-aware deduplication

- Issue: #223
- Base main: `a85f606f40869739af4468c7da973c9cb84937ef`
- Local service: `mcf-voice-reporter.service`
- Boot observed: `2026-09-18 03:57`
- Status: `QUALIFIED_LOCALLY_POST_REBOOT`

## Defect

V1 polled every 30 seconds and spoke the same unchanged status on every poll.

## V2 invariant

Speech is allowed only when all are true:

```text
enabled = true
mission_active = true
mission_state = ACTIVE
current_status_fingerprint != last_spoken_fingerprint
```

Polling remains 30 seconds. **Speech is event/change-driven, not cadence-driven.**

## Persistence evidence after reboot

Observed after Linux reboot:

```text
voicehub-linux.service        enabled + active
mcf-voice-reporter.service   enabled + active
Restart                      always
Linger                       yes
VoiceHub 127.0.0.1:8788      listening
reporter state               IDLE / disabled
```

Reporter restarted automatically:

```text
2026-09-18T03:57:53 reporter_started_v2 interval=30
2026-09-18T03:57:53 skip_inactive_or_disabled
2026-09-18T03:58:37 skip_inactive_or_disabled
```

No speech replay was observed after reboot.

## Boundary

```text
kind: DETERMINISTIC_STATUS_REPORTER
cognitive_independence_proven: false
mission_authority: none
human_gate_authority: none
production_authority: none
```

No provider secret or API token is introduced by V2.
