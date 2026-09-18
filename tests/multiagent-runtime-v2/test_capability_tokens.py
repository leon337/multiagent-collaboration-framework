import tempfile, unittest
from pathlib import Path
from capability_tokens import CapabilityIssuer, CapabilityDenied

class CapabilityTokenTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.issuer=CapabilityIssuer(Path(self.tmp.name)/'key')
    def tearDown(self): self.tmp.cleanup()
    def test_allow_and_deny_tool(self):
        t=self.issuer.issue('a','task',['repo_read'],60,now=100)
        self.assertEqual(self.issuer.verify(t,'repo_read',now=101)['task_id'],'task')
        with self.assertRaises(CapabilityDenied): self.issuer.verify(t,'shell',now=101)
    def test_expiry_fails_closed(self):
        t=self.issuer.issue('a','task',['repo_read'],5,now=100)
        with self.assertRaises(CapabilityDenied): self.issuer.verify(t,now=105)
    def test_child_must_narrow_parent(self):
        p=self.issuer.issue('a','task',['repo_read','test_run'],60,now=100)
        c=self.issuer.issue('a','task',['repo_read'],60,now=101,parent_token=p); self.assertEqual(self.issuer.verify(c,now=102)['allowed_tools'],['repo_read'])
        with self.assertRaises(CapabilityDenied): self.issuer.issue('a','task',['repo_read','shell'],60,now=101,parent_token=p)
    def test_revocation_fails_closed(self):
        t=self.issuer.issue('a','task',['repo_read'],60,now=100); self.issuer.revoke(t,'test')
        with self.assertRaises(CapabilityDenied): self.issuer.verify(t,now=101)
