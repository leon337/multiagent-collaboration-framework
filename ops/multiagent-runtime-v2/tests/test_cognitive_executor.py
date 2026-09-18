import tempfile, time, unittest
from pathlib import Path
from cognitive_executor import LocalProcessExecutor
from runtime_v2_local import Store, Runtime

class CognitiveExecutorTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        self.executor=LocalProcessExecutor(self.root/'executor')
    def tearDown(self):
        for eid in list(self.executor.processes):
            try:self.executor.dispose(eid)
            except Exception:pass
        self.tmp.cleanup()
    def _wait_step(self,eid,min_step=1,timeout=3):
        end=time.time()+timeout
        while time.time()<end:
            cp=self.executor.collect_events(eid)['checkpoint']
            if cp and int(cp.get('last_step',0))>=min_step:return cp
            time.sleep(.01)
        self.fail('step checkpoint timeout')
    def test_doctor_declares_non_cognitive_truthfully(self):
        d=self.executor.doctor(); self.assertTrue(d['available']); self.assertFalse(d['cognitive']); self.assertEqual(d['boundary'],'chatgpt-bubble-local-sandbox')
    def test_provision_start_complete_and_collect(self):
        self.executor.provision_agent('agent-a')
        run=self.executor.start_task('agent-a','task-a',{'steps':3,'delay_s':.005})
        p=self.executor.wait(run['execution_id'],3)
        self.assertEqual(p['checkpoint']['status'],'completed')
        kinds=[x['kind'] for x in p['history']]
        self.assertIn('EXECUTOR_STARTED',kinds); self.assertIn('EXECUTOR_COMPLETED',kinds); self.assertEqual(kinds.count('EXECUTOR_STEP'),3)
    def test_crash_new_executor_instance_resumes_same_execution(self):
        run=self.executor.start_task('agent-a','task-resume',{'steps':30,'delay_s':.02})
        eid=run['execution_id']; self._wait_step(eid,2); self.executor.simulate_crash(eid)
        before=self.executor.collect_events(eid); self.assertNotEqual(before['checkpoint']['status'],'completed')
        replacement=LocalProcessExecutor(self.root/'executor')
        replacement.resume(eid); after=replacement.wait(eid,5)
        self.assertEqual(after['checkpoint']['status'],'completed')
        steps=[x for x in after['history'] if x['kind']=='EXECUTOR_STEP']
        self.assertEqual(len(steps),30); self.assertGreaterEqual(after['checkpoint']['attempt'],2)
        replacement.dispose(eid)
    def test_mission_state_survives_executor_crash_and_reopen(self):
        db=self.root/'mission.db'; s=Store(db); rt=Runtime(s,'M')
        rt.create_task('t','durable task',allowed_tools=[]); rt.start_execution('e','agent-a','t','local-process'); s.close()
        run=self.executor.start_task('agent-a','t',{'execution_id':'e','steps':30,'delay_s':.02}); self._wait_step('e',1); self.executor.simulate_crash('e')
        s=Store(db); rt=Runtime(s,'M'); self.assertIn('t',rt.projection().tasks); self.assertEqual(rt.projection().executions['e']['status'],'running'); s.close()
        replacement=LocalProcessExecutor(self.root/'executor'); replacement.resume('e'); p=replacement.wait('e',5)
        s=Store(db); rt=Runtime(s,'M'); rt.finish_execution('e','agent-a',True,finish_reason='resumed_after_executor_crash',artifact_refs=[str(self.root/'executor'/'executions'/'e')],resource_usage={'attempts':p['checkpoint']['attempt']}); self.assertEqual(rt.projection().executions['e']['status'],'completed'); s.close(); replacement.dispose('e')

if __name__=='__main__':unittest.main()
