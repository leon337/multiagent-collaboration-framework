from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from graph_engine import GraphEngine, node_task_id
from local_runtime_pool import LocalRuntimePool, RuntimePoolBackpressure


class GraphSchedulerError(RuntimeError):
    pass


@dataclass(frozen=True)
class GraphAssignment:
    graph_id: str
    node_id: str
    task_id: str
    worker_id: str
    run_id: str
    slot: int


class GraphScheduler:
    """Deterministic dependency-aware scheduler over GraphEngine + RuntimePool."""

    def __init__(self, engine: GraphEngine, pool: LocalRuntimePool):
        self.engine = engine
        self.pool = pool

    def dispatch_ready(
        self,
        graph_id: str,
        workers: Iterable[str],
        *,
        ttl_seconds: int,
        actor: str = "graph-scheduler",
    ) -> list[GraphAssignment]:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")

        worker_ids = [str(worker) for worker in workers if str(worker)]
        if not worker_ids:
            return []

        ready = self.engine.ready_nodes(graph_id)
        assignments: list[GraphAssignment] = []

        for node_id, worker_id in zip(ready, worker_ids):
            run_id = f"{graph_id}:{node_id}:{worker_id}"
            try:
                slot = self.pool.acquire(
                    run_id,
                    node_task_id(graph_id, node_id),
                    worker_id,
                    actor,
                )
            except RuntimePoolBackpressure:
                break

            try:
                self.engine.lease_node(
                    graph_id,
                    node_id,
                    worker_id,
                    ttl_seconds,
                    actor,
                )
            except Exception:
                self.pool.release(run_id, actor)
                raise

            assignments.append(
                GraphAssignment(
                    graph_id=graph_id,
                    node_id=node_id,
                    task_id=node_task_id(graph_id, node_id),
                    worker_id=worker_id,
                    run_id=run_id,
                    slot=int(slot["slot"]),
                )
            )
        return assignments

    def release_assignment(self, assignment: GraphAssignment, actor: str = "graph-scheduler") -> None:
        self.pool.release(assignment.run_id, actor)
