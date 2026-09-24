# WebAgent Egress 005 — implementation plan

Issue: #356

- [x] Add RED tests for pinned fetch, CONNECT proxy, and real Chromium through proxy.
- [x] Observe exact-head CI RED for missing pinned transport components.
- [x] Extract public target resolution from existing egress policy.
- [x] Implement Node HTTP/HTTPS pinned fetch preserving Host and TLS SNI.
- [x] Make pinned fetch the default WebAgent fetch transport.
- [x] Implement loopback pinned egress proxy for HTTP and HTTPS CONNECT.
- [x] Route Playwright through the proxy and retain request-level policy checks.
- [x] Dispose proxy/sockets on terminal browser states.
- [x] Add blocked-target and rebinding regression tests.
- [x] Update README/security claims to remove the preflight-only limitation only where evidence supports it.
- [x] Exact-head WebAgent qualification GREEN.
- [ ] Draft PR; merge only after qualification and authority boundary.
