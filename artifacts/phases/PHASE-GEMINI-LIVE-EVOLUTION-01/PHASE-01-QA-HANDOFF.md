# QA to LEO-profile handoff

handoff_id: MCF-GEMINI-F1-LEO-GATE-20261116-001
mission_id: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
phase_id: PHASE-01-AUDIO-RELIABILITY
cycle: 2
from: MESTRE
to: LEO (external Codex CLI under normative LEO profile)
objective_state: GATE_PENDENTE
delivered: F1 PR #529 candidate code, PRF, primary F1.4 and F1.5 JSONs, two external Emily reviews, adversarial tests
evidence: 632-second real GoAway recovery, 10 turns, semantic keyword after reconnect, 17/17 browser, 8/8 playback, 5/5 adversarial, 12/12 offline, physical mic samples; physical speaker monitor inconclusive
decisions: LEANDRO authorized this F1 QA and a Codex CLI agent using the official LEO profile; previously postponed API key rotation
open_findings: physical headset audibility, 9 underruns, antialias, UI port backlog, stable voice p95/cost, F0.8
blockers: native Emily agent receipt missing; human listening unavailable, production authorization not given
next_action: Determine delegated internal gate using normative role and exact SHA; return decision and next state with evidence citations
acceptance_for_next_action: Real separate Codex CLI thread ID, read-only verification, explicit decision APROVAR/APROVAR_COM_RESSALVAS/RETORNAR/BLOQUEAR/ESCALAR and justification
return_to: MESTRE
continue_in_same_response: true

Scope note: the external CLI Codex profile does not create or authenticate a native MCF Agent Session. This gate output is an external delegate assessment at LEANDRO's explicit request.

## Return from LEO external profile to MESTRE
On 2026-11-16 a distinct external Codex CLI process with LEO normative profile (thread 01a1e697-23c5-7af1-a68f-05d56083e38c) reviewed SHA 361a08b730b24b7fe0ba88e5917634dd3a947d64 and emitted RETORNAR_PARA_CORRECAO. It independently verified 12/12 offline tests, 24/24 source hashes, 26/26 PRF hashes. F1.1-F1.4 partial; F1.5 insufficient; F1.6 partial. This is NOT a native MCF Agent Session. F0.8 remains open and no merge/deploy is approved. Primary receipt in QA-F1-20261116/LEO-PROFILE-GATE.md.
Next action: finish physical audibility QA, voice latency/cost benchmark and class C governance, reconcile F0.8 and resubmit SHA final.

## Q3 return to gate delegates
qa_id: MCF-GEMINI-F1-Q3-20261116
coordinator: MESTRE
evidence: QA-F1-Q3-AUDIO-20261116 (browser 17/17, physical mic 63 frames, resampler 17/17 unit, gap classifier 3/3, text playback 18/19 success n=18)
historic_gate: LEO-profile Codex external RETORNAR at SHA 361a08b; not a new native gate
open_findings: 16-second nonterminal response, voice mouth-to-ear p95, natural barge-in, hardware acoustic quality, F0.8, unrotated key
next_action: external Emily-profile reviewer on new exact commit, then external LEO-profile delegated gate; gate must not be represented as native Agent Session.

## F1 Q3 cycle 3 clock origin
The external Codex CLI Emily-profile reviewer at ae9f76a found a P1 clock-domain mismatch causing fresh mic frames to be dropped after delayed worklet startup. MESTRE fixed Worklet timestamps to use AudioContext clock and added a VM delayed init test. 20/20 Node tests, 17/17 real Gemini browser E2E, and 60 frames/zero stale drops in a browser with deliberately delayed addModule passed with source hashes. The one previous real Google nonterminal turn in 19 attempts is NOT fixed by a 16s watchdog warning, and human voice/headset gate/F0.8 remain OPEN. Reports in QA-F1-Q3-AUDIO-20261116/Q3-CLOCK-REMEDIATION.md.

## Independent external LÉO-profile gate on Q3 clock-origin candidate
At LEANDRO's request, a separate read-only Codex CLI under the normative docs/agentes/LEO.md profile reviewed SHA c6f85b083837b297bd1bf04cba0e6582c5861afe. Codex thread 01a1e6e0-7292-71b1-8ff2-738d098e268c, explicit decision **RETORNAR_PARA_CORRECAO**. This is a real external profile-based executor receipt, but NOT a native authenticated MCF Agent Session.
Evidence and justification: QA-F1-Q3-AUDIO-20261116/LEO-PROFILE-GATE-Q3-CLOCK.md. F0.8 and public production key rotation remain open; this QA does not authorize merge/deploy. It does not claim 30 physical speech mouth-to-ear latency measurements or spontaneous barge-in evidence. F2 work remains planning-only unless all prerequisite gates formally approve.
