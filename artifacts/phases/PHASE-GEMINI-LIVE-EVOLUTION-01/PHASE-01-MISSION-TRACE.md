# F1 MCF mission trace and ESEV

Mission: MCF-GEMINI-LIVE-EVOLUTION-20261116-001 | Phase F1
Authority LEANDRO; coordinator MESTRE; gate delegate LEO; independent audit Emily.
Only named active executors below have true tool/session evidence; other normative agents are pending rather than simulated.

1. MESTRE retrieved canonical Issue #527, PR #529, docs/agentes/LEO.md and EMILY.md, operating protocol and MCF-DEC-017/050, verified the online authorized computer.
2. MESTRE used remote execution to test real USB mic PipeWire (32,000 samples) and Chrome AudioWorklet (40,960 samples) and a physical analog output tone; sink monitor did not validate audible output.
3. MESTRE ran 180s exploratory conversation, found harness-only-completion issue, corrected measurement and obtained 6/6 terminals plus induced reconnect with handle.
4. EXTERNAL Emily-profile Codex CLI read-only session (thread 01a1e67d-2061-70b2-87c4-80230314230f) audited PR SHA ea96781 and returned RETORNAR, A1–A4 findings.
5. MESTRE corrected A1–A3 and tested 4/4 adversarial, 12/12 offline, committed source/QA at bef121c.
6. EXTERNAL Emily-profile Codex CLI read-only session (thread 01a1e68b-1b8a-7ff1-b876-b54a04e7b153) reviewed bef121c, resolved A1–A3 on code, returned RETORNAR for release, and found stop during backoff missing.
7. MESTRE ran a 632-second real Live test with session compression and resumed after one actual GoAway, 10 completed turns, 9 underruns and clean final release.
8. MESTRE ran an actual synthetic keyword semantic resume check, positive.
9. MESTRE corrected backoff cancel UI, added fifth adversarial test (5/5), re-ran browser 17/17 and playback 8/8 with source hashes.
10. MESTRE prepared PRF/QA and handoff to external Codex CLI with LEO normative profile for gate decision.

Outstanding: native agent Emily invocation not established; F0.8 still open, physical audible and 30+ sample p95/cost not measured, other class C control-agent artifacts incomplete; no release/merge/production deployment authorized.

## Codex CLI external LEO-profile gate decision
On 2026-11-16 a distinct external Codex CLI process with LEO normative profile (thread 01a1e697-23c5-7af1-a68f-05d56083e38c) reviewed SHA 361a08b730b24b7fe0ba88e5917634dd3a947d64 and emitted RETORNAR_PARA_CORRECAO. It independently verified 12/12 offline tests, 24/24 source hashes, 26/26 PRF hashes. F1.1-F1.4 partial; F1.5 insufficient; F1.6 partial. This is NOT a native MCF Agent Session. F0.8 remains open and no merge/deploy is approved. Primary receipt in QA-F1-20261116/LEO-PROFILE-GATE.md.

## Independent external LÉO-profile gate on Q3 clock-origin candidate
At LEANDRO's request, a separate read-only Codex CLI under the normative docs/agentes/LEO.md profile reviewed SHA c6f85b083837b297bd1bf04cba0e6582c5861afe. Codex thread 01a1e6e0-7292-71b1-8ff2-738d098e268c, explicit decision **RETORNAR_PARA_CORRECAO**. This is a real external profile-based executor receipt, but NOT a native authenticated MCF Agent Session.
Evidence and justification: QA-F1-Q3-AUDIO-20261116/LEO-PROFILE-GATE-Q3-CLOCK.md. F0.8 and public production key rotation remain open; this QA does not authorize merge/deploy. It does not claim 30 physical speech mouth-to-ear latency measurements or spontaneous barge-in evidence. F2 work remains planning-only unless all prerequisite gates formally approve.
