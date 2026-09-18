import unittest, hashlib, json
from adversarial_auditor import TechnicalAdversarialAuditor

class AdversarialAuditorTests(unittest.TestCase):
    def setUp(self): self.a=TechnicalAdversarialAuditor(); self.e={'artifact':'ok'}
    def good(self):
        sha=hashlib.sha256(json.dumps(self.e,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        return {'claim':{'status':'PASS'},'checks':{'unit':'PASS','integration':'PASS'},
                'receipt':{'mission_id':'M','task_id':'t','execution_id':'e','actor_id':'a','result_sha256':sha},'evidence':self.e,
                'provenance':{'mission_id':'M','task_id':'t','execution_id':'e','actor_id':'a','evidence_refs':['artifact://one']}}
    def test_good_packet_passes(self): self.assertEqual(self.a.audit(self.good(),now=100)['verdict'],'PASS')
    def test_false_green_rejected(self):
        p=self.good(); p['checks']['integration']='FAIL'; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_missing_receipt_rejected(self):
        p=self.good(); p.pop('receipt'); self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_forged_evidence_rejected(self):
        p=self.good(); p['evidence']={'artifact':'tampered'}; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_mailbox_poisoning_rejected(self):
        p=self.good(); p['message']={'target_id':'victim'}; p['expected_message_target']='agent-b'; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_capability_escalation_rejected(self):
        p=self.good(); p['parent_capability']={'agent_id':'a','task_id':'t','allowed_tools':['read'],'expires_at':200}; p['child_capability']={'agent_id':'a','task_id':'t','allowed_tools':['read','shell'],'expires_at':220}; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_stale_lease_rejected(self):
        p=self.good(); p['task']={'status':'leased','lease_until':99}; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_executor_crash_without_checkpoint_rejected(self):
        p=self.good(); p['execution']={'status':'recovery_required'}; p['recovery']={}; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_missing_provenance_rejected(self):
        p=self.good(); p['provenance']['evidence_refs']=[]; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
    def test_invalid_dag_rejected(self):
        p=self.good(); p['dag']={'a':['b'],'b':['a']}; self.assertEqual(self.a.audit(p,now=100)['verdict'],'REJECT')
