#!/usr/bin/env python3
"""Update or inspect the sanitized status consumed by AUGUSTO Voice Reporter."""

import argparse
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path

STATUS = Path.home() / ".local/state/mcf-voice-reporter/status.json"


def load() -> dict:
    if STATUS.exists():
        return json.loads(STATUS.read_text(encoding="utf-8"))
    return {
        "enabled": True,
        "mission": "MCF",
        "phase": "inicialização",
        "message": "Reporter iniciado.",
    }


def save(data: dict) -> None:
    STATUS.parent.mkdir(parents=True, exist_ok=True)
    data["updated_at"] = datetime.now().isoformat(timespec="seconds")
    descriptor, temporary = tempfile.mkstemp(
        prefix="status-",
        suffix=".json",
        dir=str(STATUS.parent),
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary, STATUS)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Atualiza o estado falado pelo AUGUSTO Voice Reporter."
    )
    parser.add_argument("message", nargs="?")
    parser.add_argument("--mission")
    parser.add_argument("--phase")
    parser.add_argument("--pause", action="store_true")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--show", action="store_true")
    args = parser.parse_args()

    data = load()
    if args.pause:
        data["enabled"] = False
    if args.resume:
        data["enabled"] = True
    if args.mission:
        data["mission"] = args.mission
    if args.phase:
        data["phase"] = args.phase
    if args.message:
        data["message"] = args.message

    changed = any(
        [
            args.pause,
            args.resume,
            args.mission,
            args.phase,
            args.message,
        ]
    )
    if changed:
        save(data)
    if args.show or not changed:
        print(json.dumps(load(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
