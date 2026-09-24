# WebAgent Egress 005 — implementation plan

Issue: #356

- [ ] Add RED tests for pinned fetch, CONNECT proxy, and real Chromium through proxy.
- [ ] Observe exact-head CI RED for missing pinned transport components.
- [ ] Extract public target resolution from existing egress policy.
- [ ] Implement Node HTTP/HTTPS pinned fetch preserving Host and TLS SNI.
- [ ] Make pinned fetch the default WebAgent fetch transport.
- [ ] Implement loopback pinned egress proxy for HTTP and HTTPS CONNECT.
- [ ] Route Playwright through the proxy and retain request-level policy checks.
- [ ] Dispose proxy/sockets on terminal browser states.
- [ ] Add blocked-target and rebinding regression tests.
- [ ] Update README/security claims to remove the preflight-only limitation only where evidence supports it.
- [ ] Exact-head WebAgent qualification GREEN.
- [ ] Draft PR; merge only after qualification and authority boundary.
