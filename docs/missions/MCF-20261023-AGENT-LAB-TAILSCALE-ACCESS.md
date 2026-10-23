# Phase 07 — Mobile Tailnet Access for Agent Lab

Date: 23 October 2026
Issue: 467, PR: 468, draft branch feat/mcf-agent-studio-mvp-001.

## Problem and decision
The localhost URL of the Agent Studio refers to the mobile device itself when opened on Android. The user requires access to the real DSH chat from their phone. Reuse the existing Tailscale tailnet and expose ONLY chat-specific routes using a loopback proxy, never the administration/publish/editor APIs.

## Architecture
- Tailscale Serve HTTPS 8492 on mcf-leo-n43sm.tail582305.ts.net in tailnet-only mode, NOT Funnel.
- Local restricted HTTP proxy 127.0.0.1:4323, systemd mcf-agent-lab-mobile.service enabled.
- Upstream Studio is still 127.0.0.1:4317 and DSH bridge remains loopback-only.
- GET paths: /lab, /lab.css, /lab.js, /api/lab/status, /health, and homepage redirect equivalent.
- POST paths: /api/lab/message and /api/lab/reset, enforcing same HTTPS origin and JSON.
- Administrative paths, DSH secrets and publication/configuration URLs are unavailable through this proxy.
- Service does not persist credentials or publish on the internet.

## ESEV test evidence
- Tailscale Serve status confirms HTTPS 8492 (tailnet only) proxying to localhost:4323 without replacing the 15 pre-existing Serve entries.
- GET lab assets and lab status returned HTTP 200.
- GET /api/state, /api/publish/status, /api/provider, /api/dsh/status and token path returned HTTP 404.
- External Origin POST returned HTTP 403. Authorized Origin with invalid request reached Studio backend and returned HTTP 422.
- Automated suite 8/8 passed, including proxy tests with isolated mock and origin/security controls.
- The notebook is online on Tailscale. Android peer realme-9i was OFFLINE during checks.
- Self-loopback testing by curling the Tailscale IP from notebook timed out: the laptop is not routing that IP to its own userspace Tailscale stack.
- Actual remote mobile HTTPS page open CANNOT be certified until the Android joins the tailnet. The user needs to enable VPN in the mobile Tailscale application.

## Risk and governance
No internet Funnel, no unrestricted reverse proxy, no credential movement, no merge to main. PR remains in draft. Independent governance review remains pending. No claim of validated access from Android while that node is offline.
