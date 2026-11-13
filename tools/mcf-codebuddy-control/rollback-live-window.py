#!/usr/bin/env python3
"""Rollback seguro do recorte de janela de mensagens do MCF Live adapter."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import time
import urllib.request

HOME = pathlib.Path.home()
ROOT = HOME / ".local/share/mcf-gemini38-agent"
TARGET = ROOT / "app"
BACKUPS = ROOT / "backups"


def digest(path: pathlib.Path) -> str | None:
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backup", required=True)
    args = parser.parse_args()
    backup = pathlib.Path(args.backup).resolve()
    if not backup.is_relative_to(BACKUPS.resolve()):
        raise ValueError("Backup fora do diretório autorizado")
    manifest = json.loads((backup / "manifest.json").read_text(encoding="utf-8"))
    expected = manifest["sha256_after"]
    for name in ("dsh-native-adapter.mjs", "message-window.mjs"):
        if digest(TARGET / name) != expected[name]:
            raise RuntimeError("Arquivos alterados após a implantação, rollback recusado: " + name)
    original = backup / "dsh-native-adapter.mjs"
    if not original.is_file():
        raise FileNotFoundError("Backup do adaptador não encontrado")
    shutil.copy2(original, TARGET / "dsh-native-adapter.mjs")
    (TARGET / "message-window.mjs").unlink()
    env = os.environ.copy()
    uid = os.getuid()
    env.update({"XDG_RUNTIME_DIR": f"/run/user/{uid}",
                "DBUS_SESSION_BUS_ADDRESS": f"unix:path=/run/user/{uid}/bus"})
    cmd = subprocess.run(["systemctl", "--user", "restart",
                          "mcf-dsh-live-native-adapter.service"],
                         env=env, timeout=20, check=False, capture_output=True)
    if cmd.returncode:
        raise RuntimeError("Falha ao reiniciar adaptador restaurado")
    ready = False
    for _ in range(15):
        try:
            with urllib.request.urlopen("http://127.0.0.1:3100/health", timeout=2) as response:
                ready = response.status == 200
        except OSError:
            time.sleep(1)
        if ready:
            break
    print(json.dumps({"rolled_back": True, "healthy": ready}, ensure_ascii=False))
    return 0 if ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
