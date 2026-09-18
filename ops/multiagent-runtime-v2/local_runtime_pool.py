from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import fcntl
except ImportError:  # pragma: no cover
    fcntl = None

from runtime import MissionRuntime
from runtime_metrics import policy as adaptive_policy


class RuntimePoolError(RuntimeError):
    pass


class RuntimePoolBackpressure(RuntimePoolError):
    pass


@dataclass
class PoolProjection:
    pool_id: str
    status: str
    target_slots: int
    active: dict[str, dict[str, Any]]
    last_event_seq: int


def replay_pool(events, pool_id: str) -> PoolProjection:
    state = PoolProjection(pool_id, "absent", 0, {}, 0)
    for event in events:
        if not event.event_type.startswith("pool/"):
            continue
        p = event.payload
        if p.get("pool_id") != pool_id:
            continue
        state.last_event_seq = event.seq
        if event.event_type == "pool/configured":
            slots = int(p["target_slots"])
            if slots < 1:
                raise RuntimePoolError("pool slots must be positive")
            state.status = "active"
            state.target_slots = slots
        elif event.event_type == "pool/slot_acquired":
            if state.status != "active":
                raise RuntimePoolError("pool is not configured")
            run_id = p["run_id"]
            if run_id in state.active:
                raise RuntimePoolError("run acquired twice")
            state.active[run_id] = {
                "run_id": run_id,
                "task_id": p["task_id"],
                "worker_id": p["worker_id"],
                "slot": int(p["slot"]),
            }
        elif event.event_type == "pool/slot_released":
            run_id = p["run_id"]
            if run_id not in state.active:
                raise RuntimePoolError("unknown run release")
            state.active.pop(run_id)
    return state


class LocalRuntimePool:
    def __init__(self, runtime: MissionRuntime, pool_id: str = "default", lock_path: str | Path | None = None):
        self.runtime = runtime
        self.store = runtime.store
        self.mission_id = runtime.mission_id
        self.pool_id = pool_id
        default = str(getattr(self.store, "db_path", "mcf")) + f".{pool_id}.pool.lock"
        self.lock_path = Path(lock_path or default)
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)

    def projection(self) -> PoolProjection:
        return replay_pool(self.store.events(self.mission_id), self.pool_id)

    def configure(self, target_slots: int, actor: str) -> PoolProjection:
        if target_slots < 1:
            raise ValueError("target_slots must be positive")
        current = self.projection()
        if target_slots < len(current.active):
            raise RuntimePoolError("cannot shrink pool below active slot count")
        version = current.last_event_seq + 1
        self.store.append(
            self.mission_id,
            "pool/configured",
            actor,
            {"pool_id": self.pool_id, "target_slots": int(target_slots)},
            idempotency_key=f"pool:configure:{self.pool_id}:{target_slots}:{version}",
        )
        return self.projection()

    def configure_from_metrics(self, metrics: dict[str, Any], actor: str, *, max_team_size: int = 8) -> dict[str, Any]:
        recommendation = adaptive_policy(metrics, max_team_size=max_team_size)
        projection = self.configure(int(recommendation["team_size"]), actor)
        return {"projection": projection, "policy": recommendation}

    def acquire(self, run_id: str, task_id: str, worker_id: str, actor: str) -> dict[str, Any]:
        with self.lock_path.open("a+") as fh:
            if fcntl is not None:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
            state = self.projection()
            if state.status != "active":
                raise RuntimePoolError("pool is not configured")
            if run_id in state.active:
                existing = state.active[run_id]
                if existing["task_id"] != task_id or existing["worker_id"] != worker_id:
                    raise RuntimePoolError("run_id reused with different task or worker")
                return dict(existing)
            if len(state.active) >= state.target_slots:
                raise RuntimePoolBackpressure("runtime pool has no free slots")
            used = {item["slot"] for item in state.active.values()}
            slot = next(index for index in range(state.target_slots) if index not in used)
            self.store.append(
                self.mission_id,
                "pool/slot_acquired",
                actor,
                {
                    "pool_id": self.pool_id,
                    "run_id": run_id,
                    "task_id": task_id,
                    "worker_id": worker_id,
                    "slot": slot,
                    "cognitive": False,
                },
                idempotency_key=f"pool:acquire:{self.pool_id}:{run_id}",
            )
            return dict(self.projection().active[run_id])

    def release(self, run_id: str, actor: str) -> PoolProjection:
        with self.lock_path.open("a+") as fh:
            if fcntl is not None:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
            state = self.projection()
            if run_id not in state.active:
                raise RuntimePoolError("run is not active")
            self.store.append(
                self.mission_id,
                "pool/slot_released",
                actor,
                {"pool_id": self.pool_id, "run_id": run_id},
                idempotency_key=f"pool:release:{self.pool_id}:{run_id}",
            )
            return self.projection()
