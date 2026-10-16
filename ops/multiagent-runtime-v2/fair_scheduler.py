from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import fcntl
except ImportError:  # pragma: no cover
    fcntl = None

from runtime import ConflictError


class SchedulerBackpressure(RuntimeError):
    pass


@dataclass(frozen=True)
class Candidate:
    task_id: str
    revision: int
    priority: int
    lane: str
    age_seconds: float
    effective_score: float


class FairScheduler:
    """Fair bounded scheduler with process-safe one-host backpressure."""

    def __init__(
        self,
        runtime,
        *,
        max_active: int = 4,
        per_lane_active: int = 2,
        aging_seconds: float = 30.0,
        preemption_delta: int = 50,
        lock_path: str | Path | None = None,
    ):
        if max_active < 1 or per_lane_active < 1 or aging_seconds <= 0:
            raise ValueError("invalid scheduler limits")
        self.runtime = runtime
        self.max_active = int(max_active)
        self.per_lane_active = int(per_lane_active)
        self.aging_seconds = float(aging_seconds)
        self.preemption_delta = int(preemption_delta)
        default_lock = str(getattr(runtime.store, "db_path", "mcf")) + ".scheduler.lock"
        self.lock_path = Path(lock_path or default_lock)
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)

    def _created_at(self) -> dict[str, float]:
        result = {}
        for event in self.runtime.store.events(self.runtime.mission_id):
            if event.event_type == "task/created":
                result[event.payload["task_id"]] = event.timestamp
        return result

    def active_count(self) -> int:
        return sum(
            1
            for task in self.runtime.projection().tasks.values()
            if task.get("status") == "leased"
        )

    def _lane_active(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for task in self.runtime.projection().tasks.values():
            if task.get("status") != "leased":
                continue
            lane = str(task.get("lane", "default"))
            counts[lane] = counts.get(lane, 0) + 1
        return counts

    def candidates(self, *, now: float | None = None) -> list[Candidate]:
        now = float(time.time() if now is None else now)
        projection = self.runtime.projection()
        created = self._created_at()
        lane_active = self._lane_active()
        rows: list[Candidate] = []

        for task_id, task in projection.tasks.items():
            if task.get("status") not in {"pending", "blocked"}:
                continue
            if not self.runtime.task_ready(task_id):
                continue
            lane = str(task.get("lane", "default"))
            if lane_active.get(lane, 0) >= self.per_lane_active:
                continue
            created_at = float(task.get("enqueued_at", created.get(task_id, now)))
            age = max(0.0, now - created_at)
            priority = int(task.get("priority", 0))
            aging_bonus = min(100.0, age / self.aging_seconds)
            lane_penalty = lane_active.get(lane, 0) * 10.0
            rows.append(
                Candidate(
                    task_id,
                    int(task["revision"]),
                    priority,
                    lane,
                    age,
                    priority + aging_bonus - lane_penalty,
                )
            )

        rows.sort(key=lambda c: (-c.effective_score, c.lane, c.task_id))
        return rows

    def lease_next(
        self,
        worker_id: str,
        ttl_seconds: int,
        *,
        actor: str = "scheduler",
        now: float | None = None,
    ):
        with self.lock_path.open("a+") as fh:
            if fcntl is not None:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX)

            if self.active_count() >= self.max_active:
                raise SchedulerBackpressure("max active task limit reached")

            for candidate in self.candidates(now=now):
                try:
                    return self.runtime.lease_task(
                        candidate.task_id,
                        candidate.revision,
                        worker_id,
                        ttl_seconds,
                        actor,
                    )
                except ConflictError:
                    continue
            return None

    def preemption_recommendation(self, incoming_task_id: str) -> dict[str, Any] | None:
        projection = self.runtime.projection()
        incoming = projection.tasks[incoming_task_id]
        incoming_priority = int(incoming.get("priority", 0))
        candidates = []

        for task_id, task in projection.tasks.items():
            if task.get("status") != "leased" or not task.get("preemptible", False):
                continue
            priority = int(task.get("priority", 0))
            if incoming_priority - priority >= self.preemption_delta:
                candidates.append((priority, task_id, task))

        if not candidates:
            return None

        priority, task_id, task = sorted(candidates, key=lambda x: (x[0], x[1]))[0]
        return {
            "schema": "mcf_preemption_recommendation/v1",
            "incoming_task_id": incoming_task_id,
            "candidate_task_id": task_id,
            "incoming_priority": incoming_priority,
            "candidate_priority": priority,
            "action": "INTERRUPT_THEN_RECOVERY_GATE",
            "automatic_preemption": False,
            "owner_id": task.get("owner_id"),
        }
