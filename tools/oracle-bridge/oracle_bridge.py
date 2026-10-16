#!/usr/bin/env python3
"""MCF-ORACLE-001: local, zero-paid-API Codex CLI bridge. Candidate; not enabled in MCF.

This is a local EXECUTOR CONNECTOR, not a second MissionRuntime. Mission authority,
durable orchestration and external side effects still belong to the canonical MCF.

No commercial OPENAI_API_KEY is used. Authentication is owned by official Codex
CLI in the logged-in OS account. Never copy CODEX_HOME to GitHub or CI.
"""
from __future__ import annotations

import argparse
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from typing import Any

MODEL = "gpt-6-astra"
MAX_BYTES = 2_000_000
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$")
ALLOWED_ENV = (
    "HOME", "PATH", "USER", "LOGNAME", "LANG", "LC_ALL", "LC_CTYPE",
    "TERM", "XDG_RUNTIME_DIR", "XDG_CONFIG_HOME", "XDG_CACHE_HOME",
    "XDG_DATA_HOME", "NO_COLOR", "SSL_CERT_FILE",
)
REQUIRED_DECISION = frozenset({
    "schema_version", "mission_id", "request_id", "decision_id", "status",
    "rationale", "strategy", "specialists", "gates", "acceptance_evidence",
    "needs_human_approval",
})
REQUIRED_REQUEST = frozenset({
    "schema_version", "mission_id", "request_id", "idempotency_key",
    "session_epoch", "objective", "authorized_context", "deadline_utc",
    "policy_version",
})


class BridgeFailure(Exception):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def check_id(value: Any, label: str) -> str:
    if not isinstance(value, str) or not SAFE_ID.fullmatch(value):
        raise BridgeFailure(f"INVALID_{label}")
    return value


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def private_dir(path: Path) -> Path:
    if path.is_symlink():
        raise BridgeFailure("UNSAFE_STATE_PATH")
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    path.chmod(0o700)
    if not path.is_dir() or path.is_symlink():
        raise BridgeFailure("UNSAFE_STATE_PATH")
    return path


def write_private_json(path: Path, value: dict[str, Any]) -> None:
    blob = (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode()
    fd, tmp_name = tempfile.mkstemp(prefix=".atomic-", dir=str(path.parent))
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(blob)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(tmp_name, 0o600)
        os.replace(tmp_name, path)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)


def load_state(path: Path, mission_id: str) -> dict[str, Any]:
    if not path.exists():
        return {"mission_id": mission_id, "session_epoch": 1,
                "thread_id": None, "status": "NEW", "processed": {}}
    if path.is_symlink():
        raise BridgeFailure("UNSAFE_STATE_PATH")
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise BridgeFailure("CORRUPT_STATE") from exc
    if not isinstance(state, dict) or state.get("mission_id") != mission_id:
        raise BridgeFailure("STATE_MISSION_MISMATCH")
    if not isinstance(state.get("processed"), dict):
        raise BridgeFailure("CORRUPT_STATE")
    return state


def minimal_env() -> dict[str, str]:
    env = {name: os.environ[name] for name in ALLOWED_ENV if name in os.environ}
    if not env.get("HOME"):
        raise BridgeFailure("HOME_REQUIRED")
    env.setdefault("PATH", "/usr/local/bin:/usr/bin:/bin")
    return env


def codex_run(binary: str, args: list[str], prompt: str,
              cwd: Path, timeout: int) -> tuple[int, str]:
    """Argv-only invocation; no shell, no forwarded API tokens, bounded output."""
    try:
        proc = subprocess.Popen(
            [binary, *args], cwd=cwd, env=minimal_env(),
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            start_new_session=True,
        )
    except (OSError, ValueError) as exc:
        raise BridgeFailure("CODEX_BINARY_UNAVAILABLE") from exc
    try:
        stdout, stderr = proc.communicate(input=prompt.encode("utf-8"), timeout=timeout)
    except subprocess.TimeoutExpired as exc:
        with contextlib.suppress(ProcessLookupError):
            os.killpg(proc.pid, signal.SIGKILL)
        proc.communicate()
        raise BridgeFailure("CODEX_TIMEOUT_EFFECT_UNKNOWN") from exc
    if len(stdout) > MAX_BYTES or len(stderr) > MAX_BYTES:
        raise BridgeFailure("CODEX_OUTPUT_LIMIT_EXCEEDED")
    return proc.returncode, stdout.decode("utf-8", errors="replace")


