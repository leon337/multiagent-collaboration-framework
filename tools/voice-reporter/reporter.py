#!/usr/bin/env python3
"""Deterministic MCF mission-status reporter for VoiceHub.

Reads a sanitized local JSON status file and announces it through VoiceHub on
a bounded cadence. It has no mission authority and performs no inference.
"""

import json
import os
import time
import urllib.request
from datetime import datetime
from pathlib import Path

HOME = Path.home()
STATUS = Path(
    os.environ.get(
        "MCF_VOICE_REPORTER_STATUS",
        str(HOME / ".local/state/mcf-voice-reporter/status.json"),
    )
)
LOG = Path(
    os.environ.get(
        "MCF_VOICE_REPORTER_LOG",
        str(HOME / ".local/state/mcf-voice-reporter/reporter.log"),
    )
)
VOICE_URL = os.environ.get(
    "MCF_VOICEHUB_URL",
    "http://127.0.0.1:8788/api/speak",
)
INTERVAL = max(30, int(os.environ.get("MCF_VOICE_REPORTER_INTERVAL", "30")))


def log(message: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().isoformat(timespec="seconds")
    with LOG.open("a", encoding="utf-8") as handle:
        handle.write(f"{stamp} {message}\n")


def load_status() -> dict:
    try:
        return json.loads(STATUS.read_text(encoding="utf-8"))
    except Exception as exc:
        log(f"status_error={type(exc).__name__}:{exc}")
        return {
            "enabled": True,
            "mission": "MCF",
            "phase": "monitoramento",
            "message": "Ainda não há atualização de estado disponível.",
        }


def build_message(status: dict) -> str:
    mission = str(status.get("mission") or "MCF")
    phase = str(status.get("phase") or "andamento")
    message = str(status.get("message") or "Sem nova informação.")
    return f"Augusto informa. Missão {mission}. Fase {phase}. {message}"[:480]


def speak(text: str) -> None:
    payload = json.dumps({"text": text}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        VOICE_URL,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        body = response.read().decode("utf-8", errors="replace")
        log(f"speak_http={response.status} body={body[:240]}")


def main() -> None:
    log(f"reporter_started interval={INTERVAL}")
    next_tick = time.monotonic()
    while True:
        status = load_status()
        if bool(status.get("enabled", True)):
            try:
                speak(build_message(status))
            except Exception as exc:
                log(f"speak_error={type(exc).__name__}:{exc}")
        next_tick += INTERVAL
        time.sleep(max(0.0, next_tick - time.monotonic()))


if __name__ == "__main__":
    main()
