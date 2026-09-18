from __future__ import annotations

import fcntl
import hashlib
import json
import os
import time
import uuid
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

GENESIS_HASH = "0" * 64
SCHEMA = "mcf_live_history/v1"

class HistoryError(RuntimeError):
    pass

class HistoryConflict(HistoryError):
    pass

class HistoryIntegrityError(HistoryError):
    pass

def canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def digest(value: Any) -> str:
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()

@dataclass(frozen=True)
class HistoryEvent:
    schema: str
    mission_id: str
    seq: int
    event_id: str
    actor: str
    kind: str
    text: str
    evidence: dict[str, Any]
    ts: float
    idempotency_key: str
    prev_sha256: str
    event_sha256: str

    def hash_material(self) -> dict[str, Any]:
        d = asdict(self)
        d.pop("event_sha256")
        return d

class HistoryLog:
    """Append-only, hash-chained local history log with process-safe writes."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.touch(exist_ok=True)

    def _read_locked(self, fh) -> list[dict[str, Any]]:
        fh.seek(0)
        out = []
        for line_no, raw in enumerate(fh, 1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                out.append(json.loads(raw))
            except json.JSONDecodeError as exc:
                raise HistoryIntegrityError(f"invalid JSONL at line {line_no}") from exc
        return out

    def append(self, mission_id: str, actor: str, kind: str, text: str, *, evidence: dict[str, Any] | None = None, idempotency_key: str, ts: float | None = None) -> HistoryEvent:
        evidence = dict(evidence or {})
        ts = float(time.time() if ts is None else ts)
        with self.path.open("r+", encoding="utf-8") as fh:
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
            rows = self._read_locked(fh)
            for row in rows:
                if row.get("mission_id") == mission_id and row.get("idempotency_key") == idempotency_key:
                    same = row.get("actor") == actor and row.get("kind") == kind and row.get("text") == text and row.get("evidence") == evidence
                    if not same:
                        raise HistoryConflict("idempotency key reused with different history content")
                    return HistoryEvent(**row)

            mission_rows = [r for r in rows if r.get("mission_id") == mission_id]
            seq = len(mission_rows) + 1
            prev = GENESIS_HASH if not mission_rows else mission_rows[-1]["event_sha256"]
            material = {
                "schema": SCHEMA,
                "mission_id": mission_id,
                "seq": seq,
                "event_id": str(uuid.uuid4()),
                "actor": actor,
                "kind": kind,
                "text": text,
                "evidence": evidence,
                "ts": ts,
                "idempotency_key": idempotency_key,
                "prev_sha256": prev,
            }
            event = HistoryEvent(**material, event_sha256=digest(material))
            fh.seek(0, os.SEEK_END)
            fh.write(canonical(asdict(event)) + "\n")
            fh.flush()
            os.fsync(fh.fileno())
            return event

    def replay(self, mission_id: str) -> list[HistoryEvent]:
        with self.path.open("r", encoding="utf-8") as fh:
            fcntl.flock(fh.fileno(), fcntl.LOCK_SH)
            rows = [r for r in self._read_locked(fh) if r.get("mission_id") == mission_id]
        expected_seq = 1
        prev = GENESIS_HASH
        events = []
        seen_keys = set()
        for row in rows:
            ev = HistoryEvent(**row)
            if ev.seq != expected_seq:
                raise HistoryIntegrityError(f"non-contiguous seq: expected {expected_seq}, got {ev.seq}")
            if ev.prev_sha256 != prev:
                raise HistoryIntegrityError("history predecessor hash mismatch")
            if digest(ev.hash_material()) != ev.event_sha256:
                raise HistoryIntegrityError("history event hash mismatch")
            if ev.idempotency_key in seen_keys:
                raise HistoryIntegrityError("duplicate idempotency key in history")
            seen_keys.add(ev.idempotency_key)
            events.append(ev)
            expected_seq += 1
            prev = ev.event_sha256
        return events

    def projection(self, mission_id: str) -> dict[str, Any]:
        events = self.replay(mission_id)
        return {
            "schema": "mcf_live_history_projection/v1",
            "mission_id": mission_id,
            "count": len(events),
            "chain_head": GENESIS_HASH if not events else events[-1].event_sha256,
            "history": [asdict(e) for e in events],
        }

def write_projection(log_path: str | Path, mission_id: str, output_path: str | Path) -> dict[str, Any]:
    projection = HistoryLog(log_path).projection(mission_id)
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(out.suffix + ".tmp")
    tmp.write_text(json.dumps(projection, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(tmp, out)
    return projection
