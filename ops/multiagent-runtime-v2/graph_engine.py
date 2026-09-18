from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any, Iterable

from runtime import ConflictError, MissionError, MissionRuntime


GRAPH_SCHEMA = "mcf_graph/v1"
GRAPH_RECEIPT_SCHEMA = "mcf_graph_node_receipt/v1"


class GraphError(RuntimeError):
    pass


class GraphDefinitionError(GraphError):
    pass


class GraphTransitionError(GraphError):
    pass


class GraphReceiptError(GraphError):
    pass


@dataclass(frozen=True)
class GraphNode:
    node_id: str
    subject: str
    blocked_by: tuple[str, ...] = ()
    kind: str = "task"


@dataclass(frozen=True)
class GraphDefinition:
    graph_id: str
    nodes: tuple[GraphNode, ...]
    schema: str = GRAPH_SCHEMA

    def validate(self) -> "GraphDefinition":
        if self.schema != GRAPH_SCHEMA:
            raise GraphDefinitionError(f"unsupported graph schema {self.schema}")
        if not self.graph_id:
            raise GraphDefinitionError("graph_id is required")
        if not self.nodes:
            raise GraphDefinitionError("graph requires at least one node")

        ids = [node.node_id for node in self.nodes]
        if any(not node_id for node_id in ids):
            raise GraphDefinitionError("node_id is required")
        if len(ids) != len(set(ids)):
            raise GraphDefinitionError("duplicate node_id")
        known = set(ids)
        for node in self.nodes:
            missing = set(node.blocked_by) - known
            if missing:
                raise GraphDefinitionError(
                    f"node {node.node_id} references unknown dependencies: {sorted(missing)}"
                )
            if node.node_id in node.blocked_by:
                raise GraphDefinitionError(f"node {node.node_id} depends on itself")

        visiting: set[str] = set()
        visited: set[str] = set()
        deps = {node.node_id: tuple(node.blocked_by) for node in self.nodes}

        def visit(node_id: str) -> None:
            if node_id in visiting:
                raise GraphDefinitionError(f"cycle detected at {node_id}")
            if node_id in visited:
                return
            visiting.add(node_id)
            for dep in deps[node_id]:
                visit(dep)
            visiting.remove(node_id)
            visited.add(node_id)

        for node_id in ids:
            visit(node_id)
        return self

    def node_map(self) -> dict[str, GraphNode]:
        return {node.node_id: node for node in self.nodes}


@dataclass
class GraphProjection:
    graph_id: str
    status: str
    nodes: dict[str, dict[str, Any]]
    last_event_seq: int


def _canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _sha(value: Any) -> str:
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def node_task_id(graph_id: str, node_id: str) -> str:
    return f"graph:{graph_id}:{node_id}"


def make_graph_receipt(
    *,
    graph_id: str,
    node_id: str,
    actor_id: str,
    status: str,
    evidence_refs: Iterable[str],
    result: Any | None = None,
) -> dict[str, Any]:
    status = status.upper()
    refs = [str(ref) for ref in evidence_refs if str(ref)]
    if status != "PASS":
        raise GraphReceiptError("node completion requires PASS receipt")
    if not refs:
        raise GraphReceiptError("PASS graph receipt requires evidence")
    material = {
        "schema": GRAPH_RECEIPT_SCHEMA,
        "graph_id": graph_id,
        "node_id": node_id,
        "actor_id": actor_id,
        "status": status,
        "evidence_refs": refs,
        "result_sha256": None if result is None else _sha(result),
    }
    return {**material, "receipt_sha256": _sha(material)}


def validate_graph_receipt(receipt: dict[str, Any], graph_id: str, node_id: str) -> None:
    material = dict(receipt)
    claimed = material.pop("receipt_sha256", None)
    if receipt.get("schema") != GRAPH_RECEIPT_SCHEMA:
        raise GraphReceiptError("unsupported graph receipt schema")
    if receipt.get("graph_id") != graph_id or receipt.get("node_id") != node_id:
        raise GraphReceiptError("receipt graph/node mismatch")
    if receipt.get("status") != "PASS" or not receipt.get("evidence_refs"):
        raise GraphReceiptError("node PASS requires evidence")
    if claimed != _sha(material):
        raise GraphReceiptError("graph receipt digest mismatch")


