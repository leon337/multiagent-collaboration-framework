from __future__ import annotations

import json
import math
import statistics
from pathlib import Path
from typing import Any

from runtime import MissionStore

SCHEMA = "mcf_runtime_metrics/v1"


def _percentile(values, q):
    if not values:
        return 0.0
    xs = sorted(float(x) for x in values)
    if len(xs) == 1:
        return xs[0]
    pos = (len(xs) - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return xs[lo] if lo == hi else xs[lo] + (xs[hi] - xs[lo]) * (pos - lo)


def _resource_pressure(root: str | Path = "/sys/fs/cgroup") -> dict[str, Any]:
    root = Path(root)
    result = {
        "complete": False,
        "cpu_throttled_ratio": 0.0,
        "memory_ratio": 0.0,
        "memory_current_bytes": None,
        "memory_max_bytes": None,
    }
    try:
        memory_current = int((root / "memory.current").read_text(encoding="utf-8").strip())
        memory_max_raw = (root / "memory.max").read_text(encoding="utf-8").strip()
        if memory_max_raw == "max":
            return result
        memory_max = int(memory_max_raw)
        cpu_stat = {}
        for line in (root / "cpu.stat").read_text(encoding="utf-8").splitlines():
            key, value = line.split(maxsplit=1)
            cpu_stat[key] = int(value)
        if memory_max <= 0 or "usage_usec" not in cpu_stat or "throttled_usec" not in cpu_stat:
            return result
        usage = max(1, cpu_stat["usage_usec"])
        result.update(
            {
                "complete": True,
                "cpu_throttled_ratio": min(1.0, cpu_stat["throttled_usec"] / usage),
                "memory_ratio": min(1.0, memory_current / memory_max),
                "memory_current_bytes": memory_current,
                "memory_max_bytes": memory_max,
            }
        )
    except (OSError, ValueError):
        return result
    return result


def _journal_metrics(db_path, mission_id):
    if not db_path or not mission_id or not Path(db_path).exists():
        return {
            "queue_time_ms": {"observed": 0, "median": 0.0, "p95": 0.0},
            "tool_time_ms": {"calls": 0, "sum": 0.0, "p95": 0.0},
            "retries": 0,
        }
    store = MissionStore(db_path)
    events = store.events(mission_id)
    store.close()
    created = {}
    first = {}
    leases = {}
    tool_start = {}
    tool = []
    for event in events:
        payload = event.payload
        if event.event_type == "task/created":
            created[payload["task_id"]] = event.timestamp
        elif event.event_type == "task/updated" and payload.get("status") == "leased":
            leases[payload["task_id"]] = leases.get(payload["task_id"], 0) + 1
            first.setdefault(payload["task_id"], event.timestamp)
        elif event.event_type == "tool/requested":
            tool_start[payload["call_id"]] = event.timestamp
        elif event.event_type in {"tool/completed", "tool/failed"} and payload.get("call_id") in tool_start:
            tool.append(max(0, (event.timestamp - tool_start[payload["call_id"]]) * 1000))
    queue = [max(0, (first[task] - created[task]) * 1000) for task in first if task in created]
    return {
        "queue_time_ms": {
            "observed": len(queue),
            "median": statistics.median(queue) if queue else 0.0,
            "p95": _percentile(queue, 0.95),
        },
        "tool_time_ms": {"calls": len(tool), "sum": sum(tool), "p95": _percentile(tool, 0.95)},
        "retries": sum(max(0, count - 1) for count in leases.values()),
    }


def collect(team_dir, *, mission_db=None, mission_id=None):
    team = Path(team_dir)
    receipts = []
    for path in sorted((team / "receipts").glob("*.json")):
        try:
            receipt = json.loads(path.read_text())
        except Exception:
            continue
        if receipt.get("worker") == "audit":
            continue
        receipts.append(receipt)

    evidence = []
    for path in sorted((team / "evidence").glob("*.json")):
        if path.name == "audit.json":
            continue
        try:
            item = json.loads(path.read_text())
            if item.get("worker"):
                evidence.append(item)
        except Exception:
            pass

    durations = [
        float(receipt.get("duration_ms", 0))
        for receipt in receipts
        if receipt.get("duration_ms") is not None
    ]
    success = sum(receipt.get("status") == "PASS" for receipt in receipts)
    points = []
    for item in evidence:
        if item.get("started") is not None and item.get("ended") is not None:
            points.extend([(float(item["started"]), 1), (float(item["ended"]), -1)])
    active = peak = 0
    for _, delta in sorted(points, key=lambda item: (item[0], -item[1])):
        active += delta
        peak = max(peak, active)

    journal = _journal_metrics(mission_db, mission_id)
    return {
        "schema": SCHEMA,
        "worker_count": len(receipts),
        "success_count": success,
        "failure_count": len(receipts) - success,
        "success_rate": success / len(receipts) if receipts else 0.0,
        "duration_ms": {
            "median": statistics.median(durations) if durations else 0.0,
            "p95": _percentile(durations, 0.95),
            "max": max(durations) if durations else 0.0,
            "sum": sum(durations),
        },
        "peak_concurrency_observed": peak,
        "model_context_usage": None,
        "resource_pressure": _resource_pressure(),
        **journal,
    }


def policy(metrics, max_team_size=8):
    max_team_size = max(1, int(max_team_size))
    success_rate = float(metrics.get("success_rate") or 0)
    p95 = float((metrics.get("duration_ms") or {}).get("p95") or 0)

    resources = metrics.get("resource_pressure") or {}
    cpu = float(resources.get("cpu_throttled_ratio") or 0)
    memory = float(resources.get("memory_ratio") or 0)
    resources_complete = bool(resources.get("complete"))

    queue_p95 = float((metrics.get("queue_time_ms") or {}).get("p95") or 0)
    retries = int(metrics.get("retries") or 0)
    duration_sum = float((metrics.get("duration_ms") or {}).get("sum") or 0)
    tool = metrics.get("tool_time_ms") or {}
    tool_calls = int(tool.get("calls") or 0)
    tool_sum = float(tool.get("sum") or 0)
    tool_ratio = min(1.0, tool_sum / duration_sum) if duration_sum > 0 else 0.0

    if success_rate < 0.8:
        team = 1
        reason = "critical_failure_pressure"
    elif resources_complete and (memory >= 0.90 or cpu >= 0.35):
        team = 1
        reason = "critical_resource_pressure"
    elif (resources_complete and (memory >= 0.75 or cpu >= 0.15)) or queue_p95 >= 500 or retries > 0:
        team = 2
        reason = "moderate_resource_or_journal_pressure"
    elif (
        resources_complete
        and success_rate == 1
        and tool_calls > 0
        and tool_ratio >= 0.50
        and memory < 0.70
        and cpu < 0.10
        and queue_p95 < 250
        and retries == 0
    ):
        team = 8
        reason = "healthy_io_bound_expand_to_eight"
    else:
        team = 4
        reason = "balanced_default_four"

    team = min(max_team_size, team)
    return {
        "schema": "mcf_runtime_policy/v1",
        "team_size": team,
        "timeout_ms": max(5000, int(max(p95 * 4, 1000))),
        "fanout_strategy": "parallel_independent_then_audit_fanin",
        "model_policy": "BLOCKED_G08_NO_BUBBLE_NATIVE_COGNITIVE_BACKEND",
        "reason": reason,
    }
