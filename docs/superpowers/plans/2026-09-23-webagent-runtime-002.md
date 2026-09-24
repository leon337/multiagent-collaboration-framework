# WebAgent Runtime 002 — Implementation Plan

Issue: #346

- [ ] Add RED tests for public-egress policy, SearXNG mapping and real Chromium execution.
- [ ] Observe CI RED on exact SHA.
- [ ] Implement `EgressPolicy`, public IP/DNS checks and explicit allow-all test policy.
- [ ] Harden `HttpFetchProvider` with policy evaluation and manual redirect validation.
- [ ] Implement `SearxngSearchProvider` and environment-based provider selection.
- [ ] Generalize browser snapshots and implement `PlaywrightBrowserRuntime`.
- [ ] Route Chromium requests through egress policy and preserve cancel/dispose behavior.
- [ ] Update MCP descriptions and operator docs.
- [ ] Observe exact-head CI GREEN.
- [ ] Open draft PR with explicit remaining DNS-rebinding/public-deploy boundary.
