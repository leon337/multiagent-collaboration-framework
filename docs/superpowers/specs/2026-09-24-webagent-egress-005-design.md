# WebAgent Egress 005 — pinned transport design

Mission: `MCF-WEBAGENT-EGRESS-005` / Issue #356

## Threat

Preflight DNS validation alone is insufficient against DNS rebinding because the application validates one DNS answer and the underlying transport may resolve the hostname again when opening the socket.

## Design

```text
URL
  -> PublicTargetResolver
      -> validate protocol/credentials/hostname
      -> DNS once
      -> reject if any answer is non-public
      -> choose approved address + family
  -> pinned connection
      -> original hostname retained for Host/SNI
      -> socket connects to approved IP
```

### Fetch
`createPinnedFetch()` uses Node HTTP/HTTPS with a custom `lookup` callback returning only the approved address. Redirect hops are independently resolved and pinned by the existing fetch-provider loop.

### Browser
`PinnedEgressProxy` runs on loopback. Chromium is launched with that proxy:
- absolute-form HTTP requests are forwarded with a pinned connection;
- HTTPS `CONNECT host:port` resolves/validates once and opens the tunnel socket directly to the approved IP;
- Chromium still performs request-level policy checks as defense in depth.

## Security properties
- no TLS interception;
- HTTPS certificate verification and SNI remain bound to the original hostname;
- no `rejectUnauthorized: false`;
- proxy never connects to a hostname after approval, only to the selected IP;
- default public resolver rejects mixed public/private DNS answers.

## Testing
Tests use an injected resolver that maps an intentionally non-resolvable hostname to a loopback fixture. If the implementation performs a second system DNS lookup, the test fails. Production uses the public resolver and still blocks loopback/private ranges.
