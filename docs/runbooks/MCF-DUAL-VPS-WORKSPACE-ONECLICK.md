# MCF Dual VPS Workspace — One-Click Runbook

Mission: `MCF-DUAL-VPS-WORKSPACE-ONECLICK-001`  
Field validation date: 2026-08-28  
Base release: MCF v1.2.0 — Human Control + Visible Copresence  
Status: FIELD-VALIDATED, NOT MERGED, NOT A RELEASE CHANGE BY ITSELF

## Objective

Reconstruct two independent graphical sessions of the same VPS from one local launcher, one session per physical monitor, while preserving visible/auditable execution and keeping browser processes isolated per XRDP display.

The reference field layout was:

- left monitor: `VGA-1`, 1360x768;
- notebook panel: `LVDS-1`, 1366x768;
- local RDP tunnel: `127.0.0.1:13389` -> VPS `127.0.0.1:3389`;
- local client: Remmina;
- remote server: XRDP;
- XRDP session policy: `Policy=UBC`.

## Why this exists

A single Linux user can have multiple persistent XRDP sessions. A browser using one shared profile may detect an already-running instance and send a new window to another XRDP display. The visible symptom is: the user clicks the browser icon, but no browser appears in the current desktop.

The field solution has two independent layers:

1. XRDP connection isolation: two Remmina processes + `Policy=UBC`.
2. Browser isolation: a distinct Brave `--user-data-dir` derived from each XRDP `DISPLAY`.

XFCE virtual workspaces are not the same thing as these two XRDP sessions.

## Toolchain used

- `ssh`, `ssh-agent`, `ssh-add` — secure tunnel/authentication;
- `ss` — tunnel/listener verification;
- Remmina — two independent RDP clients;
- XRDP / Xorg — independent remote graphical sessions;
- `xrandr` — monitor discovery and geometry;
- `wmctrl` — deterministic local window placement/fullscreen;
- `xwininfo` — remote graphical evidence;
- Brave — browser under per-display profiles;
- XFCE Terminal — visible execution/audit surface.

No password, API key, SSH private key contents, token, cookie, or browser secret is written to the operational log.

## State machine

```text
PRECHECK
  -> confirm VGA-1 + LVDS-1
  -> confirm required local commands
AUTH
  -> reuse a live ssh-agent when possible
  -> otherwise start a session-local agent and ask for the key passphrase visibly
TUNNEL
  -> reuse 127.0.0.1:13389 if owned by ssh
  -> otherwise create the forward
XRDP
  -> verify Policy=UBC
RDP_SESSIONS
  -> reuse Workspace 1 / Workspace 2 if open
  -> otherwise launch two Remmina instances with distinct GApplication IDs
LAYOUT
  -> Workspace 1 -> VGA-1
  -> Workspace 2 -> LVDS-1
BROWSER
  -> select the two most recent XRDP Xorg displays
  -> reuse or start one Brave profile per display
VERIFY
  -> two local Remmina processes
  -> two local windows at expected geometry
  -> two distinct XRDP displays
  -> isolated Brave profiles
  -> READY
```

## Idempotency contract

A second launcher activation must not create duplicate infrastructure.

Expected behavior:

- tunnel already active -> `REUSE`;
- Workspace 1 already open -> `REUSE`;
- Workspace 2 already open -> `REUSE`;
- Brave profile already active for a display -> `REUSE`;
- window geometry may be re-applied safely;
- concurrent launcher invocation is rejected by a local `flock` lock.

## Local deployment reference

Field deployment used:

```text
~/.local/bin/mcf-vps-dual-workspace
~/.local/bin/mcf-vps-dual-workspace-terminal
~/.local/bin/mcf-vps-dual-workspace-launcher
~/.local/bin/mcf-vps-dual-workspace-rollback
~/Área de trabalho/MCF-2-Workspaces-VPS.desktop
```

Remote user-space helper:

```text
~/.local/bin/mcf-rdp-brave-newest-two
```

The remote helper requires no `sudo` and derives the Brave profile from the XRDP display, for example:

```text
DISPLAY=:14 -> $HOME/.config/BraveSoftware/MCF-RDP-14
DISPLAY=:13 -> $HOME/.config/BraveSoftware/MCF-RDP-13
```

## Security boundaries

- Do not use `NOPASSWD: ALL`.
- Do not store the SSH key passphrase in the launcher.
- Do not expose XRDP directly to the LAN/Internet for this workflow; use the loopback SSH forward.
- Do not restart or reboot the VPS to make the launcher work.
- If `127.0.0.1:13389` is occupied by a non-SSH process, fail closed.
- If `Policy=UBC` cannot be verified, fail closed.
- The launcher may terminate only its own Remmina/tunnel processes during controlled tests or rollback.

## Failure modes learned in the field

### Browser appears to do nothing

Cause: a shared Brave profile is already owned by a process on another XRDP display.

Fix: separate `--user-data-dir` values per display.

### Two Remmina windows reconnect to the same graphical session

Cause: XRDP session policy does not distinguish concurrent connections sufficiently.

Fix: validate `Policy=UBC` before declaring success.

### Remmina opens on the wrong monitor

Fix: remove fullscreen/maximized state, apply monitor geometry with `wmctrl`, then restore fullscreen.

### First click after login asks for a passphrase

This is intentional. If no usable ssh-agent exists, the launcher opens a visible terminal and calls `ssh-add`. The passphrase is not persisted by the MCF launcher.

## Rollback

Rollback must be explicit and reversible:

1. terminate only the two Remmina instances created for this workflow;
2. terminate only the `contabo-vps-rdp` tunnel created for this workflow;
3. restore/remove the remote user-space browser helper;
4. remove the local desktop launcher and helper scripts;
5. preserve logs/backups for audit.

## Known limitation

The field VPS retained older disconnected XRDP sessions because `KillDisconnected=false`. The browser helper intentionally does not kill them; it selects the two most recent Xorg XRDP displays. If unrelated newer XRDP sessions are introduced concurrently, session selection should be hardened further rather than silently killing old sessions.

## Release handling

MCF v1.2.0 is treated as historical and immutable. This runbook is knowledge produced by a v1.2.0 Visible Copresence field mission and should be referenced by a future release candidate only after review and human gate. No merge or release is implied by this document.
