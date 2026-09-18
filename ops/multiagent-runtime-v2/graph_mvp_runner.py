from __future__ import annotations

import json
import multiprocessing as mp
import os
import time
from pathlib import Path
from typing import Any

from graph_engine import GraphDefinition, GraphEngine, GraphNode, make_graph_receipt
from local_runtime_pool import LocalRuntimePool
from loop_controller import BoundedLoopController, LoopPolicy
from runtime import MissionRuntime, MissionStore


def _cell_worker(node_id: str, root: str, barrier, fail_node: str | None) -> None:
    barrier.wait(timeout=10)
    started = time.time()
    time.sleep(0.12)
    ended = time.time()
    status = "FAIL" if fail_node == node_id else "PASS"
    Path(root, f"{node_id}.json").write_text(
        json.dumps(
            {
                "node_id": node_id,
                "pid": os.getpid(),
                "started": started,
                "ended": ended,
                "status": status,
                "artifact": f"artifact://{node_id}",
            },
            sort_keys=True,
        ),
        encoding="utf-8",
    )


def _peak_concurrency(rows: list[dict[str, Any]]) -> int:
    points = []
    for row in rows:
        points.append((float(row["started"]), 1))
        points.append((float(row["ended"]), -1))
    active = peak = 0
    for _, delta in sorted(points, key=lambda item: (item[0], -item[1])):
        active += delta
        peak = max(peak, active)
    return peak


def fanout_definition() -> GraphDefinition:
    return GraphDefinition(
        "mvp",
        (
            GraphNode("start", "Start"),
            GraphNode("test_a", "Test A", ("start",)),
            GraphNode("test_b", "Test B", ("start",)),
            GraphNode("test_c", "Test C", ("start",)),
            GraphNode("audit", "Audit", ("test_a", "test_b", "test_c")),
            GraphNode("end", "End", ("audit",)),
        ),
    )


def _pass_receipt(node_id: str, actor_id: str) -> dict[str, Any]:
    return make_graph_receipt(
        graph_id="mvp",
        node_id=node_id,
        actor_id=actor_id,
        status="PASS",
        evidence_refs=[f"artifact://{node_id}"],
        result={"node": node_id, "ok": True},
    )


def run_fanout_demo(root: str | Path, *, fail_node: str | None = None) -> dict[str, Any]:
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    evidence_dir = root / "cells"
    evidence_dir.mkdir(parents=True, exist_ok=True)

    store = MissionStore(root / "mission.db")
    runtime = MissionRuntime(store, "MVP")
    engine = GraphEngine(runtime)
    pool = LocalRuntimePool(runtime, "graph-pool", root / "pool.lock")

    engine.create_graph(fanout_definition(), "mestre")
    engine.start_graph("mvp", "mestre")
    pool.configure(3, "mestre")

    engine.lease_node("mvp", "start", "start-worker", 30, "mestre")
    engine.complete_node("mvp", "start", _pass_receipt("start", "start-worker"), "start-worker")

    ready_before = engine.ready_nodes("mvp")
    expected = ["test_a", "test_b", "test_c"]
    if ready_before != expected:
        raise RuntimeError(f"unexpected fanout readiness: {ready_before}")

    for node_id in expected:
        engine.lease_node("mvp", node_id, f"worker-{node_id}", 30, "mestre")
        pool.acquire(f"run-{node_id}", node_id, f"worker-{node_id}", "mestre")

    ctx = mp.get_context("spawn")
    barrier = ctx.Barrier(len(expected) + 1)
    processes = [
        ctx.Process(
            target=_cell_worker,
            args=(node_id, str(evidence_dir), barrier, fail_node),
        )
        for node_id in expected
    ]
    for process in processes:
        process.start()
    barrier.wait(timeout=10)
    for process in processes:
        process.join(10)
    if any(process.exitcode != 0 for process in processes):
        raise RuntimeError("runtime cell process failed")

    rows = [
        json.loads((evidence_dir / f"{node_id}.json").read_text(encoding="utf-8"))
        for node_id in expected
    ]

    for row in rows:
        node_id = row["node_id"]
        if row["status"] == "PASS":
            engine.complete_node("mvp", node_id, _pass_receipt(node_id, f"worker-{node_id}"), f"worker-{node_id}")
        else:
            engine.fail_node("mvp", node_id, f"worker-{node_id}", "injected_failure")
        pool.release(f"run-{node_id}", "mestre")

    graph_after_fanout = engine.maybe_complete_graph("mvp", "mestre")
    audit_ready = "audit" in engine.ready_nodes("mvp")

    if fail_node is None:
        if not audit_ready:
            raise RuntimeError("audit did not become ready after successful fanout")
        engine.lease_node("mvp", "audit", "auditor", 30, "mestre")
        engine.complete_node("mvp", "audit", _pass_receipt("audit", "auditor"), "auditor")
        engine.lease_node("mvp", "end", "end-worker", 30, "mestre")
        engine.complete_node("mvp", "end", _pass_receipt("end", "end-worker"), "end-worker")
        final = engine.maybe_complete_graph("mvp", "mestre")
    else:
        final = graph_after_fanout

    events = store.events("MVP")
    store.close()

    return {
        "schema": "mcf_graph_mvp_evidence/v1",
        "graph_status": final.status,
        "fanout_nodes": expected,
        "ready_before_fanout": ready_before,
        "audit_ready_after_fanout": audit_ready,
        "cell_pass_count": sum(row["status"] == "PASS" for row in rows),
        "cell_fail_count": sum(row["status"] == "FAIL" for row in rows),
        "unique_pids": len({row["pid"] for row in rows}),
        "peak_concurrency_observed": _peak_concurrency(rows),
        "pool_active_after_join": 0,
        "journal_event_count": len(events),
    }


def run_loop_demo(root: str | Path, outcomes: list[bool]) -> dict[str, Any]:
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    store = MissionStore(root / "loop.db")
    runtime = MissionRuntime(store, "LOOP")
    controller = BoundedLoopController(runtime)
    policy = LoopPolicy(max_iterations=3, timeout_seconds=60, budget_units=3)
    state = controller.create("repair-loop", policy, "mestre")
    base = state.started_at or time.time()

    for index, passed in enumerate(outcomes, 1):
        state = controller.begin_iteration(
            "repair-loop",
            "worker",
            cost_units=1,
            now=base + index,
        )
        if passed:
            state = controller.validation_passed(
                "repair-loop",
                "validator",
                [f"evidence://pass-{index}"],
                now=base + index + 0.1,
            )
            break
        state = controller.validation_failed(
            "repair-loop",
            "validator",
            [f"evidence://fail-{index}"],
            now=base + index + 0.1,
        )
        if state.status == "failed":
            break
        state = controller.repair_completed(
            "repair-loop",
            "repair",
            [f"evidence://repair-{index}"],
            now=base + index + 0.2,
        )

    final = controller.projection("repair-loop")
    event_count = len(store.events("LOOP"))
    store.close()
    return {
        "schema": "mcf_loop_mvp_evidence/v1",
        "status": final.status,
        "iteration": final.iteration,
        "used_units": final.used_units,
        "failure_reason": final.failure_reason,
        "journal_event_count": event_count,
    }
