import json,tempfile,unittest
from pathlib import Path
from runtime import MissionStore,MissionRuntime
from runtime_metrics import collect,policy
class RuntimeMetricsTests(unittest.TestCase):
  def test_collect_and_journal_queue(self):
    with tempfile.TemporaryDirectory() as d:
      t=Path(d);(t/'receipts').mkdir();(t/'evidence').mkdir()
      for i in range(3):
        (t/'receipts'/f'w{i}.json').write_text(json.dumps({'worker':f'w{i}','status':'PASS','duration_ms':10*(i+1)}));(t/'evidence'/f'w{i}.json').write_text(json.dumps({'worker':f'w{i}','started':100+i,'ended':105+i}))
      db=t/'m.db';s=MissionStore(db);r=MissionRuntime(s,'M');x=r.create_task('x','X',[],'m');r.lease_task('x',x['revision'],'a',10,'a');s.close();m=collect(t,mission_db=db,mission_id='M')
      self.assertEqual(m['worker_count'],3);self.assertEqual(m['success_rate'],1);self.assertEqual(m['queue_time_ms']['observed'],1)
  def test_policy(self):
    p=policy({'worker_count':3,'success_rate':1.0,'peak_concurrency_observed':3,'duration_ms':{'p95':100}},5);self.assertEqual(p['team_size'],4);self.assertIn('BLOCKED_G08',p['model_policy'])
