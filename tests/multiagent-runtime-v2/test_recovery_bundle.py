import json,tempfile,unittest
from pathlib import Path
from recovery_bundle import export_events,import_events,load_export,build_capsule,validate_capsule,materialize_from_map,resume_plan,RecoveryIntegrityError,RecoveryError
from runtime import MissionStore,MissionRuntime

class RecoveryBundleTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.db=self.root/'source.db';self.s=MissionStore(self.db);self.r=MissionRuntime(self.s,'M')
    def tearDown(self):
        try:self.s.close()
        except Exception:pass
        self.tmp.cleanup()
    def seed(self):
        a=self.r.create_task('a','A',[],'mestre');self.r.update_task('a',a['revision'],'mestre',status='completed')
        b=self.r.create_task('b','B',['a'],'mestre');b=self.r.lease_task('b',b['revision'],'worker-old',1,'worker-old');self.r.recover_expired_leases('recovery',b['lease_until']+1)
        self.r.queue_message('m1','agent-a','agent-b','hello','agent-a')
        self.r.create_session('s1','agent-b','local-process','mestre','b');self.r.checkpoint_session('s1','a'*64,'agent-b');self.r.interrupt_session('s1','agent-b','pause')
    def test_export_import_fresh_store_preserves_projection(self):
        self.seed();p=self.root/'events.jsonl';meta=export_events(self.s,'M',p);self.s.close()
        t=MissionStore(self.root/'target.db');res=import_events(t,p);proj=MissionRuntime(t,'M').projection()
        self.assertEqual(res['journal_export_sha256'],meta['journal_export_sha256']);self.assertEqual(proj.tasks['b']['status'],'blocked');self.assertIn('m1',proj.messages);self.assertEqual(proj.sessions['s1']['status'],'interrupted');t.close()
    def test_tampered_export_rejected(self):
        self.seed();p=self.root/'events.jsonl';export_events(self.s,'M',p);rows=p.read_text().splitlines();d=json.loads(rows[0]);d['payload']['subject']='HACK';rows[0]=json.dumps(d);p.write_text('\n'.join(rows)+'\n')
        with self.assertRaises(RecoveryIntegrityError):load_export(p)
    def test_capsule_materializes_and_missing_artifact_fails(self):
        a=self.root/'a.txt';b=self.root/'sub/b.txt';b.parent.mkdir();a.write_text('A');b.write_text('B')
        cap=build_capsule(self.root,'M',['a.txt','sub/b.txt'],self.root/'cap.json');target=self.root/'fresh';materialize_from_map(target,cap,{'a.txt':b'A','sub/b.txt':b'B'});(target/'cap.json').write_text(json.dumps(cap))
        self.assertTrue(validate_capsule(target,target/'cap.json')['ok']);(target/'a.txt').unlink();self.assertFalse(validate_capsule(target,target/'cap.json')['ok'])
    def test_resume_plan_and_reassign_after_import(self):
        self.seed();p=self.root/'events.jsonl';export_events(self.s,'M',p);self.s.close();t=MissionStore(self.root/'target.db');import_events(t,p);rt=MissionRuntime(t,'M');proj=rt.projection();plan=resume_plan(proj,now=10**12)
        self.assertIn('b',plan['recovery_tasks']);self.assertIn('s1',plan['interrupted_sessions'])
        b=proj.tasks['b'];b=rt.lease_task('b',b['revision'],'worker-new',30,'worker-new');self.assertEqual(b['owner_id'],'worker-new');rt.resume_session('s1','agent-b');self.assertEqual(rt.projection().sessions['s1']['status'],'active');t.close()
    def test_import_into_nonempty_store_fails(self):
        self.seed();p=self.root/'events.jsonl';export_events(self.s,'M',p);t=MissionStore(self.root/'target.db');MissionRuntime(t,'M').create_task('x','X',[],'mestre')
        with self.assertRaises(RecoveryError):import_events(t,p)
        t.close()
