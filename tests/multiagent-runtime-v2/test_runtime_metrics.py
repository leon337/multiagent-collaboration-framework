import json
import tempfile
import unittest
from pathlib import Path

from runtime import MissionRuntime, MissionStore
from runtime_metrics import _resource_pressure, collect, policy


def metrics(**overrides):
    base = {
        "worker_count": 4,
        "success_rate": 1.0,
        "peak_concurrency_observed": 4,
        "duration_ms": {"p95": 100.0, "sum": 400.0},
        "queue_time_ms": {"p95": 50.0},
        "tool_time_ms": {"calls": 0, "sum": 0.0, "p95": 0.0},
        "retries": 0,
    }
    base.update(overrides)
    return base


class RuntimeMetricsTests(unittest.TestCase):
    def test_collect_and_journal_queue(self):
        with tempfile.TemporaryDirectory() as directory:
            team = Path(directory)
            (team / "receipts").mkdir()
            (team / "evidence").mkdir()
            for index in range(3):
                (team / "receipts" / f"w{index}.json").write_text(
                    json.dumps(
                        {
                            "worker": f"w{index}",
                            "status": "PASS",
                            "duration_ms": 10 * (index + 1),
                        }
                    ),
                    encoding="utf-8",
                )
                (team / "evidence" / f"w{index}.json").write_text(
                    json.dumps(
                        {
                            "worker": f"w{index}",
                            "started": 100 + index,
                            "ended": 105 + index,
                        }
                    ),
                    encoding="utf-8",
                )
            db = team / "m.db"
            store = MissionStore(db)
            runtime = MissionRuntime(store, "M")
            task = runtime.create_task("x", "X", [], "m")
            runtime.lease_task("x", task["revision"], "a", 10, "a")
            store.close()

            result = collect(team, mission_db=db, mission_id="M")

            self.assertEqual(result["worker_count"], 3)
            self.assertEqual(result["success_rate"], 1)
            self.assertEqual(result["queue_time_ms"]["observed"], 1)
            self.assertEqual(result["duration_ms"]["sum"], 60.0)
            self.assertIn("resource_pressure", result)

    def test_incomplete_resource_metrics_fail_safe_to_four(self):
        result = policy(metrics(), max_team_size=8)
        self.assertEqual(result["team_size"], 4)
        self.assertEqual(result["reason"], "balanced_default_four")

    def test_failures_reduce_to_one(self):
        result = policy(metrics(success_rate=0.5), max_team_size=8)
        self.assertEqual(result["team_size"], 1)
        self.assertEqual(result["reason"], "critical_failure_pressure")

    def test_moderate_cpu_throttling_reduces_to_two(self):
        result = policy(
            metrics(
                resource_pressure={
                    "cpu_throttled_ratio": 0.20,
                    "memory_ratio": 0.30,
                    "complete": True,
                }
            ),
            max_team_size=8,
        )
        self.assertEqual(result["team_size"], 2)
        self.assertEqual(result["reason"], "moderate_resource_or_journal_pressure")

    def test_extreme_memory_pressure_reduces_to_one(self):
        result = policy(
            metrics(
                resource_pressure={
                    "cpu_throttled_ratio": 0.02,
                    "memory_ratio": 0.92,
                    "complete": True,
                }
            ),
            max_team_size=8,
        )
        self.assertEqual(result["team_size"], 1)
        self.assertEqual(result["reason"], "critical_resource_pressure")

    def test_journal_pressure_reduces_to_two(self):
        result = policy(
            metrics(
                queue_time_ms={"p95": 700.0},
                resource_pressure={
                    "cpu_throttled_ratio": 0.02,
                    "memory_ratio": 0.30,
                    "complete": True,
                },
            ),
            max_team_size=8,
        )
        self.assertEqual(result["team_size"], 2)

    def test_healthy_io_bound_workload_expands_to_eight(self):
        result = policy(
            metrics(
                duration_ms={"p95": 200.0, "sum": 2000.0},
                tool_time_ms={"calls": 8, "sum": 1300.0, "p95": 180.0},
                resource_pressure={
                    "cpu_throttled_ratio": 0.02,
                    "memory_ratio": 0.35,
                    "complete": True,
                },
            ),
            max_team_size=8,
        )
        self.assertEqual(result["team_size"], 8)
        self.assertEqual(result["reason"], "healthy_io_bound_expand_to_eight")

    def test_max_team_size_is_always_respected(self):
        result = policy(
            metrics(
                duration_ms={"p95": 200.0, "sum": 2000.0},
                tool_time_ms={"calls": 8, "sum": 1300.0, "p95": 180.0},
                resource_pressure={
                    "cpu_throttled_ratio": 0.02,
                    "memory_ratio": 0.35,
                    "complete": True,
                },
            ),
            max_team_size=3,
        )
        self.assertEqual(result["team_size"], 3)

    def test_resource_pressure_reads_cgroup_v2(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "memory.current").write_text("1073741824\n", encoding="utf-8")
            (root / "memory.max").write_text("4294967296\n", encoding="utf-8")
            (root / "cpu.stat").write_text(
                "usage_usec 1000000\n"
                "user_usec 700000\n"
                "system_usec 300000\n"
                "throttled_usec 200000\n",
                encoding="utf-8",
            )

            result = _resource_pressure(root)

            self.assertTrue(result["complete"])
            self.assertAlmostEqual(result["memory_ratio"], 0.25)
            self.assertAlmostEqual(result["cpu_throttled_ratio"], 0.20)

    def test_resource_pressure_missing_files_is_incomplete(self):
        with tempfile.TemporaryDirectory() as directory:
            result = _resource_pressure(Path(directory))
            self.assertFalse(result["complete"])
            self.assertEqual(result["memory_ratio"], 0.0)
            self.assertEqual(result["cpu_throttled_ratio"], 0.0)


if __name__ == "__main__":
    unittest.main()
