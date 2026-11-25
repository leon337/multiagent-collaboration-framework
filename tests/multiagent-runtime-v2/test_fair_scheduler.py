import tempfile
import time
import unittest
from pathlib import Path

from fair_scheduler import FairScheduler, SchedulerBackpressure
from runtime import MissionRuntime, MissionStore


class FairSchedulerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store = MissionStore(Path(self.tmp.name) / "mission.db")
        self.addCleanup(self.store.close)
        self.runtime = MissionRuntime(self.store, "M")

    def task(self, task_id, priority=0, lane="default", preemptible=False):
        task = self.runtime.create_task(task_id, task_id, [], "mestre")
        return self.runtime.update_task(
            task_id,
            task["revision"],
            "mestre",
            priority=priority,
            lane=lane,
            preemptible=preemptible,
        )

    def test_priority_and_backpressure(self):
        self.task("low", 1)
        self.task("high", 100)
        scheduler = FairScheduler(self.runtime, max_active=1, per_lane_active=1)
        leased = scheduler.lease_next("worker", 10)
        self.assertEqual(leased["task_id"], "high")
        with self.assertRaises(SchedulerBackpressure):
            scheduler.lease_next("worker-2", 10)

    def test_lane_fairness_blocks_overfilled_lane(self):
        first = self.task("a", 10, "L1")
        self.task("b", 9, "L1")
        self.task("c", 1, "L2")
        scheduler = FairScheduler(self.runtime, max_active=3, per_lane_active=1)
        self.runtime.lease_task("a", first["revision"], "w1", 10, "mestre")
        leased = scheduler.lease_next("w2", 10)
        self.assertEqual(leased["task_id"], "c")

    def test_aging_prevents_starvation(self):
        old = self.task("old", 0, "old")
        self.task("new", 1, "new")
        self.runtime.update_task(
            "old",
            old["revision"],
            "mestre",
            enqueued_at=time.time() - 500,
        )
        scheduler = FairScheduler(
            self.runtime,
            aging_seconds=10,
            max_active=2,
            per_lane_active=2,
        )
        self.assertEqual(scheduler.candidates()[0].task_id, "old")

    def test_preemption_is_recommendation_only(self):
        running = self.task("running", 0, "x", True)
        self.task("urgent", 100, "y")
        self.runtime.lease_task(
            "running",
            running["revision"],
            "w",
            30,
            "mestre",
        )
        recommendation = FairScheduler(
            self.runtime,
            preemption_delta=50,
        ).preemption_recommendation("urgent")
        self.assertEqual(recommendation["candidate_task_id"], "running")
        self.assertFalse(recommendation["automatic_preemption"])


if __name__ == "__main__":
    unittest.main()
