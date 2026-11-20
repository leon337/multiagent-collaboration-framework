import json
import os
from pathlib import Path
import tempfile
import time
import unittest
import uuid
from unittest.mock import patch
import proposal
import app_executor as a
from server import operate

BASE_SHA="e4a7108e80407189dabcdaabec288e005b02539e"
def valid():
    return {"mission_id":"MCF-GH-WRITE-3085-001","phase_id":"F1","agent_id":"Rafael",
            "branch":"agent/dsh3085/test-phase-one","base_sha":BASE_SHA,
            "title":"feat: validate agent-proposal gate","body":"Draft change; independent review required",
            "files":[{"path":"tools/mcf-dsh-github-readonly-mcp/test-proposal.md","content":"hello\n"}]}
def envelope(x=None):
    value=proposal.normalize(x or valid())
    return {"proposal_id":str(uuid.uuid4()),"digest_sha256":proposal.digest(value),
            "created_unix":int(time.time()),"proposal":value}
class FakeApp:
    def __init__(self,fail_at=None):
        self.calls=[];self.fail_at=fail_at;self.installation_id="123456"
    def installation_token(self):
        self.calls.append(("token",None));return "test-token"
    def call(self,method,path,body=None,token=None):
        self.calls.append((method,path))
        if self.fail_at and self.fail_at in path:raise a.GateError("NETWORK FAILURE")
        if path.endswith("/git/ref/heads/main"):return {"object":{"sha":BASE_SHA}}
        if method=="GET" and "/contents/" in path:raise a.GateError("GitHub HTTP 404 on GET contents")
        if method=="POST" and path.endswith("/pulls"):return {"draft":True,"number":3,"html_url":"https://github.com/leon337/multiagent-collaboration-framework/pull/3"}
        if method=="GET" and path.endswith("/pulls/3"):
            return {"draft":True,"state":"open","head":{"ref":"agent/dsh3085/test-phase-one"},"base":{"ref":"main"}}
        return {"ok":True}
class ProposalTests(unittest.TestCase):
    def test_valid_canonical(self):
        v=proposal.normalize(valid());self.assertEqual(v["approval_state"],"PROPOSED_UNAUTHORIZED")
        self.assertEqual(v["repository"],proposal.REPO)
    def test_denies_unsafe_paths(self):
        for p in (".github/workflows/evil.yml","tools/../docs/x.md","/etc/passwd",
                  "secret.env","tools/a/.env","src/core.py"):
            x=valid();x["files"][0]["path"]=p
            with self.subTest(path=p),self.assertRaises(proposal.Rejected):proposal.normalize(x)
    def test_denies_secret(self):
        x=valid();x["files"][0]["content"]="-----BEGIN PRIVATE KEY-----"
        with self.assertRaises(proposal.Rejected):proposal.normalize(x)
    def test_denies_wrong_branch(self):
        x=valid();x["branch"]="main"
        with self.assertRaises(proposal.Rejected):proposal.normalize(x)
    def test_denies_bad_sha(self):
        x=valid();x["base_sha"]="main"
        with self.assertRaises(proposal.Rejected):proposal.normalize(x)
    def test_denies_duplicate_files(self):
        x=valid();x["files"].append(dict(x["files"][0]))
        with self.assertRaises(proposal.Rejected):proposal.normalize(x)
    def test_durable_proposal_no_git_write(self):
        with tempfile.TemporaryDirectory() as t:
            r=proposal.submit(valid(),t)
            self.assertEqual(r["state"],"PROPOSED_UNAUTHORIZED")
            file=Path(t)/(r["proposal_id"]+".json")
            self.assertEqual(file.stat().st_mode & 0o777,0o600)
            data=json.loads(file.read_text())
            self.assertEqual(data["digest_sha256"],proposal.digest(data["proposal"]))
    def test_mcp_exposes_proposal_only(self):
        self.assertIn("github_submit_proposal",[x["name"] for x in __import__("server").TOOLS])
        self.assertNotIn("github_execute_pr",[x["name"] for x in __import__("server").TOOLS])
