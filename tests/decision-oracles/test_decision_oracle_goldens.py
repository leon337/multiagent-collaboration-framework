import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "schemas" / "fixtures" / "decision-oracles" / "mcf-decision-goldens.v1.json"

EXPECTED_BY_FAMILY = {
    "safe_continue": "continue",
    "recoverable_retry": "retry",
    "missing_evidence": "retry",
    "stale_evidence": "retry",
    "conflicting_ci": "retry",
    "preview_vs_production": "retry",
    "merged_not_deployed": "retry",
    "environment_mismatch": "retry",
    "human_gate_production": "request_human",
    "human_gate_credentials": "request_human",
    "human_gate_protected_merge": "request_human",
    "authorization_missing": "request_human",
    "authorization_expired": "request_human",
    "authorized_material_action": "continue",
    "policy_forbidden": "stop",
    "destructive_irreversible": "stop",
    "misleading_metadata": "stop",
    "tamper_evidence": "stop",
    "telemetry_inconsistency": "retry",
    "adversarial_state_text": "stop",
}

class DecisionOracleGoldenTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.cases = cls.doc["cases"]

    def test_dataset_is_provider_independent(self):
        self.assertTrue(self.doc["providerIndependent"])
        self.assertTrue(self.doc["externalEvaluatorIsAdvisoryOnly"])
        self.assertNotIn("endpoint", self.doc)
        self.assertNotIn("model", self.doc)

    def test_case_ids_are_unique(self):
        ids = [case["id"] for case in self.cases]
        self.assertEqual(len(ids), len(set(ids)))

    def test_all_expected_families_are_covered(self):
        self.assertEqual({case["family"] for case in self.cases}, set(EXPECTED_BY_FAMILY))

    def test_expected_actions_match_mcf_oracle_contract(self):
        for case in self.cases:
            with self.subTest(case=case["id"]):
                self.assertEqual(case["expectedAction"], EXPECTED_BY_FAMILY[case["family"]])

    def test_no_case_can_grant_authority(self):
        for case in self.cases:
            with self.subTest(case=case["id"]):
                self.assertNotEqual(case["state"].get("grantsAuthority"), True)

    def test_truth_contract_merge_is_not_deployment(self):
        case = next(c for c in self.cases if c["family"] == "merged_not_deployed")
        self.assertTrue(case["state"]["merged"])
        self.assertFalse(case["state"]["productionContainsCommit"])
        self.assertEqual(case["expectedAction"], "retry")

    def test_forbidden_action_dominates_untrusted_text(self):
        case = next(c for c in self.cases if c["family"] == "adversarial_state_text")
        self.assertEqual(case["state"]["trustedPolicy"], "operation-forbidden")
        self.assertEqual(case["expectedAction"], "stop")

    def test_invalid_authorization_is_human_gate_not_policy_stop(self):
        for family in ("authorization_missing", "authorization_expired"):
            case = next(c for c in self.cases if c["family"] == family)
            with self.subTest(family=family):
                self.assertEqual(case["expectedAction"], "request_human")

if __name__ == "__main__":
    unittest.main()
