#!/usr/bin/env python3
"""Configuração reversível dos modelos Gemini 3.8 no CodeBuddy; sem segredos no Git."""
from __future__ import annotations
import argparse
import json
import os
import pathlib
import shutil
import tempfile
import hashlib
from datetime import datetime, timezone

HOME = pathlib.Path.home()
MODELS = HOME / ".codebuddy/models.json"
UNIT = HOME / ".config/systemd/user/codebuddy-web.service"
ENVFILE = HOME / ".config/codebuddy/mcf-gemini38.env"
BACKUPS = HOME / ".codebuddy/backups/mcf-codebuddy-gemini38"
SECRET_FLASH = HOME / ".local/share/mcf-gemini38-agent/secrets/gemini-api-key"
SECRET_LIVE = HOME / ".local/share/mcf-gemini38-agent/secrets/bridge-internal-token"
VENDOR = "MCF Gemini 3.8"
IDS = ("gemini-3.8-flash", "gemini-3.8-live", "gemini-3.8-live-extended-thinking")


def definitions():
    return [
        {"id": IDS[0], "name": "Gemini 3.8 Flash — Google API (MCF)", "vendor": VENDOR,
         "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
         "apiKey": "$"+"{MCF_CODEBUDDY_GEMINI_API_KEY}", "supportsToolCall": True,
         "supportsImages": True, "supportsReasoning": True,
         "relatedModels": {"lite": IDS[0], "reasoning": IDS[0]}},
        {"id": IDS[1], "name": "Gemini 3.8 Live — MCF (texto)", "vendor": VENDOR,
         "url": "http://127.0.0.1:3100/v1/chat/completions",
         "apiKey": "$"+"{MCF_CODEBUDDY_LIVE_TOKEN}", "supportsToolCall": True,
         "supportsImages": False, "supportsReasoning": False},
        {"id": IDS[2], "name": "Gemini 3.8 Live Extended Thinking — MCF (texto)", "vendor": VENDOR,
         "url": "http://127.0.0.1:3100/v1/chat/completions",
         "apiKey": "$"+"{MCF_CODEBUDDY_LIVE_TOKEN}", "supportsToolCall": True,
         "supportsImages": False, "supportsReasoning": True},
    ]


def merge_models(doc):
    if not isinstance(doc, dict) or not isinstance(doc.get("models", []), list):
        raise ValueError("models.json inválido")
    merged = {**doc}
    models = [dict(m) for m in doc.get("models", [])]
    for model in definitions():
        idx = next((i for i, old in enumerate(models) if old.get("id") == model["id"]), None)
        if idx is None:
            models.append(model)
        elif models[idx].get("vendor") == VENDOR:
            models[idx] = model
        else:
            raise ValueError("Modelo existente de outro provedor: " + model["id"])
    merged["models"] = models
    if isinstance(merged.get("availableModels"), list) and merged["availableModels"]:
        merged["availableModels"] = list(dict.fromkeys(merged["availableModels"] + list(IDS)))
    return merged


def unit_with_models(source):
    if "--auth none" in source or "--auth password" not in source:
        raise PermissionError("Serviço deve manter autenticação")
    if "--host 127.0.0.1 --port 46514" not in source:
        raise PermissionError("Serviço precisa usar localhost e porta 46514")
    line = "EnvironmentFile=" + str(ENVFILE)
    return source if line in source else source.replace("[Service]\n", "[Service]\n" + line + "\n", 1)


def safe_secret(path):
    if not path.is_file() or (path.stat().st_mode & 0o077):
        raise PermissionError("Credencial não encontrada ou com permissões amplas: " + path.name)
    value = path.read_text().strip()
    if not value or any(ch in value for ch in "\n\r\x00"):
        raise ValueError("Credencial inválida: " + path.name)
    return value


def atomic_text(path, content, mode):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(name, mode)
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def apply():
    document = json.loads(MODELS.read_text()) if MODELS.exists() else {}
    new_models = merge_models(document)
    new_unit = unit_with_models(UNIT.read_text())
    # Never print, log, commit or put secrets in command-line arguments.
    flash = safe_secret(SECRET_FLASH)
    live = safe_secret(SECRET_LIVE)
    env = "MCF_CODEBUDDY_GEMINI_API_KEY=" + json.dumps(flash) + "\n"
    env += "MCF_CODEBUDDY_LIVE_TOKEN=" + json.dumps(live) + "\n"
    backup = BACKUPS / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup.mkdir(parents=True, exist_ok=False, mode=0o700)
    os.chmod(backup, 0o700)
    paths = {"models.json": MODELS, "codebuddy-web.service": UNIT, "mcf-gemini38.env": ENVFILE}
    existed = {}
    for name, path in paths.items():
        existed[name] = path.exists()
        if path.exists():
            shutil.copy2(path, backup / name)
            os.chmod(backup / name, 0o600)
    atomic_text(MODELS, json.dumps(new_models, ensure_ascii=False, indent=2) + "\n", 0o600)
    atomic_text(ENVFILE, env, 0o600)
    atomic_text(UNIT, new_unit, 0o644)
    manifest = {"existed": existed, "sha256_after": {name: checksum(path) for name, path in paths.items()}}
    atomic_text(backup / "manifest.json", json.dumps(manifest) + "\n", 0o600)
    return {"ok": True, "backup": str(backup), "model_ids": list(IDS),
            "service_reload_required": True, "secret_values_exposed": False}


def inspect():
    document = json.loads(MODELS.read_text()) if MODELS.exists() else {}
    ids = [m.get("id") for m in document.get("models", [])]
    unit = UNIT.read_text() if UNIT.exists() else ""
    return {"model_ids": {key: key in ids for key in IDS},
            "models_mode_secure": MODELS.exists() and not(MODELS.stat().st_mode & 0o077),
            "service_env_reference": "EnvironmentFile=" + str(ENVFILE) in unit,
            "service_loopback_password": "--host 127.0.0.1 --port 46514" in unit and "--auth password" in unit,
            "env_mode_secure": ENVFILE.exists() and not(ENVFILE.stat().st_mode & 0o077)}


def rollback(root):
    root = root.resolve()
    if not root.is_relative_to(BACKUPS.resolve()) or not (root / "manifest.json").is_file():
        raise ValueError("Backup não pertence à implantação")
    metadata = json.loads((root / "manifest.json").read_text())
    paths = {"models.json": MODELS, "codebuddy-web.service": UNIT, "mcf-gemini38.env": ENVFILE}
    for name, dest in paths.items():
        if checksum(dest) != metadata["sha256_after"][name]:
            raise RuntimeError("Arquivo alterado após implantação; rollback interrompido: " + name)
    for name, dest in paths.items():
        if metadata["existed"][name]:
            shutil.copy2(root / name, dest)
            os.chmod(dest, 0o644 if name == "codebuddy-web.service" else 0o600)
        else:
            dest.unlink(missing_ok=True)
    return {"ok": True, "files_restored": list(paths), "service_reload_required": True}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("command", choices=["apply", "inspect", "rollback"])
    p.add_argument("--backup")
    args = p.parse_args()
    try:
        if args.command == "apply": result = apply()
        elif args.command == "inspect": result = inspect()
        elif args.backup: result = rollback(pathlib.Path(args.backup))
        else: raise ValueError("--backup é necessário para rollback")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except (OSError, ValueError, RuntimeError, PermissionError) as error:
        print(json.dumps({"ok": False, "type": type(error).__name__, "message": str(error)[:180]}))
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
