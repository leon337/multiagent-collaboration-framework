from __future__ import annotations

import hashlib
import json
import sqlite3
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

SCHEMA_VERSION = 1


class MissionError(RuntimeError):
    pass


class ConflictError(MissionError):
    pass


class ProjectionError(MissionError):
    pass


@dataclass(frozen=True)
class Event:
    mission_id: str
    seq: int
    event_id: str
    event_type: str
    actor_id: str
    timestamp: float
    idempotency_key: str
    correlation_id: str
    causation_id: str | None
    payload: dict[str, Any]
    payload_sha256: str


def _canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _sha(value: Any) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


class MissionStore:
    """SQLite/WAL append-only mission journal prototype."""

    def __init__(self, db_path: str | Path):
        self.db_path = str(db_path)
        self.conn = sqlite3.connect(self.db_path, timeout=5.0, isolation_level=None)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA foreign_keys=ON")
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS mission_seq (
              mission_id TEXT PRIMARY KEY,
              next_seq INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS mission_events (
              mission_id TEXT NOT NULL,
              seq INTEGER NOT NULL,
              event_id TEXT NOT NULL PRIMARY KEY,
              schema_version INTEGER NOT NULL,
              event_type TEXT NOT NULL,
              actor_id TEXT NOT NULL,
              ts REAL NOT NULL,
              idempotency_key TEXT NOT NULL,
              correlation_id TEXT NOT NULL,
              causation_id TEXT,
              payload_json TEXT NOT NULL,
              payload_sha256 TEXT NOT NULL,
              UNIQUE(mission_id, seq),
              UNIQUE(mission_id, idempotency_key)
            );
            CREATE INDEX IF NOT EXISTS idx_events_mission_seq
              ON mission_events(mission_id, seq);
            """
        )

    def close(self) -> None:
        self.conn.close()

    def append(
        self,
        mission_id: str,
        event_type: str,
        actor_id: str,
        payload: dict[str, Any],
        *,
        idempotency_key: str,
        correlation_id: str | None = None,
        causation_id: str | None = None,
    ) -> Event:
        if not mission_id or not event_type or not actor_id or not idempotency_key:
            raise ValueError("mission_id, event_type, actor_id and idempotency_key are required")
        payload_json = _canonical_json(payload)
        payload_sha = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        correlation_id = correlation_id or str(uuid.uuid4())
        event_id = str(uuid.uuid4())
        ts = time.time()

        self.conn.execute("BEGIN IMMEDIATE")
        try:
            existing = self.conn.execute(
                "SELECT * FROM mission_events WHERE mission_id=? AND idempotency_key=?",
                (mission_id, idempotency_key),
            ).fetchone()
            if existing is not None:
                if existing["event_type"] != event_type or existing["payload_sha256"] != payload_sha:
                    raise ConflictError("idempotency key reused with different event content")
                self.conn.execute("COMMIT")
                return self._row_to_event(existing)

            row = self.conn.execute(
                "SELECT next_seq FROM mission_seq WHERE mission_id=?", (mission_id,)
            ).fetchone()
            seq = 1 if row is None else int(row["next_seq"])
            if row is None:
                self.conn.execute(
                    "INSERT INTO mission_seq(mission_id,next_seq) VALUES(?,?)",
                    (mission_id, seq + 1),
                )
            else:
                self.conn.execute(
                    "UPDATE mission_seq SET next_seq=? WHERE mission_id=?",
                    (seq + 1, mission_id),
                )

            self.conn.execute(
                """
                INSERT INTO mission_events(
                  mission_id,seq,event_id,schema_version,event_type,actor_id,ts,
                  idempotency_key,correlation_id,causation_id,payload_json,payload_sha256
                ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    mission_id, seq, event_id, SCHEMA_VERSION, event_type, actor_id, ts,
                    idempotency_key, correlation_id, causation_id, payload_json, payload_sha,
                ),
            )
            self.conn.execute("COMMIT")
        except Exception:
            self.conn.execute("ROLLBACK")
            raise
        return Event(
            mission_id=mission_id, seq=seq, event_id=event_id, event_type=event_type,
            actor_id=actor_id, timestamp=ts, idempotency_key=idempotency_key,
            correlation_id=correlation_id, causation_id=causation_id,
            payload=payload, payload_sha256=payload_sha,
        )

    def events(self, mission_id: str) -> list[Event]:
        rows = self.conn.execute(
            "SELECT * FROM mission_events WHERE mission_id=? ORDER BY seq", (mission_id,)
        ).fetchall()
        return [self._row_to_event(row) for row in rows]

    @staticmethod
    def _row_to_event(row: sqlite3.Row) -> Event:
        return Event(
            mission_id=row["mission_id"], seq=int(row["seq"]), event_id=row["event_id"],
            event_type=row["event_type"], actor_id=row["actor_id"], timestamp=float(row["ts"]),
            idempotency_key=row["idempotency_key"], correlation_id=row["correlation_id"],
            causation_id=row["causation_id"], payload=json.loads(row["payload_json"]),
            payload_sha256=row["payload_sha256"],
        )