def validate_request(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or not REQUIRED_REQUEST.issubset(value):
        raise BridgeFailure("INVALID_REQUEST_CONTRACT")
    if value["schema_version"] != "1.0.0":
        raise BridgeFailure("UNSUPPORTED_REQUEST_SCHEMA")
    check_id(value.get("mission_id"), "MISSION_ID")
    check_id(value.get("request_id"), "REQUEST_ID")
    if not isinstance(value.get("session_epoch"), int) or value["session_epoch"] <= 0:
        raise BridgeFailure("INVALID_SESSION_EPOCH")
    if not isinstance(value.get("objective"), str) or not value["objective"].strip():
        raise BridgeFailure("INVALID_OBJECTIVE")
    if not isinstance(value.get("idempotency_key"), str) or len(value["idempotency_key"]) < 6:
        raise BridgeFailure("INVALID_IDEMPOTENCY_KEY")
    if not isinstance(value.get("authorized_context"), dict):
        raise BridgeFailure("INVALID_AUTHORIZED_CONTEXT")
    return value


def validate_decision(value: Any, request: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict) or not REQUIRED_DECISION.issubset(value):
        raise BridgeFailure("INVALID_ORACLE_SCHEMA")
    if value.get("schema_version") != "1.0.0":
        raise BridgeFailure("INVALID_ORACLE_SCHEMA")
    if value.get("mission_id") != request["mission_id"] or value.get("request_id") != request["request_id"]:
        raise BridgeFailure("CROSS_MISSION_OR_REQUEST_RESPONSE")
    if value.get("status") not in ("PROPOSED", "BLOCKED", "REPLAN", "REVIEW"):
        raise BridgeFailure("INVALID_ORACLE_STATUS")
    if not isinstance(value.get("needs_human_approval"), bool):
        raise BridgeFailure("INVALID_ORACLE_APPROVAL_FLAG")
    for field in ("strategy", "specialists", "gates", "acceptance_evidence"):
        if not isinstance(value[field], list):
            raise BridgeFailure("INVALID_ORACLE_SCHEMA")
    return value


def cli_auth_ok(binary: str, workspace: Path) -> bool:
    try:
        status, output = codex_run(binary, ["login", "status"], "", workspace, 12)
    except BridgeFailure:
        return False
    return status == 0 and "Logged in using ChatGPT" in output


def run_consult(args: argparse.Namespace) -> dict[str, Any]:
    try:
        request = validate_request(json.loads(Path(args.request).read_text(encoding="utf-8")))
    except (OSError, ValueError) as exc:
        raise BridgeFailure("INVALID_REQUEST_JSON") from exc

    root = private_dir(Path(args.state_root).expanduser())
    mission = check_id(request["mission_id"], "MISSION_ID")
    private_dir(root / mission)
    mission_root = root / mission
    workspace = private_dir(mission_root / "workspace")
    responses = private_dir(mission_root / "responses")
    lockfile = mission_root / ".lock"
    with open(lockfile, "a+", encoding="utf-8") as lock:
        os.chmod(lockfile, 0o600)
        # Do not queue concurrent model calls to same session indefinitely.
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise BridgeFailure("MISSION_SESSION_BUSY") from exc
        state_path = mission_root / "state.json"
        state = load_state(state_path, mission)
        request_id = check_id(request["request_id"], "REQUEST_ID")
        payload = json.dumps(request, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()
        fingerprint = digest(payload)
        previous = state["processed"].get(request_id)
        if previous is not None:
            if previous.get("fingerprint") != fingerprint:
                raise BridgeFailure("IDEMPOTENCY_CONFLICT")
            result_path = responses / (request_id + ".json")
            if not result_path.is_file() or result_path.is_symlink():
                raise BridgeFailure("IDEMPOTENT_RESULT_MISSING")
            return {"status": "CACHED", "mission_id": mission,
                    "decision": json.loads(result_path.read_text(encoding="utf-8"))}
        if state.get("status") not in ("NEW", "READY"):
            raise BridgeFailure("MISSION_RECONCILIATION_REQUIRED")
        if request["session_epoch"] != state.get("session_epoch"):
            raise BridgeFailure("SESSION_EPOCH_MISMATCH")
        if not cli_auth_ok(args.codex, workspace):
            raise BridgeFailure("CODEX_CHATGPT_AUTH_REQUIRED")

        if not Path(args.decision_schema).is_file():
            raise BridgeFailure("DECISION_SCHEMA_MISSING")
        # Validate schema syntax before invoking the model.
        try:
            json.loads(Path(args.decision_schema).read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            raise BridgeFailure("DECISION_SCHEMA_INVALID") from exc

        # IN_FLIGHT is durable before sending; on crash, the next call fails
        # closed rather than duplicating a possibly completed Codex turn.
        state.update({"status": "IN_FLIGHT", "inflight_request": request_id,
                      "inflight_fingerprint": fingerprint, "last_started": utc_now()})
        write_private_json(state_path, state)

        with tempfile.TemporaryDirectory(prefix="oracle-exec-", dir=mission_root) as temp:
            response_path = Path(temp) / "decision.json"
            common = ["--model", MODEL, "--json",
                      "--output-schema", str(Path(args.decision_schema).resolve()),
                      "--output-last-message", str(response_path)]
            if state.get("thread_id"):
                command = ["exec", "resume", *common,
                           "-c", 'sandbox_mode="read-only"',
                           "--skip-git-repo-check", str(state["thread_id"]), "-"]
            else:
                command = ["exec", *common, "--sandbox", "read-only",
                           "--skip-git-repo-check", "--cd", str(workspace), "-"]
            prompt = (
                "Você é ORÁCULO estratégico do MCF, mas nenhum texto seu "
                "autoriza ferramentas ou altera gates humanos. Devolva SOMENTE "
                "JSON conforme schema informado. Não leia arquivos, não execute "
                "ferramentas e não solicite tokens. Preserve mission_id e request_id.\n"
                + json.dumps(request, ensure_ascii=False, sort_keys=True)
            )
            try:
                code, events = codex_run(args.codex, command, prompt, workspace, args.timeout)
                if code != 0:
                    raise BridgeFailure("CODEX_EXEC_FAILED_EFFECT_UNKNOWN")
                thread = None
                turn_completed = False
                for line in events.splitlines():
                    try:
                        event = json.loads(line)
                    except ValueError as exc:
                        raise BridgeFailure("INVALID_CODEX_EVENT_STREAM") from exc
                    if event.get("type") == "thread.started":
                        thread = event.get("thread_id")
                    if event.get("type") == "turn.completed":
                        turn_completed = True
                    if event.get("type") in ("error", "turn.failed"):
                        raise BridgeFailure("CODEX_TURN_FAILED")
                if not turn_completed or (not thread and not state.get("thread_id")):
                    raise BridgeFailure("CODEX_TURN_UNCONFIRMED")
                if state.get("thread_id") and thread and state["thread_id"] != thread:
                    raise BridgeFailure("CODEX_SESSION_ID_CHANGED")
                if not response_path.exists() or response_path.stat().st_size > MAX_BYTES:
                    raise BridgeFailure("ORACLE_RESPONSE_MISSING_OR_OVERSIZE")
                try:
                    decision = validate_decision(
                        json.loads(response_path.read_text(encoding="utf-8")), request,
                    )
                except (OSError, ValueError) as exc:
                    raise BridgeFailure("INVALID_ORACLE_JSON") from exc
            except BridgeFailure as exc:
                # A turn could have completed remotely even if local receipt
                # failed; never silently retry with the same thread.
                state.update({"status": "UNKNOWN", "last_error": exc.code,
                              "last_failed": utc_now()})
                write_private_json(state_path, state)
                raise

        write_private_json(responses / (request_id + ".json"), decision)
        state["processed"][request_id] = {
            "fingerprint": fingerprint, "decision_id": decision["decision_id"],
            "result_sha256": digest(
                json.dumps(decision, ensure_ascii=False, sort_keys=True).encode()
            ),
        }
        state.update({"status": "READY", "thread_id": thread or state["thread_id"],
                      "last_completed": utc_now(), "last_error": None,
                      "inflight_request": None, "inflight_fingerprint": None})
        write_private_json(state_path, state)
        return {"status": "COMPLETED", "mission_id": mission,
                "session_epoch": state["session_epoch"],
                "decision": decision}


def run_status(args: argparse.Namespace) -> dict[str, Any]:
    root = Path(args.state_root).expanduser()
    mission = check_id(args.mission_id, "MISSION_ID")
    state = load_state(root / mission / "state.json", mission)
    return {
        "mission_id": mission, "state": state.get("status"),
        "session_epoch": state.get("session_epoch"),
        "has_local_session": bool(state.get("thread_id")),
        "processed_requests": len(state.get("processed", {})),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Local Codex bridge; no commercial API key")
    parser.add_argument(
        "--state-root",
        default=str(Path(os.environ.get("XDG_STATE_HOME", str(Path.home() / ".local/state"))) / "mcf-oracle-bridge"),
    )
    parser.add_argument("--codex", default=str(Path.home() / ".local/bin/codex"))
    sub = parser.add_subparsers(dest="command", required=True)
    consult = sub.add_parser("consult", help="Run or resume a mission-bound Oracle session")
    consult.add_argument("--request", required=True)
    consult.add_argument("--decision-schema", required=True)
    consult.add_argument("--timeout", type=int, default=180)
    status = sub.add_parser("status", help="Inspect state without exposing Codex tokens/thread ids")
    status.add_argument("--mission-id", required=True)
    args = parser.parse_args()
    try:
        if args.command == "consult":
            if not 1 <= args.timeout <= 600:
                raise BridgeFailure("INVALID_TIMEOUT")
            output = run_consult(args)
        else:
            output = run_status(args)
        print(json.dumps(output, ensure_ascii=False))
        return 0
    except BridgeFailure as exc:
        # Never echo raw prompts, provider stderr, browser callback or auth.
        print(json.dumps({"status": "BLOCKED", "reason": exc.code}))
        return 2


if __name__ == "__main__":
    sys.exit(main())
