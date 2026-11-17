from __future__ import annotations
from pathlib import Path
import json
import os
import stat
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"backend"))
import pet_readonly_tools as tools
from pet_live_auth import issue_ticket,validate_ticket,_seen,signature

class ReadOnlyRegistryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.audit=Path(self.tmp.name)/"receipts.jsonl"
        self.patcher=patch.object(tools,"AUDIT_LOG",self.audit)
        self.patcher.start()
    def tearDown(self):
        self.patcher.stop()
        self.tmp.cleanup()

    def test_fixed_catalog_has_no_shell_browser_or_writes(self):
        expected={
            "mcf_system_status","mcf_service_status",
            "mcf_pet_status","mcf_mission_status","mcf_tool_catalog",
        }
        self.assertEqual(tools.TOOL_NAMES,expected)
        self.assertEqual({x["name"] for x in tools.TOOL_DECLARATIONS},expected)
        for x in tools.TOOL_DECLARATIONS:
            self.assertEqual(x["parameters"]["type"],"OBJECT")
        self.assertNotIn("execute_command",tools.TOOL_NAMES)
        self.assertNotIn("browser_click",tools.TOOL_NAMES)

    def test_unlisted_tool_rejected_without_any_http_call(self):
        for name in ("run_shell","browser_click","restart_service","write_file","mcf_status; rm -rf /"):
            with self.subTest(name=name),patch.object(tools,"_get",
                    side_effect=AssertionError("no query allowed")):
                reply=tools.dispatch(name,{})
                self.assertFalse(reply["ok"])
                self.assertEqual(reply["status"],"TOOL_NOT_ALLOWED")

    def test_arguments_are_rejected_before_network_calls(self):
        for name,args in (
            ("mcf_pet_status",{"url":"http://evil.invalid"}),
            ("mcf_system_status",{"command":"rm -rf /"}),
            ("mcf_service_status",{"service":"../../etc/passwd"}),
            ("mcf_service_status",{"service":"ollama","stop":True}),
            ("mcf_service_status",{"service":["ollama"]}),
            ("mcf_tool_catalog",{"anything":True}),
        ):
            with self.subTest(name=name,args=args),patch.object(tools,"_get",
                    side_effect=AssertionError("not permitted")):
                reply=tools.dispatch(name,args)
                self.assertFalse(reply["ok"])
                self.assertTrue(reply["read_only"])

    def test_system_metrics_are_allowlisted_and_not_raw(self):
        sample={
            "updated":"2026-11-16T19:20:00-03:00",
            "host":{"hostname":"leo-N43SM","os":"Linux Mint","private_key":"SECRET"},
            "metrics":{"cpu_percent":13.2,"memory_percent":60.4,
                "disk_percent":87.0,"swap_percent":12.0,
                "gpu_busy_percent":7,"gpu_temperature_c":45,
                "memory_available_bytes":5368709120,"disk_free_bytes":10737418240,
                "password":"SECRET"},
            "summary":{"secret":"SECRET"}
        }
        with patch.object(tools,"_get",return_value=sample):
            result=tools.dispatch("mcf_system_status",{})
        self.assertTrue(result["ok"])
        self.assertEqual(result["result"]["metrics"]["memory_available_gib"],5)
        self.assertEqual(result["result"]["metrics"]["disk_free_gib"],10)
        self.assertNotIn("SECRET",json.dumps(result))

    def test_service_inventory_maps_only_exact_port_and_unit(self):
        def get(path):
            if path.endswith("/services"):
                return [
                    {"name":"Ollama","port":11434,"status":"Disponível",
                     "http_code":200,"token":"private"},
                    {"name":"unknown","port":9999,"status":"abc"}
                ]
            return [{"name":"ollama-local.service","status":"active","substate":"running",
                     "description":"internal private secret"}]
        with patch.object(tools,"_get",side_effect=get) as obs:
            result=tools.dispatch("mcf_service_status",{"service":"ollama"})
        self.assertTrue(result["ok"])
        self.assertEqual(len(result["result"]["services"]),1)
        self.assertEqual(result["result"]["services"][0]["http_code"],200)
        self.assertEqual(result["result"]["services"][0]["unit_status"],"active")
        self.assertNotIn("private",str(result))
        self.assertEqual(obs.call_count,2)

    def test_mission_observer_disconnected_is_not_claimed_running(self):
        disconnected={
            "status":"disconnected","source":"local",
            "lastSuccessAt":None,"checkedAt":"2026-11-16T19:20",
            "mission":None,"events":[],"secrets":"secret",
        }
        with patch.object(tools,"_get",return_value=disconnected):
            result=tools.dispatch("mcf_mission_status",{})
        self.assertTrue(result["ok"])
        self.assertEqual(result["result"]["reliability"],"NOT_CONNECTED")
        self.assertIsNone(result["result"]["mission"])
        self.assertNotIn("secret",json.dumps(result))

    def test_canonical_mission_snapshot_is_sanitised(self):
        sample={
           "status":"READY","source":"MCF_MISSION_CONTROL_READ_ONLY",
           "repository":"leon337/multiagent-collaboration-framework",
           "checkedAt":"2026-11-16T22:00:00Z",
           "mission":{"id":"mission-1","title":"Inspecionar Ollama",
                      "state":"WAITING","version":1,"currentAgentId":"Rafael",
                      "password":"SECRET"},
           "currentPhase":{"id":"phase-1","state":"PENDING",
                           "agentId":"Rafael","secret":"SECRET"}
        }
        with patch.object(tools,"_get",return_value=sample):
            result=tools.dispatch("mcf_mission_status",{})
        self.assertTrue(result["ok"])
        self.assertEqual(result["result"]["mission"]["title"],"Inspecionar Ollama")
        self.assertEqual(result["result"]["reliability"],"OBSERVATION_ONLY")
        self.assertNotIn("SECRET",str(result))
        sample["repository"]="other/repo"
        with patch.object(tools,"_get",return_value=sample):
            denied=tools.dispatch("mcf_mission_status",{})
        self.assertFalse(denied["ok"])

    def test_pet_telemetry_is_read_only_and_minimal(self):
        sample={"pet":{"status":"online","state":"ocioso","state_verified":True,
                        "process_source":"desktop","pid":12345,"api_key":"private"},
                "checked_at":"2026-11-16T18:50"}
        with patch.object(tools,"_get",return_value=sample):
            result=tools.dispatch("mcf_pet_status",{})
        self.assertTrue(result["ok"])
        self.assertEqual(result["result"]["status"]["state"],"ocioso")
        self.assertNotIn("api_key",json.dumps(result))
        self.assertNotIn("pid",json.dumps(result))

    def test_catalog_explicitly_blocks_state_changes(self):
        result=tools.dispatch("mcf_tool_catalog",{})
        self.assertTrue(result["ok"])
        self.assertEqual(result["result"]["permission_profile"],"READ_ONLY")
        self.assertIn("HUMAN_GATE",result["result"]["future_authorization"])

    def test_audit_receipts_have_private_permissions_and_no_user_data(self):
        with patch.object(tools,"_get",return_value={
            "pet":{"status":"online","state":"ocioso"}}):
            result=tools.dispatch("mcf_pet_status",{})
        self.assertTrue(result["ok"])
        self.assertEqual(stat.S_IMODE(self.audit.stat().st_mode),0o600)
        records=[json.loads(x) for x in self.audit.read_text().splitlines()]
        self.assertEqual(len(records),1)
        self.assertEqual(records[0]["tool"],"mcf_pet_status")
        self.assertEqual(records[0]["receipt_id"],result["receipt_id"])
        self.assertNotIn("ocioso",self.audit.read_text())
        self.assertNotIn("args",self.audit.read_text())
        self.assertNotIn("response",self.audit.read_text())

    def test_full_audit_log_disables_tool_result(self):
        self.audit.write_bytes(b"a" * 1_000_001)
        self.audit.chmod(0o600)
        with patch.object(tools,"_get",return_value={"pet":{"status":"online"}}):
            result=tools.dispatch("mcf_pet_status",{})
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"],"AUDIT_UNAVAILABLE")
        self.assertEqual(self.audit.stat().st_size,1_000_001)

    def test_blocked_tools_are_audited(self):
        result=tools.dispatch("write_file",{"path":"/tmp/abc"})
        self.assertFalse(result["ok"])
        row=json.loads(self.audit.read_text().splitlines()[0])
        self.assertEqual(row["outcome"],"TOOL_NOT_ALLOWED")

    def test_audit_failure_fails_closed(self):
        with (patch.object(tools,"_receipt",side_effect=OSError("private path")),
              patch.object(tools,"_get",return_value={"pet":{"status":"online"}})):
            result=tools.dispatch("mcf_pet_status",{})
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"],"AUDIT_UNAVAILABLE")

    def test_get_endpoint_allowlist_blocks_arbitrary_url(self):
        with self.assertRaises(tools.ToolBlocked):
            tools._get("http://example.com/secrets")
        with self.assertRaises(tools.ToolBlocked):
            tools._get("/api/admin/reboot")

    def test_invalid_json_response_is_not_exposed(self):
        with patch.object(tools,"_get",return_value=[]):
            result=tools.dispatch("mcf_pet_status",{})
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"],"UNEXPECTED_PET_STATUS")

    def test_too_large_result_rejected(self):
        with patch.object(tools,"tool_catalog",
                          return_value={"extra":"x"*3000}):
            result=tools.dispatch("mcf_tool_catalog",{})
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"],"RESULT_TOO_LARGE")

