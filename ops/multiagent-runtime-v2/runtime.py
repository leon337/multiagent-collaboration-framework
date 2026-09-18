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
            CREATE TABLE IF NOT EXISTS task_heads (
              mission_id TEXT NOT NULL,
              task_id TEXT NOT NULL,
              revision INTEGER NOT NULL,
              PRIMARY KEY(mission_id, task_id)
            );
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

    def _allocate_seq(self, mission_id: str) -> int:
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
        return seq

    def _insert_event_tx(
        self,
        mission_id: str,
        seq: int,
        event_type: str,
        actor_id: str,
        payload: dict[str, Any],
        idempotency_key: str,
        correlation_id: str | None = None,
        causation_id: str | None = None,
    ) -> Event:
        payload_json = _canonical_json(payload)
        payload_sha = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        correlation_id = correlation_id or str(uuid.uuid4())
        event_id = str(uuid.uuid4())
        ts = time.time()
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
        return Event(
            mission_id=mission_id, seq=seq, event_id=event_id, event_type=event_type,
            actor_id=actor_id, timestamp=ts, idempotency_key=idempotency_key,
            correlation_id=correlation_id, causation_id=causation_id,
            payload=payload, payload_sha256=payload_sha,
        )

    def append_task_created(
        self,
        mission_id: str,
        task_id: str,
        actor_id: str,
        payload: dict[str, Any],
        *,
        idempotency_key: str,
    ) -> Event:
        self.conn.execute("BEGIN IMMEDIATE")
        try:
            existing = self.conn.execute(
                "SELECT * FROM mission_events WHERE mission_id=? AND idempotency_key=?",
                (mission_id, idempotency_key),
            ).fetchone()
            if existing is not None:
                self.conn.execute("COMMIT")
                return self._row_to_event(existing)
            head = self.conn.execute(
                "SELECT revision FROM task_heads WHERE mission_id=? AND task_id=?",
                (mission_id, task_id),
            ).fetchone()
            if head is not None:
                raise ConflictError(f"task {task_id} already exists")
            seq = self._allocate_seq(mission_id)
            event = self._insert_event_tx(
                mission_id, seq, "task/created", actor_id, payload, idempotency_key
            )
            self.conn.execute(
                "INSERT INTO task_heads(mission_id,task_id,revision) VALUES(?,?,1)",
                (mission_id, task_id),
            )
            self.conn.execute("COMMIT")
            return event
        except Exception:
            self.conn.execute("ROLLBACK")
            raise

    def append_task_updated(
        self,
        mission_id: str,
        task_id: str,
        expected_revision: int,
        actor_id: str,
        changes: dict[str, Any],
        *,
        idempotency_key: str,
    ) -> Event:
        self.conn.execute("BEGIN IMMEDIATE")
        try:
            existing = self.conn.execute(
                "SELECT * FROM mission_events WHERE mission_id=? AND idempotency_key=?",
                (mission_id, idempotency_key),
            ).fetchone()
            if existing is not None:
                self.conn.execute("COMMIT")
                return self._row_to_event(existing)
            head = self.conn.execute(
                "SELECT revision FROM task_heads WHERE mission_id=? AND task_id=?",
                (mission_id, task_id),
            ).fetchone()
            if head is None:
                raise MissionError(f"unknown task {task_id}")
            current = int(head["revision"])
            if current != expected_revision:
                raise ConflictError(
                    f"stale task revision: expected {expected_revision}, current {current}"
                )
            new_revision = current + 1
            payload = {"task_id": task_id, "revision": new_revision, **changes}
            seq = self._allocate_seq(mission_id)
            event = self._insert_event_tx(
                mission_id, seq, "task/updated", actor_id, payload, idempotency_key
            )
            self.conn.execute(
                "UPDATE task_heads SET revision=? WHERE mission_id=? AND task_id=?",
                (new_revision, mission_id, task_id),
            )
            self.conn.execute("COMMIT")
            return event
        except Exception:
            self.conn.execute("ROLLBACK")
            raise

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
    executions: dict[str, dict[str, Any]]
    tool_calls: dict[str, dict[str, Any]]
    sessions: dict[str, dict[str, Any]]


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
    executions: dict[str, dict[str, Any]] = {}
    tool_calls: dict[str, dict[str, Any]] = {}
    sessions: dict[str, dict[str, Any]] = {}
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
            if any(agent.get("name") == p["name"] for agent in agents.values()):
                raise ProjectionError(f"agent name {p['name']} is permanently reserved")
            agents[aid] = {
                "agent_id": aid,
                "name": p["name"],
                "phase": "provisioning",
                "executor_ref": p["executor_ref"],
            }
        elif event.event_type in {"agent/active", "agent/failed"}:
            aid = p["agent_id"]
            prior = agents.get(aid)
            if prior is None or prior["phase"] != "provisioning":
                raise ProjectionError(f"invalid agent transition for {aid}")
            prior["phase"] = event.event_type.split("/")[1]
            if "error" in p:
                prior["error"] = p["error"]
            if "evidence_ref" in p:
                prior["evidence_ref"] = p["evidence_ref"]
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
            for key in (
                "status", "subject", "blocked_by", "owner_id", "lease_id", "lease_until",
                "priority", "lane", "preemptible", "enqueued_at"
            ):
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
        elif event.event_type == "execution/started":
            eid = p["execution_id"]
            if eid in executions:
                raise ProjectionError(f"execution {eid} already exists")
            executions[eid] = {
                "execution_id": eid,
                "agent_id": p["agent_id"],
                "task_id": p["task_id"],
                "executor": p["executor"],
                "status": "running",
                "resource_usage": {},
            }
        elif event.event_type in {"execution/completed", "execution/failed"}:
            eid = p["execution_id"]
            execution = executions.get(eid)
            if execution is None or execution["status"] != "running":
                raise ProjectionError(f"invalid execution transition for {eid}")
            execution["status"] = event.event_type.split("/")[1]
            execution["finish_reason"] = p.get("finish_reason")
            execution["artifact_refs"] = list(p.get("artifact_refs", []))
            execution["resource_usage"] = dict(p.get("resource_usage", {}))
        elif event.event_type == "tool/requested":
            call_id = p["call_id"]
            if call_id in tool_calls:
                raise ProjectionError(f"tool call {call_id} already exists")
            if p["execution_id"] not in executions:
                raise ProjectionError(f"tool call {call_id} references unknown execution")
            tool_calls[call_id] = {
                "call_id": call_id,
                "execution_id": p["execution_id"],
                "tool": p["tool"],
                "args_sha256": p["args_sha256"],
                "status": "requested",
            }
        elif event.event_type in {"tool/completed", "tool/failed"}:
            call_id = p["call_id"]
            tool = tool_calls.get(call_id)
            if tool is None or tool["status"] != "requested":
                raise ProjectionError(f"invalid tool transition for {call_id}")
            tool["status"] = event.event_type.split("/")[1]
            if "result_sha256" in p:
                tool["result_sha256"] = p["result_sha256"]
            if "error_class" in p:
                tool["error_class"] = p["error_class"]
        elif event.event_type == "session/created":
            sid = p["session_id"]
            if sid in sessions:
                raise ProjectionError(f"session {sid} already exists")
            sessions[sid] = {
                **p,
                "status": "active",
                "checkpoint_seq": 0,
                "seen_message_ids": set(),
                "resume_count": 0,
            }
        elif event.event_type == "session/checkpointed":
            sid = p["session_id"]
            session = sessions.get(sid)
            if session is None:
                raise ProjectionError(f"unknown session {sid}")
            expected = int(session.get("checkpoint_seq", 0)) + 1
            if int(p["checkpoint_seq"]) != expected:
                raise ProjectionError(f"non-contiguous session checkpoint for {sid}")
            session.update(p)
        elif event.event_type == "session/message_seen":
            sid = p["session_id"]
            session = sessions.get(sid)
            if session is None:
                raise ProjectionError(f"unknown session {sid}")
            mid = p["message_id"]
            if mid in session["seen_message_ids"]:
                raise ProjectionError(f"session message {mid} seen twice")
            session["seen_message_ids"].add(mid)
        elif event.event_type == "session/interrupted":
            sid = p["session_id"]
            session = sessions.get(sid)
            if session is None or session["status"] != "active":
                raise ProjectionError(f"invalid session interrupt for {sid}")
            session["status"] = "interrupted"
            session["interrupt_reason"] = p.get("reason")
        elif event.event_type == "session/resumed":
            sid = p["session_id"]
            session = sessions.get(sid)
            if session is None or session["status"] != "interrupted":
                raise ProjectionError(f"invalid session resume for {sid}")
            session["status"] = "active"
            session["resume_count"] = int(session.get("resume_count", 0)) + 1
            session["resume_executor_state_ref"] = p.get("executor_state_ref")

    return Projection(
        agents=agents,
        tasks=tasks,
        messages=messages,
        delivered_messages=delivered,
        executions=executions,
        tool_calls=tool_calls,
        sessions=sessions,
    )


