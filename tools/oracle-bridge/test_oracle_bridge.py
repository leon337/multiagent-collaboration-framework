#!/usr/bin/env python3
"""Deterministic Oracle CLI bridge contract tests. No ChatGPT secrets, networking or paid API."""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import fcntl
from datetime import datetime, timedelta, timezone
import unittest

BRIDGE = Path(__file__).with_name("oracle_bridge.py")
SCHEMA = Path(__file__).resolve().parents[2] / "schemas" / "mcf-oracle-decision.v1.schema.json"
FAKE_CODEX = r'''#!/usr/bin/env python3
import json,os,pathlib,sys,time,uuid
args=sys.argv[1:]
if args==['login','status']:
 print('Logged in using ChatGPT')
 sys.exit(0)
if os.environ.get("OPENAI_API_KEY") or os.environ.get("SUPER_SECRET_TEST"):
 print('Secret leaked into Codex child', file=sys.stderr)
 sys.exit(80)
if "--model" not in args or args[args.index("--model")+1] != "gpt-6-astra":
 sys.exit(81)
if "--json" not in args or "--output-schema" not in args:
 sys.exit(82)
if any("dangerously" in a for a in args):
 sys.exit(83)
resume= len(args)>1 and args[1]=="resume"
if resume:
 if "-c" not in args or not any('sandbox_mode="read-only"' in a for a in args):sys.exit(84)
else:
 if "--sandbox" not in args or args[args.index("--sandbox")+1] != "read-only":sys.exit(85)
request=json.loads(sys.stdin.read().splitlines()[-1])
if request["objective"] == "FAIL":sys.exit(99)
if request["objective"] == "SLOW":
 time.sleep(3)
if request["objective"] == "BAD":
 response={"mission_id": "OTHER-MISSION"}
else:
 response={"schema_version":"1.0.0","mission_id":request["mission_id"],
 "request_id":request["request_id"],"decision_id":"DEC-"+request["request_id"],
 "status":"PROPOSED","rationale":"test only", "strategy":[],
 "specialists":[],"gates":[],"acceptance_evidence":[],
 "needs_human_approval":False}
out=pathlib.Path(args[args.index("--output-last-message")+1])
out.write_text(json.dumps(response))
thread=(args[-2] if resume else str(uuid.uuid4()))
print(json.dumps({"type":"thread.started","thread_id":thread}))
print(json.dumps({"type":"turn.completed","usage":{"input_tokens":1,"output_tokens":1}}))
'''


