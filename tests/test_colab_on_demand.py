"""Hermetic contract checks for the experimental Colab adapter."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / "tools" / "colab_on_demand.py"
spec = importlib.util.spec_from_file_location("colab_on_demand", MODULE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class ColabOneShotTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.script = Path(self.temp.name) / "demo.py"
        self.script.write_text("print('OK')\n")
        self.calls = []

    def fake(self, argv, wait):
        self.calls.append((list(argv), wait))
        return subprocess.CompletedProcess(argv, 0, "OK\n", "")

    def test_cpu_and_cleanup(self):
        outcome = mod.run_once(self.script, "mcf-cpu-test", invoke=self.fake)
        self.assertTrue(outcome["run_completed"])
        self.assertTrue(outcome["cleanup_confirmed"])
        self.assertEqual(self.calls[1][0][:4], ["colab", "run", "--session", "mcf-cpu-test"])
        self.assertNotIn("--gpu", self.calls[1][0])
        self.assertEqual(self.calls[2][0], ["colab", "stop", "--session", "mcf-cpu-test"])

    def test_gpu_receipt_mode_and_private_file(self):
        receipt = Path(self.temp.name) / "evidence" / "result.json"
        outcome = mod.run_once(self.script, "mcf-t4-test", gpu=True, output=receipt, invoke=self.fake)
        self.assertIn("--gpu", self.calls[1][0])
        self.assertTrue(outcome["run_completed"])
        self.assertEqual(receipt.stat().st_mode & 0o777, 0o600)
        self.assertNotIn('"stdout"', receipt.read_text())

    def test_remote_failure_still_cleans_up(self):
        def failure(argv, wait):
            self.calls.append((argv, wait))
            if argv[1] == "run":
                raise subprocess.TimeoutExpired(argv, wait)
            return subprocess.CompletedProcess(argv, 0, "", "")
        result = mod.run_once(self.script, "mcf-fail-test", invoke=failure)
        self.assertFalse(result["run_completed"])
        self.assertTrue(result["cleanup_attempted"])
        self.assertTrue(result["cleanup_confirmed"])
        self.assertEqual(len(self.calls), 3)

    def test_nonzero_run_has_no_retry(self):
        def fail(argv, wait):
            self.calls.append((argv, wait))
            return subprocess.CompletedProcess(argv, 7 if argv[1] == "run" else 0, "", "")
        result = mod.run_once(self.script, "mcf-error-test", invoke=fail)
        self.assertEqual(result["run_exit_code"], 7)
        self.assertEqual(len(self.calls), 3)

    def test_rejects_invalid_parameters(self):
        for session in ("", "../bad", "BAD", "x"):
            with self.assertRaises(ValueError):
                mod.run_once(self.script, session, invoke=self.fake)
        with self.assertRaises(ValueError):
            mod.run_once(self.script, "mcf-valid", timeout=999, invoke=self.fake)
        with self.assertRaises(FileNotFoundError):
            mod.run_once(Path(self.temp.name) / "missing.py", "mcf-valid", invoke=self.fake)

    def test_existing_session_protected(self):
        def collision(argv, wait):
            self.calls.append((argv, wait))
            return subprocess.CompletedProcess(argv, 0, "mcf-collision   READY\n", "")
        with self.assertRaises(RuntimeError):
            mod.run_once(self.script, "mcf-collision", invoke=collision)
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.calls[0][0], ["colab", "sessions"])

    def test_unreadable_inventory_protected(self):
        def failure(argv, wait):
            self.calls.append((argv, wait))
            return subprocess.CompletedProcess(argv, 1, "", "inventory failed")
        with self.assertRaises(RuntimeError):
            mod.run_once(self.script, "mcf-valid", invoke=failure)
        self.assertEqual(len(self.calls), 1)

    def test_no_overwrite_receipt(self):
        receipt = Path(self.temp.name) / "exists.json"
        receipt.write_text("existing")
        with self.assertRaises(FileExistsError):
            mod.run_once(self.script, "mcf-valid", output=receipt, invoke=self.fake)
        self.assertEqual(receipt.read_text(), "existing")


if __name__ == "__main__":
    unittest.main()
