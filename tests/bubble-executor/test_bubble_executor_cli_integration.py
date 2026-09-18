import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CLI = ROOT / "ops" / "bubble-executor" / "bubble_executor.py"
CONTRACT = ROOT / "context" / "missions" / "mcf-memory-live-next-stable.json"
MISSION = "MCF-MEMORY-LIVE-NEXT-STABLE-001"


def run_cli(state_dir: Path, *args: str) -> dict:
    env = os.environ.copy()
    env["MCF_BUBBLE_STATE_DIR"] = str(state_dir)
    proc = subprocess.run(
        [sys.executable, str(CLI), *args],
        cwd=ROOT,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(proc.stdout)


class BubbleExecutorCliIntegrationTests(unittest.TestCase):
    def test_external_contract_recovers_across_fresh_state_directories(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "bubble-a"
            second = root / "bubble-b"

            imported_a = run_cli(
                first,
                "import-contract",
                "--mission", MISSION,
                "--file", str(CONTRACT),
            )
            run_a = run_cli(first, "prepare-run", "--mission", MISSION)
            checkpoint_a = run_cli(first, "checkpoint", "--mission", MISSION)

            self.assertEqual(
                run_a["execution_boundary"],
                "CHATGPT_BUBBLE_LOCAL_SANDBOX",
            )
            self.assertEqual(
                checkpoint_a["execution_boundary"],
                "CHATGPT_BUBBLE_LOCAL_SANDBOX",
            )
            self.assertEqual(len(checkpoint_a["checkpoint_sha256"]), 64)

            imported_b = run_cli(
                second,
                "import-contract",
                "--mission", MISSION,
                "--file", str(CONTRACT),
            )
            recovered_b = run_cli(second, "recover", "--mission", MISSION)

            self.assertNotEqual(first, second)
            self.assertEqual(
                imported_a["contract_sha256"],
                imported_b["contract_sha256"],
            )
            self.assertEqual(recovered_b["mission_id"], MISSION)
            self.assertEqual(recovered_b["human_authority"], "LEANDRO")
            self.assertEqual(
                recovered_b["persistent_source_of_truth"],
                "GitHub/MCF",
            )
            self.assertEqual(recovered_b["recovery_source"], "sandbox_cache")


if __name__ == "__main__":
    unittest.main()
