import multiprocessing as mp
import tempfile
import time
import unittest
from pathlib import Path

from local_runtime_pool import LocalRuntimePool, RuntimePoolBackpressure
from runtime import MissionRuntime, MissionStore


def _pool_worker(db_path, lock_path, barrier, index, queue):
    store = MissionStore(db_path)
    runtime = MissionRuntime(store, "M")
    pool = LocalRuntimePool(runtime, "P", lock_path)
    barrier.wait(timeout=10)
    try:
        slot = pool.acquire(
            f"run-{index}",
            f"task-{index}",
            f"worker-{index}",
            f"worker-{index}",
        )
        queue.put(("acquired", slot["slot"]))
        time.sleep(0.25)
        pool.release(f"run-{index}", f"worker-{index}")
    except RuntimePoolBackpressure:
        queue.put(("backpressure", None))
    finally:
        store.close()


class RuntimePoolConcurrencyTests(unittest.TestCase):
    def test_four_processes_respect_two_slot_limit(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            db = root / "mission.db"
            lock = root / "pool.lock"

            store = MissionStore(db)
            runtime = MissionRuntime(store, "M")
            LocalRuntimePool(runtime, "P", lock).configure(2, "mestre")
            store.close()

            ctx = mp.get_context("spawn")
            barrier = ctx.Barrier(5)
            queue = ctx.Queue()
            processes = [
                ctx.Process(
                    target=_pool_worker,
                    args=(str(db), str(lock), barrier, index, queue),
                )
                for index in range(4)
            ]
            for process in processes:
                process.start()
            barrier.wait(timeout=10)
            for process in processes:
                process.join(10)

            self.assertTrue(all(process.exitcode == 0 for process in processes))
            results = [queue.get(timeout=1) for _ in processes]
            self.assertEqual(sum(r[0] == "acquired" for r in results), 2)
            self.assertEqual(sum(r[0] == "backpressure" for r in results), 2)
            self.assertEqual(len({r[1] for r in results if r[0] == "acquired"}), 2)

            store = MissionStore(db)
            pool = LocalRuntimePool(MissionRuntime(store, "M"), "P", lock)
            self.assertEqual(pool.projection().active, {})
            store.close()


if __name__ == "__main__":
    unittest.main()
