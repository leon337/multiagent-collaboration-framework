import tempfile
import threading
import unittest
from pathlib import Path

from runtime import ConflictError, MissionError, MissionRuntime, MissionStore, ProjectionError, replay


class RuntimeV2Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "mission.db"
        self.store = MissionStore(self.db)
        self.addCleanup(self.store.close)
        self.rt = MissionRuntime(self.store, "M1")

    def test_append_idempotency(self):
        payload = {"message_id":"x","sender_id":"a","target_id":"b","content":"c"}
        a = self.store.append("M1", "message/queued", "mestre", payload, idempotency_key="k")
        b = self.store.append("M1", "message/queued", "mestre", payload, idempotency_key="k")
        self.assertEqual(a.event_id, b.event_id)
        self.assertEqual(len(self.store.events("M1")), 1)

    def test_task_cas_rejects_stale_update(self):
        task = self.rt.create_task("t1", "one", [], "mestre")
        self.rt.update_task("t1", task["revision"], "miriam", status="running")
        with self.assertRaises(ConflictError):
            self.rt.update_task("t1", task["revision"], "sofia", status="completed")

    def test_task_cycle_rejected(self):
        self.rt.create_task("a", "A", [], "mestre")
        self.rt.create_task("b", "B", ["a"], "mestre")
        a = self.rt.projection().tasks["a"]
        with self.assertRaises(ProjectionError):
            self.rt.update_task("a", a["revision"], "mestre", blocked_by=["b"])

    def test_mailbox_queue_then_ack_is_durable_across_reopen(self):
        self.rt.queue_message("m1", "a", "b", "hello", "a")
        self.store.close()
        self.store = MissionStore(self.db)
        self.rt = MissionRuntime(self.store, "M1")
        p = self.rt.projection()
        self.assertIn("m1", p.messages)
        self.assertNotIn("m1", p.delivered_messages)
        self.rt.ack_message("m1", "b", "b")
        self.assertIn("m1", self.rt.projection().delivered_messages)

    def test_expired_lease_enters_recovery_block(self):
        t = self.rt.create_task("t1", "one", [], "mestre")
        leased = self.rt.lease_task("t1", t["revision"], "worker-1", 1, "mestre")
        recovered = self.rt.recover_expired_leases(
            "mestre", now=leased["lease_until"] + 1
        )
        self.assertEqual(recovered, ["t1"])
        current = self.rt.projection().tasks["t1"]
        self.assertEqual(current["status"], "blocked")
        self.assertIsNone(current["owner_id"])

    def test_projection_rejects_non_contiguous_seq(self):
        e1 = self.store.append(
            "M1", "message/queued", "a",
            {"message_id":"1","sender_id":"a","target_id":"b","content":"x"},
            idempotency_key="1",
        )
        e2 = self.store.append(
            "M1", "message/queued", "a",
            {"message_id":"2","sender_id":"a","target_id":"b","content":"x"},
            idempotency_key="2",
        )
        broken = [e1, e2.__class__(**{**e2.__dict__, "seq": 3})]
        with self.assertRaises(ProjectionError):
            replay(broken)

    def test_agent_provisioning_reconciles_to_active(self):
        agent = self.rt.provision_agent("a1", "worker", "sandbox:one", "mestre")
        self.assertEqual(agent["phase"], "provisioning")
        active = self.rt.settle_agent("a1", "active", "mestre")
        self.assertEqual(active["phase"], "active")
        again = self.rt.settle_agent("a1", "active", "mestre")
        self.assertEqual(again["phase"], "active")
        with self.assertRaises(ConflictError):
            self.rt.settle_agent("a1", "failed", "mestre", error="late contradictory observation")

    def test_execution_receipt_and_tool_evidence_are_correlated(self):
        self.rt.provision_agent("a1", "worker", "sandbox:one", "mestre")
        self.rt.settle_agent("a1", "active", "mestre")
        task = self.rt.create_task("t1", "work", [], "mestre")
        execution = self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")
        self.assertEqual(execution["status"], "running")
        tool = self.rt.request_tool("c1", "e1", "repo_read", "a" * 64, "a1")
        self.assertEqual(tool["status"], "requested")
        done_tool = self.rt.finish_tool(
            "c1", "a1", success=True, result_sha256="b" * 64
        )
        self.assertEqual(done_tool["status"], "completed")
        done = self.rt.finish_execution(
            "e1",
            "mestre",
            success=True,
            finish_reason="completed",
            artifact_refs=["artifact://one"],
            resource_usage={"wall_ms": 12, "tool_calls": 1},
        )
        self.assertEqual(done["status"], "completed")
        self.assertEqual(done["resource_usage"]["tool_calls"], 1)
        self.assertEqual(self.rt.projection().tool_calls["c1"]["result_sha256"], "b" * 64)

    def test_tool_call_cannot_reference_unknown_execution(self):
        with self.assertRaises(MissionError):
            self.rt.request_tool("c1", "missing", "repo_read", "a" * 64, "a1")

    def test_two_connections_compete_for_same_task_revision(self):
        task = self.rt.create_task("t1", "one", [], "mestre")
        expected = task["revision"]
        barrier = threading.Barrier(2)
        outcomes = []
        lock = threading.Lock()

        def worker(name, status):
            store = MissionStore(self.db)
            try:
                runtime = MissionRuntime(store, "M1")
                barrier.wait()
                try:
                    runtime.update_task("t1", expected, name, status=status)
                    result = "success"
                except ConflictError:
                    result = "conflict"
                with lock:
                    outcomes.append(result)
            finally:
                store.close()

        threads = [
            threading.Thread(target=worker, args=("w1", "running")),
            threading.Thread(target=worker, args=("w2", "completed")),
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        self.assertEqual(sorted(outcomes), ["conflict", "success"])
        current = self.rt.projection().tasks["t1"]
        self.assertEqual(current["revision"], 2)


if __name__ == "__main__":
    unittest.main()


class FailureAndSoakTests(unittest.TestCase):
    def test_storage_failure_injection_leaves_no_false_green(self):
        with tempfile.TemporaryDirectory() as d:
            store = MissionStore(Path(d) / "failure.db")
            store.conn.execute(
                "CREATE TRIGGER fail_events BEFORE INSERT ON mission_events "
                "BEGIN SELECT RAISE(ABORT,'simulated storage failure'); END;"
            )
            rt = MissionRuntime(store, "M")
            with self.assertRaises(Exception):
                rt.create_task("x", "X", [], "mestre")
            self.assertEqual(store.events("M"), [])
            store.close()

    def test_soak_reopen_replay_fifty_events(self):
        with tempfile.TemporaryDirectory() as d:
            db = Path(d) / "soak.db"
            store = MissionStore(db)
            rt = MissionRuntime(store, "M")
            for i in range(25):
                task = rt.create_task(f"t{i}", f"T{i}", [], "mestre")
                rt.update_task(f"t{i}", task["revision"], "mestre", status="completed")
                if i % 5 == 4:
                    store.close()
                    store = MissionStore(db)
                    rt = MissionRuntime(store, "M")
                    self.assertEqual(len(rt.projection().tasks), i + 1)
            self.assertEqual(len(store.events("M")), 50)
            store.close()