class ExecutorTests(unittest.TestCase):
    def test_no_auth_is_no_effect(self):
        with tempfile.TemporaryDirectory() as t:
            c=FakeApp()
            with self.assertRaises(a.GateError):
                a.run_authorized(envelope(),None,c,a.Ledger(t))
            self.assertEqual(c.calls,[])
            self.assertEqual(list(Path(t).glob("*.json")),[])
    def test_model_supplied_auth_flag_is_not_authorization(self):
        with tempfile.TemporaryDirectory() as t:
            c=FakeApp();env=envelope();env["proposal"]["approval_state"]="AUTHORIZED"
            with self.assertRaises(a.GateError):
                a.run_authorized(env,lambda _:{"status":"AUTHORIZED"},c,a.Ledger(t))
            self.assertEqual(c.calls,[])
    def test_runtime_auth_callback_must_bind_digest(self):
        with tempfile.TemporaryDirectory() as t:
            c=FakeApp()
            with self.assertRaises(a.GateError):
                a.run_authorized(envelope(),lambda _:{"status":"AUTHORIZED","digest":"wrong","authority":"MCF_RUNTIME_VERIFIED"},c,a.Ledger(t))
            self.assertEqual(c.calls,[])
    def test_unprovisioned_app_rejected(self):
        with self.assertRaises(a.GateError):a.GitHubApp.from_env({})
    def test_mocked_success_draft_only(self):
        with tempfile.TemporaryDirectory() as t:
            env=envelope();c=FakeApp()
            def grant(f):return {"status":"AUTHORIZED","digest":f["proposal_digest"],"authority":"MCF_RUNTIME_VERIFIED"}
            r=a.run_authorized(env,grant,c,a.Ledger(t))
            self.assertEqual(r["status"],"EXECUTED")
            self.assertEqual(r["pr_number"],3)
            self.assertTrue(any(m=="POST" and p.endswith("/pulls") for m,p in c.calls))
            self.assertFalse(any("merge" in str(x) or "deploy" in str(x) for x in c.calls))
            with self.assertRaisesRegex(a.GateError,"DUPLICATE_OR_UNKNOWN_WRITE"):
                a.run_authorized(env,grant,c,a.Ledger(t))
    def test_failure_after_branch_remains_unknown(self):
        with tempfile.TemporaryDirectory() as t:
            env=envelope();c=FakeApp(fail_at="/pulls")
            def grant(f):return {"status":"AUTHORIZED","digest":f["proposal_digest"],"authority":"MCF_RUNTIME_VERIFIED"}
            with self.assertRaises(a.GateError):a.run_authorized(env,grant,c,a.Ledger(t))
            item=json.loads(next(Path(t).glob("*.json")).read_text())
            self.assertEqual(item["status"],"EFFECT_UNKNOWN")
            with self.assertRaisesRegex(a.GateError,"DUPLICATE_OR_UNKNOWN_WRITE"):
                a.run_authorized(env,grant,c,a.Ledger(t))
    def test_stale_sha_blocks_write(self):
        with tempfile.TemporaryDirectory() as t:
            env=envelope();c=FakeApp()
            old_call=c.call
            def altered(method,path,body=None,token=None):
                if path.endswith("/git/ref/heads/main"):return {"object":{"sha":"f"*40}}
                return old_call(method,path,body,token)
            c.call=altered
            def grant(f):return {"status":"AUTHORIZED","digest":f["proposal_digest"],"authority":"MCF_RUNTIME_VERIFIED"}
            with self.assertRaisesRegex(a.GateError,"main SHA changed"):a.run_authorized(env,grant,c,a.Ledger(t))
            self.assertFalse(any(x[0]=="POST" for x in c.calls))
    def test_installation_token_rejects_unverified_repo_scope(self):
        x=a.GitHubApp("123","456","/nonexistent")
        x._jwt=lambda:"fake-jwt"
        x._call=lambda *args:{"token":"test-token-valid-length-001","permissions":{"contents":"write","pull_requests":"write"},
                               "repositories":[{"full_name":"another/repo"}]}
        with self.assertRaisesRegex(a.GateError,"repository scope"):
            x.installation_token()
    def test_installation_token_scoped(self):
        x=a.GitHubApp("123","456","/nonexistent")
        x._jwt=lambda:"fake-jwt"
        def call(method,path,body,token):
            self.assertEqual(method,"POST")
            self.assertEqual(body["repositories"],["multiagent-collaboration-framework"])
            return {"token":"installation-token-for-test-only","permissions":{"contents":"write","pull_requests":"write"},
                    "repositories":[{"full_name":proposal.REPO}]}
        x._call=call
        self.assertEqual(x.installation_token(),"installation-token-for-test-only")
    def test_scope_rejection(self):
        x=a.GitHubApp("123","456","/nonexistent")
        with self.assertRaises(a.GateError):x.call("POST","/repos/example/other/pulls",{},token="fake")
if __name__=="__main__":unittest.main()
