import multiprocessing as mp
import os
import tempfile
import unittest
from pathlib import Path

from mailbox_dispatcher import MailboxDispatcher
from runtime import ConflictError, MissionRuntime, MissionStore


def _crash_after_effect(db_path, lock_dir, marker_path):
    store = MissionStore(db_path)
    runtime = MissionRuntime(store, "M")
    dispatcher = MailboxDispatcher(runtime, lock_dir)

    def deliver(message):
        with open(marker_path, "a", encoding="utf-8") as fh:
            fh.write(message["message_id"] + "\n")
            fh.flush()
            os.fsync(fh.fileno())
        os._exit(17)

    dispatcher.dispatch("target", deliver)


class MailboxCrashReconcileTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.db = self.root / "mission.db"
        self.locks = self.root / "locks"
        self.marker = self.root / "side-effects.txt"
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.dispatcher = MailboxDispatcher(self.runtime, self.locks)

    def tearDown(self):
        try:
            self.store.close()
        except Exception:
            pass

    def reopen(self):
        self.store.close()
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.dispatcher = MailboxDispatcher(self.runtime, self.locks)

    def test_crash_after_effect_requires_reconciliation_before_retry(self):
        self.dispatcher.queue("m1", "sender", "target", "hello")
        self.store.close()

        ctx = mp.get_context("spawn")
        process = ctx.Process(
            target=_crash_after_effect,
            args=(str(self.db), str(self.locks), str(self.marker)),
        )
        process.start()
        process.join(10)
        self.assertEqual(process.exitcode, 17)

        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.dispatcher = MailboxDispatcher(self.runtime, self.locks)

        calls = []
        receipt = self.dispatcher.dispatch(
            "target",
            lambda message: calls.append(message["message_id"]) or True,
        )
        self.assertEqual(calls, [])
        self.assertEqual(receipt["reconciliation_required_message_id"], "m1")
        self.assertEqual(self.marker.read_text().splitlines(), ["m1"])

        attempt = self.runtime.projection().delivery_attempts["m1"]
        self.assertEqual(attempt["status"], "started")

        reconciled = self.runtime.reconcile_message_delivery(
            "m1",
            "target",
            delivered=True,
            actor="recovery",
            evidence_ref="artifact://provider-confirmed-delivery",
        )
        self.assertEqual(reconciled["status"], "delivered")
        self.assertIn("m1", self.runtime.projection().delivered_messages)

        receipt = self.dispatcher.dispatch("target", lambda message: True)
        self.assertEqual(receipt["remaining"], 0)
        self.assertEqual(self.marker.read_text().splitlines(), ["m1"])

    def test_reconcile_not_delivered_allows_safe_retry(self):
        self.dispatcher.queue("m1", "sender", "target", "hello")
        self.runtime.start_message_delivery("m1", "target", "attempt-1", "target")

        reconciled = self.runtime.reconcile_message_delivery(
            "m1",
            "target",
            delivered=False,
            actor="recovery",
            evidence_ref="artifact://provider-confirmed-not-delivered",
        )
        self.assertEqual(reconciled["status"], "failed")

        seen = []
        receipt = self.dispatcher.dispatch(
            "target",
            lambda message: seen.append(message["message_id"]) or True,
        )
        self.assertEqual(seen, ["m1"])
        self.assertEqual(receipt["delivered"], ["m1"])
        self.assertEqual(self.runtime.projection().delivery_attempts["m1"]["status"], "delivered")

    def test_attempt_mismatch_ack_fails_closed(self):
        self.dispatcher.queue("m1", "sender", "target", "hello")
        self.runtime.start_message_delivery("m1", "target", "attempt-1", "target")
        with self.assertRaises(ConflictError):
            self.runtime.ack_message(
                "m1",
                "target",
                "target",
                attempt_id="attempt-other",
            )

    def test_failed_callback_records_failed_attempt(self):
        self.dispatcher.queue("m1", "sender", "target", "hello")
        receipt = self.dispatcher.dispatch("target", lambda message: False)
        self.assertEqual(receipt["failed_message_id"], "m1")
        attempt = self.runtime.projection().delivery_attempts["m1"]
        self.assertEqual(attempt["status"], "failed")
        self.assertEqual(attempt["error_class"], "delivery_callback_returned_false")


if __name__ == "__main__":
    unittest.main()