@dataclass
class Projection:
    agents: dict[str, dict[str, Any]]
    tasks: dict[str, dict[str, Any]]
    messages: dict[str, dict[str, Any]]
    delivered_messages: set[str]


def _detect_cycle(tasks: dict[str, dict[str, Any]]) -> None:
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(task_id: str) -> None:
        if task_id in visited:
            return
        if task_id in visiting:
            raise ProjectionError(f"task dependency cycle at {task_id}")
        visiting.add(task_id)
        for dep in tasks[task_id].get("blocked_by", []):
            if dep not in tasks:
                raise ProjectionError(f"missing task dependency {dep}")
            visit(dep)
        visiting.remove(task_id)
        visited.add(task_id)

    for task_id in tasks:
        visit(task_id)


def replay(events: Iterable[Event]) -> Projection:
    agents: dict[str, dict[str, Any]] = {}
    tasks: dict[str, dict[str, Any]] = {}
    messages: dict[str, dict[str, Any]] = {}
    delivered: set[str] = set()
    expected_seq = 1

    for event in events:
        if event.seq != expected_seq:
            raise ProjectionError(f"non-contiguous event seq: expected {expected_seq}, got {event.seq}")
        expected_seq += 1
        p = event.payload

        if event.event_type == "agent/provisioning":
            aid = p["agent_id"]
            if aid in agents:
                raise ProjectionError(f"agent {aid} already exists")
            agents[aid] = {"agent_id": aid, "name": p["name"], "phase": "provisioning"}
        elif event.event_type in {"agent/active", "agent/failed"}:
            aid = p["agent_id"]
            prior = agents.get(aid)
            if prior is None or prior["phase"] != "provisioning":
                raise ProjectionError(f"invalid agent transition for {aid}")
            prior["phase"] = event.event_type.split("/")[1]
            if "error" in p:
                prior["error"] = p["error"]
        elif event.event_type == "task/created":
            tid = p["task_id"]
            if tid in tasks:
                raise ProjectionError(f"task {tid} already exists")
            tasks[tid] = {
                "task_id": tid,
                "revision": 1,
                "status": "pending",
                "subject": p["subject"],
                "blocked_by": list(p.get("blocked_by", [])),
                "owner_id": None,
                "lease_id": None,
                "lease_until": None,
            }
            _detect_cycle(tasks)
        elif event.event_type == "task/updated":
            tid = p["task_id"]
            task = tasks.get(tid)
            if task is None:
                raise ProjectionError(f"unknown task {tid}")
            if int(p["revision"]) != task["revision"] + 1:
                raise ProjectionError(f"non-contiguous task revision for {tid}")
            task["revision"] = int(p["revision"])
            for key in ("status", "subject", "blocked_by", "owner_id", "lease_id", "lease_until"):
                if key in p:
                    task[key] = p[key]
            _detect_cycle(tasks)
        elif event.event_type == "message/queued":
            mid = p["message_id"]
            if mid in messages:
                raise ProjectionError(f"duplicate message {mid}")
            messages[mid] = dict(p)
        elif event.event_type == "message/delivered":
            mid = p["message_id"]
            if mid not in messages:
                raise ProjectionError(f"message {mid} delivered before queue")
            if mid in delivered:
                raise ProjectionError(f"message {mid} delivered twice")
            delivered.add(mid)

    return Projection(agents=agents, tasks=tasks, messages=messages, delivered_messages=delivered)


