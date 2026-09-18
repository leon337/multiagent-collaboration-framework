import tempfile
import unittest
from pathlib import Path

from graph_engine import (
    GraphDefinition,
    GraphDefinitionError,
    GraphEngine,
    GraphNode,
    GraphReceiptError,
    GraphTransitionError,
    make_graph_receipt,
)
from runtime import ConflictError, MissionRuntime, MissionStore


class GraphEngineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "mission.db"
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.engine = GraphEngine(self.runtime)

    def tearDown(self):
        try:
            self.store.close()
        except Exception:
            pass

    def reopen(self):
        self.store.close()
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.engine = GraphEngine(self.runtime)

    @staticmethod
    def fanout_graph():
        return GraphDefinition(
            "g1",
            (
                GraphNode("audit", "Audit", ("test_a", "test_b", "test_c")),
                GraphNode("start", "Start"),
                GraphNode("test_b", "Test B", ("start",)),
                GraphNode("test_a", "Test A", ("start",)),
                GraphNode("end", "End", ("audit",)),
                GraphNode("test_c", "Test C", ("start",)),
            ),
        )

    def complete(self, node_id):
        receipt = make_graph_receipt(
            graph_id="g1",
            node_id=node_id,
            actor_id=node_id,
            status="PASS",
            evidence_refs=[f"artifact://{node_id}"],
            result={"node": node_id, "ok": True},
        )
        self.engine.complete_node("g1", node_id, receipt, node_id)

    def test_unknown_dependency_rejected(self):
        graph = GraphDefinition(
            "bad",
            (GraphNode("a", "A", ("missing",)),),
        )
        with self.assertRaises(GraphDefinitionError):
            graph.validate()

    def test_cycle_rejected(self):
        graph = GraphDefinition(
            "bad",
            (
                GraphNode("a", "A", ("b",)),
                GraphNode("b", "B", ("a",)),
            ),
        )
        with self.assertRaises(GraphDefinitionError):
            graph.validate()

    def test_topological_materialization_is_independent_of_input_order(self):
        graph = self.fanout_graph()
        projection = self.engine.create_graph(graph, "mestre")
        self.assertEqual(projection.status, "created")
        tasks = self.runtime.projection().tasks
        self.assertIn("graph:g1:start", tasks)
        self.assertEqual(
            tasks["graph:g1:audit"]["blocked_by"],
            ["graph:g1:test_a", "graph:g1:test_b", "graph:g1:test_c"],
        )

    def test_start_exposes_only_root_as_ready(self):
        self.engine.create_graph(self.fanout_graph(), "mestre")
        self.engine.start_graph("g1", "mestre")
        self.assertEqual(self.engine.ready_nodes("g1"), ["start"])

    def test_fanout_and_fanin(self):
        self.engine.create_graph(self.fanout_graph(), "mestre")
        self.engine.start_graph("g1", "mestre")

        self.engine.lease_node("g1", "start", "w0", 30, "mestre")
        self.complete("start")
        self.assertEqual(
            self.engine.ready_nodes("g1"),
            ["test_a", "test_b", "test_c"],
        )

        for node_id in ("test_a", "test_b", "test_c"):
            self.engine.lease_node("g1", node_id, node_id, 30, "mestre")

        self.complete("test_a")
        self.complete("test_b")
        self.assertNotIn("audit", self.engine.ready_nodes("g1"))

        self.complete("test_c")
        self.assertEqual(self.engine.ready_nodes("g1"), ["audit"])

        self.engine.lease_node("g1", "audit", "auditor", 30, "mestre")
        self.complete("audit")
        self.assertEqual(self.engine.ready_nodes("g1"), ["end"])

        self.engine.lease_node("g1", "end", "w-end", 30, "mestre")
        self.complete("end")
        graph = self.engine.maybe_complete_graph("g1", "mestre")
        self.assertEqual(graph.status, "completed")

    def test_node_completion_requires_valid_receipt(self):
        self.engine.create_graph(self.fanout_graph(), "mestre")
        self.engine.start_graph("g1", "mestre")
        self.engine.lease_node("g1", "start", "w0", 30, "mestre")
        with self.assertRaises(GraphReceiptError):
            self.engine.complete_node(
                "g1",
                "start",
                {
                    "schema": "mcf_graph_node_receipt/v1",
                    "graph_id": "g1",
                    "node_id": "start",
                    "status": "PASS",
                    "evidence_refs": [],
                    "receipt_sha256": "x",
                },
                "mestre",
            )

    def test_blocked_node_cannot_be_leased(self):
        self.engine.create_graph(self.fanout_graph(), "mestre")
        self.engine.start_graph("g1", "mestre")
        with self.assertRaises(ConflictError):
            self.engine.lease_node("g1", "audit", "auditor", 30, "mestre")

    def test_failure_marks_graph_failed(self):
        self.engine.create_graph(self.fanout_graph(), "mestre")
        self.engine.start_graph("g1", "mestre")
        self.engine.lease_node("g1", "start", "w0", 30, "mestre")
        self.engine.fail_node("g1", "start", "w0", "boom")
        graph = self.engine.maybe_complete_graph("g1", "mestre")
        self.assertEqual(graph.status, "failed")

    def test_graph_replay_survives_reopen(self):
        self.engine.create_graph(self.fanout_graph(), "mestre")
        self.engine.start_graph("g1", "mestre")
        self.engine.lease_node("g1", "start", "w0", 30, "mestre")
        self.complete("start")

        before = self.engine.projection("g1")
        self.reopen()
        after = self.engine.projection("g1")
        self.assertEqual(before.status, after.status)
        self.assertEqual(before.nodes, after.nodes)
        self.assertEqual(self.engine.ready_nodes("g1"), ["test_a", "test_b", "test_c"])

    def test_graph_cannot_complete_early(self):
        self.engine.create_graph(self.fanout_graph(), "mestre")
        self.engine.start_graph("g1", "mestre")
        with self.assertRaises(GraphTransitionError):
            self.store.append(
                "M",
                "graph/completed",
                "mestre",
                {"graph_id": "g1"},
                idempotency_key="bad-complete",
            )
            self.engine.projection("g1")


if __name__ == "__main__":
    unittest.main()
