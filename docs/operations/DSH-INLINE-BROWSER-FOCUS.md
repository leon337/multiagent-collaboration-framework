# DSH inline Browser — composer focus boundary

## Bug fixed

The MCF inline Browser live view refreshes frames by calling the native `dsh-builtin-browser` screenshot path.

In `dsh-builtin-browser` 0.4.5, the Electron host performed:

`capturePage()` → `BrowserWindow.focus()`

That made every inline frame capture steal the OS keyboard focus from the DSH message composer.

## Fix

Do not focus the browser window as a side effect of screenshot capture. `capturePage()` remains responsible for producing the live frame.

## Required invariant

> A passive inline Browser frame refresh MUST NOT change the OS active window or steal focus from the DSH composer.

This is different from intentional Browser interaction: when the human explicitly clicks the Browser window, normal Browser focus behavior is preserved.

## Evidence

Verified on the Linux Mint notebook with DSH service `127.0.0.1:3081`:

- `mcf-dsh.service` restarted successfully after applying the patch.
- Active DSH conversation remained the active OS window while the inline Browser was refreshing.
- Composer click remained focused for at least 3 seconds while live Browser capture continued.
- Typed text `FOCUS_OK` appeared in the DSH composer instead of being redirected to `dsh-browser`.
- The previous external test Chrome on port 9222 was terminated.
- The active web profile contains `dsh-builtin-browser` + `mcf-dsh-inline-browser`; no `@try-works/dsh-browser-agent` dependency is present in the effective profile package.

## Canonical runtime patch

`plugins/dsh-inline-browser/runtime/dsh-builtin-browser-0.4.5-focusless-capture.patch`

## Regression gate

The inline Browser integration is not healthy if any periodic frame refresh changes the active OS window without an explicit human click on the Browser.
