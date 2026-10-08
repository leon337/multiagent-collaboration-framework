# MCF DSH Inline Browser

This plugin reuses the existing `dsh-builtin-browser` BrowserRuntime. It does not create a second browser engine and does not use `connectUrl: http://127.0.0.1:9222`.

Architecture:

`DSH session → browser_goto → dsh-builtin-browser BrowserRuntime → conversation-owned browser session → tabs → SSE live view → tool card`

The live stream is bound to both the tool call id and the owning DSH session id. Chat A cannot subscribe to Chat B's browser stream.

The MCF inline profile must not mount `@try-works/dsh-browser-agent`; that legacy path is the source of the external 9222 Chrome attachment.

Acceptance gates: HARNESS_OWNED_BROWSER, INLINE_BROWSER_VIEW, CHAT_ISOLATION, EVENT_ISOLATION, DUAL_CHAT_E2E, DSH_3081_PROOF.
