import tempfile
import unittest
from pathlib import Path

from journal_snapshot import AnchorSigner, SnapshotError, archive_prefix, create_snapshot, verify_snapshot
from runtime import MissionRuntime, MissionStore


class JournalSnapshotTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.store = MissionStore(self.root / "mission.db")
        self.addCleanup(self.store.close)
        self.runtime = MissionRuntime(self.store, "M")

    def seed(self):
        for i in range(3):
            task = self.runtime.create_task(f"t{i}", f"T{i}", [], "mestre")
            self.runtime.update_task(
                f"t{i}",
                task["revision"],
                "mestre",
                status="completed",
            )

    def test_snapshot_verify_and_archive(self):
        self.seed()
        snapshot = create_snapshot(self.store, "M", self.root / "snapshot.json")
        self.assertTrue(verify_snapshot(self.store, snapshot)["ok"])
        archive = archive_prefix(
            self.store,
            "M",
            snapshot,
            self.root / "events.jsonl",
        )
        self.assertEqual(archive["event_count"], 6)
        self.assertFalse(archive["destructive_compaction_performed"])

    def test_snapshot_tamper_rejected(self):
        self.seed()
        snapshot = create_snapshot(self.store, "M", self.root / "snapshot.json")
        snapshot["event_count"] = 1
        with self.assertRaises(SnapshotError):
            verify_snapshot(self.store, snapshot)

    def test_signed_anchor(self):
        self.seed()
        snapshot = create_snapshot(self.store, "M", self.root / "snapshot.json")
        signer = AnchorSigner(self.root / "anchor.key")
        anchor = signer.sign(
            snapshot,
            authority_id="LEANDRO",
            anchor_id="anchor-1",
        )
        self.assertTrue(signer.verify(anchor))
        anchor["journal_chain_head"] = "0" * 64
        self.assertFalse(signer.verify(anchor))

    def test_snapshot_prefix_remains_valid_after_new_events(self):
        self.seed()
        snapshot = create_snapshot(self.store, "M", self.root / "snapshot.json")
        self.runtime.create_task("later", "Later", [], "mestre")
        self.assertTrue(verify_snapshot(self.store, snapshot)["ok"])


if __name__ == "__main__":
    unittest.main()