class SignedScopeTests(unittest.TestCase):
    def setUp(self):
        _seen.clear()
        self.tmp=tempfile.TemporaryDirectory()
        self.key=Path(self.tmp.name)/"key"
        self.key.write_bytes(b"a"*32)
        self.key.chmod(0o600)
    def tearDown(self):
        self.tmp.cleanup()

    def test_read_only_ticket_is_not_valid_in_conversation_scope(self):
        token=issue_ticket(self.key,now=1731700000,scope="read_only")
        self.assertFalse(validate_ticket(token,self.key,now=1731700001,
                                         expected_scope="conversation"))
        self.assertTrue(validate_ticket(token,self.key,now=1731700001,
                                         expected_scope="read_only"))
        self.assertFalse(validate_ticket(token,self.key,now=1731700002,
                                         expected_scope="read_only"))

    def test_conversation_ticket_cannot_escalate_to_tools(self):
        token=issue_ticket(self.key,now=1731700000,scope="conversation")
        self.assertFalse(validate_ticket(token,self.key,now=1731700001,
                                         expected_scope="read_only"))
        self.assertTrue(validate_ticket(token,self.key,now=1731700001,
                                        expected_scope="conversation"))

    def test_proposal_scope_ticket_is_valid_only_for_that_scope(self):
        token=issue_ticket(self.key,now=1731700000,scope="read_and_propose")
        self.assertTrue(validate_ticket(token,self.key,now=1731700001,
                                        expected_scope="read_and_propose"))
        self.assertFalse(validate_ticket(token,self.key,now=1731700001,
                                         expected_scope="read_only"))
        self.assertFalse(validate_ticket(token,self.key,now=1731700001,
                                         expected_scope="conversation"))

    def test_unknown_scope_rejected(self):
        with self.assertRaises(ValueError):
            issue_ticket(self.key,now=1731700000,scope="execute")
        token=issue_ticket(self.key,now=1731700000,scope="read_only")
        self.assertFalse(validate_ticket(token,self.key,now=1731700001,
                                         expected_scope="execute"))

    def test_legacy_v1_ticket_is_never_authorized_for_tools(self):
        ts="1731700000"
        nonce="A"*27
        old_signature=signature(b"a"*32,ts,nonce,legacy=True)
        token=f"v1.{ts}.{nonce}.{old_signature}"
        self.assertFalse(validate_ticket(token,self.key,now=1731700001,
                                         expected_scope="read_only"))
        self.assertTrue(validate_ticket(token,self.key,now=1731700001,
                                        expected_scope="conversation"))

if __name__=="__main__":unittest.main()
