"""Tests offline para o catálogo Gemini 3.8 e suas invariantes de segurança."""
import importlib.util
import pathlib
import tempfile
import unittest

SOURCE = pathlib.Path(__file__).resolve().parents[1] / "gemini38_models.py"
spec = importlib.util.spec_from_file_location("mcf_g38", SOURCE)
g38 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g38)


class Gemini38ModelsTests(unittest.TestCase):
    def test_three_models_distinct_and_correct_endpoints(self):
        entries = g38.definitions()
        self.assertEqual([m["id"] for m in entries], list(g38.IDS))
        self.assertIn("generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                      entries[0]["url"])
        for model in entries[1:]:
            self.assertEqual(model["url"], "http://127.0.0.1:3100/v1/chat/completions")
            self.assertFalse(model["supportsImages"])

    def test_environment_refs_without_secrets_in_git(self):
        for model in g38.definitions():
            self.assertTrue(model["apiKey"].startswith("$" + "{MCF_CODEBUDDY_"))
            self.assertTrue(model["apiKey"].endswith("}"))

    def test_preserve_unrelated_models(self):
        current = {"models": [{"id": "existing", "vendor": "other", "url": "http://example.com"}],
                   "other": {"preserve": True}}
        merged = g38.merge_models(current)
        self.assertEqual(merged["models"][0], current["models"][0])
        self.assertTrue(merged["other"]["preserve"])
        self.assertEqual(len(merged["models"]), 4)

    def test_merge_idempotent(self):
        first = g38.merge_models({"models": []})
        second = g38.merge_models(first)
        self.assertEqual(second, first)

    def test_conflict_does_not_override_user_model(self):
        with self.assertRaises(ValueError):
            g38.merge_models({"models": [{"id": "gemini-3.8-flash", "vendor": "Google Custom"}]})

    def test_available_models_kept_and_appended(self):
        merged = g38.merge_models({"models": [], "availableModels": ["custom-old"]})
        self.assertEqual(merged["availableModels"], ["custom-old", *g38.IDS])

    def test_secure_unit_change(self):
        unit = "[Unit]\nDescription=CodeBuddy\n[Service]\nExecStart=codebuddy --serve --host 127.0.0.1 --port 46514 --auth password\n"
        changed = g38.unit_with_models(unit)
        self.assertIn("EnvironmentFile=", changed)
        self.assertEqual(changed, g38.unit_with_models(changed))
        with self.assertRaises(PermissionError):
            g38.unit_with_models(unit.replace("--auth password", "--auth none"))
        with self.assertRaises(PermissionError):
            g38.unit_with_models(unit.replace("127.0.0.1", "0.0.0.0"))

    def test_secret_permissions_and_format(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "secret"
            path.write_text("testsecret\n")
            path.chmod(0o600)
            self.assertEqual(g38.safe_secret(path), "testsecret")
            path.chmod(0o644)
            with self.assertRaises(PermissionError):
                g38.safe_secret(path)

    def test_no_mutation_of_input(self):
        original = {"models": []}
        g38.merge_models(original)
        self.assertEqual(original, {"models": []})


if __name__ == "__main__":
    unittest.main()
