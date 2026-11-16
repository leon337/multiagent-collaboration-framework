# QA F1.4 / F1.5 / F1.6 - Evidencia de hardware e conexao

Mission: MCF-GEMINI-LIVE-EVOLUTION-20261116-001 | PR #529 draft.
Coordinator MESTRE. Reviewer Codex CLI under Emily external profile (not native).
Gate requested: Codex CLI under LEO external profile (not a native Agent Session).

## Primary files
- EVIDENCE-PHYSICAL-IO.json: 32,000 real USB mic samples in 2s, numerical metadata only.
- EVIDENCE-PHYSICAL-BROWSER.json: Chrome getUserMedia with real audio track, 64 PCM worklet frames / 40,960 samples, no media persisted.
- EVIDENCE-SPEAKER-MONITOR.json: sink accepted 660Hz tone but monitor produced zero samples. Audible loudspeaker output NOT proven.
- EVIDENCE-180S-EXPLORATORY.json: 180s test with 3 attempted turns; recorder only counted generationComplete, which is not always present. Initial 2/3 is an instrumentation limitation, not proof the model failed.
- EVIDENCE-DIAGNOSTIC-6-TURNS.json: test with generationComplete OR turnComplete, 6/6 completed; induced network disconnection recovered; handle present. Semantic context continuity not proven.
- EVIDENCE-HIGH-FIXES-4.json: 4/4 adversarial tests of playback controls after close, token timeout, setup watchdog and reconnect budget.
- EMILY-EXTERNAL-REVIEW-EA96781.md: independent external Codex CLI audit against old HEAD; verdict RETORNAR_PARA_CORRECAO.
- EVIDENCE-LONG-SESSION.json: confirmed as 632s real Live with GoAway and recovery.
- LEO-PROFILE-GATE.md: pending genuine Codex CLI profile-based gate output.

## Unsupported conclusions
Physical subjective listening, spontaneous human barge-in, final-speech-to-first-playback latency and reliable p95 cost/SLO were not validated. No release or public exposure. Rotation of previously exposed key explicitly postponed by user.
External CLI agent profiles are not authenticated native MCF agent sessions.

## Terminal evidence added
EVIDENCE-LONG-SESSION.json: 632-second real Live session, 1 GoAway, 1 resumed connection, 10 completed turns, 9 underruns.
EVIDENCE-SEMANTIC-RESUME.json: synthetic keyword after reconnect (positive case).
EVIDENCE-HIGH-FIXES-5.json: 5/5 adversarial checks with app and test hashes at execution.
EVIDENCE-BROWSER-E2E-CURRENT.json: 17/17 browser checks with source and script hashes.
EMILY-EXTERNAL-REREVIEW-BEF121C.md: external re-review, confirms A1–A3 fixed but additional medium cancel-backoff issue (now patched).
LEO-PROFILE-GATE.md: real external profile-based Codex gate RETORNAR_PARA_CORRECAO, SHA 361a08b730b24b7fe0ba88e5917634dd3a947d64, thread 01a1e697-23c5-7af1-a68f-05d56083e38c.
