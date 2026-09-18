import tempfile
import unittest

from graph_mvp_runner import run_fanout_demo, run_loop_demo


class GraphMvpE2ETests(unittest.TestCase):
    def test_three_runtime_cells_execute_in_parallel_then_audit(self):
        with tempfile.TemporaryDirectory() as directory:
            result = run_fanout_demo(directory)
        self.assertEqual(result["graph_status"], "completed")
        self.assertEqual(result["cell_pass_count"], 3)
        self.assertEqual(result["cell_fail_count"], 0)
        self.assertEqual(result["unique_pids"], 3)
        self.assertEqual(result["peak_concurrency_observed"], 3)
        self.assertTrue(result["audit_ready_after_fanout"])
        self.assertEqual(result["pool_active_after_join"], 0)

    def test_failed_branch_prevents_successful_fanin(self):
        with tempfile.TemporaryDirectory() as directory:
            result = run_fanout_demo(directory, fail_node="test_b")
        self.assertEqual(result["graph_status"], "failed")
        self.assertEqual(result["cell_pass_count"], 2)
        self.assertEqual(result["cell_fail_count"], 1)
        self.assertFalse(result["audit_ready_after_fanout"])
        self.assertEqual(result["unique_pids"], 3)

    def test_bounded_loop_passes_on_third_iteration(self):
        with tempfile.TemporaryDirectory() as directory:
            result = run_loop_demo(directory, [False, False, True])
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["iteration"], 3)
        self.assertEqual(result["used_units"], 3)

    def test_bounded_loop_exhausts_on_third_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            result = run_loop_demo(directory, [False, False, False])
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["iteration"], 3)
        self.assertEqual(result["failure_reason"], "max_iterations")


if __name__ == "__main__":
    unittest.main()
