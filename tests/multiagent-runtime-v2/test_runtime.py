import tempfile
import unittest
from pathlib import Path

from runtime import ConflictError, MissionRuntime, MissionStore, ProjectionError, replay


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


if __name__ == "__main__":
    unittest.main()
