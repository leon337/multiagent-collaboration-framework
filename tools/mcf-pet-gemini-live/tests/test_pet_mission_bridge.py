from __future__ import annotations
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import stat
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"backend"))
import pet_proposals
import pet_mission_bridge as bridge

def sample():
    return {
        "title":"Examinar desempenho do serviço Ollama",
        "objective":"Investigar latência no Ollama sem alterar configurações ou serviços.",
        "summary":"Examinar métricas observadas e propor medidas reversíveis para revisão técnica.",
        "steps":[
            "Verificar métricas de RAM e GPU relacionadas ao serviço local.",
            "Preparar uma proposta técnica para revisão de LÉO sem executar ações."
        ],
        "risks":"Mudanças de configuração poderão interromper serviços ativos.",
        "rollback":"Restabelecer parâmetros anteriores apenas mediante missão autorizada.",
        "priority":"media",
    }

class MissionBridgeTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        root=Path(self.tmp.name)
        self.proposal_dir=root/"proposal"
        self.proposal_dir.mkdir(mode=0o700)
        self.proposals=self.proposal_dir/"proposals.sqlite3"
        self.handoff_dir=root/"handoff"
        self.handoff_dir.mkdir(mode=0o700)
        self.db=self.handoff_dir/"handoffs.sqlite3"
        self.source=pet_proposals.create_proposal(sample(),"a"*32,"gemini-call",[],self.proposals)

    def tearDown(self):
        self.tmp.cleanup()

    def review(self):
        return pet_proposals.review_proposal(
            self.source["id"],"reviewed_for_planning",1,"Revisado para planejamento.",self.proposals)

    def test_unreviewed_ai_draft_must_never_be_sent_to_runtime(self):
        with self.assertRaises(bridge.BridgeError) as error:
            bridge.export_reviewed_proposal(self.source["id"],1,self.db,self.proposals)
        self.assertEqual(error.exception.code,"REVIEW_REQUIRED")
        self.assertFalse(self.db.exists())

    def test_reviewed_proposal_exports_canonical_contract_locally(self):
        p=self.review()
        draft=bridge.export_reviewed_proposal(p["id"],p["version"],self.db,self.proposals)
        self.assertEqual(draft["status"],"LOCAL_DRAFT_ONLY")
        self.assertIsNone(draft["runtime_mission_id"])
        self.assertFalse(draft["human_gate"])
        self.assertFalse(draft["execution_authorized"])
        self.assertFalse(draft["import_ready"])
        self.assertEqual(draft["validation_status"],"CONTEXT_INCOMPLETE")
        self.assertIn("ALIGNED_PIP_REQUIRED",draft["runtime_import_blockers"])
        self.assertIn("methodologyPin",draft["required_project_context"])
        self.assertIn("alignedPipRef",draft["required_project_context"])
        self.assertEqual(draft["mission_runtime_endpoint"],"/v1/mcf/missions")
        contract=draft["request"]["contract"]
        for name in ("title","objective","expectedOutcome","scope",
                     "outOfScope","acceptanceCriteria","riskClass",
                     "selectedAgents","selectedSkills","sourceOfTruth"):
            self.assertIn(name,contract)
        self.assertEqual(contract["riskClass"],"C")
        self.assertEqual(contract["contractSchemaVersion"],"1.1")
        self.assertEqual(contract["projectId"],"multiagent-collaboration-framework")
        self.assertEqual(stat.S_IMODE(self.db.stat().st_mode),0o600)
        self.assertEqual(len(draft["payload_sha256"]),64)

    def test_replay_returns_identical_handoff_without_duplicate(self):
        p=self.review()
        first=bridge.export_reviewed_proposal(p["id"],2,self.db,self.proposals)
        again=bridge.export_reviewed_proposal(p["id"],2,self.db,self.proposals)
        self.assertEqual(first["handoff_id"],again["handoff_id"])
        self.assertEqual(len(bridge.list_handoffs(self.db)),1)

    def test_rejected_proposal_is_never_exported(self):
        pet_proposals.review_proposal(self.source["id"],"rejected",1,"",self.proposals)
        with self.assertRaises(bridge.BridgeError):
            bridge.export_reviewed_proposal(self.source["id"],2,self.db,self.proposals)

    def test_mismatched_version_rejected(self):
        self.review()
        with self.assertRaises(bridge.BridgeError) as err:
            bridge.export_reviewed_proposal(self.source["id"],1,self.db,self.proposals)
        self.assertEqual(err.exception.code,"PROPOSAL_VERSION_CONFLICT")

    def test_no_temporary_workspace_path_crossing(self):
        self.review()
        wrong=self.handoff_dir/"unsafe.db"
        wrong.symlink_to(self.proposals)
        with self.assertRaises(bridge.BridgeError):
            bridge.export_reviewed_proposal(self.source["id"],2,wrong,self.proposals)

    def test_no_external_network_call_during_export(self):
        self.review()
        with patch("pet_mission_bridge.http.client.HTTPConnection",
                   side_effect=AssertionError("Network call not authorized")):
            draft=bridge.export_reviewed_proposal(self.source["id"],2,self.db,self.proposals)
        self.assertEqual(draft["status"],"LOCAL_DRAFT_ONLY")

    def test_invalid_id_and_version(self):
        self.review()
        for ident,version in (("../secrets",2),(self.source["id"],True),
                              (self.source["id"],0)):
            with self.subTest(ident=ident,version=version),self.assertRaises(bridge.BridgeError):
                bridge.export_reviewed_proposal(ident,version,self.db,self.proposals)

    def context_proof(self) -> tuple[Path,dict]:
        cache=self.handoff_dir/"verified-project-context.json"
        now=datetime.now(timezone.utc)
        ref={
            "artifactType":"PROJECT_INTENT_PACKAGE","schemaVersion":"1.0",
            "projectId":bridge.PROJECT_ID,"revisionId":bridge.PIP_REVISION,
            "path":".mcf/intent/pip-"+bridge.PIP_REVISION+".json",
            "contentDigest":bridge.PIP_DIGEST,"repository":bridge.REPOSITORY,
            "commitSha":None,
        }
        document={
            "schemaVersion":1,"authority":"LOCAL_VERIFIED_CANONICAL_ARTIFACTS",
            "state":"PASS_VERIFIED_LOCAL","repository":bridge.REPOSITORY,
            "projectId":bridge.PROJECT_ID,
            "methodologyPin":bridge.METHODOLOGY_PIN,"alignedPipRef":ref,
            "alignmentReceiptRef":{
                "artifactType":"INTENT_ALIGNMENT_RECEIPT",
                "projectId":bridge.PROJECT_ID,
                "contentDigest":bridge.RECEIPT_DIGEST,
            },
            "verifiedAt":now.isoformat(),
            "expiresAt":(now+timedelta(minutes=30)).isoformat(),
            "remoteRuntimeAdmissionVerified":False,
            "missionCreated":False,"executionAuthorized":False,
            "humanGateApproved":False,
        }
        cache.write_text(json.dumps(document))
        cache.chmod(0o600)
        return cache,document

    def test_exact_verified_local_context_adds_pinned_refs_but_no_execution(self):
        path,proof=self.context_proof()
        loaded=bridge.load_verified_project_context(path)
        self.assertEqual(loaded["alignedPipRef"]["contentDigest"],bridge.PIP_DIGEST)
        p=self.review()
        draft=bridge.export_reviewed_proposal(
            p["id"],p["version"],self.db,self.proposals,context_file=path)
        self.assertTrue(draft["local_context_verified"])
        self.assertEqual(draft["validation_status"],"LOCAL_PIP_VERIFIED_REMOTE_PENDING")
        self.assertFalse(draft["import_ready"])
        self.assertIsNone(draft["runtime_mission_id"])
        self.assertIn("REMOTE_V11_CONTEXT_PREFLIGHT_REQUIRED",draft["runtime_import_blockers"])
        self.assertFalse(draft["execution_authorized"])
        contract=draft["request"]["contract"]
        self.assertEqual(contract["methodologyPin"],bridge.METHODOLOGY_PIN)
        self.assertEqual(contract["alignedPipRef"]["contentDigest"],bridge.PIP_DIGEST)
        self.assertNotIn("standingAuthorizations",contract)

    def test_replay_after_context_proof_expired_keeps_existing_verified_contract(self):
        path,doc=self.context_proof()
        p=self.review()
        first=bridge.export_reviewed_proposal(
            p["id"],p["version"],self.db,self.proposals,context_file=path)
        doc["expiresAt"]=(datetime.now(timezone.utc)-timedelta(seconds=3)).isoformat()
        path.write_text(json.dumps(doc));path.chmod(0o600)
        with patch.object(bridge,"load_verified_project_context",
                          side_effect=AssertionError("should not load transient cache")):
            again=bridge.export_reviewed_proposal(
                p["id"],p["version"],self.db,self.proposals,context_file=path)
        self.assertEqual(again["handoff_id"],first["handoff_id"])
        self.assertEqual(again["payload_sha256"],first["payload_sha256"])
        self.assertTrue(again["local_context_verified"])
        self.assertEqual(again["request"],first["request"])
        self.assertEqual(len(bridge.list_handoffs(self.db)),1)

    def test_replay_after_new_context_appears_preserves_old_incomplete_draft(self):
        p=self.review()
        first=bridge.export_reviewed_proposal(
            p["id"],p["version"],self.db,self.proposals,
            context_file=self.handoff_dir/"absent.json")
        path,_=self.context_proof()
        with patch.object(bridge,"load_verified_project_context",
                          side_effect=AssertionError("must preserve immutable draft")):
            again=bridge.export_reviewed_proposal(
                p["id"],p["version"],self.db,self.proposals,context_file=path)
        self.assertEqual(again["handoff_id"],first["handoff_id"])
        self.assertEqual(again["payload_sha256"],first["payload_sha256"])
        self.assertFalse(again["local_context_verified"])
        self.assertEqual(again["request"],first["request"])
        self.assertEqual(len(bridge.list_handoffs(self.db)),1)

    def test_corrupt_handoff_digest_is_rejected_on_retry(self):
        p=self.review()
        first=bridge.export_reviewed_proposal(
            p["id"],p["version"],self.db,self.proposals)
        import sqlite3
        conn=sqlite3.connect(self.db)
        conn.execute("UPDATE handoffs SET contract_sha256=? WHERE id=?",
                     ("0"*64,first["handoff_id"]))
        conn.commit();conn.close()
        with self.assertRaises(bridge.BridgeError) as err:
            bridge.export_reviewed_proposal(
                p["id"],p["version"],self.db,self.proposals)
        self.assertEqual(err.exception.code,"HANDOFF_INTEGRITY_FAILED")

    def test_unverified_expired_or_unsafe_cache_never_grants_context(self):
        path,doc=self.context_proof()
        doc["methodologyPin"]={"version":"9.9.9","immutableRef":"git:fake"}
        path.write_text(json.dumps(doc));path.chmod(0o600)
        with self.assertRaises(bridge.BridgeError) as invalid:
            bridge.load_verified_project_context(path)
        self.assertEqual(invalid.exception.code,"INVALID_CONTEXT_CACHE")
        path,doc=self.context_proof()
        doc["expiresAt"]=(datetime.now(timezone.utc)-timedelta(seconds=3)).isoformat()
        path.write_text(json.dumps(doc));path.chmod(0o600)
        self.assertIsNone(bridge.load_verified_project_context(path))
        path,doc=self.context_proof()
        path.chmod(0o644)
        with self.assertRaises(bridge.BridgeError) as unsafe:
            bridge.load_verified_project_context(path)
        self.assertEqual(unsafe.exception.code,"UNSAFE_CONTEXT_CACHE")

    def test_missing_or_symlinked_cache_cannot_be_used(self):
        self.assertIsNone(bridge.load_verified_project_context(
            self.handoff_dir/"absent.json"))
        file,doc=self.context_proof()
        link=self.handoff_dir/"context-symlink.json"
        link.symlink_to(file)
        with self.assertRaises(bridge.BridgeError):
            bridge.load_verified_project_context(link)

    def test_unavailable_observer_explicitly_denies_canonical_claim(self):
        snapshot={"source":"MCF_MISSION_CONTROL_READ_ONLY",
                  "status":"AUTH_NOT_CONFIGURED","mission":None}
        class Response:
            status=200
            def getheader(self,*args):return "application/json"
            def read(self,*args):return json.dumps(snapshot).encode()
        class Connection:
            def __init__(self,*args,**kwargs):pass
            def request(self,*args,**kwargs):pass
            def getresponse(self):return Response()
            def close(self):pass
        with patch.object(bridge.http.client,"HTTPConnection",Connection):
            result=bridge.read_canonical_snapshot()
        self.assertFalse(result["ready"])
        self.assertFalse(result["canonical"])
        self.assertIsNone(result["mission"])
        self.assertEqual(result["status"],"AUTH_NOT_CONFIGURED")

    def test_canonical_snapshot_only_with_fresh_source_and_repository(self):
        source={
           "source":"MCF_MISSION_CONTROL_READ_ONLY","status":"READY",
           "repository":bridge.REPOSITORY,
           "checkedAt":bridge.now(),"mission":{"id":"a"*36,"title":"Missão exemplo",
              "state":"WAITING","version":2,"currentAgentId":"Mestre"},
           "currentPhase":{"id":"phase-1","state":"PENDING","agentId":"Rafael"},
           "blocked":False}
        class Response:
            status=200
            def getheader(self,*args):return "application/json"
            def read(self,*args):return json.dumps(source).encode()
        class Connection:
            def __init__(self,*args,**kwargs):pass
            def request(self,method,path,headers):
                if method!="GET" or path!="/api/v1/mcf/observation":
                    raise AssertionError("Not a fixed safe endpoint")
            def getresponse(self):return Response()
            def close(self):pass
        with patch.object(bridge.http.client,"HTTPConnection",Connection):
            result=bridge.read_canonical_snapshot()
        self.assertTrue(result["ready"])
        self.assertTrue(result["canonical"])
        self.assertEqual(result["mission"]["state"],"WAITING")
        source["repository"]="untrusted/repo"
        with patch.object(bridge.http.client,"HTTPConnection",Connection),self.assertRaises(bridge.BridgeError):
            bridge.read_canonical_snapshot()
        source["repository"]=bridge.REPOSITORY
        source["checkedAt"]="2020-01-01T00:00:00+00:00"
        with patch.object(bridge.http.client,"HTTPConnection",Connection),self.assertRaises(bridge.BridgeError):
            bridge.read_canonical_snapshot()

if __name__=="__main__":
    unittest.main()
