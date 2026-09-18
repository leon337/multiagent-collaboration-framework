import tempfile
import unittest
from pathlib import Path

from runtime import MissionRuntime, MissionStore


class AgentSessionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "mission.db"
        self.store = MissionStore(self.db)
        self.rt = MissionRuntime(self.store, "M1")

    def tearDown(self):
        try:
            self.store.close()
        except Exception:
            pass

    def reopen(self):
        self.store.close()
        self.store = MissionStore(self.db)
        self.rt = MissionRuntime(self.store, "M1")

    def test_session_survives_reopen_and_resume(self):
        session = self.rt.create_session("s1", "agent-a", "local-process", "mestre", "task-1")
        self.assertEqual(session["status"], "active")
        session = self.rt.checkpoint_session(
            "s1", "a" * 64, "agent-a", executor_state_ref="local://exec/e1/checkpoint"
        )
        self.assertEqual(session["checkpoint_seq"], 1)
        self.rt.mark_session_message("s1", "m1", "agent-a")
        self.rt.interrupt_session("s1", "agent-a", "executor_crash")
        self.reopen()
        session = self.rt.projection().sessions["s1"]
        self.assertEqual(session["status"], "interrupted")
        self.assertIn("m1", session["seen_message_ids"])
        session = self.rt.resume_session("s1", "agent-a", "local://exec/e1/checkpoint")
        self.assertEqual(session["status"], "active")
        self.assertEqual(session["resume_count"], 1)

    def test_session_message_dedup_is_idempotent(self):
        self.rt.create_session("s", "agent-a", "local-process", "mestre")
        self.rt.mark_session_message("s", "m", "agent-a")
        before = len(self.store.events("M1"))
        self.rt.mark_session_message("s", "m", "agent-a")
        after = len(self.store.events("M1"))
        self.assertEqual(before, after)
        self.assertEqual(self.rt.projection().sessions["s"]["seen_message_ids"], {"m"})

    def test_task_memory_boundary_is_hash_only(self):
        session = self.rt.create_session("s", "agent-a", "local-process", "mestre", "t")
        self.assertEqual(session["memory_policy"]["institutional"], "external_governed")
        self.assertEqual(session["memory_policy"]["task"], "session_checkpoint_hash_only")
        session = self.rt.checkpoint_session("s", "1" * 64, "agent-a")
        session = self.rt.checkpoint_session("s", "2" * 64, "agent-a")
        self.assertEqual(session["checkpoint_seq"], 2)
        self.assertEqual(session["context_sha256"], "2" * 64)
        self.assertNotIn("raw_context", session)
        self.assertNotIn("institutional_memory", session)

    def test_session_interrupt_does_not_lose_mailbox(self):
        self.rt.create_session("s", "agent-b", "local-process", "mestre")
        self.rt.queue_message("m1", "agent-a", "agent-b", "durable hello", "agent-a")
        self.rt.interrupt_session("s", "agent-b", "pause")
        self.reopen()
        projection = self.rt.projection()
        self.assertIn("m1", projection.messages)
        self.assertNotIn("m1", projection.delivered_messages)
        self.assertEqual(projection.sessions["s"]["status"], "interrupted")
        self.rt.resume_session("s", "agent-b")
        self.rt.ack_message("m1", "agent-b", "agent-b")
        projection = self.rt.projection()
        self.assertIn("m1", projection.delivered_messages)
        self.assertEqual(projection.sessions["s"]["status"], "active")


if __name__ == "__main__":
    unittest.main()
