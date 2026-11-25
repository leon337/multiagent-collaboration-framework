import tempfile
import unittest
from pathlib import Path

from mailbox_dispatcher import MailboxBackpressure, MailboxDispatcher
from runtime import MissionRuntime, MissionStore


class MailboxDispatcherTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store = MissionStore(Path(self.tmp.name) / "mission.db")
        self.addCleanup(self.store.close)
        self.runtime = MissionRuntime(self.store, "M")
        self.dispatcher = MailboxDispatcher(
            self.runtime,
            Path(self.tmp.name) / "locks",
            max_pending_per_target=3,
            max_message_bytes=64,
        )

    def test_target_order_and_ack(self):
        for i in range(3):
            self.dispatcher.queue(f"m{i}", "a", "b", f"hello-{i}")
        seen = []
        receipt = self.dispatcher.dispatch(
            "b",
            lambda message: seen.append(message["message_id"]) or True,
        )
        self.assertEqual(seen, ["m0", "m1", "m2"])
        self.assertEqual(receipt["remaining"], 0)

    def test_failed_head_blocks_later_messages(self):
        for i in range(3):
            self.dispatcher.queue(f"m{i}", "a", "b", str(i))
        seen = []
        receipt = self.dispatcher.dispatch(
            "b",
            lambda message: seen.append(message["message_id"])
            or message["message_id"] != "m1",
        )
        self.assertEqual(seen, ["m0", "m1"])
        self.assertEqual(receipt["failed_message_id"], "m1")
        self.assertEqual(receipt["remaining"], 2)

    def test_backpressure_and_size_limit(self):
        for i in range(3):
            self.dispatcher.queue(f"m{i}", "a", "b", "x")
        with self.assertRaises(MailboxBackpressure):
            self.dispatcher.queue("m3", "a", "b", "x")
        with self.assertRaises(MailboxBackpressure):
            self.dispatcher.queue("huge", "a", "c", "x" * 65)

    def test_idempotent_retry_does_not_consume_extra_slot(self):
        self.dispatcher.queue("m", "a", "b", "x")
        self.dispatcher.queue("m", "a", "b", "x")
        self.assertEqual(self.dispatcher.pending_count("b"), 1)


if __name__ == "__main__":
    unittest.main()
