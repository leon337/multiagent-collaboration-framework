# CodeBuddy Linux Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate CodeBuddy 2.146.0 on Linux into one canonical installation and one stable authenticated localhost Web UI.

**Architecture:** Keep the npm `codebuddy` command as primary and the native 2.146.0 binary only as rollback. Replace ad-hoc/transient Web UI processes with one user systemd service bound to `127.0.0.1:46514` and rooted at the MCF repository instead of `/home/leo`.

**Tech Stack:** Linux Mint, systemd --user, CodeBuddy Code 2.146.0, localhost HTTP, Git.

**Spec:** `docs/superpowers/specs/2026-09-05-codebuddy-mcf-integration-design.md`

## Global Constraints

- Preserve `~/.codebuddy`, history, authentication and custom 9Router model configuration.
- Keep the native 2.146.0 binary available as rollback.
- Do not expose the Web UI beyond `127.0.0.1`.
- Persistent Web UI must use password authentication; `--auth none` is temporary-debug only.
- Do not delete the isolated legacy profile before verification; archive it instead.
- Do not watch `/home/leo` as the CodeBuddy workspace root.

---

### Task 1: Capture rollback state and remove naming ambiguity

**Files:**
- Create: `~/.local/state/mcf-backups/codebuddy-consolidation-20260905/` (runtime backup directory)
- Inspect: `~/.config/systemd/user/workbuddy-enterprise-web.service`
- Inspect: `~/.local/bin/workbuddy`
- Inspect: `~/.local/bin/workbuddy-enterprise`

**Interfaces:**
- Consumes: current npm and native CodeBuddy installations.
- Produces: rollback snapshot and an inventory proving both versions before service changes.

- [ ] **Step 1: Record versions, paths and listeners**

Run:
```bash
command -v codebuddy
codebuddy --version
/home/leo/.local/share/workbuddy-enterprise/codebuddy-native --version
ss -lntp | grep -E ':(46514|46515)\b' || true
systemctl --user status workbuddy-enterprise-web.service --no-pager || true
systemctl --user status workbuddy-enterprise-temp.service --no-pager || true
```
Expected: canonical and rollback binaries both report `2.146.0`; existing UI state is recorded without changing it.

- [ ] **Step 2: Back up service and launcher metadata**

Run:
```bash
set -e
B="$HOME/.local/state/mcf-backups/codebuddy-consolidation-20260905"
mkdir -p "$B"
cp -a "$HOME/.config/systemd/user/workbuddy-enterprise-web.service" "$B/" 2>/dev/null || true
cp -a "$HOME/.local/bin/workbuddy" "$B/" 2>/dev/null || true
cp -a "$HOME/.local/bin/workbuddy-enterprise" "$B/" 2>/dev/null || true
printf '%s\n' "$(readlink -f "$(command -v codebuddy)")" > "$B/canonical-codebuddy-path.txt"
```
Expected: backup directory exists without copying secret files.

- [ ] **Step 3: Verify no secret material entered the backup**

Run:
```bash
find "$HOME/.local/state/mcf-backups/codebuddy-consolidation-20260905" -maxdepth 1 -type f -printf '%f\n' | sort
```
Expected: only service/launcher/path metadata; no `settings.json`, `models.json`, token or key files.

### Task 2: Install the canonical authenticated Web UI service

**Files:**
- Create: `~/.config/systemd/user/codebuddy-web.service`
- Preserve: `~/.codebuddy/settings.json`

**Interfaces:**
- Consumes: canonical npm `codebuddy` 2.146.0 and MCF repository path.
- Produces: one persistent authenticated Web UI on `127.0.0.1:46514`.

- [ ] **Step 1: Write the service unit**

Create exactly:
```ini
[Unit]
Description=CodeBuddy Web UI
After=network-online.target mcf-9router-vps-tunnel.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/leo/Documentos/GitHub/multiagent-collaboration-framework
Environment=CODEBUDDY_CONFIG_DIR=/home/leo/.codebuddy
Environment=DISABLE_AUTOUPDATER=1
Environment=PATH=/home/leo/.nvm/versions/node/v22.23.2/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/leo/.nvm/versions/node/v22.23.2/bin/codebuddy --serve --host 127.0.0.1 --port 46514 --agent cli --permission-mode default --auth password
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
```

