import json
import time
import uuid
import unittest
from http.cookies import SimpleCookie
from unittest.mock import patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
import pet_conversation as convo


class SessionSecurityTests(unittest.TestCase):
    def setUp(self):
        with convo._mutex:
            convo._sessions.clear()
            convo._completed.clear()

    def _session(self):
        data, cookie = convo.make_session("127.0.0.1:8898")
        self.assertTrue(data["ok"])
        sid = cookie.split("=", 1)[1].split(";", 1)[0]
        return data, sid

    def test_local_and_remote_hosts_allowlisted(self):
        self.assertTrue(convo.safe_host("localhost:8898"))
        self.assertTrue(convo.safe_host("mcf-leo-n43sm.tail582305.ts.net:8446"))
        self.assertFalse(convo.safe_host("127.0.0.1:8899"))
        self.assertFalse(convo.safe_host("evil.example"))
        self.assertFalse(convo.safe_host("127.0.0.1:8898.evil.tld"))
        with self.assertRaises(convo.ConversationError):
            convo.make_session("evil.example")

    def test_session_cookie_is_httponly_samesite(self):
        _, cookie = convo.make_session("mcf-leo-n43sm.tail582305.ts.net:8446")
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Strict", cookie)
        self.assertIn("Secure", cookie)
        self.assertIn("Path=/api/pet-voice", cookie)

    def test_authorized_browser_requires_cookie_and_csrf(self):
        data, sid = self._session()
        headers = {"Host": "127.0.0.1:8898", "Origin": "http://127.0.0.1:8898",
                   "Cookie": f"mcfpet_session={sid}", "X-MCF-Pet-CSRF": data["csrf"]}
        self.assertEqual(convo.authorize(headers), sid)
        for bad in [
            dict(headers, Origin="https://evil.test"),
            dict(headers, Origin="null"),
            dict(headers, Host="evil.example"),
            dict(headers, **{"X-MCF-Pet-CSRF": "wrong-token"}),
            dict(headers, Cookie="mcfpet_session=wrong"),
        ]:
            with self.subTest(bad=bad), self.assertRaises(convo.ConversationError):
                convo.authorize(bad)

    def test_expired_session_rejected(self):
        data, sid = self._session()
        with convo._mutex:
            convo._sessions[sid]["expires"] = time.monotonic()-1
        with self.assertRaises(convo.ConversationError):
            convo.authorize({
                "Host": "127.0.0.1:8898",
                "Origin": "http://127.0.0.1:8898",
                "Cookie": "mcfpet_session="+sid,
                "X-MCF-Pet-CSRF": data["csrf"],
            })


