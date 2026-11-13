#!/usr/bin/env python3
"""MCF CodeBuddy control: trusted local CLI + authenticated loopback Gateway.

Does not bypass CodeBuddy permissions. No credential or prompt logging.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

SERVICE = "codebuddy-web.service"
PORT = 46514
DEFAULT_MODEL = "fast-model"
SESSION_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$")
MODEL_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$")


def repo_path() -> Path:
    return Path(os.environ.get("MCF_CODEBUDDY_REPO", str(Path.home() / "multiagent-collaboration-framework"))).expanduser().resolve()


def settings_path() -> Path:
    return Path.home() / ".codebuddy" / "settings.json"


def service_path() -> Path:
    return Path.home() / ".config" / "systemd" / "user" / SERVICE


def load_settings() -> dict[str, Any]:
    content = json.loads(settings_path().read_text(encoding="utf-8"))
    if not isinstance(content, dict):
        raise ValueError("Configuração CodeBuddy inválida")
    return content


def find_codebuddy() -> Path:
    override = os.environ.get("MCF_CODEBUDDY_BIN", "")
    candidates: list[Path] = []
    if override:
        candidates.append(Path(override))
    else:
        candidates.extend(sorted((Path.home() / ".nvm" / "versions" / "node").glob("*/bin/codebuddy"), reverse=True))
        which = shutil.which("codebuddy")
        if which:
            candidates.append(Path(which))
    for path in candidates:
        if path.is_file() and os.access(path, os.X_OK):
            return path.resolve()
    raise FileNotFoundError("CodeBuddy CLI não encontrado no host")


def systemd_environment() -> dict[str, str]:
    env = os.environ.copy()
    runtime = "/run/user/" + str(os.getuid())
    env["XDG_RUNTIME_DIR"] = runtime
    env["DBUS_SESSION_BUS_ADDRESS"] = "unix:path=" + runtime + "/bus"
    return env


def codebuddy_environment() -> dict[str, str]:
    env = os.environ.copy()
    node_bins = list((Path.home() / ".nvm" / "versions" / "node").glob("*/bin/node"))
    def key(node: Path) -> tuple[int, ...]:
        try:
            return tuple(int(x) for x in node.parent.parent.name.lstrip("v").split("."))
        except ValueError:
            return (0,)
    if node_bins:
        best = max(node_bins, key=key)
        env["PATH"] = str(best.parent) + os.pathsep + env.get("PATH", "")
    return env


def systemctl(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["systemctl", "--user", *args], text=True, capture_output=True,
                          timeout=15, check=False, env=systemd_environment())


def gateway_probe() -> dict[str, Any]:
    try:
        req = urllib.request.Request("http://127.0.0.1:" + str(PORT) + "/",
                                     headers={"User-Agent": "MCF-CodeBuddy-Doctor/1"})
        with urllib.request.urlopen(req, timeout=4) as response:
            return {"reachable": True, "http_status": response.status}
    except urllib.error.HTTPError as exc:
        return {"reachable": True, "http_status": exc.code}
    except (urllib.error.URLError, TimeoutError, OSError):
        return {"reachable": False, "http_status": None}


def service_is_secure(unit: str) -> bool:
    return all(x in unit for x in ("--host 127.0.0.1", "--port 46514", "--auth password")) \
        and "--auth none" not in unit


def trusted_workdir(directory: Path, settings: dict[str, Any]) -> Path:
    candidate = directory.expanduser().resolve(strict=True)
    if not candidate.is_dir():
        raise ValueError("Diretório de execução inválido")
    for item in settings.get("trustedDirectories", []):
        trusted = Path(item).expanduser()
        if not trusted.is_dir():
            continue
        trusted = trusted.resolve()
        if candidate == trusted or trusted in candidate.parents:
            return candidate
    raise PermissionError("Diretório não autorizado em ~/.codebuddy/settings.json")


def doctor() -> dict[str, Any]:
    settings = load_settings()
    binary = find_codebuddy()
    unit = service_path().read_text(encoding="utf-8")
    enabled = systemctl("is-enabled", SERVICE)
    active = systemctl("is-active", SERVICE)
    probe = gateway_probe()
    gateway = settings.get("gateway", {})
    auth_ok = gateway.get("auth") == "password" and bool(gateway.get("password"))
    trusted = any(Path(p).is_dir() and Path(p).resolve() == repo_path()
                  for p in settings.get("trustedDirectories", []))
    unit_secure = service_is_secure(unit)
    return {
        "host": os.uname().nodename,
        "cli": str(binary),
        "repo": str(repo_path()),
        "service_enabled": enabled.stdout.strip() == "enabled",
        "service_active": active.stdout.strip() == "active",
        "gateway_host": "127.0.0.1",
        "gateway_port": PORT,
        "gateway_http": probe["http_status"],
        "gateway_reachable": probe["reachable"],
        "password_auth_configured": bool(auth_ok),
        "service_secure_loopback": unit_secure,
        "repo_trusted": trusted,
        "ready": (enabled.stdout.strip() == "enabled"
                  and active.stdout.strip() == "active"
                  and probe["reachable"] and auth_ok and unit_secure and trusted),
    }


def safe_result(stdout: str, stderr: str, returncode: int) -> dict[str, Any]:
    try:
        data = json.loads(stdout)
    except (ValueError, TypeError):
        data = None
    if isinstance(data, list):
        last = next((v for v in reversed(data)
                     if isinstance(v, dict) and v.get("type") == "result"), None)
    elif isinstance(data, dict):
        last = data
    else:
        last = None
    if last is not None:
        return {
            "ok": returncode == 0 and not bool(last.get("is_error")),
            "exit_code": returncode,
            "result": last.get("result", ""),
            "session_id": last.get("session_id"),
            "duration_ms": last.get("duration_ms"),
            "cost_usd_reported": last.get("total_cost_usd"),
        }
    error_kind = ("model_not_allowed" if "not allowed" in stderr.lower()
                  else "authentication" if any(x in stderr.lower() for x in ("unauthorized", "login", "auth"))
                  else "network" if any(x in stderr.lower() for x in ("network", "connection", "timeout"))
                  else "cli_failure")
    return {"ok": False, "exit_code": returncode, "error_kind": error_kind,
            "message": "CodeBuddy não retornou resposta final JSON válida; detalhes privados não exibidos"}


def build_prompt_command(binary: Path, message: str, model: str,
                         resume: str | None = None) -> list[str]:
    if not message.strip() or len(message) > 20000 or message.startswith("-"):
        raise ValueError("Mensagem vazia, longa demais ou iniciada por hífen")
    if resume is not None and not SESSION_PATTERN.fullmatch(resume):
        raise ValueError("Session ID inválido")
    if not MODEL_PATTERN.fullmatch(model):
        raise ValueError("Model ID inválido")
    args = [str(binary), "--print", "--output-format", "json", "--permission-mode", "dontAsk",
            "--model", model]
    if resume is not None:
        args += ["--resume", resume]
    return args + [message]


def execute_prompt(message: str, model: str, cwd: str | None,
                   resume: str | None, timeout: int) -> dict[str, Any]:
    if not 1 <= timeout <= 300:
        raise ValueError("Timeout deve estar entre 1 e 300 segundos")
    settings = load_settings()
    directory = trusted_workdir(Path(cwd) if cwd else repo_path(), settings)
    command = build_prompt_command(find_codebuddy(), message, model, resume)
    try:
        result = subprocess.run(command, cwd=directory, env=codebuddy_environment(),
                                text=True, capture_output=True, timeout=timeout, check=False)
        return safe_result(result.stdout, result.stderr, result.returncode)
    except subprocess.TimeoutExpired:
        return {"ok": False, "error_kind": "timeout", "timeout_seconds": timeout}


def print_json(obj: dict[str, Any]) -> None:
    print(json.dumps(obj, ensure_ascii=False, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Controlador CodeBuddy CLI/ACP do MCF")
    actions = parser.add_subparsers(dest="action", required=True)
    for action in ("status", "doctor", "start", "restart"):
        actions.add_parser(action)
    for action in ("prompt", "resume"):
        sub = actions.add_parser(action)
        if action == "resume":
            sub.add_argument("session_id")
        sub.add_argument("message")
        sub.add_argument("--model", default=os.environ.get("MCF_CODEBUDDY_MODEL", DEFAULT_MODEL))
        sub.add_argument("--cwd")
        sub.add_argument("--timeout", type=int, default=120)
    args = parser.parse_args()
    try:
        if args.action in ("start", "restart"):
            cfg = load_settings()
            if cfg.get("gateway", {}).get("auth") != "password" or not cfg.get("gateway", {}).get("password"):
                raise PermissionError("Recusado: autenticação do gateway não configurada")
            if not service_is_secure(service_path().read_text(encoding="utf-8")):
                raise PermissionError("Recusado: serviço não está protegido em loopback com senha")
            if args.action == "start":
                systemctl("daemon-reload")
                action = systemctl("enable", "--now", SERVICE)
            else:
                action = systemctl("restart", SERVICE)
            if action.returncode != 0:
                raise RuntimeError("Falha ao iniciar/reiniciar CodeBuddy user service")
            for _ in range(12):
                status = doctor()
                if status["ready"]:
                    break
                time.sleep(1)
            print_json(status)
            return 0 if status["ready"] else 1
        if args.action in ("doctor", "status"):
            status = doctor()
            print_json(status)
            return 0 if status["ready"] else 1
        output = execute_prompt(args.message, args.model, args.cwd,
                                getattr(args, "session_id", None), args.timeout)
        print_json(output)
        return 0 if output.get("ok") else 1
    except (ValueError, OSError, PermissionError, RuntimeError) as exc:
        # Never echo contents of config or subprocess stderr: they may contain credentials.
        print_json({"ok": False, "error": type(exc).__name__,
                    "message": str(exc)[:200]})
        return 1


if __name__ == "__main__":
    sys.exit(main())
