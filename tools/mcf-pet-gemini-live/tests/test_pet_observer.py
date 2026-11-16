import json
import os
from pathlib import Path
import tempfile
import time
import unittest

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from pet_observer import PetObserver, PET_SERVICE, VOICE_SERVICE, _read_presence, _unit_info, PET_STATE_TTL

def fixture(pid=2064, state="executando", timestamp=None, extras=None):
    data = {
        "schema": "mcf-pet-presence/v1",
        "pid": pid, "state": state,
        "updated_at": time.time() if timestamp is None else timestamp,
        "uptime_seconds": 87,
    }
    if extras:
        data.update(extras)
    return data

def write_presence(path, value, private=True):
    path.write_text(json.dumps(value),encoding="utf-8")
    path.chmod(0o600 if private else 0o644)

def unit_info(service):
    if service == PET_SERVICE:
        return {"active": True, "pid": 2064, "substate":"running", "restarts": 0}
    if service == VOICE_SERVICE:
        return {"active": True, "pid": 1430, "substate":"running", "restarts": 0}
    raise AssertionError("Unexpected service")

def voice():
    return {"api_ok": True, "speech_dispatcher_running": True,
            "orca_running": False, "fallback_ready": True}

class PresenceSecurityTests(unittest.TestCase):
    def test_known_state_is_verified_only_for_matching_pid(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            now=time.time()
            write_presence(f,fixture(timestamp=now))
            actual=_read_presence(f,2064,now+1)
            self.assertEqual(actual["state"],"executando")
            self.assertIsNone(_read_presence(f,9999,now+1))

    def test_stale_presence_is_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            now=time.time()
            write_presence(f,fixture(timestamp=now-PET_STATE_TTL-5))
            self.assertIsNone(_read_presence(f,2064,now))

    def test_future_timestamp_is_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            now=time.time()
            write_presence(f,fixture(timestamp=now+60))
            self.assertIsNone(_read_presence(f,2064,now))

    def test_untrusted_world_readable_file_is_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            now=time.time()
            write_presence(f,fixture(timestamp=now),private=False)
            self.assertIsNone(_read_presence(f,2064,now))

    def test_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            target=Path(root)/"target.json"; link=Path(root)/"link.json"
            now=time.time()
            write_presence(target,fixture(timestamp=now))
            link.symlink_to(target)
            self.assertIsNone(_read_presence(link,2064,now))

    def test_invalid_state_schema_and_json_are_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            now=time.time()
            for value in [fixture(state="sair",timestamp=now),fixture(state="hacked",timestamp=now),
                          fixture(timestamp=now,extras={"schema":"custom"})]:
                write_presence(f,value)
                self.assertIsNone(_read_presence(f,2064,now))
            f.write_text("this is not json",encoding="utf-8");f.chmod(0o600)
            self.assertIsNone(_read_presence(f,2064,now))

    def test_sensitive_fields_are_not_exposed(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            now=time.time()
            write_presence(f,fixture(timestamp=now,extras={
                "message":"secret conversation", "audio":"private audio", "token":"secret token"
            }))
            result=_read_presence(f,2064,now)
            encoded=json.dumps(result)
            self.assertNotIn("secret",encoded)
            self.assertNotIn("conversation",encoded)
            self.assertNotIn("audio",encoded)

class ObserverTests(unittest.TestCase):
    def test_online_pet_with_voice_status(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            write_presence(f,fixture())
            o=PetObserver(path=f,unit_reader=unit_info,udp_reader=lambda:True,voice_reader=voice)
            result=o.collect()
            self.assertEqual(result["pet"]["status"],"online")
            self.assertTrue(result["pet"]["state_verified"])
            self.assertEqual(result["pet"]["state"],"executando")
            self.assertEqual(result["voicehub"]["status"],"healthy")
            self.assertTrue(result["boundary"]["read_only"])
            self.assertFalse(result["boundary"]["audio_collected"])

    def test_online_service_without_presence_is_not_claimed_as_state(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"missing.json"
            o=PetObserver(path=f,unit_reader=unit_info,udp_reader=lambda:True,voice_reader=voice)
            r=o.collect()
            self.assertEqual(r["pet"]["status"],"telemetry_unverified")
            self.assertIsNone(r["pet"]["state"])
            self.assertFalse(r["pet"]["state_verified"])

    def test_missing_udp_is_degraded(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            write_presence(f,fixture())
            o=PetObserver(path=f,unit_reader=unit_info,udp_reader=lambda:False,voice_reader=voice)
            self.assertEqual(o.collect()["pet"]["status"],"degraded")

    def test_offline_pet_never_claims_state(self):
        def offline(service):
            if service==PET_SERVICE:
                return {"active":False,"pid":None,"substate":"dead","restarts":0}
            return unit_info(service)
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            write_presence(f,fixture())
            o=PetObserver(path=f,unit_reader=offline,udp_reader=lambda:True,voice_reader=voice)
            result=o.collect()
            self.assertEqual(result["pet"]["status"],"offline")
            self.assertIsNone(result["pet"]["state"])

    def test_voicehub_degradation_does_not_fabricate_health(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            write_presence(f,fixture())
            v=lambda:{"api_ok":None,"speech_dispatcher_running":None,
                      "orca_running":None,"fallback_ready":None}
            o=PetObserver(path=f,unit_reader=unit_info,udp_reader=lambda:True,voice_reader=v)
            self.assertEqual(o.collect()["voicehub"]["status"],"unverified")
            self.assertEqual(o.collect()["pet"]["status"],"online")

    def test_observer_returns_detached_cached_snapshot(self):
        with tempfile.TemporaryDirectory() as root:
            f=Path(root)/"state.json"
            write_presence(f,fixture())
            calls=[]
            def counted(service):
                calls.append(service)
                return unit_info(service)
            o=PetObserver(path=f,unit_reader=counted,udp_reader=lambda:True,voice_reader=voice)
            first=o.snapshot()
            first["pet"]["state"]="ERROR_INJECTED"
            second=o.snapshot()
            self.assertEqual(second["pet"]["state"],"executando")
            self.assertEqual(len(calls),2)

    def test_fixed_allowlist_does_not_run_arbitrary_systemd_unit(self):
        with self.assertRaises(ValueError):
            _unit_info("bash.service; rm -rf /")

if __name__=="__main__":
    unittest.main()
