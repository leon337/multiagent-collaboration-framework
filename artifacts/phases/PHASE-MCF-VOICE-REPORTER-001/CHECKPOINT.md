# PHASE-MCF-VOICE-REPORTER-001 — Operational Evidence

- Issue: #219
- Base main: `bd428b2b89261df15c20e168adaaab0a96ae0f33`
- Local service: `mcf-voice-reporter.service`
- State: **ACTIVE + ENABLED**
- Interval configured: **30 seconds**
- Restart policy: **always**
- VoiceHub dependency: **yes**
- Human authority: **unchanged**

## Observed speech evidence

Reporter start:

```text
2026-09-18T02:32:26 reporter_started interval=30
```

Successful VoiceHub responses:

```text
2026-09-18T02:32:47 speak_http=200 engine=nvidia voice=Magpie-Multilingual.PT-BR.Isabela
2026-09-18T02:33:16 speak_http=200 engine=nvidia voice=Magpie-Multilingual.PT-BR.Isabela
```

The completion timestamps are 29 seconds apart; requests are scheduled on a
30-second monotonic cadence and completion time includes provider latency.

## Classification

```text
kind: DETERMINISTIC_STATUS_REPORTER
cognitive_independence_proven: false
mission_authority: none
production_authority: none
```

No API key, provider token or secret is included in repository content.
