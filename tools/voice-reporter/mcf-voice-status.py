#!/usr/bin/env python3
import argparse
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path

STATUS = Path.home() / ".local/state/mcf-voice-reporter/status.json"


def load():
    if STATUS.exists():
        try:
            data = json.loads(STATUS.read_text(encoding="utf-8"))
        except Exception:
            data = {}
    else:
        data = {}
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


def save(data):
    STATUS.parent.mkdir(parents=True, exist_ok=True)
    data["updated_at"] = datetime.now().isoformat(timespec="seconds")
    fd, tmp = tempfile.mkstemp(prefix="status-", suffix=".json", dir=str(STATUS.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        os.chmod(tmp, 0o600)
        os.replace(tmp, STATUS)
        os.chmod(STATUS, 0o600)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def main():
    p = argparse.ArgumentParser(description="Controla o MCF Voice Reporter.")
    p.add_argument("message", nargs="?")
    p.add_argument("--project")
    p.add_argument("--mission")
    p.add_argument("--phase")
    p.add_argument("--agent")
    p.add_argument("--voice-profile")
    p.add_argument("--rendered-audio")
    p.add_argument("--clear-rendered-audio", action="store_true")
    p.add_argument("--no-tts-fallback", action="store_true")
    p.add_argument("--pause", action="store_true")
    p.add_argument("--resume", action="store_true")
    p.add_argument("--active", action="store_true")
    p.add_argument("--complete", action="store_true")
    p.add_argument("--fail", action="store_true")
    p.add_argument("--cancel", action="store_true")
    p.add_argument("--show", action="store_true")
    args = p.parse_args()

    data = load()
    if args.pause:
        data["enabled"] = False
    if args.resume:
        data["enabled"] = True
    if args.active:
        data["mission_active"] = True
        data["mission_state"] = "ACTIVE"
    if args.complete:
        data["mission_active"] = False
        data["mission_state"] = "COMPLETED"
    if args.fail:
        data["mission_active"] = False
        data["mission_state"] = "FAILED"
    if args.cancel:
        data["mission_active"] = False
        data["mission_state"] = "CANCELLED"
    if args.project:
        data["project"] = args.project
    if args.mission:
        data["mission"] = args.mission
    if args.phase:
        data["phase"] = args.phase
    if args.agent:
        data["agent"] = args.agent
    if args.voice_profile:
        data["voice_profile"] = args.voice_profile
    if args.rendered_audio:
        data["rendered_audio_path"] = str(Path(args.rendered_audio).expanduser())
    if args.clear_rendered_audio:
        data["rendered_audio_path"] = None
    if args.no_tts_fallback:
        data["allow_tts_fallback"] = False
    if args.message:
        data["message"] = args.message

    changed = any([
        args.pause, args.resume, args.active, args.complete, args.fail, args.cancel,
        args.project, args.mission, args.phase, args.agent, args.voice_profile,
        args.rendered_audio, args.clear_rendered_audio, args.no_tts_fallback,
        args.message,
    ])
    if changed:
        save(data)
    if args.show or not changed:
        print(json.dumps(load(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
