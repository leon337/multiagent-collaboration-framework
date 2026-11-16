# F0 sanitized reproduction snapshot

Source: authorized local Gemini Live Studio at /home/leo/Projetos/gemini-live-studio.
This directory is a **historical audit snapshot**, not a deployed service or new runtime.
The application was copied without .private/, API keys, node_modules, logs, saved browser state, audio, video, or user media.

The JSON result files reflect point-in-time observations made during the F0. They are not signed provider receipts. The browser E2E smoke uses virtual microphone/camera and a mock display capture; physical devices are unverified.
Requires a separately configured local key in .private/ for authenticated API tests. NEVER commit it.

Reproduce offline: node --check server.js; node --check public/app.js; node --check public/telemetry.js.
Security smoke and provider probes require an explicitly configured local environment. No CI execution with personal keys.