class MissionRuntime:
    def __init__(self, store: MissionStore, mission_id: str):
        self.store = store
        self.mission_id = mission_id

    def projection(self) -> Projection:
        return replay(self.store.events(self.mission_id))

    def provision_agent(
        self,
        agent_id: str,
        name: str,
        executor_ref: str,
        actor: str,
    ) -> dict[str, Any]:
        projection = self.projection()
        existing = projection.agents.get(agent_id)
        if existing is not None:
            if existing.get("name") == name and existing.get("executor_ref") == executor_ref:
                return existing
            raise ConflictError(f"agent id {agent_id} already reserved")
        for other in projection.agents.values():
            if other.get("name") == name:
                raise ConflictError(f"agent name {name} is permanently reserved")

        self.store.append(
            self.mission_id,
            "agent/provisioning",
            actor,
            {"agent_id": agent_id, "name": name, "executor_ref": executor_ref},
            idempotency_key=f"agent:provisioning:{agent_id}",
        )
        return self.projection().agents[agent_id]

    def settle_agent(
        self,
        agent_id: str,
        observed_phase: str,
        actor: str,
        error: str | None = None,
        evidence_ref: str | None = None,
    ) -> dict[str, Any]:
        if observed_phase not in {"active", "failed"}:
            raise ValueError("observed_phase must be active or failed")
        current = self.projection().agents.get(agent_id)
        if current is None:
            raise MissionError(f"unknown agent {agent_id}")
        if current["phase"] != "provisioning":
            if current["phase"] == observed_phase:
                return current
            raise ConflictError(f"agent {agent_id} already settled as {current['phase']}")
        payload = {"agent_id": agent_id}
        if error is not None:
            payload["error"] = error
        if evidence_ref is not None:
            payload["evidence_ref"] = evidence_ref
        self.store.append(
            self.mission_id,
            f"agent/{observed_phase}",
            actor,
            payload,
            idempotency_key=f"agent:settle:{agent_id}:{observed_phase}",
        )
        return self.projection().agents[agent_id]

    def reconcile_provisioning(
        self,
        observations: dict[str, dict[str, Any]],
        actor: str,
    ) -> dict[str, Any]:
        projection = self.projection()
        settled: dict[str, str] = {}
        pending: list[str] = []
        already_settled: dict[str, str] = {}

        for agent_id, agent in sorted(projection.agents.items()):
            observation = observations.get(agent_id)
            if agent["phase"] != "provisioning":
                if observation is not None:
                    observed_phase = observation.get("phase")
                    if observed_phase is not None and observed_phase != agent["phase"]:
                        raise ConflictError(
                            f"agent {agent_id} observed as {observed_phase} "
                            f"but journal says {agent['phase']}"
                        )
                    already_settled[agent_id] = agent["phase"]
                continue

            if observation is None:
                pending.append(agent_id)
                continue

            observed_phase = observation.get("phase")
            if observed_phase not in {"active", "failed"}:
                raise ValueError(
                    f"agent {agent_id} observation phase must be active or failed"
                )
            observed_executor = observation.get("executor_ref")
            if observed_executor is not None and observed_executor != agent.get("executor_ref"):
                raise ConflictError(
                    f"agent {agent_id} executor mismatch: "
                    f"{observed_executor} != {agent.get('executor_ref')}"
                )

            result = self.settle_agent(
                agent_id,
                observed_phase,
                actor,
                error=observation.get("error"),
                evidence_ref=observation.get("evidence_ref"),
            )
            settled[agent_id] = result["phase"]

        unknown = sorted(set(observations).difference(projection.agents))
        return {
            "schema": "mcf_provisioning_reconcile/v1",
            "settled": settled,
            "pending": pending,
            "already_settled": already_settled,
            "unknown_observations": unknown,
        }

    def start_execution(
        self,
        execution_id: str,
        agent_id: str,
        task_id: str,
        executor: str,
        actor: str,
    ) -> dict[str, Any]:
        p = self.projection()
        if task_id not in p.tasks:
            raise MissionError(f"unknown task {task_id}")
        self.store.append(
            self.mission_id,
            "execution/started",
            actor,
            {
                "execution_id": execution_id,
                "agent_id": agent_id,
                "task_id": task_id,
                "executor": executor,
            },
            idempotency_key=f"execution:start:{execution_id}",
        )
        return self.projection().executions[execution_id]

    def finish_execution(
        self,
        execution_id: str,
        actor: str,
        *,
        success: bool,
        finish_reason: str,
        artifact_refs: list[str] | None = None,
        resource_usage: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        current = self.projection().executions.get(execution_id)
        if current is None:
            raise MissionError(f"unknown execution {execution_id}")
        if current["status"] != "running":
            return current
        event_type = "execution/completed" if success else "execution/failed"
        self.store.append(
            self.mission_id,
            event_type,
            actor,
            {
                "execution_id": execution_id,
                "finish_reason": finish_reason,
                "artifact_refs": list(artifact_refs or []),
                "resource_usage": dict(resource_usage or {}),
            },
            idempotency_key=f"execution:finish:{execution_id}:{event_type}",
        )
        return self.projection().executions[execution_id]

    def request_tool(
        self,
        call_id: str,
        execution_id: str,
        tool: str,
        args_sha256: str,
        actor: str,
    ) -> dict[str, Any]:
        if execution_id not in self.projection().executions:
            raise MissionError(f"unknown execution {execution_id}")
        self.store.append(
            self.mission_id,
            "tool/requested",
            actor,
            {
                "call_id": call_id,
                "execution_id": execution_id,
                "tool": tool,
                "args_sha256": args_sha256,
            },
            idempotency_key=f"tool:requested:{call_id}",
        )
        return self.projection().tool_calls[call_id]

    def finish_tool(
        self,
        call_id: str,
        actor: str,
        *,
        success: bool,
        result_sha256: str | None = None,
        error_class: str | None = None,
    ) -> dict[str, Any]:
        current = self.projection().tool_calls.get(call_id)
        if current is None:
            raise MissionError(f"unknown tool call {call_id}")
        if current["status"] != "requested":
            return current
        event_type = "tool/completed" if success else "tool/failed"
        payload: dict[str, Any] = {"call_id": call_id}
        if result_sha256 is not None:
            payload["result_sha256"] = result_sha256
        if error_class is not None:
            payload["error_class"] = error_class
        self.store.append(
            self.mission_id,
            event_type,
            actor,
            payload,
            idempotency_key=f"tool:finish:{call_id}:{event_type}",
        )
        return self.projection().tool_calls[call_id]

    def create_task(self, task_id: str, subject: str, blocked_by: list[str], actor: str) -> dict[str, Any]:
        candidate = self.projection()
        if task_id in candidate.tasks:
            raise ConflictError(f"task {task_id} already exists")
        temp = dict(candidate.tasks)
        temp[task_id] = {"blocked_by": list(blocked_by)}
        _detect_cycle(temp)
        self.store.append_task_created(
            self.mission_id,
            task_id,
            actor,
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
        candidate_tasks = json.loads(json.dumps(p.tasks))
        candidate_tasks[task_id].update(changes)
        _detect_cycle(candidate_tasks)
        self.store.append_task_updated(
            self.mission_id,
            task_id,
            expected_revision,
            actor,
            changes,
            idempotency_key=f"task:update:{task_id}:{expected_revision + 1}:{_sha(changes)[:16]}",
        )
        return self.projection().tasks[task_id]

    def task_ready(self, task_id: str) -> bool:
        p = self.projection()
        task = p.tasks.get(task_id)
        if task is None:
            raise MissionError(f"unknown task {task_id}")
        return all(
            p.tasks.get(dep, {}).get("status") == "completed"
            for dep in task.get("blocked_by", [])
        )

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
        if not self.task_ready(task_id):
            raise ConflictError(f"task {task_id} dependencies are not complete")
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


    def create_session(
        self,
        session_id: str,
        agent_id: str,
        executor_type: str,
        actor: str,
        task_id: str | None = None,
    ) -> dict[str, Any]:
        payload = {
            "session_id": session_id,
            "agent_id": agent_id,
            "executor_type": executor_type,
            "task_id": task_id,
            "memory_policy": {
                "task": "session_checkpoint_hash_only",
                "institutional": "external_governed",
            },
        }
        self.store.append(
            self.mission_id,
            "session/created",
            actor,
            payload,
            idempotency_key=f"session:create:{session_id}",
        )
        return self.projection().sessions[session_id]

    def checkpoint_session(
        self,
        session_id: str,
        context_sha256: str,
        actor: str,
        *,
        task_id: str | None = None,
        executor_state_ref: str | None = None,
    ) -> dict[str, Any]:
        current = self.projection().sessions.get(session_id)
        if current is None:
            raise MissionError(f"unknown session {session_id}")
        checkpoint_seq = int(current.get("checkpoint_seq", 0)) + 1
        payload = {
            "session_id": session_id,
            "checkpoint_seq": checkpoint_seq,
            "context_sha256": context_sha256,
            "task_id": task_id if task_id is not None else current.get("task_id"),
            "executor_state_ref": executor_state_ref,
        }
        self.store.append(
            self.mission_id,
            "session/checkpointed",
            actor,
            payload,
            idempotency_key=f"session:checkpoint:{session_id}:{checkpoint_seq}",
        )
        return self.projection().sessions[session_id]

    def mark_session_message(self, session_id: str, message_id: str, actor: str) -> dict[str, Any]:
        if session_id not in self.projection().sessions:
            raise MissionError(f"unknown session {session_id}")
        self.store.append(
            self.mission_id,
            "session/message_seen",
            actor,
            {"session_id": session_id, "message_id": message_id},
            idempotency_key=f"session:message:{session_id}:{message_id}",
        )
        return self.projection().sessions[session_id]

    def interrupt_session(self, session_id: str, actor: str, reason: str = "interrupted") -> dict[str, Any]:
        current = self.projection().sessions.get(session_id)
        if current is None:
            raise MissionError(f"unknown session {session_id}")
        self.store.append(
            self.mission_id,
            "session/interrupted",
            actor,
            {"session_id": session_id, "reason": reason},
            idempotency_key=f"session:interrupt:{session_id}:{int(current.get('resume_count', 0))}",
        )
        return self.projection().sessions[session_id]

    def resume_session(
        self,
        session_id: str,
        actor: str,
        executor_state_ref: str | None = None,
    ) -> dict[str, Any]:
        current = self.projection().sessions.get(session_id)
        if current is None:
            raise MissionError(f"unknown session {session_id}")
        next_resume = int(current.get("resume_count", 0)) + 1
        self.store.append(
            self.mission_id,
            "session/resumed",
            actor,
            {"session_id": session_id, "executor_state_ref": executor_state_ref},
            idempotency_key=f"session:resume:{session_id}:{next_resume}",
        )
        return self.projection().sessions[session_id]
