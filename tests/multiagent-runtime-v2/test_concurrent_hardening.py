import multiprocessing as mp
import os
import tempfile
import unittest
from pathlib import Path

from fair_scheduler import FairScheduler, SchedulerBackpressure
from mailbox_dispatcher import MailboxBackpressure, MailboxDispatcher
from runtime import MissionRuntime, MissionStore


def _dispatch_worker(db_path, lock_dir, output_file, result_queue):
    store = MissionStore(db_path)
    runtime = MissionRuntime(store, "M")
    dispatcher = MailboxDispatcher(runtime, lock_dir, max_pending_per_target=100)

    def deliver(message):
        fd = os.open(
            output_file,
            os.O_CREAT | os.O_WRONLY | os.O_APPEND,
            0o600,
        )
        try:
            os.write(fd, (message["message_id"] + "\n").encode())
        finally:
            os.close(fd)
        return True

    result_queue.put(
        dispatcher.dispatch("target", deliver, batch_size=100)
    )
    store.close()


def _queue_worker(db_path, lock_dir, message_id, result_queue):
    store = MissionStore(db_path)
    runtime = MissionRuntime(store, "M")
    dispatcher = MailboxDispatcher(
        runtime,
        lock_dir,
        max_pending_per_target=3,
    )
    try:
        dispatcher.queue(message_id, "sender", "target", message_id)
        result_queue.put("queued")
    except MailboxBackpressure:
        result_queue.put("backpressure")
    finally:
        store.close()


def _schedule_worker(db_path, lock_path, worker_id, result_queue):
    store = MissionStore(db_path)
    runtime = MissionRuntime(store, "M")
    scheduler = FairScheduler(
        runtime,
        max_active=1,
        per_lane_active=1,
        lock_path=lock_path,
    )
    try:
        task = scheduler.lease_next(worker_id, 30)
        result_queue.put(("leased", None if task is None else task["task_id"]))
    except SchedulerBackpressure:
        result_queue.put(("backpressure", None))
    finally:
        store.close()


class ConcurrentHardeningTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.db = self.root / "mission.db"
        self.locks = self.root / "locks"
        self.store = MissionStore(self.db)
        self.runtime = MissionRuntime(self.store, "M")

    def tearDown(self):
        if self.store is not None:
            self.store.close()

    @staticmethod
    def context():
        return mp.get_context("spawn")

    def close_seed_store(self):
        self.store.close()
        self.store = None

    def test_two_dispatchers_do_not_duplicate_target_delivery(self):
        dispatcher = MailboxDispatcher(self.runtime, self.locks)
        for i in range(20):
            dispatcher.queue(f"m{i:02d}", "a", "target", str(i))
        self.close_seed_store()

        ctx = self.context()
        queue = ctx.Queue()
        output = str(self.root / "delivered.txt")
        processes = [
            ctx.Process(
                target=_dispatch_worker,
                args=(str(self.db), str(self.locks), output, queue),
            )
            for _ in range(2)
        ]
        for process in processes:
            process.start()
        for process in processes:
            process.join(10)

        self.assertTrue(all(process.exitcode == 0 for process in processes))
        rows = (self.root / "delivered.txt").read_text().splitlines()
        self.assertEqual(rows, [f"m{i:02d}" for i in range(20)])
        self.assertEqual(len(set(rows)), 20)

        store = MissionStore(self.db)
        projection = MissionRuntime(store, "M").projection()
        self.assertEqual(len(projection.delivered_messages), 20)
        store.close()

    def test_concurrent_queue_respects_target_limit(self):
        self.close_seed_store()
        ctx = self.context()
        queue = ctx.Queue()
        processes = [
            ctx.Process(
                target=_queue_worker,
                args=(str(self.db), str(self.locks), f"m{i}", queue),
            )
            for i in range(5)
        ]
        for process in processes:
            process.start()
        for process in processes:
            process.join(10)

        results = [queue.get(timeout=1) for _ in processes]
        self.assertEqual(results.count("queued"), 3)
        self.assertEqual(results.count("backpressure"), 2)

    def test_two_schedulers_respect_global_max_active(self):
        self.runtime.create_task("a", "A", [], "mestre")
        self.runtime.create_task("b", "B", [], "mestre")
        self.close_seed_store()

        ctx = self.context()
        queue = ctx.Queue()
        lock_path = str(self.root / "scheduler.lock")
        processes = [
            ctx.Process(
                target=_schedule_worker,
                args=(str(self.db), lock_path, f"w{i}", queue),
            )
            for i in range(2)
        ]
        for process in processes:
            process.start()
        for process in processes:
            process.join(10)

        results = [queue.get(timeout=1) for _ in processes]
        self.assertEqual(sum(1 for result in results if result[0] == "leased"), 1)
        self.assertEqual(
            sum(1 for result in results if result[0] == "backpressure"),
            1,
        )

        store = MissionStore(self.db)
        projection = MissionRuntime(store, "M").projection()
        self.assertEqual(
            sum(task["status"] == "leased" for task in projection.tasks.values()),
            1,
        )
        store.close()


if __name__ == "__main__":
    unittest.main()
