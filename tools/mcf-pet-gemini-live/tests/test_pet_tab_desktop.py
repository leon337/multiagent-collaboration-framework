import json
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

import pet_conversation as pc
from pet_observer import PetObserver, PET_SERVICE, VOICE_SERVICE, _desktop_process_pid, PET_STATE_TTL

class PerTabSessionTests(unittest.TestCase):
    def setUp(self):
        with pc._mutex:
            pc._sessions.clear()
            pc._completed.clear()

    def test_independent_tabs_keep_distinct_http_only_cookies(self):
        a="a"*32
        b="b"*32
        session_a,cookie_a=pc.make_session("127.0.0.1:8898",a)
        session_b,cookie_b=pc.make_session("127.0.0.1:8898",b)
        self.assertIn("mcfpet_tab_"+a+"=",cookie_a)
        self.assertIn("mcfpet_tab_"+b+"=",cookie_b)
        self.assertIn("HttpOnly",cookie_a)
        self.assertIn("SameSite=Strict",cookie_b)
        combined="; ".join((cookie_a.split(";",1)[0],cookie_b.split(";",1)[0]))
        headers={"Host":"127.0.0.1:8898","Origin":"http://127.0.0.1:8898",
                 "Cookie":combined}
        tab_a={**headers,"X-MCF-Pet-Tab":a,"X-MCF-Pet-CSRF":session_a["csrf"]}
        tab_b={**headers,"X-MCF-Pet-Tab":b,"X-MCF-Pet-CSRF":session_b["csrf"]}
        self.assertNotEqual(pc.authorize(tab_a),pc.authorize(tab_b))
        self.assertEqual(pc.authorize(tab_a),pc.authorize(tab_a))
        self.assertEqual(pc.authorize(tab_b),pc.authorize(tab_b))
        with self.assertRaises(pc.ConversationError):
            pc.authorize({**tab_a,"X-MCF-Pet-CSRF":session_b["csrf"]})
        with self.assertRaises(pc.ConversationError):
            pc.authorize({**tab_b,"X-MCF-Pet-Tab":a})

    def test_tab_cookie_renewal_cannot_revoke_other_tab(self):
        a,b="1"*32,"2"*32
        d1,c1=pc.make_session("127.0.0.1:8898",a)
        d2,c2=pc.make_session("127.0.0.1:8898",b)
        d3,c3=pc.make_session("127.0.0.1:8898",a)
        self.assertTrue(d3["csrf"] != d1["csrf"])
        cookies="; ".join(x.split(";",1)[0] for x in (c2,c3))
        headers={"Host":"127.0.0.1:8898","Origin":"http://127.0.0.1:8898","Cookie":cookies}
        self.assertTrue(pc.authorize({**headers,"X-MCF-Pet-Tab":b,"X-MCF-Pet-CSRF":d2["csrf"]}))
        self.assertTrue(pc.authorize({**headers,"X-MCF-Pet-Tab":a,"X-MCF-Pet-CSRF":d3["csrf"]}))

    def test_bad_tab_id_refused_and_original_legacy_cookie_works(self):
        for value in ("x","a"*31,"A"*32,"../../../api","a"*33):
            with self.subTest(value=value),self.assertRaises(pc.ConversationError):
                pc.make_session("127.0.0.1:8898",value)
        data,cookie=pc.make_session("127.0.0.1:8898")
        old_headers={"Host":"127.0.0.1:8898","Origin":"http://127.0.0.1:8898",
                     "Cookie":cookie.split(";",1)[0],"X-MCF-Pet-CSRF":data["csrf"]}
        self.assertTrue(pc.authorize(old_headers))

class DesktopPetRecognitionTests(unittest.TestCase):
    def _presence(self, path, pid=2064, offset=0.0):
        path.write_text(json.dumps({
            "schema":"mcf-pet-presence/v1","pid":pid,"state":"ouvindo",
            "updated_at":time.time()+offset,"uptime_seconds":88
        }),encoding="utf-8")
        path.chmod(0o600)

    def _offline(self, unit):
        if unit==PET_SERVICE:
            return {"active":False,"pid":None,"substate":"dead","restarts":0}
        if unit==VOICE_SERVICE:
            return {"active":True,"pid":1430,"substate":"running","restarts":0}
        raise AssertionError(unit)

    def _fixture(self, path, desktop_pid):
        return PetObserver(path=path,unit_reader=self._offline,
            udp_reader=lambda:True,voice_reader=lambda:{"api_ok":True},
            desktop_reader=lambda path:desktop_pid)

    def test_real_desktop_pet_telemetry_is_observed_without_managing_it(self):
        with tempfile.TemporaryDirectory() as directory:
            f=Path(directory)/"status.json"
            self._presence(f)
            data=self._fixture(f,2064).collect()["pet"]
            self.assertEqual(data["status"],"online")
            self.assertEqual(data["process_source"],"desktop")
            self.assertFalse(data["service_active"])
            self.assertTrue(data["state_verified"])
            self.assertEqual(data["state"],"ouvindo")
            self.assertEqual(data["pid"],2064)
            self.assertTrue(data["udp_listening"])

    def test_stale_manual_telemetry_cannot_confirm_state(self):
        with tempfile.TemporaryDirectory() as directory:
            f=Path(directory)/"status.json"
            self._presence(f,offset=-PET_STATE_TTL-12)
            data=self._fixture(f,2064).collect()["pet"]
            self.assertEqual(data["status"],"telemetry_unverified")
            self.assertFalse(data["state_verified"])
            self.assertIsNone(data["state"])

    def test_unrelated_same_uid_process_cannot_impersonate_pet(self):
        with tempfile.TemporaryDirectory() as directory:
            f=Path(directory)/"status.json"
            self._presence(f,pid=os.getpid())
            self.assertIsNone(_desktop_process_pid(f))

if __name__=="__main__":
    unittest.main()
