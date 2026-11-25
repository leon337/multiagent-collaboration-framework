# GUI / Window Control Finding — 2026-08-27

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Status: CANDIDATE_SCOPE_FOR_NEXT_RELEASE
Authority: LEANDRO
Coordinator: MESTRE

## Context

After the v1.2.0 cross-chat succession experiment, a concrete operational deviation was identified: opening the successor chat reused the predecessor's existing ChatGPT window instead of creating and preserving a distinct window surface. The predecessor remained reachable from another device, so the material release and persistent recovery remained valid, but desktop copresence was only partial.

A follow-up GUI operation then separated predecessor and successor into two distinct Brave windows and repaired the desktop tiling path.

## Field findings

### 1. Session identity is not window identity

A new session/chat must not be assumed to imply a new operating-system window. `OPEN_NEW_CHAT` and `OPEN_NEW_WINDOW` are distinct operations.

Candidate invariant:

```text
SUCCESSOR_SESSION_CREATED != SUCCESSOR_WINDOW_CREATED
```

### 2. Predecessor surface preservation

During succession testing, the predecessor should remain open and intact on its own authorized surface until equivalence and explicit handoff are complete.

Candidate checks:

```text
OPEN_NEW_WINDOW
PRESERVE_PREDECESSOR
PLACE_WINDOWS
VISUAL_ASSERTION
BOOT_SUCCESSOR
PREDECESSOR_SURFACE_PRESERVED = PASS
```

Closing or replacing the predecessor surface should be treated as a separate action from logical authority handoff.

### 3. Window-management shortcut conflict discovered

The XFCE desktop had these effective bindings:

```text
Super_L       -> xfce4-popup-whiskermenu
Super+KP_Left -> tile_left_key
Super+KP_Right -> tile_right_key
```

The single-key `Super_L` binding could steal focus before a `Super+Arrow` chord completed.

The field fix was:

```text
Super+Left  -> left-half tiling
Super+Right -> right-half tiling
Super+Up    -> top-half tiling
Super+Down  -> bottom-half tiling
Super+Space -> Whisker Menu
```

### 4. Synthetic X11 events were insufficient for global tiling

`xdotool`-generated events did not reliably trigger the global XFWM shortcut path. This must not be misreported as the same thing as physical input.

### 5. Device-level input path validated

A temporary virtual keyboard was created through `/dev/uinput`. Xorg detected it as a keyboard device. After resolving the `Super_L` shortcut conflict, `Super+Left` emitted through this device-level path triggered the configured shortcut and produced a verifiable tiling log.

This establishes a stronger distinction:

```text
X11_SYNTHETIC_EVENT != DEVICE_LEVEL_INPUT_EVENT
```

### 6. Monitor-aware tiling required

The host has two displays with different geometry:

```text
HDMI-1  = 1920x1080 @ x=0
LVDS-1  = 1366x768  @ x=1920
```

A reliable tiling helper must identify the monitor containing the target window and compute the correct half for that monitor rather than assuming a single desktop origin.

### 7. Final field result

The two MCF ChatGPT conversations were left as separate windows:

```text
PREDECESSOR
  title: MCF NextGen - Branch · Supervisão da OX
  surface: separate Brave window
  final geometry: 683x768 @ x=1920

SUCCESSOR
  title: MCF NextGen - Recuperação e Continuidade MCF
  surface: separate Brave window
  final geometry: 683x768 @ x=2603
```

Observed result:

```text
PREDECESSOR_SURFACE_PRESERVED = PASS
SUCCESSOR_SEPARATE_WINDOW     = PASS
KEYBOARD_TILING               = PASS
```

## Proposed release impact

This finding must be considered in the next release scope, but is not yet an official protocol change until the team review and final human gate are complete.

Recommended areas for formalization:

- successor-surface invariants;
- explicit predecessor preservation rule;
- separate close-predecessor gate;
- GUI/window-control test cases;
- monitor-aware tiling behavior;
- truthfulness rule distinguishing X11 synthetic events from device-level input;
- observable/logged shortcut execution;
- regression test for two-chat simultaneous copresence.

## Governance status

```text
FINDING_PERSISTED = PASS
NEXT_RELEASE_SCOPE_CANDIDATE = PASS
TEAM_CONSENSUS = PENDING
MAIN_MUTATION = NONE
FINAL_HUMAN_GATE = PENDING
```

This artifact records a field-tested operational finding. It does not by itself authorize a new version number, merge, or release.
