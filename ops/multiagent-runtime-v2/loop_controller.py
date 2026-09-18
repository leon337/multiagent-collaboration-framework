from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from runtime import MissionRuntime


class LoopError(RuntimeError):
    pass


class LoopTransitionError(LoopError):
    pass


class LoopLimitExceeded(LoopError):
    pass


@dataclass(frozen=True)
class LoopPolicy:
    max_iterations: int
    timeout_seconds: float
    budget_units: int | None = None

    def validate(self) -> "LoopPolicy":
        if self.max_iterations < 1:
            raise ValueError("max_iterations must be positive")
        if self.timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be positive")
        if self.budget_units is not None and self.budget_units < 1:
            raise ValueError("budget_units must be positive when set")
        return self


@dataclass
class LoopProjection:
    loop_id: str
    status: str
    phase: str
    iteration: int
    max_iterations: int
    timeout_seconds: float
    budget_units: int | None
    used_units: int
    started_at: float | None
    last_event_seq: int
    evidence_refs: list[str]
    failure_reason: str | None = None


def replay_loop(events, loop_id: str) -> LoopProjection:
    state = LoopProjection(
        loop_id=loop_id,
        status="absent",
        phase="absent",
        iteration=0,
        max_iterations=0,
        timeout_seconds=0.0,
        budget_units=None,
        used_units=0,
        started_at=None,
        last_event_seq=0,
        evidence_refs=[],
    )

    for event in events:
        if not event.event_type.startswith("loop/"):
            continue
        p = event.payload
        if p.get("loop_id") != loop_id:
            continue
        state.last_event_seq = event.seq

        if event.event_type == "loop/created":
            if state.status != "absent":
                raise LoopTransitionError("loop created twice")
            state.status = "active"
            state.phase = "ready"
            state.max_iterations = int(p["max_iterations"])
            state.timeout_seconds = float(p["timeout_seconds"])
            state.budget_units = p.get("budget_units")
            state.started_at = event.timestamp
        elif event.event_type == "loop/iteration_started":
            if state.status != "active" or state.phase not in {"ready", "repaired"}:
                raise LoopTransitionError("invalid iteration start")
            expected = state.iteration + 1
            if int(p["iteration"]) != expected:
                raise LoopTransitionError("non-contiguous loop iteration")
            state.iteration = expected
            state.used_units += int(p.get("cost_units", 1))
            state.phase = "executing"
        elif event.event_type == "loop/validation_failed":
            if state.status != "active" or state.phase != "executing":
                raise LoopTransitionError("invalid validation failure")
            state.phase = "needs_repair"
            state.evidence_refs.extend(p.get("evidence_refs", []))
        elif event.event_type == "loop/repair_completed":
            if state.status != "active" or state.phase != "needs_repair":
                raise LoopTransitionError("invalid repair completion")
            state.phase = "repaired"
            state.evidence_refs.extend(p.get("evidence_refs", []))
        elif event.event_type == "loop/completed":
            if state.status != "active" or state.phase != "executing":
                raise LoopTransitionError("invalid loop completion")
            if not p.get("evidence_refs"):
                raise LoopTransitionError("loop PASS requires evidence")
            state.status = "completed"
            state.phase = "done"
            state.evidence_refs.extend(p.get("evidence_refs", []))
        elif event.event_type == "loop/exhausted":
            if state.status != "active":
                raise LoopTransitionError("invalid loop exhaustion")
            state.status = "failed"
            state.phase = "exhausted"
            state.failure_reason = p.get("reason")

    return state


