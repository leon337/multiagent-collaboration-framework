import tempfile,unittest
from capacity_probe import run
class CapacityProbeTests(unittest.TestCase):
  def test_six_explicit_processes_overlap(self):
    with tempfile.TemporaryDirectory() as d:
      r=run(d,6);self.assertEqual(r['pass_count'],6);self.assertEqual(r['unique_pids'],6);self.assertEqual(r['peak_concurrency_observed'],6)
