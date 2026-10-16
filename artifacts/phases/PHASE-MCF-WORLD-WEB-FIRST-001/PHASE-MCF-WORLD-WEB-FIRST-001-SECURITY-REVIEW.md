# Security Review — MCF World Web MVP

## Reviewed boundaries
- user-provided URL handling;
- iframe capabilities;
- external-window navigation;
- static HTTP server filesystem resolution;
- CDN/browser dependency boundary.

## Controls observed
- `normalizeHttpUrl` rejects empty values, parsing failures and every non-HTTP(S) scheme.
- Browser Surface calls the same normalizer before assigning iframe src.
- External opening uses `window.open(..., 'noopener,noreferrer')`.
- Iframe sandbox is `allow-forms allow-scripts allow-popups`; `allow-same-origin` is absent.
- Referrer policy is `strict-origin-when-cross-origin`.
- The local server accepts only GET/HEAD, emits nosniff, resolves paths under a fixed app root and rejects traversal outside it.
- A server regression test proves traversal blocking.

## Known constraints / residual risks
- Third-party sites can refuse iframe embedding through CSP/X-Frame-Options. The app does not and must not bypass those controls.
- Embedded remote content remains untrusted active content inside the sandbox. The sandbox intentionally denies same-origin privileges but still allows scripts/forms/popups to preserve basic site usability.
- Three.js is loaded from a pinned jsDelivr URL. Version pinning limits drift but does not eliminate CDN availability/supply-chain risk. A future deployment can self-host the module or add provider-level integrity controls.
- A production hosting CSP/header policy is not defined in this phase because provider selection and production deployment are explicitly deferred.

## Assessment
No blocking security finding was identified for the authorized hosted-MVP boundary. Production deployment still requires its own hosting/header/security review.