- [ ] **Step 2: Stop only obsolete/ad-hoc UI instances**

Run:
```bash
systemctl --user stop workbuddy-enterprise-temp.service 2>/dev/null || true
systemctl --user stop workbuddy-enterprise-web.service 2>/dev/null || true
systemctl --user disable workbuddy-enterprise-web.service 2>/dev/null || true
for pid in $(ss -lntp 2>/dev/null | awk '/127\.0\.0\.1:46514/ { if (match($0,/pid=[0-9]+/)) print substr($0,RSTART+4,RLENGTH-4) }'); do
  kill "$pid"
done
```
Expected: port 46514 becomes free; unrelated CodeBuddy CLI sessions are not killed.

- [ ] **Step 3: Enable and start the canonical service**

Run:
```bash
systemctl --user daemon-reload
systemctl --user enable --now codebuddy-web.service
systemctl --user is-enabled codebuddy-web.service
systemctl --user is-active codebuddy-web.service
```
Expected: `enabled` and `active`.

- [ ] **Step 4: Verify localhost binding and HTTP**

Run:
```bash
ss -lntp | grep '127.0.0.1:46514'
curl -sS -o /dev/null -w 'HTTP=%{http_code}\n' http://127.0.0.1:46514/
```
Expected: listener is `127.0.0.1:46514`; homepage returns HTTP 200.

### Task 3: Prove the watcher/EPIPE regression is fixed

**Files:**
- Read: `~/.codebuddy/logs/**`

**Interfaces:**
- Consumes: running `codebuddy-web.service`.
- Produces: evidence that the service remains alive with the repository-scoped working directory.

- [ ] **Step 1: Confirm service working directory**

Run:
```bash
PID=$(systemctl --user show -p MainPID --value codebuddy-web.service)
readlink -f "/proc/$PID/cwd"
```
Expected: `/home/leo/Documentos/GitHub/multiagent-collaboration-framework`.

- [ ] **Step 2: Exercise the homepage and wait through the previous failure window**

Run:
```bash
curl -fsS http://127.0.0.1:46514/ >/dev/null
sleep 30
systemctl --user is-active codebuddy-web.service
```
Expected: `active`.

- [ ] **Step 3: Inspect fresh logs for the original crash signature**

Run a bounded search over logs created after this service start for:
```text
watch cap 10000
uncaughtException
EPIPE: broken pipe
```
Expected: no new matching process-exit event for the current service PID.

- [ ] **Step 4: Restart and re-verify**

Run:
```bash
systemctl --user restart codebuddy-web.service
sleep 5
systemctl --user is-active codebuddy-web.service
curl -sS -o /dev/null -w 'HTTP=%{http_code}\n' http://127.0.0.1:46514/
```
Expected: `active` and HTTP 200.

### Task 4: Retire misleading WorkBuddy aliases without deleting rollback

**Files:**
- Archive: `~/.workbuddy-enterprise/`
- Remove after backup: `~/.local/bin/workbuddy`, `~/.local/bin/workbuddy-enterprise`
- Preserve: `/home/leo/.local/share/workbuddy-enterprise/codebuddy-native`

**Interfaces:**
- Consumes: successful Tasks 1-3.
- Produces: one user-facing CodeBuddy identity plus explicit native rollback binary.

- [ ] **Step 1: Archive the isolated profile**

Run:
```bash
set -e
if [ -d "$HOME/.workbuddy-enterprise" ] && [ ! -e "$HOME/.codebuddy-native-rollback-20260905" ]; then
  mv "$HOME/.workbuddy-enterprise" "$HOME/.codebuddy-native-rollback-20260905"
fi
```
Expected: legacy profile is preserved under a truthful rollback name.

- [ ] **Step 2: Remove only misleading launch aliases**

Run:
```bash
rm -f "$HOME/.local/bin/workbuddy" "$HOME/.local/bin/workbuddy-enterprise"
```
Expected: native binary itself remains intact.

- [ ] **Step 3: Final consolidation check**

Run:
```bash
codebuddy --version
/home/leo/.local/share/workbuddy-enterprise/codebuddy-native --version
systemctl --user is-active codebuddy-web.service
ss -lntp | grep -E ':(46514|46515)\b' || true
```
Expected: canonical and rollback binaries report 2.146.0, `codebuddy-web.service` is active on 46514, and nothing listens on 46515.