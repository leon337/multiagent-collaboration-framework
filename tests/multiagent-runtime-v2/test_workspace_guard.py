import tempfile, unittest
from pathlib import Path
from workspace_guard import WorkspaceManager, WorkspaceConflict, WorkspaceAuthorizationError

class WorkspaceGuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.w=WorkspaceManager(Path(self.tmp.name)/'ws')
        self.w.create('a','agent-a',['src']); self.w.create('b','agent-b',['src'])
    def tearDown(self): self.tmp.cleanup()
    def test_isolated_same_path_does_not_cross_write(self):
        self.w.write_file('a','agent-a','src/x.txt','A'); self.w.write_file('b','agent-b','src/x.txt','B')
        self.assertEqual(self.w.read_file('a','agent-a','src/x.txt'),b'A'); self.assertEqual(self.w.read_file('b','agent-b','src/x.txt'),b'B')
    def test_conflict_detection_and_gate(self):
        self.w.write_file('a','agent-a','src/x.txt','A'); self.w.write_file('b','agent-b','src/x.txt','B')
        plan=self.w.reconciliation_plan(['a','b']); self.assertIn('src/x.txt',plan['conflicts']); self.assertTrue(plan['requires_human_gate'])
        with self.assertRaises(WorkspaceAuthorizationError): self.w.reconcile(['a','b'],'target')
        with self.assertRaises(WorkspaceConflict): self.w.reconcile(['a','b'],'target',approve=True)
        r=self.w.reconcile(['a','b'],'target',approve=True,resolutions={'src/x.txt':'b'}); self.assertEqual(r['conflict_count'],1); self.assertEqual((Path(r['target'])/'src/x.txt').read_text(),'B')
    def test_owner_path_and_prefix_fail_closed(self):
        with self.assertRaises(WorkspaceAuthorizationError): self.w.write_file('a','agent-b','src/x','x')
        with self.assertRaises(WorkspaceAuthorizationError): self.w.write_file('a','agent-a','../escape','x')
        with self.assertRaises(WorkspaceAuthorizationError): self.w.write_file('a','agent-a','docs/x','x')
    def test_checkpoint_and_rollback(self):
        self.w.write_file('a','agent-a','src/x.txt','v1'); c=self.w.checkpoint('a','agent-a'); self.w.write_file('a','agent-a','src/x.txt','v2'); self.w.write_file('a','agent-a','src/y.txt','new')
        self.w.rollback('a','agent-a',c); self.assertEqual(self.w.read_file('a','agent-a','src/x.txt'),b'v1'); self.assertFalse((self.w._work('a')/'src/y.txt').exists())
