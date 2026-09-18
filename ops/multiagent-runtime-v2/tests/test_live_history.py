import json
import multiprocessing as mp
import tempfile
import unittest
from pathlib import Path

from live_history import HistoryConflict, HistoryIntegrityError, HistoryLog

MISSION = "HIST-TEST"

def _append_worker(path, idx):
    log = HistoryLog(path)
    log.append(MISSION, f"worker-{idx}", "WORK", f"done-{idx}", idempotency_key=f"k-{idx}")

class LiveHistoryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "history.jsonl"
        self.log = HistoryLog(self.path)

    def tearDown(self):
        self.tmp.cleanup()

    def test_append_replay_and_chain(self):
        a = self.log.append(MISSION, "MESTRE", "MISSION", "start", idempotency_key="k1")
        b = self.log.append(MISSION, "worker-tests", "TEST", "7/7 PASS", evidence={"tests": 7}, idempotency_key="k2")
        events = self.log.replay(MISSION)
        self.assertEqual([e.seq for e in events], [1, 2])
        self.assertEqual(b.prev_sha256, a.event_sha256)
        self.assertEqual(self.log.projection(MISSION)["chain_head"], b.event_sha256)

    def test_idempotency_same_content_returns_same_event(self):
        a = self.log.append(MISSION, "MESTRE", "WORK", "same", evidence={"x": 1}, idempotency_key="same")
        b = self.log.append(MISSION, "MESTRE", "WORK", "same", evidence={"x": 1}, idempotency_key="same")
        self.assertEqual(a.event_id, b.event_id)
        self.assertEqual(len(self.log.replay(MISSION)), 1)

    def test_idempotency_conflict_fails_closed(self):
        self.log.append(MISSION, "MESTRE", "WORK", "one", idempotency_key="conflict")
        with self.assertRaises(HistoryConflict):
            self.log.append(MISSION, "MESTRE", "WORK", "two", idempotency_key="conflict")

    def test_tamper_is_detected(self):
        self.log.append(MISSION, "MESTRE", "WORK", "original", idempotency_key="t")
        row = json.loads(self.path.read_text().strip())
        row["text"] = "tampered"
        self.path.write_text(json.dumps(row) + "\n")
        with self.assertRaises(HistoryIntegrityError):
            self.log.replay(MISSION)

    def test_concurrent_append_serializes(self):
        procs = [mp.Process(target=_append_worker, args=(str(self.path), i)) for i in range(6)]
        for p in procs: p.start()
        for p in procs: p.join(5)
        self.assertTrue(all(p.exitcode == 0 for p in procs))
        events = self.log.replay(MISSION)
        self.assertEqual(len(events), 6)
        self.assertEqual([e.seq for e in events], list(range(1, 7)))

if __name__ == "__main__":
    unittest.main()
