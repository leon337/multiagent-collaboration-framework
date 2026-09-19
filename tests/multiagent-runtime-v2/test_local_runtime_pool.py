import tempfile
import unittest
from pathlib import Path

from local_runtime_pool import LocalRuntimePool, RuntimePoolBackpressure, RuntimePoolError
from runtime import MissionRuntime, MissionStore


class LocalRuntimePoolTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "mission.db"
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.pool = LocalRuntimePool(self.runtime, "P", Path(self.tmp.name) / "pool.lock")

    def tearDown(self):
        try:
            self.store.close()
        except Exception:
            pass

    def reopen(self):
        self.store.close()
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.pool = LocalRuntimePool(self.runtime, "P", Path(self.tmp.name) / "pool.lock")

    def test_requires_configuration(self):
        with self.assertRaises(RuntimePoolError):
            self.pool.acquire("r1", "t1", "w1", "mestre")

    def test_slot_backpressure_and_reuse(self):
        self.pool.configure(2, "mestre")
        a = self.pool.acquire("r1", "t1", "w1", "mestre")
        b = self.pool.acquire("r2", "t2", "w2", "mestre")
        self.assertNotEqual(a["slot"], b["slot"])
        with self.assertRaises(RuntimePoolBackpressure):
            self.pool.acquire("r3", "t3", "w3", "mestre")
        self.pool.release("r1", "mestre")
        c = self.pool.acquire("r3", "t3", "w3", "mestre")
        self.assertEqual(c["slot"], a["slot"])

    def test_idempotent_acquire_for_same_run(self):
        self.pool.configure(1, "mestre")
        first = self.pool.acquire("r1", "t1", "w1", "mestre")
        second = self.pool.acquire("r1", "t1", "w1", "mestre")
        self.assertEqual(first, second)
        self.assertEqual(len(self.pool.projection().active), 1)

    def test_adaptive_configuration_uses_discrete_default_policy(self):
        metrics = {
            "worker_count": 2,
            "success_rate": 1.0,
            "peak_concurrency_observed": 2,
            "duration_ms": {"p95": 100},
        }
        result = self.pool.configure_from_metrics(metrics, "mestre", max_team_size=4)
        self.assertEqual(result["policy"]["team_size"], 4)
        self.assertEqual(result["projection"].target_slots, 4)
        self.assertIn("BLOCKED_G08", result["policy"]["model_policy"])

    def test_replay_survives_reopen(self):
        self.pool.configure(2, "mestre")
        self.pool.acquire("r1", "t1", "w1", "mestre")
        before = self.pool.projection()
        self.reopen()
        after = self.pool.projection()
        self.assertEqual(before.__dict__, after.__dict__)

    def test_pool_events_never_claim_cognition(self):
        self.pool.configure(1, "mestre")
        self.pool.acquire("r1", "t1", "w1", "mestre")
        events = self.store.events("M")
        acquired = [e for e in events if e.event_type == "pool/slot_acquired"][0]
        self.assertFalse(acquired.payload["cognitive"])

    def test_run_id_reuse_with_different_identity_fails(self):
        self.pool.configure(2, "mestre")
        self.pool.acquire("r1", "t1", "w1", "mestre")
        with self.assertRaises(RuntimePoolError):
            self.pool.acquire("r1", "t2", "w1", "mestre")
        with self.assertRaises(RuntimePoolError):
            self.pool.acquire("r1", "t1", "w2", "mestre")

    def test_adaptive_configuration_respects_active_slot_floor(self):
        self.pool.configure(4, "mestre")
        self.pool.acquire("r1", "t1", "w1", "mestre")
        self.pool.acquire("r2", "t2", "w2", "mestre")
        self.pool.acquire("r3", "t3", "w3", "mestre")
        metrics = {
            "worker_count": 4,
            "success_rate": 0.5,
            "peak_concurrency_observed": 4,
            "duration_ms": {"p95": 100, "sum": 400},
        }

        result = self.pool.configure_from_metrics(metrics, "mestre", max_team_size=8)

        self.assertEqual(result["policy"]["team_size"], 3)
        self.assertEqual(result["projection"].target_slots, 3)

    def test_pool_cannot_shrink_below_active_count(self):
        self.pool.configure(2, "mestre")
        self.pool.acquire("r1", "t1", "w1", "mestre")
        self.pool.acquire("r2", "t2", "w2", "mestre")
        with self.assertRaises(RuntimePoolError):
            self.pool.configure(1, "mestre")


if __name__ == "__main__":
    unittest.main()
