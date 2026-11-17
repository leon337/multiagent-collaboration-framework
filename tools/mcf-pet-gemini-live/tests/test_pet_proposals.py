from __future__ import annotations
import json
import os
from pathlib import Path
import stat
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"backend"))
from pet_proposals import (
    ProposalError,create_proposal,list_proposals,review_proposal,_proposal_data
)

def sample():
    return {
        "title":"Proposta de reduzir uso da swap",
        "objective":"Investigar o consumo elevado de swap sem interromper serviços.",
        "summary":"Analisar métricas e sugerir ações reversíveis para a memória.",
        "steps":[
            "Coletar métricas de uso de RAM e swap durante um intervalo.",
            "Identificar processos que mais consomem memória, sem alterar nada.",
            "Preparar uma proposta de ajustes com rollback para revisão humana."
        ],
        "risks":"Mudanças na configuração de memória podem afetar serviços ativos.",
        "rollback":"Restaurar configurações originais somente em missão futura governada.",
        "priority":"media",
    }

class ProposalStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.directory=Path(self.temp.name)/"private"
        self.directory.mkdir(mode=0o700)
        self.path=self.directory/"proposals.sqlite3"
        self.sid="a"*32

    def tearDown(self):
        self.temp.cleanup()

    def test_draft_persists_with_zero_execution_authority(self):
        p=create_proposal(sample(),self.sid,"call-1",["a"*16],self.path)
        self.assertEqual(p["status"],"pending_review")
        self.assertFalse(p["executable"])
        self.assertFalse(p["human_gate"])
        self.assertEqual(p["authority"],"AI_DRAFT_ONLY")
        self.assertEqual(p["evidence_refs"],["a"*16])
        self.assertEqual(stat.S_IMODE(self.path.stat().st_mode),0o600)
        self.assertEqual(stat.S_IMODE(self.directory.stat().st_mode),0o700)
        recovered=list_proposals(path=self.path)
        self.assertEqual(len(recovered),1)
        self.assertEqual(recovered[0]["id"],p["id"])
        self.assertEqual(len(recovered[0]["steps"]),3)
        self.assertNotIn("session_id",recovered[0])

    def test_idempotent_duplicate_call_returns_same_proposal(self):
        p=create_proposal(sample(),self.sid,"call-1",[],self.path)
        again=create_proposal(sample(),self.sid,"call-1",[],self.path)
        self.assertEqual(p["id"],again["id"])
        self.assertEqual(len(list_proposals(path=self.path)),1)

    def test_one_session_cannot_flood_proposals(self):
        for i in range(4):
            create_proposal(sample(),self.sid,"call-"+str(i),[],self.path)
        with self.assertRaises(ProposalError) as ctx:
            create_proposal(sample(),self.sid,"call-5",[],self.path)
        self.assertEqual(ctx.exception.code,"PROPOSAL_LIMIT")
        self.assertEqual(len(list_proposals(path=self.path)),4)

    def test_unsupported_fields_are_rejected(self):
        invalid=sample()
        invalid["execute"]="systemctl restart ollama"
        with self.assertRaises(ProposalError) as ctx:
            create_proposal(invalid,self.sid,"call-1",[],self.path)
        self.assertEqual(ctx.exception.code,"INVALID_PROPOSAL_SCHEMA")
        self.assertFalse(self.path.exists())

    def test_secret_looking_value_is_rejected(self):
        invalid=sample()
        invalid["summary"]="A credencial é api_key=123456789012345678, não divulgar."
        with self.assertRaises(ProposalError) as ctx:
            create_proposal(invalid,self.sid,"call-1",[],self.path)
        self.assertEqual(ctx.exception.code,"SENSITIVE_VALUE_REJECTED")

    def test_script_injection_is_treated_as_untrusted_text(self):
        args=sample()
        args["title"]='<img src=x onerror=alert(1)> Proposta de operação'
        p=create_proposal(args,self.sid,"call-1",[],self.path)
        self.assertIn("<img",p["title"])
        self.assertFalse(p["executable"])
        self.assertEqual(p["status"],"pending_review")

    def test_review_does_not_create_gate_or_execution_authority(self):
        p=create_proposal(sample(),self.sid,"call-1",[],self.path)
        x=review_proposal(p["id"],"reviewed_for_planning",1,
                          "Revisado; aguarda missão separada.",self.path)
        self.assertEqual(x["version"],2)
        self.assertEqual(x["status"],"reviewed_for_planning")
        self.assertFalse(x["executable"])
        self.assertFalse(x["human_gate"])
        self.assertEqual(x["authority"],"AI_DRAFT_ONLY")
        self.assertIsNotNone(x["reviewed_at"])
        with self.assertRaises(ProposalError) as ctx:
            review_proposal(p["id"],"rejected",1,"",self.path)
        self.assertEqual(ctx.exception.code,"REVIEW_CONFLICT")

    def test_reject_is_terminal_and_no_approve_execution_transition(self):
        p=create_proposal(sample(),self.sid,"call-1",[],self.path)
        reviewed=review_proposal(p["id"],"rejected",1,"Sem prioridade.",self.path)
        self.assertEqual(reviewed["status"],"rejected")
        for decision in ("approved","executed","authorized","pending_review"):
            with self.subTest(decision=decision),self.assertRaises(ProposalError):
                review_proposal(p["id"],decision,2,"",self.path)

    def test_no_unscoped_file_paths_or_unsafe_permissions(self):
        symlink=self.directory/"alias.db"
        symlink.symlink_to(self.path)
        with self.assertRaises(ProposalError):
            list_proposals(path=symlink)
        self.directory.chmod(0o755)
        with self.assertRaises(ProposalError):
            list_proposals(path=self.path)

    def test_missing_evidence_is_not_implied_verified(self):
        p=create_proposal(sample(),self.sid,"call-1",["bad-ref","a"*16,"a"*16],self.path)
        self.assertEqual(p["evidence_refs"],["a"*16])
        q=create_proposal(sample(),"b"*32,"call-2",[],self.path)
        self.assertEqual(q["evidence_refs"],[])

    def test_invalid_priority_types_are_rejected_without_server_crash(self):
        for priority in ([],{},None,42,True):
            with self.subTest(priority=priority):
                data=sample();data["priority"]=priority
                with self.assertRaises(ProposalError) as err:
                    create_proposal(data,self.sid,"invalid-priority",[],self.path)
                self.assertEqual(err.exception.code,"INVALID_PRIORITY")

    def test_all_pending_proposals_reachable_through_pagination(self):
        from pet_proposals import proposal_counts
        for number in range(31):
            create_proposal(sample(),f"{number:032x}",f"call-{number}",[],self.path)
        # Recently created entries reviewed first do not hide older pending.
        recent=list_proposals(15,self.path,offset=0)
        assert len(recent)==15
        for p in recent:
            review_proposal(p["id"],"rejected",p["version"],"",self.path)
        first=list_proposals(15,self.path,offset=0)
        second=list_proposals(15,self.path,offset=15)
        third=list_proposals(15,self.path,offset=30)
        rows=first+second+third
        self.assertEqual(len(rows),31)
        self.assertEqual(len({p["id"] for p in rows}),31)
        self.assertEqual(sum(p["status"]=="pending_review" for p in rows),16)
        self.assertEqual(proposal_counts(self.path),{"total":31,"pending":16})
        self.assertTrue(all(p["status"]=="pending_review" for p in first))

    def test_offset_validation(self):
        for offset in (-1,301,"0",True):
            with self.subTest(offset=offset),self.assertRaises(ProposalError):
                list_proposals(25,self.path,offset=offset)

    def test_schema_validation_blocks_executable_payloads(self):
        args=sample()
        args["steps"]=["Execução"]
        with self.assertRaises(ProposalError):
            _proposal_data(args)
        args=sample()
        args["priority"]="critical"
        with self.assertRaises(ProposalError):
            _proposal_data(args)

    def test_version_replay_and_nonexistent_id_fail_closed(self):
        p=create_proposal(sample(),self.sid,"call-1",[],self.path)
        with self.assertRaises(ProposalError) as ctx:
            review_proposal("b"*32,"rejected",1,"",self.path)
        self.assertEqual(ctx.exception.status,404)
        with self.assertRaises(ProposalError) as ctx:
            review_proposal(p["id"],"reviewed_for_planning",2,"",self.path)
        self.assertEqual(ctx.exception.status,409)

if __name__=="__main__":
    unittest.main()