class MissionRuntime:
    def __init__(self, store: MissionStore, mission_id: str):
        self.store = store
        self.mission_id = mission_id

    def projection(self) -> Projection:
        return replay(self.store.events(self.mission_id))

    def create_task(self, task_id: str, subject: str, blocked_by: list[str], actor: str) -> dict[str, Any]:
        candidate = self.projection()
        if task_id in candidate.tasks:
            raise ConflictError(f"task {task_id} already exists")
        temp = dict(candidate.tasks)
        temp[task_id] = {"blocked_by": list(blocked_by)}
        _detect_cycle(temp)
        self.store.append(
            self.mission_id, "task/created", actor,
            {"task_id": task_id, "subject": subject, "blocked_by": blocked_by},
            idempotency_key=f"task:create:{task_id}",
        )
        return self.projection().tasks[task_id]

    def update_task(self, task_id: str, expected_revision: int, actor: str, **changes: Any) -> dict[str, Any]:
        p = self.projection()
        task = p.tasks.get(task_id)
        if task is None:
            raise MissionError(f"unknown task {task_id}")
        if task["revision"] != expected_revision:
            raise ConflictError(
                f"stale task revision: expected {expected_revision}, current {task['revision']}"
            )
        new_rev = expected_revision + 1
        candidate_tasks = json.loads(json.dumps(p.tasks))
        candidate_tasks[task_id].update(changes)
        _detect_cycle(candidate_tasks)
        payload = {"task_id": task_id, "revision": new_rev, **changes}
        self.store.append(
            self.mission_id, "task/updated", actor, payload,
            idempotency_key=f"task:update:{task_id}:{new_rev}:{_sha(changes)[:16]}",
        )
        return self.projection().tasks[task_id]

    def lease_task(
        self,
        task_id: str,
        expected_revision: int,
        owner_id: str,
        ttl_seconds: int,
        actor: str,
    ) -> dict[str, Any]:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        lease_id = str(uuid.uuid4())
        return self.update_task(
            task_id, expected_revision, actor,
            status="leased", owner_id=owner_id, lease_id=lease_id,
            lease_until=time.time() + ttl_seconds,
        )

    def recover_expired_leases(self, actor: str, now: float | None = None) -> list[str]:
        now = time.time() if now is None else now
        recovered: list[str] = []
        while True:
            changed = False
            p = self.projection()
            for tid, task in p.tasks.items():
                if (
                    task["status"] == "leased"
                    and task.get("lease_until") is not None
                    and task["lease_until"] <= now
                ):
                    self.update_task(
                        tid, task["revision"], actor,
                        status="blocked", owner_id=None, lease_id=None, lease_until=None,
                    )
                    recovered.append(tid)
                    changed = True
            if not changed:
                return recovered

    def queue_message(
        self,
        message_id: str,
        sender_id: str,
        target_id: str,
        content: str,
        actor: str,
    ) -> dict[str, Any]:
        self.store.append(
            self.mission_id, "message/queued", actor,
            {
                "message_id": message_id,
                "sender_id": sender_id,
                "target_id": target_id,
                "content": content,
            },
            idempotency_key=f"message:queued:{message_id}",
        )
        return self.projection().messages[message_id]

    def ack_message(self, message_id: str, target_id: str, actor: str) -> None:
        p = self.projection()
        msg = p.messages.get(message_id)
        if msg is None:
            raise MissionError(f"unknown message {message_id}")
        if msg["target_id"] != target_id:
            raise ConflictError("message target mismatch")
        if message_id in p.delivered_messages:
            return
        self.store.append(
            self.mission_id, "message/delivered", actor,
            {"message_id": message_id, "target_id": target_id},
            idempotency_key=f"message:delivered:{message_id}",
        )