def replay_graph(events, graph_id: str) -> GraphProjection:
    status = "absent"
    nodes: dict[str, dict[str, Any]] = {}
    last_seq = 0

    for event in events:
        if not event.event_type.startswith("graph/"):
            continue
        payload = event.payload
        if payload.get("graph_id") != graph_id:
            continue
        last_seq = event.seq

        if event.event_type == "graph/created":
            if status != "absent":
                raise GraphTransitionError(f"graph {graph_id} created twice")
            status = "created"
            for raw in payload["nodes"]:
                nodes[raw["node_id"]] = {
                    "node_id": raw["node_id"],
                    "subject": raw["subject"],
                    "blocked_by": list(raw.get("blocked_by", [])),
                    "kind": raw.get("kind", "task"),
                    "status": "pending",
                    "receipt_sha256": None,
                }
        elif event.event_type == "graph/started":
            if status != "created":
                raise GraphTransitionError("graph can start only from created")
            status = "running"
        elif event.event_type == "graph/node_started":
            if status != "running":
                raise GraphTransitionError("node can start only while graph is running")
            node = nodes.get(payload["node_id"])
            if node is None or node["status"] != "pending":
                raise GraphTransitionError("invalid node start")
            node["status"] = "running"
            node["owner_id"] = payload["owner_id"]
            node["lease_id"] = payload["lease_id"]
        elif event.event_type == "graph/node_completed":
            node = nodes.get(payload["node_id"])
            if node is None or node["status"] != "running":
                raise GraphTransitionError("invalid node completion")
            node["status"] = "completed"
            node["receipt_sha256"] = payload["receipt_sha256"]
        elif event.event_type == "graph/node_failed":
            node = nodes.get(payload["node_id"])
            if node is None or node["status"] != "running":
                raise GraphTransitionError("invalid node failure")
            node["status"] = "failed"
            node["error"] = payload.get("error")
        elif event.event_type == "graph/completed":
            if status != "running":
                raise GraphTransitionError("graph can complete only from running")
            if any(node["status"] != "completed" for node in nodes.values()):
                raise GraphTransitionError("graph completed before all nodes")
            status = "completed"
        elif event.event_type == "graph/failed":
            if status not in {"created", "running"}:
                raise GraphTransitionError("invalid graph failure")
            status = "failed"

    return GraphProjection(graph_id, status, nodes, last_seq)


