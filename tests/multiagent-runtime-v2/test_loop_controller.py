import tempfile
import unittest
from pathlib import Path

from loop_controller import (
    BoundedLoopController,
    LoopLimitExceeded,
    LoopPolicy,
    LoopTransitionError,
)
from runtime import MissionRuntime, MissionStore


class BoundedLoopControllerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "mission.db"
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.loop = BoundedLoopController(self.runtime)

    def tearDown(self):
        try:
            self.store.close()
        except Exception:
            pass

    def reopen(self):
        self.store.close()
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")
        self.loop = BoundedLoopController(self.runtime)

    def test_policy_requires_bounds(self):
        with self.assertRaises(ValueError):
            LoopPolicy(0, 10).validate()
        with self.assertRaises(ValueError):
            LoopPolicy(1, 0).validate()
        with self.assertRaises(ValueError):
            LoopPolicy(1, 10, 0).validate()

    def test_fail_repair_then_pass(self):
        state = self.loop.create("L", LoopPolicy(3, 60, 10), "mestre")
        now = state.started_at + 1
        state = self.loop.begin_iteration("L", "worker", cost_units=2, now=now)
        self.assertEqual(state.iteration, 1)
        state = self.loop.validation_failed("L", "validator", ["evidence://fail-1"], now=now + 1)
        self.assertEqual(state.phase, "needs_repair")
        state = self.loop.repair_completed("L", "repair", ["evidence://repair-1"], now=now + 2)
        self.assertEqual(state.phase, "repaired")
        state = self.loop.begin_iteration("L", "worker", cost_units=2, now=now + 3)
        state = self.loop.validation_passed("L", "validator", ["evidence://pass-2"], now=now + 4)
        self.assertEqual(state.status, "completed")
        self.assertEqual(state.iteration, 2)
        self.assertEqual(state.used_units, 4)

    def test_max_iterations_exhausts_fail_closed(self):
        state = self.loop.create("L", LoopPolicy(1, 60), "mestre")
        now = state.started_at + 1
        self.loop.begin_iteration("L", "worker", now=now)
        failed = self.loop.validation_failed("L", "validator", ["e://fail"], now=now + 1)
        self.assertEqual(failed.status, "failed")
        self.assertEqual(failed.failure_reason, "max_iterations")
        with self.assertRaises(LoopTransitionError):
            self.loop.repair_completed("L", "repair", ["e://repair"], now=now + 2)

    def test_timeout_exhausts_fail_closed(self):
        state = self.loop.create("L", LoopPolicy(3, 5), "mestre")
        with self.assertRaises(LoopLimitExceeded):
            self.loop.begin_iteration("L", "worker", now=state.started_at + 5)
        projection = self.loop.projection("L")
        self.assertEqual(projection.status, "failed")
        self.assertEqual(projection.failure_reason, "timeout")

    def test_budget_exhausts_fail_closed(self):
        state = self.loop.create("L", LoopPolicy(3, 60, 1), "mestre")
        now = state.started_at + 1
        self.loop.begin_iteration("L", "worker", cost_units=1, now=now)
        self.loop.validation_failed("L", "validator", ["e://fail"], now=now + 1)
        self.loop.repair_completed("L", "repair", ["e://repair"], now=now + 2)
        with self.assertRaises(LoopLimitExceeded):
            self.loop.begin_iteration("L", "worker", cost_units=1, now=now + 3)
        self.assertEqual(self.loop.projection("L").failure_reason, "budget")

    def test_pass_requires_evidence(self):
        state = self.loop.create("L", LoopPolicy(1, 60), "mestre")
        self.loop.begin_iteration("L", "worker", now=state.started_at + 1)
        with self.assertRaises(LoopTransitionError):
            self.loop.validation_passed("L", "validator", [], now=state.started_at + 2)

    def test_replay_survives_reopen(self):
        state = self.loop.create("L", LoopPolicy(3, 60), "mestre")
        self.loop.begin_iteration("L", "worker", now=state.started_at + 1)
        self.loop.validation_failed("L", "validator", ["e://fail"], now=state.started_at + 2)
        before = self.loop.projection("L")
        self.reopen()
        after = self.loop.projection("L")
        self.assertEqual(before.__dict__, after.__dict__)


if __name__ == "__main__":
    unittest.main()
