#!/usr/bin/env python3
"""Read-only projection of the existing desktop Pet MESTRE.

Pet telemetry is a strictly bounded, private /run/user/<uid> state file.
No input, audio, conversations, prompts or agent state is collected.
"""
from __future__ import annotations

import copy
import datetime as dt
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import threading
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPRedirectHandler

PET_SERVICE = "agente-dominante-pet.service"
VOICE_SERVICE = "voicehub-linux.service"
PRESENCE_FILE = Path(f"/run/user/{os.getuid()}/mcf-pet-presence-v1.json")
PET_STATES = frozenset(("ocioso", "ouvindo", "raciocinando", "executando", "concluido", "erro"))
PET_STATE_TTL = 8.0
PET_SCRIPT = Path.home() / "Aplicativos/agente-dominante-pet/agente_dominante_pet.py"
PET_INTERPRETER = PET_SCRIPT.parent / ".venv/bin/python"
VOICE_URL = "http://127.0.0.1:8788/api/status"

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None

def _now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")

def _unit_info(service: str) -> dict[str, Any]:
    if service not in (PET_SERVICE, VOICE_SERVICE):
        raise ValueError("unlisted systemd unit")
    try:
        result = subprocess.run(
            ("systemctl", "--user", "show", service,
             "-p", "MainPID", "-p", "ActiveState", "-p", "SubState", "-p", "NRestarts"),
            capture_output=True, text=True, timeout=1.2, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return {"active": None, "pid": None, "substate": None, "restarts": None}
    if result.returncode != 0:
        return {"active": None, "pid": None, "substate": None, "restarts": None}
    fields = dict(row.split("=", 1) for row in result.stdout.splitlines() if "=" in row)
    pid = fields.get("MainPID", "")
    restarts = fields.get("NRestarts", "")
    return {
        "active": fields.get("ActiveState") == "active",
        "pid": int(pid) if pid.isdigit() and int(pid) > 0 else None,
        "substate": fields.get("SubState") if fields.get("SubState") in ("running", "dead", "exited", "failed") else None,
        "restarts": int(restarts) if restarts.isdigit() else None,
    }

def _udp_listener() -> bool | None:
    try:
        result = subprocess.run(("ss", "-H", "-lnu"),
                                capture_output=True, text=True, timeout=1.0, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        if re.search(r"(?<!\d)(?:127\.0\.0\.1|\[::1\]):18765(?:\s|$)", line):
            return True
    return False

def _read_presence(path: Path, service_pid: int | None, epoch: float) -> dict[str, Any] | None:
    if not service_pid:
        return None
    try:
        info = path.lstat()
        if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or
                info.st_mode & 0o077 or info.st_size > 512 or info.st_size < 30):
            return None
        data = json.loads(path.read_bytes().decode("utf-8"))
    except (OSError, UnicodeError, ValueError, TypeError):
        return None
    if not isinstance(data, dict) or data.get("schema") != "mcf-pet-presence/v1":
        return None
    timestamp = data.get("updated_at")
    up = data.get("uptime_seconds")
    pid = data.get("pid")
    if (type(timestamp) not in (int,float) or type(pid) is not int or
            type(up) is not int or up < 0 or pid != service_pid or
            not -3 <= epoch - timestamp <= PET_STATE_TTL or
            data.get("state") not in PET_STATES):
        return None
    try:
        stamp = dt.datetime.fromtimestamp(timestamp, tz=dt.timezone.utc).isoformat(timespec="seconds")
    except (ValueError, OverflowError, OSError):
        return None
    return {"state": data["state"], "updated_at": stamp, "uptime_seconds": up, "pid": pid}

def _desktop_process_pid(path: Path) -> int | None:
    """Verify the original Pet process launched by the desktop instead of systemd.

    Never trust telemetry alone as proof of an online process. Only the exact
    fixed executable and Pet script running under this UID may be adopted for
    a read-only presence observation. No process is killed or started here.
    """
    try:
        st = path.lstat()
        if (not stat.S_ISREG(st.st_mode) or st.st_uid != os.getuid()
                or st.st_mode & 0o077 or not 30 <= st.st_size <= 512):
            return None
        item = json.loads(path.read_bytes().decode("utf-8"))
        if not isinstance(item,dict) or item.get("schema") != "mcf-pet-presence/v1":
            return None
        pid = item.get("pid")
        if type(pid) is not int or not 1 <= pid <= 4194304:
            return None
        proc = Path("/proc") / str(pid)
        if proc.stat().st_uid != os.getuid():
            return None
        args = proc.joinpath("cmdline").read_bytes().split(b"\0")
        if len(args) < 3:
            return None
        if (Path(os.fsdecode(args[0])).resolve(strict=True)
                != PET_INTERPRETER.resolve(strict=True)):
            return None
        if (Path(os.fsdecode(args[1])).resolve(strict=True)
                != PET_SCRIPT.resolve(strict=True)):
            return None
        return pid
    except (OSError,ValueError,TypeError,UnicodeError,KeyError):
        return None


def _voice_health() -> dict[str, Any]:
    try:
        opener = build_opener(NoRedirect())
        req = Request(VOICE_URL, method="GET", headers={"Accept": "application/json"})
        with opener.open(req, timeout=0.7) as res:
            if res.status != 200 or not res.headers.get("Content-Type", "").lower().startswith("application/json"):
                return {"api_ok": False, "speech_dispatcher_running": None, "orca_running": None, "fallback_ready": None}
            payload = res.read(32769)
        if len(payload) > 32768:
            raise ValueError("over limit")
        data = json.loads(payload)
        if not isinstance(data, dict):
            raise ValueError("invalid body")
        def flag(key: str):
            value = data.get(key)
            return value if type(value) is bool else None
        return {
            "api_ok": flag("ok"),
            "speech_dispatcher_running": flag("speech_dispatcher_running"),
            "orca_running": flag("orca_running"),
            "fallback_ready": flag("fallback_ready"),
        }
    except (OSError, URLError, HTTPError, ValueError, TypeError):
        return {"api_ok": None, "speech_dispatcher_running": None, "orca_running": None, "fallback_ready": None}

class PetObserver:
    """Bounded, cached observation; never writes commands to the pet or voice service."""
    def __init__(self, path: Path = PRESENCE_FILE, unit_reader=None,
                 udp_reader=None, voice_reader=None, now=None, desktop_reader=None):
        self.path = path
        self.unit_reader = unit_reader or _unit_info
        self.udp_reader = udp_reader or _udp_listener
        self.voice_reader = voice_reader or _voice_health
        self.desktop_reader = desktop_reader or _desktop_process_pid
        self.now = now or time.time
        self._lock = threading.RLock()
        self._sample_at = 0.0
        self._cached: dict[str, Any] | None = None

    def collect(self) -> dict[str, Any]:
        pet_unit = self.unit_reader(PET_SERVICE)
        voice_unit = self.unit_reader(VOICE_SERVICE)
        is_active = pet_unit["active"] is True
        desktop_pid = self.desktop_reader(self.path) if not is_active else None
        observed_pid = pet_unit.get("pid") if is_active else desktop_pid
        running = is_active or desktop_pid is not None
        source = "systemd" if is_active else "desktop" if desktop_pid else "none"
        udp = self.udp_reader() if running else False
        telemetry = _read_presence(self.path, observed_pid, self.now()) if running else None
        voice = self.voice_reader() if voice_unit["active"] is True else {
            "api_ok": False, "speech_dispatcher_running": None, "orca_running": None, "fallback_ready": None,
        }
        if not running and pet_unit["active"] is False:
            status = "offline"
        elif not running and pet_unit["active"] is None:
            status = "unknown"
        elif udp is False:
            status = "degraded"
        elif udp is None or telemetry is None:
            status = "telemetry_unverified"
        else:
            status = "online"
        return {
            "schema": "mcf-pet-observation/v1",
            "checked_at": _now_iso(),
            "pet": {
                "name": "Pet MESTRE · Agente Dominante",
                "service": PET_SERVICE,
                "status": status,
                "service_active": pet_unit["active"],
                "process_source": source,
                "pid": observed_pid,
                "restarts": pet_unit.get("restarts"),
                "udp_listening": udp,
                "state_verified": status == "online",
                "state": telemetry["state"] if status == "online" else None,
                "updated_at": telemetry["updated_at"] if status == "online" else None,
                "uptime_seconds": telemetry["uptime_seconds"] if status == "online" else None,
            },
            "voicehub": {
                "service": VOICE_SERVICE,
                "service_active": voice_unit["active"],
                "status": ("healthy" if voice_unit["active"] is True and voice["api_ok"] is True
                           else "unavailable" if voice_unit["active"] is False
                           else "unverified"),
                **voice,
            },
            "boundary": {"read_only": True, "audio_collected": False,
                         "conversation_collected": False, "execution_control": False},
        }

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            if self._cached is not None and time.monotonic() - self._sample_at < 3:
                return copy.deepcopy(self._cached)
            try:
                self._cached = self.collect()
            except Exception:
                self._cached = {
                    "schema": "mcf-pet-observation/v1", "checked_at": _now_iso(),
                    "pet": {"status": "unknown", "state_verified": False, "state": None},
                    "voicehub": {"status": "unverified", "api_ok": None},
                    "boundary": {"read_only": True, "audio_collected": False,
                                 "conversation_collected": False, "execution_control": False},
                }
            self._sample_at = time.monotonic()
            return copy.deepcopy(self._cached)

pet_observer = PetObserver()