class GraphEngine:
    def __init__(self, runtime: MissionRuntime):
        self.runtime = runtime
        self.store = runtime.store
        self.mission_id = runtime.mission_id

    def projection(self, graph_id: str) -> GraphProjection:
        return replay_graph(self.store.events(self.mission_id), graph_id)

    def create_graph(self, definition: GraphDefinition, actor: str) -> GraphProjection:
        definition.validate()
        payload = {
            "graph_id": definition.graph_id,
            "schema": definition.schema,
            "nodes": [
                {
                    "node_id": node.node_id,
                    "subject": node.subject,
                    "blocked_by": list(node.blocked_by),
                    "kind": node.kind,
                }
                for node in definition.nodes
            ],
        }
        self.store.append(
            self.mission_id,
            "graph/created",
            actor,
            payload,
            idempotency_key=f"graph:create:{definition.graph_id}",
        )

        for node in definition.nodes:
            task_id = node_task_id(definition.graph_id, node.node_id)
            blocked = [node_task_id(definition.graph_id, dep) for dep in node.blocked_by]
            self.runtime.create_task(task_id, node.subject, blocked, actor)
        return self.projection(definition.graph_id)

    def start_graph(self, graph_id: str, actor: str) -> GraphProjection:
        projection = self.projection(graph_id)
        if projection.status != "created":
            raise GraphTransitionError("graph is not ready to start")
        self.store.append(
            self.mission_id,
            "graph/started",
            actor,
            {"graph_id": graph_id},
            idempotency_key=f"graph:start:{graph_id}",
        )
        return self.projection(graph_id)

    def ready_nodes(self, graph_id: str) -> list[str]:
        graph = self.projection(graph_id)
        if graph.status != "running":
            return []
        tasks = self.runtime.projection().tasks
        ready: list[str] = []
        for node_id, node in graph.nodes.items():
            if node["status"] != "pending":
                continue
            task = tasks[node_task_id(graph_id, node_id)]
            if task["status"] not in {"pending", "blocked"}:
                continue
            deps_ok = all(
                tasks[node_task_id(graph_id, dep)]["status"] == "completed"
                for dep in node["blocked_by"]
            )
            if deps_ok:
                ready.append(node_id)
        return sorted(ready)

    def lease_node(
        self,
        graph_id: str,
        node_id: str,
        worker_id: str,
        ttl_seconds: int,
        actor: str,
    ) -> dict[str, Any]:
        if node_id not in self.ready_nodes(graph_id):
            raise ConflictError(f"node {node_id} is not READY")
        task_id = node_task_id(graph_id, node_id)
        task = self.runtime.projection().tasks[task_id]
        leased = self.runtime.lease_task(
            task_id,
            task["revision"],
            worker_id,
            ttl_seconds,
            actor,
        )
        self.store.append(
            self.mission_id,
            "graph/node_started",
            actor,
            {
                "graph_id": graph_id,
                "node_id": node_id,
                "owner_id": worker_id,
                "lease_id": leased["lease_id"],
            },
            idempotency_key=f"graph:node:start:{graph_id}:{node_id}:{leased['lease_id']}",
        )
        return leased

    def complete_node(
        self,
        graph_id: str,
        node_id: str,
        receipt: dict[str, Any],
        actor: str,
    ) -> GraphProjection:
        validate_graph_receipt(receipt, graph_id, node_id)
        graph = self.projection(graph_id)
        node = graph.nodes.get(node_id)
        if node is None or node["status"] != "running":
            raise GraphTransitionError("node is not running")

        task_id = node_task_id(graph_id, node_id)
        task = self.runtime.projection().tasks[task_id]
        self.runtime.update_task(
            task_id,
            task["revision"],
            actor,
            status="completed",
            owner_id=None,
            lease_id=None,
            lease_until=None,
        )
        self.store.append(
            self.mission_id,
            "graph/node_completed",
            actor,
            {
                "graph_id": graph_id,
                "node_id": node_id,
                "receipt_sha256": receipt["receipt_sha256"],
                "evidence_refs": list(receipt["evidence_refs"]),
            },
            idempotency_key=f"graph:node:complete:{graph_id}:{node_id}:{receipt['receipt_sha256']}",
        )
        return self.projection(graph_id)

    def fail_node(self, graph_id: str, node_id: str, actor: str, error: str) -> GraphProjection:
        graph = self.projection(graph_id)
        node = graph.nodes.get(node_id)
        if node is None or node["status"] != "running":
            raise GraphTransitionError("node is not running")
        task_id = node_task_id(graph_id, node_id)
        task = self.runtime.projection().tasks[task_id]
        self.runtime.update_task(
            task_id,
            task["revision"],
            actor,
            status="failed",
            owner_id=None,
            lease_id=None,
            lease_until=None,
        )
        self.store.append(
            self.mission_id,
            "graph/node_failed",
            actor,
            {"graph_id": graph_id, "node_id": node_id, "error": error},
            idempotency_key=f"graph:node:fail:{graph_id}:{node_id}:{_sha(error)}",
        )
        return self.projection(graph_id)

    def maybe_complete_graph(self, graph_id: str, actor: str) -> GraphProjection:
        graph = self.projection(graph_id)
        if graph.status != "running":
            return graph
        if any(node["status"] == "failed" for node in graph.nodes.values()):
            self.store.append(
                self.mission_id,
                "graph/failed",
                actor,
                {"graph_id": graph_id, "reason": "node_failed"},
                idempotency_key=f"graph:fail:{graph_id}:node_failed",
            )
            return self.projection(graph_id)
        if all(node["status"] == "completed" for node in graph.nodes.values()):
            self.store.append(
                self.mission_id,
                "graph/completed",
                actor,
                {"graph_id": graph_id},
                idempotency_key=f"graph:complete:{graph_id}",
            )
        return self.projection(graph_id)
