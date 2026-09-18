import tempfile
import unittest
from pathlib import Path

from graph_engine import GraphDefinition, GraphEngine, GraphNode, make_graph_receipt
from graph_scheduler import GraphScheduler
from local_runtime_pool import LocalRuntimePool
from runtime import MissionRuntime, MissionStore


class GraphSchedulerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.store = MissionStore(root / "mission.db")
        self.addCleanup(self.store.close)
        self.runtime = MissionRuntime(self.store, "M")
        self.engine = GraphEngine(self.runtime)
        self.pool = LocalRuntimePool(self.runtime, "P", root / "pool.lock")
        self.scheduler = GraphScheduler(self.engine, self.pool)

        graph = GraphDefinition(
            "g",
            (
                GraphNode("start", "Start"),
                GraphNode("test_c", "C", ("start",)),
                GraphNode("test_a", "A", ("start",)),
                GraphNode("test_b", "B", ("start",)),
            ),
        )
        self.engine.create_graph(graph, "mestre")
        self.engine.start_graph("g", "mestre")
        self.pool.configure(2, "mestre")
        self.engine.lease_node("g", "start", "root", 30, "mestre")
        self.engine.complete_node(
            "g",
            "start",
            make_graph_receipt(
                graph_id="g",
                node_id="start",
                actor_id="root",
                status="PASS",
                evidence_refs=["artifact://start"],
            ),
            "root",
        )

    def test_dispatch_is_deterministic_and_bounded_by_pool(self):
        assignments = self.scheduler.dispatch_ready(
            "g",
            ["w1", "w2", "w3"],
            ttl_seconds=30,
        )
        self.assertEqual([a.node_id for a in assignments], ["test_a", "test_b"])
        self.assertEqual([a.worker_id for a in assignments], ["w1", "w2"])
        self.assertEqual(len(self.pool.projection().active), 2)

    def test_released_slot_allows_next_ready_node(self):
        assignments = self.scheduler.dispatch_ready(
            "g",
            ["w1", "w2"],
            ttl_seconds=30,
        )
        first = assignments[0]
        self.engine.complete_node(
            "g",
            first.node_id,
            make_graph_receipt(
                graph_id="g",
                node_id=first.node_id,
                actor_id=first.worker_id,
                status="PASS",
                evidence_refs=[f"artifact://{first.node_id}"],
            ),
            first.worker_id,
        )
        self.scheduler.release_assignment(first)

        next_assignments = self.scheduler.dispatch_ready(
            "g",
            ["w3"],
            ttl_seconds=30,
        )
        self.assertEqual(len(next_assignments), 1)
        self.assertEqual(next_assignments[0].node_id, "test_c")

    def test_empty_worker_list_dispatches_nothing(self):
        self.assertEqual(
            self.scheduler.dispatch_ready("g", [], ttl_seconds=30),
            [],
        )


if __name__ == "__main__":
    unittest.main()
