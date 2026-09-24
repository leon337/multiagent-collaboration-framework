# MCF World Desktop

Electron desktop shell for MCF World.

## Run

Cross-platform development entry point:

    npm ci
    npm start

The Electron main process is electron/main.mjs.

## Linux / XFCE X11

For the current Linux workstation, scripts/launch-x11.sh sets the active X11/DBus environment and detaches the app.

## Windows

The source and Node test suite are platform-neutral. Windows execution uses the standard npm start entry point; the X11 launcher is Linux-only and is not used on Windows.

## Relationship to the hosted app

../mcf-world-web/ is the hosted browser-first surface. This desktop app preserves the richer Electron Browser Surface (WebContentsView) for sites and native desktop capabilities that cannot be guaranteed inside a normal web iframe.

## Security

- remote WebContentsView uses sandboxing and no Node integration;
- remote permission requests are denied by default;
- privileged/non-HTTP(S) URLs are rejected;
- popup attempts are denied and routed through internal URL validation;
- IPC Browser Surface handlers accept only the trusted world renderer.
