# PHASE PLAN — MCF-PET-GEMINI-LIVE-001

Authority: LEANDRO directly authorized implementation, merge and deployment on 2026-11-16.
Orchestrator: MESTRE. Canonical repository: leon337/multiagent-collaboration-framework.
Baseline: main@b88ccda900a477fd5490a8897bd663069354f6cd.
Branch: feat/mcf-pet-gemini-live-20261116.

Goal: provide natural continuous audio conversation with the same existing MESTRE Agent and its Pet, replacing push-to-talk for the new mode without opening an autonomous-execution surface.

Scope: feature package, isolated authenticated WebSocket endpoint in existing MESTRE Agent, Pet dashboard UI and existing Tailnet routes, local deployment and rollback, CI.

Out of scope: mission execution, browser tools, HUMAN_GATE approval, altering canonical MissionRuntime database, Google API key rotation, new public listener, automatic wake word, production MissionRuntime deployment.

Acceptance:
1. One-time 30-second signed session ticket, CSRF, origin allowlist and safe local key 0600.
2. Gemini 3.8 Live handshake + audio response confirmed without tools.
3. Browser capture starts only on explicit click, stops on user action/tab exit.
4. Audio PCM 16 kHz upstream / 24 kHz downstream, interruption buffering.
5. Original Pet states and same MESTRE personality / SQLite.
6. Unit tests, API smoke, Chrome desktop/mobile and non-regression.
7. PR with evidence and merge after checks; deploy to existing local services only.
