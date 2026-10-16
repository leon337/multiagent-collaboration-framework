# Electron Reconciliation — MCF World

## Purpose

Resolve Issue #330 using the authoritative local Electron workspace that became available again on 2026-09-24.

## Authoritative local source

- Local workspace: /home/leo/Apps/mcf-world-3d
- Branch: main
- Pre-reconciliation HEAD: 639f536b0b74680fe74d2f4ea99612d07d02ff21
- Reconciled Task 6 commit: 195b3ef9e89706ae94168f08be7e9fbe3a4a0cee
- Reconciled tree: 0c550a5ce7c9d1e0a5caae670d8b1c84cc1e6d26
- Working tree after commit: clean

## Preserved pre-commit evidence

Backup directory on the source workstation:

    /home/leo/mcf-archipelago-backups/mcf-world-3d-20260924-010959

Hashes:

- workspace.tar.gz SHA-256: 299af38cec1511a583f11945633a77b0341ac2a7786a5726c383ea3e7f30a88f
- uncommitted.diff SHA-256: 644d49ccb29ba527f987d19a28aebb1c1b7df522e6488ffc5f93ef14a0c7fd38

The backup captures the real uncommitted Task 6 state before it was committed.

## Task 6 content recovered

- deny remote WebContentsView permission requests by default;
- reject Browser Surface IPC from any sender other than the trusted world renderer;
- keep privileged/non-HTTP(S) URL rejection;
- retain popup denial/internal navigation validation;
- add development smoke hook for open/close Browser Surface;
- make the Linux XFCE launcher select the required Node 22 binary;
- add .gitignore and package-lock.json.

## Local validation

After committing Task 6 in the standalone Electron repository:

- npm test: 20 tests
- pass: 20
- fail: 0
- local working tree: clean

After importing the same executable source into this monorepo under apps/mcf-world-desktop:

- npm ci: success
- npm audit result from install: 0 vulnerabilities
- npm test: 20 tests
- pass: 20
- fail: 0

## Reconciliation result

The Electron application is now versioned in the official MCF repository under:

    apps/mcf-world-desktop/

The hosted browser-first surface remains independent under:

    apps/mcf-world-web/

No legacy local files were overwritten. The standalone Electron repository remains intact and continues to launch from the Linux desktop shortcut.

## Capability split

### Hosted web

Use apps/mcf-world-web for the provider-neutral hosted/browser experience on Windows 10 and Linux.

### Electron desktop

Use apps/mcf-world-desktop when native desktop behavior or a richer embedded Browser Surface is required. The Electron Browser Surface uses WebContentsView and does not attempt to bypass destination-site security policies.

The X11 launcher is Linux-specific. The generic Electron development entry point is npm start.

## Remaining limits

This reconciliation does not claim:
- an installed Windows 10 desktop package;
- a real GUI smoke test on a Windows 10 machine;
- a production hosting deployment.

Those are separate delivery/deployment concerns, not evidence gaps in the recovered Task 6 lineage.
