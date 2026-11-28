#!/usr/bin/env python3
"""Small, local-only, authenticated MCF computer bridge MVP (stdlib only)."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

MAX_BODY = 16 * 1024
MAX_READ_BYTES = 128 * 1024
MAX_LIST_ITEMS = 100
ROOT = Path(os.environ.get("MCF_BRIDGE_ROOT", str(Path.home()))).expanduser().resolve()
TOKEN = os.environ.get("MCF_BRIDGE_TOKEN", "")
HOST = os.environ.get("MCF_BRIDGE_HOST", "127.0.0.1")
PORT = int(os.environ.get("MCF_BRIDGE_PORT", "8765"))
JOBS: dict[str, dict] = {}
IDEMPOTENCY: dict[str, str] = {}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def digest(value: object) -> str:
    raw = json.dumps(value, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def safe_path(relative: str) -> Path:
    candidate = (ROOT / relative).resolve(strict=True)
    if not candidate.is_relative_to(ROOT):
        raise PermissionError("path_outside_root")
    return candidate


def execute(operation: str, args: dict) -> dict:
    if operation == "system_info":
        return {
            "hostname": os.uname().nodename,
            "platform": os.uname().sysname,
            "release": os.uname().release,
            "root": str(ROOT),
            "python": os.sys.version.split()[0],
        }
    if operation == "list_directory":
        target = safe_path(str(args.get("path", ".")))
        if not target.is_dir():
            raise ValueError("not_a_directory")
        entries = []
        for item in sorted(target.iterdir(), key=lambda p: p.name.casefold())[:MAX_LIST_ITEMS]:
            try:
                resolved = item.resolve(strict=True)
                if not resolved.is_relative_to(ROOT):
                    continue
                entries.append({
                    "name": item.name,
                    "kind": "directory" if resolved.is_dir() else "file",
                    "size": resolved.stat().st_size if resolved.is_file() else None,
                })
            except (OSError, RuntimeError):
                continue
        return {"path": str(target.relative_to(ROOT)), "entries": entries, "truncated": len(list(target.iterdir())) > MAX_LIST_ITEMS}
    if operation == "read_file":
        target = safe_path(str(args.get("path", "")))
        if not target.is_file():
            raise ValueError("not_a_file")
        if target.stat().st_size > MAX_READ_BYTES:
            raise ValueError("file_too_large")
        data = target.read_bytes()
        try:
            content = data.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("file_not_utf8_text") from exc
        return {"path": str(target.relative_to(ROOT)), "content": content, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
    raise ValueError("operation_not_allowed")


class Handler(BaseHTTPRequestHandler):
    server_version = "MCFComputerBridge/0.1"

    def log_message(self, fmt: str, *args) -> None:
        # Avoid logging headers, tokens, query strings or file contents.
        print(f"[mcf-bridge] {self.command} {urlparse(self.path).path} - {fmt % args}")

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def authorized(self) -> bool:
        supplied = self.headers.get("Authorization", "")
        expected = f"Bearer {TOKEN}"
        return bool(TOKEN) and hmac.compare_digest(supplied, expected)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            self.send_json(200, {"ok": True, "service": "mcf-computer-bridge", "version": "0.1.0", "auth_required_for_operations": True})
            return
        if path == "/":
            html = b"<!doctype html><meta charset=utf-8><title>MCF Computer Bridge</title><h1>MCF Computer Bridge 0.1.0</h1><p>Local authenticated computer operations.</p><p>GET /health; POST /v1/jobs; GET /v1/jobs/&lt;id&gt;</p><p>See README for the API contract.</p>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(html)
            return
        if path.startswith("/v1/jobs/"):
            if not self.authorized():
                self.send_json(401, {"ok": False, "error": "unauthorized"})
                return
            job_id = path.rsplit("/", 1)[-1]
            job = JOBS.get(job_id)
            if not job:
                self.send_json(404, {"ok": False, "error": "job_not_found"})
                return
            self.send_json(200, {"ok": True, "job": job})
            return
        self.send_json(404, {"ok": False, "error": "not_found"})

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/v1/jobs":
            self.send_json(404, {"ok": False, "error": "not_found"})
            return
        if not self.authorized():
            self.send_json(401, {"ok": False, "error": "unauthorized"})
            return
        key = self.headers.get("Idempotency-Key", "")
        if not key or len(key) > 128:
            self.send_json(400, {"ok": False, "error": "idempotency_key_required"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > MAX_BODY:
                raise ValueError("invalid_body_size")
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict) or not isinstance(payload.get("args", {}), dict):
                raise ValueError("invalid_payload")
            operation = payload.get("operation")
            if not isinstance(operation, str):
                raise ValueError("operation_required")
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {"ok": False, "error": "invalid_json_or_payload"})
            return
        request_hash = digest(payload)
        existing_id = IDEMPOTENCY.get(key)
        if existing_id:
            previous = JOBS[existing_id]
            if previous["request_sha256"] != request_hash:
                self.send_json(409, {"ok": False, "error": "idempotency_conflict"})
                return
            self.send_json(200, {"ok": True, "replayed": True, "job": previous})
            return
        job_id = str(uuid.uuid4())
        started = time.time()
        job = {
            "id": job_id, "status": "running", "operation": operation,
            "created_at": utc_now(), "request_sha256": request_hash,
        }
        JOBS[job_id] = job
        IDEMPOTENCY[key] = job_id
        try:
            result = execute(operation, payload.get("args", {}))
            job.update({"status": "completed", "result": result, "result_sha256": digest(result)})
        except (OSError, PermissionError, ValueError, RuntimeError) as exc:
            # Only stable error identifiers are returned; never leak absolute paths or internals.
            code = str(exc) if str(exc).replace("_", "").isalnum() else "operation_failed"
            job.update({"status": "failed", "error": code})
        except Exception:
            job.update({"status": "failed", "error": "internal_error"})
        job["finished_at"] = utc_now()
        job["duration_ms"] = round((time.time() - started) * 1000, 2)
        self.send_json(200, {"ok": job["status"] == "completed", "replayed": False, "job": job})


def main() -> None:
    if len(TOKEN) < 32:
        raise SystemExit("MCF_BRIDGE_TOKEN must contain at least 32 characters")
    if HOST not in ("127.0.0.1", "localhost"):
        raise SystemExit("MVP only permits loopback binding; remote access requires a separately reviewed private tunnel")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"MCF Computer Bridge listening on http://{HOST}:{PORT}; root={ROOT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
