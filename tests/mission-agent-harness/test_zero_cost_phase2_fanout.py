import importlib.util
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

MODULE_PATH = Path(__file__).resolve().parents[2] / "ops" / "mission-agent-harness" / "zero_cost_phase2_fanout.py"
SPEC = importlib.util.spec_from_file_location("phase2_harness", MODULE_PATH)
h = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = h
SPEC.loader.exec_module(h)


class HarnessRegressionTests(unittest.TestCase):
    def test_json_parser_accepts_control_characters(self):
        raw = '{"tool":"repo_search","args":{"query":"line1\nline2"}}'
        obj = h.extract_json_object(raw)
        self.assertEqual(obj["tool"], "repo_search")

    def test_invalid_model_tool_falls_back_safely(self):
        packet = h.AgentPacket("Emily", "Auditoria", "audit", "Léo")
        with mock.patch.object(h, "run_model", return_value='{"tool":"audit_package","args":{}}'):
            req = h.request_tool_call("fake", packet, "ctx", 1)
        self.assertEqual(req["tool"], "repo_search")
        self.assertEqual(req["_selection_source"], "HARNESS_FALLBACK")

    def test_invalid_read_path_falls_back_without_execution_credit(self):
        packet = h.AgentPacket("Miriam", "Memória", "review memory", "Carmem+Emily")
        with mock.patch.object(
            h,
            "run_model",
            return_value='{"tool":"repo_read","args":{"path":"public_repo.md"}}',
        ):
            req = h.request_tool_call("fake", packet, "ctx", 1)
        self.assertEqual(req["tool"], "repo_search")
        self.assertEqual(req["_selection_source"], "HARNESS_FALLBACK")

    def test_output_normalization_preserves_real_tool_evidence(self):
        packet = h.AgentPacket("Tiago", "IA", "analyze", "Carmem+Emily")
        evidence = h.ToolEvidence(
            call_id="call-1",
            tool="repo_search",
            args={"query": h.MISSION_ID},
            args_sha256="a" * 64,
            result_sha256="b" * 64,
            result_chars=10,
            selection_source="HARNESS_FALLBACK",
        )
        out = h.normalize_output(packet, "raw analysis without headings", evidence)
        for heading in h.REQUIRED_HEADINGS:
            self.assertIn(heading, out)
        self.assertIn("call-1", out)
        self.assertIn("raw analysis without headings", out)


    def test_repo_search_uses_fixed_string_for_model_query(self):
        fake = mock.Mock(returncode=1, stdout="", stderr="")
        with mock.patch.object(h, "run_command", return_value=fake) as runner:
            out = h.tool_repo_search({"query": "Experience [Layer"})
        self.assertEqual(out, "NO_MATCHES")
        argv = runner.call_args.args[0]
        self.assertIn("-F", argv)
        self.assertIn("Experience [Layer", argv)

    def test_parallel_retry_only_reexecutes_failed_agent(self):
        a = h.AgentPacket("A", "role", "focus", "next")
        b = h.AgentPacket("B", "role", "focus", "next")
        result_a = mock.Mock(agent_id="A")
        result_b = mock.Mock(agent_id="B")
        with mock.patch.object(
            h,
            "run_parallel",
            side_effect=[
                ([result_a], {"B": "TimeoutExpired: first attempt"}),
                ([result_b], {}),
            ],
        ) as runner:
            results, failures, retries = h.run_parallel_with_retry(
                "model",
                [a, b],
                "A",
                "context",
                600,
            )
        self.assertEqual([r.agent_id for r in results], ["A", "B"])
        self.assertEqual(failures, {})
        self.assertEqual(retries, {"B": 1})
        self.assertEqual(runner.call_count, 2)
        retried_packets = runner.call_args_list[1].args[1]
        self.assertEqual([packet.agent_id for packet in retried_packets], ["B"])


if __name__ == "__main__":
    unittest.main()
