#!/usr/bin/env python3
import hashlib
import json
import os
import time
import urllib.request
from datetime import datetime
from pathlib import Path

HOME = Path.home()
STATUS = Path(os.environ.get(
    "MCF_VOICE_REPORTER_STATUS",
    str(HOME / ".local/state/mcf-voice-reporter/status.json"),
))
LAST = Path(os.environ.get(
    "MCF_VOICE_REPORTER_LAST",
    str(HOME / ".local/state/mcf-voice-reporter/last-spoken.json"),
))
LOG = Path(os.environ.get(
    "MCF_VOICE_REPORTER_LOG",
    str(HOME / ".local/state/mcf-voice-reporter/reporter.log"),
))
_legacy_voice_url = os.environ.get("MCF_VOICEHUB_URL", "http://127.0.0.1:8788/api/speak")
VOICE_BASE = os.environ.get("MCF_VOICEHUB_BASE") or _legacy_voice_url.split("/api/", 1)[0]
QUEUE_URL = VOICE_BASE.rstrip("/") + "/api/speech/queue"
ENQUEUE_URL = VOICE_BASE.rstrip("/") + "/api/speech/enqueue"
INTERVAL = max(30, int(os.environ.get("MCF_VOICE_REPORTER_INTERVAL", "30")))

def log(message):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(f"{datetime.now().isoformat(timespec='seconds')} {message}\n")

def load_json(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default

def load_status():
    return load_json(STATUS, {
        "enabled": False,
        "mission_active": False,
        "mission_state": "IDLE",
        "mission": "MCF",
        "phase": "idle",
        "message": "Sem missão ativa.",
    })

def fingerprint(status):
    payload = {
        "mission": status.get("mission"),
        "phase": status.get("phase"),
        "message": status.get("message"),
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def should_speak(status):
    return (
        bool(status.get("enabled", False))
        and bool(status.get("mission_active", False))
        and str(status.get("mission_state", "")).upper() == "ACTIVE"
    )

def build_message(status):
    mission = str(status.get("mission") or "MCF")
    phase = str(status.get("phase") or "andamento")
    message = str(status.get("message") or "Sem nova informação.")
    return f"Augusto informa. Missão {mission}. Fase {phase}. {message}"[:480]

def queue_is_busy():
    req = urllib.request.Request(
        QUEUE_URL,
        headers={"Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        data = json.loads(response.read().decode("utf-8"))
    return bool(data.get("busy"))

def speak(status):
    if queue_is_busy():
        log("defer_voicehub_busy")
        return False
    payload = json.dumps({
        "text": build_message(status).replace(
            f"Augusto informa. Missão {status.get('mission')}. Fase {status.get('phase')}. ",
            "",
            1,
        ),
        "agent": "AUGUSTO",
        "project": str(status.get("project") or "MCF"),
        "mission": str(status.get("mission") or "MCF"),
        "phase": str(status.get("phase") or "andamento"),
        "source": "mcf_voice_reporter",
        "wait": True,
        "timeout": 180,
    }, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        ENQUEUE_URL,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=190) as response:
        data = json.loads(response.read().decode("utf-8"))
    job = data.get("job") or {}
    if not data.get("ok") or job.get("status") != "DONE":
        raise RuntimeError(f"VoiceHub queue status={job.get('status')} error={job.get('error')}")
    log(f"speech_job_done id={job.get('id')}")
    return True

def save_last(fp, status):
    LAST.parent.mkdir(parents=True, exist_ok=True)
    LAST.write_text(json.dumps({
        "fingerprint": fp,
        "spoken_at": datetime.now().isoformat(timespec="seconds"),
        "mission": status.get("mission"),
        "phase": status.get("phase"),
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def main():
    log(f"reporter_started_v2 interval={INTERVAL}")
    while True:
        status = load_status()
        if should_speak(status):
            fp = fingerprint(status)
            last = load_json(LAST, {})
            if last.get("fingerprint") != fp:
                try:
                    if speak(status):
                        save_last(fp, status)
                except Exception as exc:
                    log(f"speak_error={type(exc).__name__}:{exc}")
            else:
                log("skip_unchanged_status")
        else:
            log("skip_inactive_or_disabled")
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
