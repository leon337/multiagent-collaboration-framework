from __future__ import annotations
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