class ModelBridgeTests(unittest.TestCase):
    def setUp(self):
        with convo._mutex:
            convo._sessions.clear()
            convo._completed.clear()

    def test_sse_contract_done(self):
        events=[
            'data: {"token":"Olá, "}',
            'data: {"token":"Leandro!"}',
            'data: {"done":true,"model_used":"mcf-test","fallback":false}',
        ]
        result=convo._events_to_reply(events)
        self.assertEqual(result["reply"],"Olá, Leandro!")
        self.assertEqual(result["model"],"mcf-test")
        self.assertFalse(result["executed_tools"])

    def test_sse_requires_completed_nonempty_reply(self):
        for lines in (
            ['data: {"token":"parcial"}'],
            ['data: {"done":true}'],
            ['data: {"error":"private provider error"}'],
        ):
            with self.subTest(lines=lines), self.assertRaises(convo.ConversationError):
                convo._events_to_reply(lines)

    def test_sse_never_returns_unapproved_event_metadata(self):
        result=convo._events_to_reply([
            'data: {"sources":["private link"],"receipt":"hidden","token":"Resposta"}',
            'data: {"done":true,"model_used":"fake","provider_key":"secret"}'
        ])
        self.assertNotIn("private",str(result))
        self.assertNotIn("secret",str(result))

    def test_input_requires_bound_json(self):
        with self.assertRaises(convo.ConversationError):
            convo._request_json(b"invalid")
        with self.assertRaises(convo.ConversationError):
            convo._request_json(b"[1,2]")
        with self.assertRaises(convo.ConversationError):
            convo._request_json(b" "*9000)
        self.assertEqual(convo._request_json(b'{"text":"ola"}')["text"],"ola")

    def test_chat_idempotency_does_not_rerun_llm(self):
        calls=[]
        def fake_chat(text):
            calls.append(text)
            return {"ok":True,"reply":"Resposta confirmada","model":"mock",
                    "fallback":False, "executed_tools":False}
        request_id=str(uuid.uuid4())
        body=json.dumps({"text":"Olá MESTRE","request_id":request_id}).encode()
        with patch.object(convo, "_chat_live",side_effect=fake_chat), patch.object(convo, "_pet_state",return_value=True):
            c1,r1=convo.chat(body,"local-session")
            c2,r2=convo.chat(body,"local-session")
            self.assertEqual(c1,200)
            self.assertEqual(r1,r2)
            self.assertEqual(calls,["Olá MESTRE"])
            with self.assertRaises(convo.ConversationError):
                convo.chat(json.dumps({"text":"texto diferente","request_id":request_id}).encode(),"local-session")

    def test_invalid_request_ids_and_text_rejected(self):
        for payload in (
            {"text":"Olá","request_id":"not-a-uuid"},
            {"text":"", "request_id":str(uuid.uuid4())},
            {"text":"x"*701, "request_id":str(uuid.uuid4())},
        ):
            with self.subTest(payload=payload["text"][:8]),self.assertRaises(convo.ConversationError):
                convo.chat(json.dumps(payload).encode(),"session")

    def test_chat_busy_fails_without_calling_upstream(self):
        self.assertTrue(convo._chat_busy.acquire(blocking=False))
        try:
            with patch.object(convo,"_chat_live",side_effect=AssertionError("must not call model")):
                with self.assertRaises(convo.ConversationError) as ctx:
                    convo.chat(json.dumps({"text":"Olá","request_id":str(uuid.uuid4())}).encode(),"other")
                self.assertEqual(ctx.exception.status,409)
        finally:
            convo._chat_busy.release()

    def test_transcription_passes_only_allowlisted_audio(self):
        with patch.object(convo,"_request",return_value=(
                200,json.dumps({"text":"olá, mestre","seconds":1.8}).encode(),"application/json"
            )) as upstream, patch.object(convo,"_pet_state",return_value=True):
            result=convo.stt(b"a"*1200,"audio/webm;codecs=opus")
            self.assertEqual(result["text"],"olá, mestre")
            self.assertFalse(result["audio_saved"])
            self.assertEqual(upstream.call_args.args[2],"/api/stt")
        with self.assertRaises(convo.ConversationError):
            convo.stt(b"a"*1300,"application/zip")

    def test_piper_output_bounded_audio(self):
        with patch.object(convo,"_request",return_value=(200,b"a"*1200,"audio/wav")) as upstream,patch.object(convo,"_pet_state",return_value=True):
            code,audio,mime=convo.speak(json.dumps({"text":"Olá","mode":"local","voice":"piper-faber"}).encode())
            self.assertEqual(code,200)
            self.assertEqual(mime,"audio/wav")
            self.assertEqual(len(audio),1200)
            self.assertEqual(upstream.call_args.args[2],"/api/tts")

    def test_voicehub_requires_active_dispatcher(self):
        with patch.object(convo,"_voicehub_status",return_value=False),patch.object(convo,"_pet_state",return_value=True):
            with self.assertRaises(convo.ConversationError) as ctx:
                convo.speak(json.dumps({"text":"Olá","mode":"voicehub"}).encode())
            self.assertEqual(ctx.exception.code,"VOICEHUB_UNAVAILABLE")

    def test_voicehub_enqueues_without_claiming_playback(self):
        with patch.object(convo,"_voicehub_status",return_value=True),patch.object(convo,"_pet_state",return_value=True),patch.object(convo,"_request",return_value=(202,b'{"ok":true,"job":{"status":"QUEUED"}}',"application/json")):
            code,data,_=convo.speak(json.dumps({"text":"Olá","mode":"voicehub"}).encode())
            self.assertEqual(code,202)
            item=json.loads(data)
            self.assertTrue(item["queued"])
            self.assertFalse(item["playback_confirmed"])

    def test_pet_state_allowlist_only(self):
        with patch.object(convo,"_pet_state",return_value=True) as emit:
            self.assertEqual(convo.set_pet_state(b'{"state":"ouvindo"}')["state"],"ouvindo")
            emit.assert_called_once_with("ouvindo")
        for p in (b'{"state":"executando; rm -rf /"}',b'{"state":"uma mensagem pessoal"}'):
            with self.assertRaises(convo.ConversationError):
                convo.set_pet_state(p)


if __name__=="__main__":
    unittest.main()