class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="mcf-oracle-test-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.fake = self.root / "codex-mock"
        self.fake.write_text(FAKE_CODEX)
        self.fake.chmod(0o700)
        self.state = self.root / "states"
        self.env = dict(os.environ, HOME=str(self.root),
                        OPENAI_API_KEY="DO_NOT_FORWARD", SUPER_SECRET_TEST="DO_NOT_FORWARD")

    def request(self, mission="MCF-ORACLE-001", request="req-001", objective="Plan"):
        value = {
            "schema_version":"1.0.0", "mission_id":mission, "request_id":request,
            "idempotency_key":"idem-"+request, "session_epoch":1,
            "objective":objective, "authorized_context":{},
            "deadline_utc":(datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "policy_version":"MCF-1"
        }
        p=self.root / (mission+"-"+request+".json")
        p.write_text(json.dumps(value))
        return p

    def run_bridge(self, *opts):
        return subprocess.run(
            [sys.executable,str(BRIDGE),"--state-root",str(self.state),
             "--codex",str(self.fake),*opts],
            cwd=self.root,capture_output=True,text=True,timeout=12,env=self.env,
        )

    def consult(self, file, timeout=5):
        return self.run_bridge(
            "consult","--request",str(file),"--decision-schema",str(SCHEMA),
            "--timeout",str(timeout)
        )

    def test_first_turn_and_persistent_resume(self):
        first=self.consult(self.request())
        self.assertEqual(first.returncode,0,first.stdout+first.stderr)
        self.assertEqual(json.loads(first.stdout)["status"],"COMPLETED")
        state=json.loads((self.state/"MCF-ORACLE-001"/"state.json").read_text())
        thread=state["thread_id"]
        self.assertTrue(thread)
        second=self.consult(self.request(request="req-002"))
        self.assertEqual(second.returncode,0,second.stdout)
        new=json.loads((self.state/"MCF-ORACLE-001"/"state.json").read_text())
        self.assertEqual(new["thread_id"],thread)
        self.assertEqual(len(new["processed"]),2)
        self.assertEqual(json.loads(self.run_bridge(
            "status","--mission-id","MCF-ORACLE-001"
        ).stdout)["processed_requests"],2)

    def test_idempotency_cache_and_conflict(self):
        request_file=self.request()
        self.assertEqual(json.loads(self.consult(request_file).stdout)["status"],"COMPLETED")
        self.assertEqual(json.loads(self.consult(request_file).stdout)["status"],"CACHED")
        p=self.request(objective="Different prompt, same request id")
        blocked=self.consult(p)
        self.assertEqual(blocked.returncode,2)
        self.assertEqual(json.loads(blocked.stdout)["reason"],"IDEMPOTENCY_CONFLICT")

    def test_separate_mission_threads(self):
        a=self.consult(self.request(mission="MISSION-AAA"))
        b=self.consult(self.request(mission="MISSION-BBB"))
        self.assertEqual(a.returncode,0)
        self.assertEqual(b.returncode,0)
        ta=json.loads((self.state/"MISSION-AAA"/"state.json").read_text())["thread_id"]
        tb=json.loads((self.state/"MISSION-BBB"/"state.json").read_text())["thread_id"]
        self.assertNotEqual(ta,tb)

    def test_invalid_mission_id_blocks_path_traversal(self):
        p=self.root/"bad-request.json"
        v=json.loads(self.request().read_text())
        v["mission_id"]="../../.codex"
        p.write_text(json.dumps(v))
        r=self.consult(p)
        self.assertEqual(r.returncode,2)
        self.assertEqual(json.loads(r.stdout)["reason"],"INVALID_MISSION_ID")

    def test_cross_mission_or_schema_invalid_fails_closed(self):
        p=self.request(objective="BAD")
        result=self.consult(p)
        self.assertEqual(result.returncode,2)
        self.assertEqual(json.loads(result.stdout)["reason"],"INVALID_ORACLE_SCHEMA")
        state=json.loads((self.state/"MCF-ORACLE-001"/"state.json").read_text())
        self.assertEqual(state["status"],"UNKNOWN")
        new=self.consult(self.request(request="req-002"))
        self.assertEqual(json.loads(new.stdout)["reason"],"MISSION_RECONCILIATION_REQUIRED")

    def test_timeout_stays_unknown_no_auto_retry(self):
        first=self.consult(self.request(objective="SLOW"),timeout=1)
        self.assertEqual(first.returncode,2)
        self.assertEqual(json.loads(first.stdout)["reason"],"CODEX_TIMEOUT_EFFECT_UNKNOWN")
        again=self.consult(self.request(request="req-002"))
        self.assertEqual(json.loads(again.stdout)["reason"],"MISSION_RECONCILIATION_REQUIRED")

    def test_expired_and_malformed_deadlines_fail_before_model(self):
        p=self.request()
        value=json.loads(p.read_text())
        value["deadline_utc"]="2020-01-01T00:00:00Z"
        p.write_text(json.dumps(value))
        self.assertEqual(
            json.loads(self.consult(p).stdout)["reason"], "REQUEST_DEADLINE_EXPIRED"
        )
        value["deadline_utc"]="2026-10-16"
        p.write_text(json.dumps(value))
        self.assertEqual(
            json.loads(self.consult(p).stdout)["reason"], "INVALID_REQUEST_DEADLINE"
        )

    def test_unknown_fields_are_rejected_before_model(self):
        p=self.request()
        value=json.loads(p.read_text())
        value["bypass_human_gate"]=True
        p.write_text(json.dumps(value))
        self.assertEqual(
            json.loads(self.consult(p).stdout)["reason"], "UNRECOGNIZED_REQUEST_FIELD"
        )

    def test_stale_in_flight_state_requires_reconciliation(self):
        p=self.request()
        root=self.state/"MCF-ORACLE-001"
        root.mkdir(parents=True)
        (root/"state.json").write_text(json.dumps({
            "mission_id":"MCF-ORACLE-001", "session_epoch":1,
            "thread_id":None, "status":"IN_FLIGHT", "processed":{},
        }))
        self.assertEqual(
            json.loads(self.consult(p).stdout)["reason"],
            "MISSION_RECONCILIATION_REQUIRED",
        )

    def test_concurrent_calls_to_same_session_fail_without_waiting(self):
        root=self.state/"MCF-ORACLE-001"
        root.mkdir(parents=True)
        p=self.request()
        with (root/".lock").open("a+") as handle:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            out=self.consult(p)
            self.assertEqual(out.returncode,2)
            self.assertEqual(json.loads(out.stdout)["reason"],"MISSION_SESSION_BUSY")

    def test_wrong_session_epoch_is_rejected(self):
        p=self.request()
        value=json.loads(p.read_text())
        value["session_epoch"]=2
        p.write_text(json.dumps(value))
        out=self.consult(p)
        self.assertEqual(out.returncode,2)
        self.assertEqual(json.loads(out.stdout)["reason"],"SESSION_EPOCH_MISMATCH")

    def test_auth_and_model_are_required_without_paid_fallback(self):
        p=self.request()
        self.fake.write_text("#!/usr/bin/env python3\nimport sys\nsys.exit(1)\n")
        r=self.consult(p)
        self.assertEqual(json.loads(r.stdout)["reason"],"CODEX_CHATGPT_AUTH_REQUIRED")
        self.assertFalse((self.state/"MCF-ORACLE-001"/"state.json").exists())


if __name__=="__main__":
    unittest.main(verbosity=2)
