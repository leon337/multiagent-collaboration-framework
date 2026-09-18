from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path
from typing import Any

from runtime import replay

SNAPSHOT_SCHEMA = "mcf_journal_snapshot/v1"
ANCHOR_SCHEMA = "mcf_journal_anchor/v1"
GENESIS_HASH = "0" * 64


class SnapshotError(RuntimeError):
    pass


def _canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _sha_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _normalize(value: Any) -> Any:
    if isinstance(value, set):
        return sorted(value)
    if isinstance(value, dict):
        return {str(k): _normalize(v) for k, v in sorted(value.items())}
    if isinstance(value, (list, tuple)):
        return [_normalize(v) for v in value]
    return value


def _event_material(event) -> dict[str, Any]:
    return {
        "mission_id": event.mission_id,
        "seq": event.seq,
        "event_id": event.event_id,
        "event_type": event.event_type,
        "actor_id": event.actor_id,
        "timestamp": event.timestamp,
        "idempotency_key": event.idempotency_key,
        "correlation_id": event.correlation_id,
        "causation_id": event.causation_id,
        "payload": event.payload,
        "payload_sha256": event.payload_sha256,
    }


def event_chain(events) -> str:
    head = GENESIS_HASH
    for event in events:
        head = _sha_text(head + _canonical(_event_material(event)))
    return head


def projection_material(projection) -> dict[str, Any]:
    return _normalize(
        {
            "agents": projection.agents,
            "tasks": projection.tasks,
            "messages": projection.messages,
            "delivered_messages": projection.delivered_messages,
            "executions": projection.executions,
            "tool_calls": projection.tool_calls,
            "sessions": projection.sessions,
        }
    )


def create_snapshot(store, mission_id: str, output: str | Path) -> dict[str, Any]:
    events = store.events(mission_id)
    projection = replay(events)
    material = {
        "schema": SNAPSHOT_SCHEMA,
        "mission_id": mission_id,
        "event_count": len(events),
        "last_seq": events[-1].seq if events else 0,
        "journal_chain_head": event_chain(events),
        "projection_sha256": _sha_text(_canonical(projection_material(projection))),
        "created_at": time.time(),
    }
    snapshot = {**material, "snapshot_sha256": _sha_text(_canonical(material))}

    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
    os.replace(tmp, path)
    return snapshot


def verify_snapshot(store, snapshot: dict[str, Any] | str | Path) -> dict[str, Any]:
    if not isinstance(snapshot, dict):
        snapshot = json.loads(Path(snapshot).read_text())

    material = dict(snapshot)
    claimed = material.pop("snapshot_sha256", None)
    if claimed != _sha_text(_canonical(material)):
        raise SnapshotError("snapshot digest mismatch")

    events = store.events(snapshot["mission_id"])
    count = int(snapshot["event_count"])
    if count > len(events):
        raise SnapshotError("snapshot references unavailable events")

    prefix = events[:count]
    projection = replay(prefix)
    if event_chain(prefix) != snapshot["journal_chain_head"]:
        raise SnapshotError("journal chain head mismatch")
    if _sha_text(_canonical(projection_material(projection))) != snapshot["projection_sha256"]:
        raise SnapshotError("projection digest mismatch")

    return {
        "ok": True,
        "event_count": count,
        "journal_chain_head": snapshot["journal_chain_head"],
    }


def archive_prefix(store, mission_id: str, snapshot: dict[str, Any], output: str | Path) -> dict[str, Any]:
    verify_snapshot(store, snapshot)
    events = store.events(mission_id)[: int(snapshot["event_count"])]
    raw = (
        "\n".join(_canonical(_event_material(event)) for event in events)
        + ("\n" if events else "")
    ).encode("utf-8")
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw)
    return {
        "schema": "mcf_journal_archive/v1",
        "mission_id": mission_id,
        "event_count": len(events),
        "journal_chain_head": snapshot["journal_chain_head"],
        "archive_sha256": hashlib.sha256(raw).hexdigest(),
        "destructive_compaction_performed": False,
    }


class AnchorSigner:
    """HMAC-signed authority checkpoint. External publication is optional."""

    def __init__(self, key_path: str | Path):
        self.key_path = Path(key_path)
        self.key_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.key_path.exists():
            self.key_path.write_bytes(secrets.token_bytes(32))
            os.chmod(self.key_path, 0o600)
        self.key = self.key_path.read_bytes()

    def sign(
        self,
        snapshot: dict[str, Any],
        *,
        authority_id: str,
        anchor_id: str,
    ) -> dict[str, Any]:
        material = {
            "schema": ANCHOR_SCHEMA,
            "anchor_id": anchor_id,
            "authority_id": authority_id,
            "mission_id": snapshot["mission_id"],
            "event_count": snapshot["event_count"],
            "journal_chain_head": snapshot["journal_chain_head"],
            "snapshot_sha256": snapshot["snapshot_sha256"],
        }
        signature = hmac.new(
            self.key,
            _canonical(material).encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return {**material, "hmac_sha256": signature}

    def verify(self, anchor: dict[str, Any]) -> bool:
        material = dict(anchor)
        claimed = material.pop("hmac_sha256", "")
        expected = hmac.new(
            self.key,
            _canonical(material).encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(claimed, expected)
