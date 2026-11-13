"""Offline tests: no credential or external model access."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "mcf-codebuddy.py"
spec = importlib.util.spec_from_file_location("mcf_codebuddy_control", MODULE)
control = importlib.util.module_from_spec(spec)
spec.loader.exec_module(control)


class CodeBuddyControlTests(unittest.TestCase):
    def test_authenticated_loopback_unit(self):
        unit = "ExecStart=/bin/codebuddy --serve --host 127.0.0.1 --port 46514 --auth password"
        self.assertTrue(control.service_is_secure(unit))
        self.assertFalse(control.service_is_secure(unit.replace("password", "none")))
        self.assertFalse(control.service_is_secure(unit.replace("127.0.0.1", "0.0.0.0")))

    def test_build_command_does_not_bypass_permissions(self):
        args = control.build_prompt_command(Path("/bin/codebuddy"), "teste", "fast-model")
        self.assertIn("dontAsk", args)
        self.assertIn("--print", args)
        self.assertIn("--output-format", args)
        self.assertNotIn("--dangerously-skip-permissions", args)
        self.assertNotIn("--auth", args)

    def test_codebuddy_environment_uses_nvm_node(self):
        env = control.codebuddy_environment()
        self.assertIn("/.nvm/versions/node/v22.23.2/bin", env["PATH"])

    def test_resume_flag(self):
        args = control.build_prompt_command(Path("/bin/codebuddy"), "continue", "fast-model",
                                            "session-123")
        self.assertEqual(args[-3:], ["--resume", "session-123", "continue"])

    def test_bad_session_id_rejected(self):
        with self.assertRaises(ValueError):
            control.build_prompt_command(Path("/bin/codebuddy"), "continue", "fast-model", "../oops")

    def test_model_flag_injection_rejected(self):
        with self.assertRaises(ValueError):
            control.build_prompt_command(Path("/bin/codebuddy"), "hello", "--dangerously-skip-permissions")

    def test_bad_message_rejected(self):
        for message in ("", "  ", "--skip"):
            with self.subTest(message=message):
                with self.assertRaises(ValueError):
                    control.build_prompt_command(Path("/bin/codebuddy"), message, "fast-model")

    def test_result_array_extracts_only_final_result(self):
        events = [{"type": "message", "role": "user", "content": [{"text": "secreto"}]},
                  {"type": "result", "result": "MCF_CODEBUDDY_READY_OK",
                   "session_id": "sess123", "duration_ms": 101, "total_cost_usd": 0,
                   "is_error": False}]
        result = control.safe_result(json.dumps(events), "", 0)
        self.assertTrue(result["ok"])
        self.assertEqual(result["result"], "MCF_CODEBUDDY_READY_OK")
        self.assertEqual(result["session_id"], "sess123")
        self.assertNotIn("secreto", json.dumps(result))

    def test_model_not_allowed_classified_without_stderr_leak(self):
        result = control.safe_result("", "model x is not allowed: secret_example", 1)
        self.assertFalse(result["ok"])
        self.assertEqual(result["error_kind"], "model_not_allowed")
        self.assertNotIn("secret_example", json.dumps(result))

    def test_trusted_workdir_accepts_descendant(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "child").mkdir()
            cfg = {"trustedDirectories": [str(root)]}
            self.assertEqual(control.trusted_workdir(root / "child", cfg), root / "child")

    def test_trusted_workdir_denies_outside(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "allow").mkdir()
            (root / "deny").mkdir()
            cfg = {"trustedDirectories": [str(root / "allow")]}
            with self.assertRaises(PermissionError):
                control.trusted_workdir(root / "deny", cfg)


if __name__ == "__main__":
    unittest.main()
