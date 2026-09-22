#!/usr/bin/env python3
import argparse
import json
import os
import tempfile
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
INSTALLED_REPORTER_DIR = Path.home() / ".local/share/mcf-voice-reporter"
for candidate in (SCRIPT_DIR, INSTALLED_REPORTER_DIR):
    value = str(candidate)
    if value not in sys.path:
        sys.path.insert(0, value)

import reporter

STATUS = Path.home() / ".local/state/mcf-voice-reporter/status.json"
DELIVERY = Path.home() / ".local/state/mcf-voice-reporter/last-delivery.json"


def load_status():
    try:
        data = json.loads(STATUS.read_text(encoding="utf-8"))
    except Exception:
        data = {}
    data.setdefault("enabled", True)
    data.setdefault("mission_active", True)
    data.setdefault("mission_state", "ACTIVE")
    data.setdefault("project", "MCF")
    data.setdefault("mission", "MCF")
    data.setdefault("phase", "andamento")
    data.setdefault("agent", "MESTRE")
    data.setdefault("voice_profile", "clear")
    data.setdefault("allow_tts_fallback", True)
    return data


def atomic_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=path.stem + "-", suffix=".json", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        os.chmod(tmp, 0o600)
        os.replace(tmp, path)
        os.chmod(path, 0o600)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def main():
    p = argparse.ArgumentParser(
        description="Emite um checkpoint imediato do MESTRE pelo VoiceHub e persiste o estado."
    )
    p.add_argument("message")
    p.add_argument("--project")
    p.add_argument("--mission")
    p.add_argument("--phase")
    p.add_argument("--agent", default="MESTRE")
    p.add_argument("--voice-profile", default="clear")
    p.add_argument("--audio")
    p.add_argument("--no-tts-fallback", action="store_true")
    p.add_argument("--radio-fx", action="store_true")
    args = p.parse_args()

    status = load_status()
    status.update({
        "enabled": True,
        "mission_active": True,
        "mission_state": "ACTIVE",
        "agent": str(args.agent or "MESTRE").strip() or "MESTRE",
        "voice_profile": str(args.voice_profile or "clear").strip() or "clear",
        "message": str(args.message).strip(),
        "source": "mcf_mestre_voice_checkpoint",
        "radio_fx": bool(args.radio_fx),
        "allow_tts_fallback": not args.no_tts_fallback,
        "rendered_audio_path": str(Path(args.audio).expanduser()) if args.audio else None,
        "updated_at": datetime.now().isoformat(timespec="seconds"),
    })
    if args.project:
        status["project"] = args.project
    if args.mission:
        status["mission"] = args.mission
    if args.phase:
        status["phase"] = args.phase

    atomic_json(STATUS, status)

    fp = reporter.fingerprint(status)
    delivery = reporter.speak(status, defer_if_busy=False)
    if not delivery:
        raise SystemExit("VoiceHub não confirmou entrega do checkpoint")
    reporter.save_last(fp, status, delivery)

    receipt = {
        "ok": True,
        "mission": status["mission"],
        "phase": status["phase"],
        "agent": status["agent"],
        "voice_profile": status["voice_profile"],
        "delivery": delivery.get("delivery"),
        "fallback_used": bool(delivery.get("fallback_used")),
        "job": delivery.get("job"),
        "delivered_at": datetime.now().isoformat(timespec="seconds"),
    }
    atomic_json(DELIVERY, receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
