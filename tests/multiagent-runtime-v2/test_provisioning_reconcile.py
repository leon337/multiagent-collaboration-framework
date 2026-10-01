import tempfile
import unittest
from pathlib import Path

from runtime import ConflictError, MissionRuntime, MissionStore


class ProvisioningReconcileTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "mission.db"
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")

    def tearDown(self):
        try:
            self.store.close()
        except Exception:
            pass

    def reopen(self):
        self.store.close()
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")

    def test_executor_ref_survives_restart_and_reconciles_active(self):
        agent = self.runtime.provision_agent(
            "a1",
            "worker-one",
            "sandbox://child-session-1",
            "mestre",
        )
        self.assertEqual(agent["executor_ref"], "sandbox://child-session-1")
        self.reopen()
        report = self.runtime.reconcile_provisioning(
            {
                "a1": {
                    "phase": "active",
                    "executor_ref": "sandbox://child-session-1",
                    "evidence_ref": "artifact://child-session-1",
                }
            },
            "recovery",
        )
        self.assertEqual(report["settled"], {"a1": "active"})
        current = self.runtime.projection().agents["a1"]
        self.assertEqual(current["phase"], "active")
        self.assertEqual(current["evidence_ref"], "artifact://child-session-1")

    def test_missing_observation_remains_pending(self):
        self.runtime.provision_agent("a1", "worker-one", "sandbox://one", "mestre")
        report = self.runtime.reconcile_provisioning({}, "recovery")
        self.assertEqual(report["pending"], ["a1"])
        self.assertEqual(self.runtime.projection().agents["a1"]["phase"], "provisioning")

    def test_executor_mismatch_fails_closed(self):
        self.runtime.provision_agent("a1", "worker-one", "sandbox://one", "mestre")
        with self.assertRaises(ConflictError):
            self.runtime.reconcile_provisioning(
                {
                    "a1": {
                        "phase": "active",
                        "executor_ref": "sandbox://other",
                    }
                },
                "recovery",
            )
        self.assertEqual(self.runtime.projection().agents["a1"]["phase"], "provisioning")

    def test_failed_agent_name_remains_reserved(self):
        self.runtime.provision_agent("a1", "worker-one", "sandbox://one", "mestre")
        self.runtime.settle_agent("a1", "failed", "mestre", error="boom")
        with self.assertRaises(ConflictError):
            self.runtime.provision_agent(
                "a2",
                "worker-one",
                "sandbox://two",
                "mestre",
            )

    def test_same_agent_provision_retry_is_idempotent(self):
        first = self.runtime.provision_agent("a1", "worker-one", "sandbox://one", "mestre")
        second = self.runtime.provision_agent("a1", "worker-one", "sandbox://one", "mestre")
        self.assertEqual(first, second)
        self.assertEqual(len(self.runtime.projection().agents), 1)

    def test_contradictory_observation_after_settle_rejected(self):
        self.runtime.provision_agent("a1", "worker-one", "sandbox://one", "mestre")
        self.runtime.settle_agent("a1", "active", "mestre")
        with self.assertRaises(ConflictError):
            self.runtime.reconcile_provisioning(
                {
                    "a1": {
                        "phase": "failed",
                        "executor_ref": "sandbox://one",
                    }
                },
                "recovery",
            )

    def test_same_observation_after_settle_is_safe(self):
        self.runtime.provision_agent("a1", "worker-one", "sandbox://one", "mestre")
        self.runtime.settle_agent("a1", "active", "mestre")
        report = self.runtime.reconcile_provisioning(
            {
                "a1": {
                    "phase": "active",
                    "executor_ref": "sandbox://one",
                }
            },
            "recovery",
        )
        self.assertEqual(report["already_settled"], {"a1": "active"})
        self.assertEqual(report["settled"], {})

    def test_unknown_observation_is_reported_not_created(self):
        report = self.runtime.reconcile_provisioning(
            {"ghost": {"phase": "active", "executor_ref": "sandbox://ghost"}},
            "recovery",
        )
        self.assertEqual(report["unknown_observations"], ["ghost"])
        self.assertEqual(self.runtime.projection().agents, {})


if __name__ == "__main__":
    unittest.main()
