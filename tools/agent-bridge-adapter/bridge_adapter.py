#!/usr/bin/env python3
"""Adaptador local e observacional MESTRE <-> MCF Dual Browser Agent Bridge.

Somente loopback, discovery obrigatório, token descoberto no descriptor 0600.
Não oferece comandos de escrita: navegação/click/type dependem do HUMAN_GATE.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import stat
import sys
import time
import urllib.error
import urllib.request
import uuid

SCHEMA = "mcf-dual-browser-runtime-discovery/v1"
INSTANCE_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$")
ROUTES = {
    "discovery": "/v1/discovery",
    "state": "/v1/state",
    "agents": "/v1/agents",
    "missions": "/v1/missions",
    "sessions": "/v1/agent-sessions",
    "snapshot": "/v1/live/snapshot",
    "text": "/v1/text",
    "interactive": "/v1/interactive",
    "accessibility": "/v1/accessibility",
}
TOOL_DOCS = {
    "discovery": "Discover live instance, panes, agents and supported mechanisms (read-only).",
    "state": "Read the current workspace URL/title/loading state (read-only).",
    "agents": "List the canonical agents bound to the running cockpit (read-only).",
    "missions": "List agent missions without dispatching any (read-only).",
    "sessions": "List persisted Agent Sessions (read-only).",
    "snapshot": "Read the live-event snapshot; do not start the SSE stream.",
    "text": "Read current workspace page text without modifying the page.",
    "interactive": "Inspect current interactive elements, without clicking or typing.",
    "accessibility": "Read the Chromium accessibility tree for semantic preflight; no interactions.",
}


class BridgeError(Exception):
    """Safe-to-display failure; no bearer tokens or response bodies."""


def descriptor_path(instance: str, home: Path | None = None) -> Path:
    if not INSTANCE_RE.fullmatch(instance):
        raise BridgeError("invalid_instance_id")
    base = home or Path.home()
    return base / ".config" / "mcf-dual-browser-cockpit" / "instances" / instance / "agent-bridge.json"


def load_descriptor(instance: str, home: Path | None = None) -> dict:
    path = descriptor_path(instance, home)
    try:
        meta = path.lstat()
        if not stat.S_ISREG(meta.st_mode) or meta.st_uid != os.getuid():
            raise BridgeError("descriptor_not_owned_regular_file")
        if stat.S_IMODE(meta.st_mode) & 0o077:
            raise BridgeError("descriptor_permissions_too_open")
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise BridgeError("descriptor_not_found") from exc
    except (OSError, ValueError) as exc:
        raise BridgeError("descriptor_unreadable") from exc
    if not isinstance(data, dict) or data.get("enabled") is not True:
        raise BridgeError("bridge_not_enabled")
    if data.get("host") != "127.0.0.1":
        raise BridgeError("non_loopback_bridge_denied")
    if data.get("instanceId") != instance:
        raise BridgeError("descriptor_instance_mismatch")
    port = data.get("port")
    if type(port) is not int or not 1 <= port <= 65535:
        raise BridgeError("invalid_bridge_port")
    if not isinstance(data.get("token"), str) or not data["token"]:
        raise BridgeError("missing_bridge_token")
    return data


class BridgeClient:
    def __init__(self, instance: str, home: Path | None = None, timeout: float = 4.0):
        if not INSTANCE_RE.fullmatch(instance):
            raise BridgeError("invalid_instance_id")
        self.instance = instance
        self.home = home
        self.timeout = timeout

    def _get(self, route: str) -> dict:
        descriptor = load_descriptor(self.instance, self.home)
        path = ROUTES.get(route)
        if path is None:
            raise BridgeError("route_not_allowlisted")
        req = urllib.request.Request(
            "http://127.0.0.1:%d%s" % (descriptor["port"], path),
            headers={
                "Authorization": "Bearer " + descriptor["token"],
                "X-MCF-Instance": self.instance,
                "Accept": "application/json",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                if response.status != 200:
                    raise BridgeError("bridge_http_status_%d" % response.status)
                if response.headers.get("X-MCF-Instance") != self.instance:
                    raise BridgeError("response_instance_mismatch")
                payload = response.read(2_000_001)
                if len(payload) > 2_000_000:
                    raise BridgeError("bridge_response_too_large")
        except urllib.error.HTTPError as exc:
            if exc.code == 401:
                raise BridgeError("bridge_auth_failed_refresh_descriptor") from exc
            raise BridgeError("bridge_http_error_%d" % exc.code) from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise BridgeError("bridge_unreachable") from exc
        try:
            data = json.loads(payload)
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise BridgeError("bridge_invalid_json") from exc
        if not isinstance(data, dict) or data.get("ok") is not True:
            raise BridgeError("bridge_result_not_ok")
        return data

    def discovery(self) -> dict:
        value = self._get("discovery")
        discovery = value.get("discovery")
        if not isinstance(discovery, dict) or discovery.get("schema") != SCHEMA:
            raise BridgeError("discovery_schema_mismatch")
        instance = discovery.get("instance")
        if not isinstance(instance, dict) or instance.get("instanceId") != self.instance:
            raise BridgeError("discovery_instance_mismatch")
        correctness = discovery.get("correctness")
        if not isinstance(correctness, dict) or correctness.get("falseGreenAllowed") is not False:
            raise BridgeError("unsafe_discovery_correctness")
        return value

    def read(self, route: str) -> dict:
        # Todo acesso passa pela reconciliação normativa de discovery.
        discovery = self.discovery()
        if route == "discovery":
            return discovery
        return self._get(route)


def receipt(instance: str, operation: str, ok: bool, error: str | None = None,
            home: Path | None = None) -> None:
    # Apenas metadados. Não persiste token, conteúdo de página ou URL.
    directory = (home or Path.home()) / ".local" / "state" / "mcf-agent-bridge"
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(directory, 0o700)
    path = directory / "receipts.jsonl"
    flags = os.O_WRONLY | os.O_APPEND | os.O_CREAT
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(str(path), flags, 0o600)
    try:
        if os.fstat(fd).st_uid != os.getuid() or os.fstat(fd).st_mode & 0o077:
            raise BridgeError("receipt_file_permissions_invalid")
        event = {
            "schema": "mcf-agent-bridge-observation-receipt/v1",
            "id": str(uuid.uuid4()),
            "at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "instanceId": instance,
            "operation": operation,
            "ok": ok,
            "error": error,
            "effects": "none",
        }
        os.write(fd, (json.dumps(event, ensure_ascii=False) + "\n").encode())
    finally:
        os.close(fd)


def execute_read(client: BridgeClient, operation: str, log: bool = True) -> dict:
    try:
        value = client.read(operation)
        if log:
            receipt(client.instance, operation, True, home=client.home)
        return value
    except BridgeError as exc:
        if log:
            receipt(client.instance, operation, False, str(exc), home=client.home)
        raise


def doctor(client: BridgeClient) -> dict:
    value = execute_read(client, "discovery")
    d = value["discovery"]
    inst = d["instance"]
    state = execute_read(client, "state")
    s = state.get("state", {})
    if not isinstance(s, dict) or s.get("instanceId") != client.instance:
        raise BridgeError("state_instance_mismatch")
    return {
        "ok": True,
        "schema": "mcf-agent-bridge-adapter-diagnostic/v1",
        "instanceId": client.instance,
        "agentProfile": inst.get("agentProfile"),
        "paused": inst.get("paused"),
        "busy": inst.get("busy"),
        "queueDepth": inst.get("queueDepth"),
        "stateTitle": s.get("title"),
        "workspaceLoaded": s.get("loading") is False,
        "warningsCount": len(d.get("warnings", [])),
        "warnings": [
            {key: item[key] for key in ("source", "warning") if key in item}
            for item in d.get("warnings", []) if isinstance(item, dict)
        ],
        "readOnly": True,
        "authentication": "verified",
    }


def tools_catalog() -> list[dict]:
    return [
        {
            "name": "bridge_" + route,
            "description": description,
            "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
            "annotations": {"readOnlyHint": True, "destructiveHint": False, "openWorldHint": False},
        }
        for route, description in TOOL_DOCS.items()
    ]


def mcp_stdio(client: BridgeClient) -> None:
    """MCP over newline-delimited JSON-RPC on stdio; never emit debug text to stdout."""
    for line in sys.stdin:
        try:
            msg = json.loads(line)
            if not isinstance(msg, dict):
                continue
            request_id = msg.get("id")
            if request_id is None:
                continue
            method = msg.get("method")
            params = msg.get("params") or {}
            if method == "initialize":
                result = {
                    "protocolVersion": (
                        params.get("protocolVersion")
                        if isinstance(params, dict) and params.get("protocolVersion")
                        in ("2024-11-05", "2025-03-26", "2025-06-18")
                        else "2024-11-05"
                    ),
                    "capabilities": {"tools": {"listChanged": False}},
                    "serverInfo": {"name": "mcf-agent-bridge-readonly", "version": "0.1.0"},
                }
            elif method == "ping":
                result = {}
            elif method == "tools/list":
                result = {"tools": tools_catalog()}
            elif method == "tools/call":
                name = params.get("name", "") if isinstance(params, dict) else ""
                route = name.removeprefix("bridge_")
                if name not in {"bridge_" + k for k in ROUTES}:
                    raise BridgeError("unsupported_tool")
                if params.get("arguments"):
                    raise BridgeError("unexpected_tool_arguments")
                result = {
                    "content": [{"type": "text", "text": json.dumps(execute_read(client, route), ensure_ascii=False)}],
                    "isError": False,
                }
            else:
                raise BridgeError("method_not_supported")
            response = {"jsonrpc": "2.0", "id": request_id, "result": result}
        except (BridgeError, ValueError, TypeError) as exc:
            response = {
                "jsonrpc": "2.0", "id": msg.get("id") if isinstance(locals().get("msg"), dict) else None,
                "error": {"code": -32000, "message": str(exc)},
            }
        sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
        sys.stdout.flush()


def main() -> int:
    parser = argparse.ArgumentParser(description="MCF local Agent Bridge adapter; read-only.")
    parser.add_argument("--instance", default=os.environ.get("MCF_BRIDGE_INSTANCE"),
                        help="Canonical cockpit instance ID (or MCF_BRIDGE_INSTANCE).")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("doctor")
    reader = commands.add_parser("read")
    reader.add_argument("route", choices=tuple(ROUTES))
    commands.add_parser("mcp")
    args = parser.parse_args()
    try:
        if not args.instance:
            raise BridgeError("instance_required")
        client = BridgeClient(args.instance)
        if args.command == "mcp":
            mcp_stdio(client)
            return 0
        result = doctor(client) if args.command == "doctor" else execute_read(client, args.route)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except BridgeError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
