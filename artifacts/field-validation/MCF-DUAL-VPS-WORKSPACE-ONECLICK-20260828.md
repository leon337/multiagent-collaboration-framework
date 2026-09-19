# Field Validation — MCF Dual VPS Workspace One-Click

Mission: `MCF-DUAL-VPS-WORKSPACE-ONECLICK-001`  
Date: 2026-08-28  
Base release: `v1.2.0`  
Authority: human-controlled mission  
Result: PASS WITH KNOWN LIMITATION

## Scope

Validate a one-click local launcher that reconstructs two independent XRDP sessions of the same VPS, one per physical local display, with browser isolation and visible logs.

## Environment observed

```text
VGA-1  connected 1360x768+0+0
LVDS-1 connected 1366x768+1360+0
local tunnel 127.0.0.1:13389
XRDP policy Policy=UBC
```

The VPS already contained older persistent XRDP sessions. No session was deleted during this mission.

## Test 1 — Existing-state idempotency

Initial state:

- SSH tunnel already listening;
- two Remmina windows already open;
- two working XRDP displays already present.

Launcher result:

```text
REUSE ssh_agent
REUSE tunnel=127.0.0.1:13389
PASS xrdp_policy=UBC
REUSE window=VPS Workspace 1
REUSE window=VPS Workspace 2
PASS window_geometry W1=0 0 1360 768 W2=1360 0 1366 768
READY two_independent_xrdp_sessions + isolated_brave_profiles
```

Verdict: PASS.

## Test 2 — Second click

The launcher was invoked a second time without closing the environment.

Observed:

```text
Remmina mission process count = 2
Workspace 1 geometry = 0 0 1360 768
Workspace 2 geometry = 1360 0 1366 768
Brave display profile 1 = REUSE
Brave display profile 2 = REUSE
```

No third Remmina process was created.

Verdict: IDEMPOTENCY PASS.

## Test 3 — Controlled cold start

Preparation intentionally terminated only:

- the two Remmina mission processes;
- the mission SSH tunnel.

It did not reboot the notebook or VPS and did not terminate XRDP/Xorg sessions on the VPS.

Pre-launch state:

```text
Remmina mission windows = 0
local 13389 listener = 0
```

One launcher activation produced:

```text
START tunnel=127.0.0.1:13389
PASS xrdp_policy=UBC
START window=VPS Workspace 1
START window=VPS Workspace 2
PASS window_geometry W1=0 0 1360 768 W2=1360 0 1366 768
READY two_independent_xrdp_sessions + isolated_brave_profiles
```

Post-launch evidence:

```text
127.0.0.1:13389 LISTEN by ssh
Remmina mission process count = 2
Workspace 1 = 1360x768+0+0
Workspace 2 = 1366x768+1360+0
```

Verdict: COLD-START PASS.

## Test 4 — Browser isolation

The two most recent XRDP Xorg displays were distinct:

```text
DISPLAY=:14
DISPLAY=:13
```

The remote browser helper assigned distinct profile roots:

```text
$HOME/.config/BraveSoftware/MCF-RDP-14
$HOME/.config/BraveSoftware/MCF-RDP-13
```

Process matches existed for both profile roots and Brave windows were visible in both X displays through `xwininfo`.

Verdict: BROWSER ISOLATION PASS.

## Test 5 — Secret exposure

Operational logs were scanned for common secret patterns including long `sk-...` values, password assignments, API-key assignments, and token assignments.

```text
LOCAL_SECRET_PATTERN_MATCHES=0
```

No secret value was intentionally printed during validation.

Verdict: PRIVACY PASS.

## Rollback

A local rollback helper was created and syntax-validated. Its contract is:

- terminate only mission Remmina/tunnel processes;
- restore or remove the remote user-space browser helper;
- remove local mission launcher files and desktop icon;
- preserve state/logs/backups.

Rollback was not executed because that would remove the successfully validated deployment.

## Known limitation

The VPS uses persistent XRDP sessions and had older sessions with `KillDisconnected=false`. The helper selects the two most recent XRDP Xorg displays and does not kill stale sessions. This is safe for the validated two-client workflow but should be hardened if unrelated newer XRDP sessions are intentionally run concurrently.

## Final field verdict

```text
TUNNEL_RECREATE       PASS
TWO_REMMINA_CLIENTS   PASS
XRDP_UBC              PASS
WINDOW_LAYOUT         PASS
SECOND_CLICK          PASS
BROWSER_ISOLATION     PASS
SECRET_SCAN           PASS
ROLLBACK_AVAILABLE    PASS
```

Overall: `PASS WITH KNOWN LIMITATION`.

No merge, release, reboot, XRDP service restart, or VPS reboot was performed by this validation.
