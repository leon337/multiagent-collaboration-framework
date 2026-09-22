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
AUDIO_ENQUEUE_URL = VOICE_BASE.rstrip("/") + "/api/audio/enqueue"
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
    data = load_json(STATUS, {})
    data.setdefault("enabled", False)
    data.setdefault("mission_active", False)
    data.setdefault("mission_state", "IDLE")
    data.setdefault("project", "MCF")
    data.setdefault("mission", "MCF")
    data.setdefault("phase", "idle")
    data.setdefault("message", "Sem missão ativa.")
    data.setdefault("agent", "MESTRE")
    data.setdefault("voice_profile", "clear")
    data.setdefault("rendered_audio_path", None)
    data.setdefault("allow_tts_fallback", True)
    return data


def fingerprint(status):
    payload = {
        "agent": status.get("agent"),
        "mission": status.get("mission"),
        "phase": status.get("phase"),
        "message": status.get("message"),
        "voice_profile": status.get("voice_profile"),
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def should_speak(status):
    return (
        bool(status.get("enabled", False))
        and bool(status.get("mission_active", False))
        and str(status.get("mission_state", "")).upper() == "ACTIVE"
    )


def queue_is_busy():
    req = urllib.request.Request(
        QUEUE_URL,
        headers={"Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        data = json.loads(response.read().decode("utf-8"))
    return bool(data.get("busy"))


def _post_json(url, payload, timeout):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _base_meta(status):
    return {
        "agent": str(status.get("agent") or "MESTRE").strip() or "MESTRE",
        "project": str(status.get("project") or "MCF").strip() or "MCF",
        "mission": str(status.get("mission") or "MCF").strip() or "MCF",
        "phase": str(status.get("phase") or "andamento").strip() or "andamento",
        "source": str(status.get("source") or "mcf_voice_reporter").strip() or "mcf_voice_reporter",
        "radio_fx": bool(status.get("radio_fx", False)),
        "wait": True,
        "timeout": 180,
    }


def _job_done(data):
    job = data.get("job") or {}
    return bool(data.get("ok")) and job.get("status") == "DONE"


def speak(status, defer_if_busy=True):
    if defer_if_busy and queue_is_busy():
        log("defer_voicehub_busy")
        return False

    meta = _base_meta(status)
    rendered_audio = str(status.get("rendered_audio_path") or "").strip()
    voice_profile = str(status.get("voice_profile") or "clear").strip() or "clear"

    if rendered_audio:
        payload = dict(meta)
        payload.update({
            "path": rendered_audio,
            "voice_profile": voice_profile,
        })
        try:
            data = _post_json(AUDIO_ENQUEUE_URL, payload, 190)
            if not _job_done(data):
                job = data.get("job") or {}
                raise RuntimeError(
                    f"rendered_audio status={job.get('status')} error={job.get('error')}"
                )
            job = data.get("job") or {}
            log(f"rendered_audio_job_done id={job.get('id')} voice_profile={voice_profile}")
            return {
                "delivery": "rendered_audio",
                "fallback_used": False,
                "job": job,
            }
        except Exception as exc:
            log(f"rendered_audio_error={type(exc).__name__}:{exc}")
            if not bool(status.get("allow_tts_fallback", True)):
                raise

    payload = dict(meta)
    payload["text"] = str(status.get("message") or "Sem nova informação.").strip()
    data = _post_json(ENQUEUE_URL, payload, 190)
    if not _job_done(data):
        job = data.get("job") or {}
        raise RuntimeError(
            f"VoiceHub queue status={job.get('status')} error={job.get('error')}"
        )
    job = data.get("job") or {}
    log(f"speech_job_done id={job.get('id')} agent={meta['agent']}")
    return {
        "delivery": "speech_tts",
        "fallback_used": bool(rendered_audio),
        "job": job,
    }


def save_last(fp, status, delivery=None):
    LAST.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "fingerprint": fp,
        "spoken_at": datetime.now().isoformat(timespec="seconds"),
        "agent": status.get("agent"),
        "mission": status.get("mission"),
        "phase": status.get("phase"),
        "voice_profile": status.get("voice_profile"),
    }
    if delivery:
        payload["delivery"] = delivery
    LAST.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    log(f"reporter_started_v3 interval={INTERVAL}")
    while True:
        status = load_status()
        if should_speak(status):
            fp = fingerprint(status)
            last = load_json(LAST, {})
            if last.get("fingerprint") != fp:
                try:
                    delivery = speak(status)
                    if delivery:
                        save_last(fp, status, delivery)
                except Exception as exc:
                    log(f"speak_error={type(exc).__name__}:{exc}")
            else:
                log("skip_unchanged_status")
        else:
            log("skip_inactive_or_disabled")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
