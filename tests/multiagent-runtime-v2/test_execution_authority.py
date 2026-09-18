import tempfile
import unittest
from pathlib import Path

from runtime import ConflictError, MissionError, MissionRuntime, MissionStore


class ExecutionAuthorityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store = MissionStore(Path(self.tmp.name) / "mission.db")
        self.addCleanup(self.store.close)
        self.rt = MissionRuntime(self.store, "M")

    def active_agent(self, agent_id="a1"):
        self.rt.provision_agent(agent_id, f"worker-{agent_id}", f"sandbox://{agent_id}", "mestre")
        return self.rt.settle_agent(agent_id, "active", "mestre")

    def leased_task(self, task_id="t1", owner_id="a1"):
        task = self.rt.create_task(task_id, task_id, [], "mestre")
        return self.rt.lease_task(task_id, task["revision"], owner_id, 30, owner_id)

    def test_unknown_agent_cannot_start_execution(self):
        self.leased_task(owner_id="ghost")
        with self.assertRaises(MissionError):
            self.rt.start_execution("e1", "ghost", "t1", "sandbox", "mestre")

    def test_provisioning_agent_cannot_start_execution(self):
        self.rt.provision_agent("a1", "worker-a1", "sandbox://a1", "mestre")
        self.leased_task(owner_id="a1")
        with self.assertRaises(ConflictError):
            self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")

    def test_unleased_task_cannot_start_execution(self):
        self.active_agent("a1")
        self.rt.create_task("t1", "t1", [], "mestre")
        with self.assertRaises(ConflictError):
            self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")

    def test_agent_must_own_task_lease(self):
        self.active_agent("a1")
        self.active_agent("a2")
        self.leased_task(owner_id="a2")
        with self.assertRaises(ConflictError):
            self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")

    def test_execution_records_observed_lease_id(self):
        self.active_agent("a1")
        task = self.leased_task(owner_id="a1")
        execution = self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")
        self.assertEqual(execution["lease_id"], task["lease_id"])
        self.assertEqual(execution["status"], "running")

    def test_duplicate_running_execution_for_task_rejected(self):
        self.active_agent("a1")
        self.leased_task(owner_id="a1")
        self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")
        with self.assertRaises(ConflictError):
            self.rt.start_execution("e2", "a1", "t1", "sandbox", "mestre")

    def test_tool_requester_must_own_running_execution(self):
        self.active_agent("a1")
        self.leased_task(owner_id="a1")
        self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")
        with self.assertRaises(ConflictError):
            self.rt.request_tool("c1", "e1", "repo_read", "a" * 64, "mestre")

    def test_completed_execution_cannot_request_new_tool(self):
        self.active_agent("a1")
        self.leased_task(owner_id="a1")
        self.rt.start_execution("e1", "a1", "t1", "sandbox", "mestre")
        self.rt.finish_execution(
            "e1",
            "mestre",
            success=True,
            finish_reason="done",
        )
        with self.assertRaises(ConflictError):
            self.rt.request_tool("c1", "e1", "repo_read", "a" * 64, "a1")


if __name__ == "__main__":
    unittest.main()
