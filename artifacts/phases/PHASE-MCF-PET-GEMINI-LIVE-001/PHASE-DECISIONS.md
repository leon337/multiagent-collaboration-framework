# PHASE DECISIONS — MCF-PET-GEMINI-LIVE-001

1. Extend the existing MESTRE Agent, never create a second agent or duplicate model secret.
2. Gateway is a dedicated websocket route with no function declarations. Reject provider tool calls.
3. Browser connects to existing MESTRE Agent on 8878 (local) or pre-existing WSS Tailnet 8466. No new network services or routes.
4. Bridge ticket is 30-second HMAC, one-time within the active gateway process, cookie/CSRF gated, no API key in browser. Key is private 0600 on host.
5. Use PCM16 16 kHz input and PCM16 24 kHz output, browser AudioWorklet and buffered WebAudio.
6. Keep microphone off until explicit start; stop when navigating away or tab hidden. Max 5 minutes per session, one session at a time.
7. Preserve existing push-to-talk fallback, infrastructure read-only endpoints and MissionRuntime boundary.
8. Existing MESTRE Agent memory is reused; transcribed text can persist in its existing SQLite, no raw audio persistence by Service Hub.
9. Do not claim remote Tailnet is working without actual evidence: self-access test from host failed with Network is unreachable.
10. Deploy only local MESTRE Agent and Service Hub under this authorization; no production Runtime release.