class BoundedLoopController:
    def __init__(self, runtime: MissionRuntime):
        self.runtime = runtime
        self.store = runtime.store
        self.mission_id = runtime.mission_id

    def projection(self, loop_id: str) -> LoopProjection:
        return replay_loop(self.store.events(self.mission_id), loop_id)

    def create(self, loop_id: str, policy: LoopPolicy, actor: str) -> LoopProjection:
        policy.validate()
        self.store.append(
            self.mission_id,
            "loop/created",
            actor,
            {
                "loop_id": loop_id,
                "max_iterations": policy.max_iterations,
                "timeout_seconds": policy.timeout_seconds,
                "budget_units": policy.budget_units,
            },
            idempotency_key=f"loop:create:{loop_id}",
        )
        return self.projection(loop_id)

    def _enforce_limits(self, state: LoopProjection, actor: str, *, now: float | None = None, next_cost: int = 0) -> None:
        now = time.time() if now is None else float(now)
        if state.status != "active":
            raise LoopTransitionError("loop is not active")
        if state.started_at is None:
            raise LoopTransitionError("loop has no start timestamp")
        if now - state.started_at >= state.timeout_seconds:
            self._exhaust(state.loop_id, actor, "timeout")
            raise LoopLimitExceeded("loop timeout exceeded")
        if state.iteration >= state.max_iterations and state.phase in {"ready", "repaired"}:
            self._exhaust(state.loop_id, actor, "max_iterations")
            raise LoopLimitExceeded("max iterations exceeded")
        if state.budget_units is not None and state.used_units + next_cost > state.budget_units:
            self._exhaust(state.loop_id, actor, "budget")
            raise LoopLimitExceeded("loop budget exceeded")

    def begin_iteration(self, loop_id: str, actor: str, *, cost_units: int = 1, now: float | None = None) -> LoopProjection:
        if cost_units < 1:
            raise ValueError("cost_units must be positive")
        state = self.projection(loop_id)
        self._enforce_limits(state, actor, now=now, next_cost=cost_units)
        if state.phase not in {"ready", "repaired"}:
            raise LoopTransitionError("loop is not ready for a new iteration")
        iteration = state.iteration + 1
        self.store.append(
            self.mission_id,
            "loop/iteration_started",
            actor,
            {"loop_id": loop_id, "iteration": iteration, "cost_units": cost_units},
            idempotency_key=f"loop:iteration:{loop_id}:{iteration}",
        )
        return self.projection(loop_id)

    def validation_failed(self, loop_id: str, actor: str, evidence_refs: list[str], *, now: float | None = None) -> LoopProjection:
        state = self.projection(loop_id)
        self._enforce_limits(state, actor, now=now)
        if state.phase != "executing":
            raise LoopTransitionError("validation failure requires executing phase")
        self.store.append(
            self.mission_id,
            "loop/validation_failed",
            actor,
            {"loop_id": loop_id, "iteration": state.iteration, "evidence_refs": list(evidence_refs)},
            idempotency_key=f"loop:validation:fail:{loop_id}:{state.iteration}",
        )
        return self.projection(loop_id)

    def repair_completed(self, loop_id: str, actor: str, evidence_refs: list[str], *, now: float | None = None) -> LoopProjection:
        state = self.projection(loop_id)
        self._enforce_limits(state, actor, now=now)
        if state.phase != "needs_repair":
            raise LoopTransitionError("repair requires failed validation")
        self.store.append(
            self.mission_id,
            "loop/repair_completed",
            actor,
            {"loop_id": loop_id, "iteration": state.iteration, "evidence_refs": list(evidence_refs)},
            idempotency_key=f"loop:repair:{loop_id}:{state.iteration}",
        )
        return self.projection(loop_id)

    def validation_passed(self, loop_id: str, actor: str, evidence_refs: list[str], *, now: float | None = None) -> LoopProjection:
        if not evidence_refs:
            raise LoopTransitionError("PASS requires evidence")
        state = self.projection(loop_id)
        self._enforce_limits(state, actor, now=now)
        if state.phase != "executing":
            raise LoopTransitionError("validation pass requires executing phase")
        self.store.append(
            self.mission_id,
            "loop/completed",
            actor,
            {"loop_id": loop_id, "iteration": state.iteration, "evidence_refs": list(evidence_refs)},
            idempotency_key=f"loop:complete:{loop_id}",
        )
        return self.projection(loop_id)

    def _exhaust(self, loop_id: str, actor: str, reason: str) -> None:
        state = self.projection(loop_id)
        if state.status != "active":
            return
        self.store.append(
            self.mission_id,
            "loop/exhausted",
            actor,
            {"loop_id": loop_id, "iteration": state.iteration, "reason": reason},
            idempotency_key=f"loop:exhaust:{loop_id}:{reason}:{state.iteration}",
        )
