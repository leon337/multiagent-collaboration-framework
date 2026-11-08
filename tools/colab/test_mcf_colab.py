"""Offline tests; never contact Google or allocate a Colab runtime."""
import importlib.util
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace

PATH = Path(__file__).with_name("mcf_colab.py")
SPEC = importlib.util.spec_from_file_location("mcf_colab", PATH)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


class ColabRunnerTests(unittest.TestCase):
    def test_plan_cpu_is_public_and_not_executed(self):
        with patch.object(mod, "AUTH", Path("/no/auth/token.json")):
            plan = mod.make_plan("smoke", None)
        self.assertEqual(plan["accelerator"], "CPU")
        self.assertEqual(plan["auth"], "HUMAN_OAUTH_REQUIRED")
        self.assertFalse(plan["executed"])
        self.assertTrue(plan["autoStop"])

    def test_only_allowlisted_jobs(self):
        for job in ("../../etc/passwd", "private.py", ".env", "smoke.py"):
            with self.subTest(job=job), self.assertRaises(mod.Blocked):
                mod.safe_job(job)

    def test_no_implicit_cloud_allocation(self):
        with patch.object(mod.subprocess, "run") as runner:
            with self.assertRaisesRegex(mod.Blocked, "explicit_compute"):
                mod.execute("smoke", None, False, False)
        runner.assert_not_called()

    def test_gpu_requires_separate_approval(self):
        with patch.object(mod.subprocess, "run") as runner:
            with self.assertRaisesRegex(mod.Blocked, "explicit_accelerator"):
                mod.execute("torch-gpu-probe", "T4", True, False)
        runner.assert_not_called()

    def test_gpu_is_only_for_gpu_job(self):
        with self.assertRaisesRegex(mod.Blocked, "does_not_need_gpu"):
            mod.make_plan("smoke", "T4")
        with self.assertRaisesRegex(mod.Blocked, "requires_T4"):
            mod.make_plan("torch-gpu-probe", None)
        self.assertEqual(mod.make_plan("torch-gpu-probe", "T4")["accelerator"], "T4")

    def test_auth_permission_gates(self):
        with tempfile.TemporaryDirectory() as tmp:
            token = Path(tmp) / "token.json"
            with patch.object(mod, "AUTH", token):
                self.assertEqual(mod.token_state(), "HUMAN_OAUTH_REQUIRED")
                token.write_text("{}")
                token.chmod(0o644)
                self.assertEqual(mod.token_state(), "UNSAFE_TOKEN_PERMISSIONS")
                token.chmod(0o600)
                self.assertEqual(mod.token_state(), "PRESENT_NOT_VERIFIED")

    def test_simulated_run_is_one_shot_and_receipted(self):
        with tempfile.TemporaryDirectory() as tmp:
            token = Path(tmp) / "conf" / "token.json"
            token.parent.mkdir()
            token.write_text("{}")
            token.chmod(0o600)
            captured = []
            def fake_run(args, **kwargs):
                captured.extend(args)
                self.assertIs(kwargs["stdin"], mod.subprocess.DEVNULL)
                return SimpleNamespace(returncode=0)
            with patch.object(mod, "AUTH", token), \
                 patch.object(mod, "STATE", Path(tmp) / "state"), \
                 patch.object(mod.shutil, "which", return_value="/usr/bin/true"), \
                 patch.object(mod.subprocess, "run", side_effect=fake_run):
                old_umask = mod.os.umask(0o077)
                try:
                    result = mod.execute("smoke", None, True, False)
                finally:
                    mod.os.umask(old_umask)
            self.assertEqual(result["exitCode"], 0)
            self.assertFalse(result["remoteStopIndependentlyVerified"])
            self.assertTrue(result["autoStopRequested"])
            self.assertIn("run", captured)
            self.assertNotIn("--keep", captured)
            self.assertNotIn("--gpu", captured)
            self.assertEqual(len([x for x in captured if "smoke.py" in x]), 1)
            receipt = Path(tmp) / "state" / (result["session"] + "-receipt.json")
            self.assertEqual(stat.S_IMODE(receipt.stat().st_mode), 0o600)

if __name__ == "__main__":
    unittest.main()
