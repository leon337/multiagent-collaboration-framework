import base64
import hashlib
import hmac
import os
from xml.etree import ElementTree as ET

import httpx
import pytest
from fastapi.testclient import TestClient
from twilio.request_validator import RequestValidator

from app import main


SID = "CA" + "a" * 32
WEBHOOK = "https://voice.example.test"


@pytest.fixture(autouse=True)
def isolate(monkeypatch):
    main._sessions.clear()
    monkeypatch.setenv("DEMO_MODE", "1")
    monkeypatch.setenv("ZERO_COST_ONLY", "0")  # MockTransport tests only; never charged
    monkeypatch.delenv("TWILIO_AUTH_TOKEN", raising=False)
    monkeypatch.delenv("NINEROUTER_API_KEY", raising=False)
    monkeypatch.delenv("ENABLE_CALL_CONTEXT", raising=False)
    monkeypatch.delenv("PUBLIC_BASE_URL", raising=False)
    yield
    main._sessions.clear()


@pytest.fixture
def client():
    return TestClient(main.app)


def test_health_is_safe(client):
    assert client.get("/health").json() == {"status": "ok", "mode": "demo", "version": "0.2.0"}


def test_incoming_gather_ptbr(client):
    r = client.post("/voice/incoming", data={"CallSid": SID})
    assert r.status_code == 200
    root = ET.fromstring(r.text)
    assert root.tag == "Response"
    assert root.find("Gather").attrib["language"] == "pt-BR"
    assert root.find("Gather/Say").attrib["language"] == "pt-BR"
    assert root.find("Gather").attrib["action"] == "/voice/respond"


def test_response_continues_multiturn(client):
    client.post("/voice/incoming", data={"CallSid": SID})
    r = client.post("/voice/respond", data={"SpeechResult": "Minha primeira pergunta", "CallSid": SID})
    root = ET.fromstring(r.text)
    assert root.find("Gather") is not None
    assert "Minha primeira pergunta" in root.find("Gather/Say").text
    assert main._sessions[SID]["turns"] == 1


def test_demo_no_key_and_no_external_network(client, monkeypatch):
    def forbidden(**kwargs):
        raise AssertionError("DEMO_MODE attempted to create an external HTTP client")
    monkeypatch.setattr(main.httpx, "AsyncClient", forbidden)
    assert client.post("/voice/respond", data={"SpeechResult": "Olá"}).status_code == 200


def test_empty_speech_gather_retry(client):
    r = client.post("/voice/respond", data={"SpeechResult": ""})
    assert ET.fromstring(r.text).find("Gather") is not None


def test_max_turns_closes_and_clears(client):
    client.post("/voice/incoming", data={"CallSid": SID})
    for i in range(main.MAX_TURNS):
        r = client.post("/voice/respond", data={"SpeechResult": "Pergunta", "CallSid": SID})
    assert ET.fromstring(r.text).find("Hangup") is not None
    assert SID not in main._sessions


def test_no_context_by_default(client):
    client.post("/voice/respond", data={"CallSid": SID, "SpeechResult": "Meu segredo"})
    assert main._sessions[SID]["history"] == []


def test_context_opt_in_bounded(client, monkeypatch):
    monkeypatch.setenv("ENABLE_CALL_CONTEXT", "1")
    for i in range(5):
        client.post("/voice/respond", data={"CallSid": SID, "SpeechResult": f"Pergunta {i}"})
    assert len(main._sessions[SID]["history"]) == main.MAX_HISTORY_PAIRS * 2
    assert "Pergunta 0" not in str(main._sessions[SID]["history"])


def test_sessions_bounded_and_invalid_sid(client):
    for i in range(main.MAX_CALLS + 10):
        sid = f"CA{i:032x}"
        client.post("/voice/respond", data={"CallSid": sid, "SpeechResult": "Oi"})
    assert len(main._sessions) == main.MAX_CALLS
    assert main._call_id({"CallSid": "not-a-call-id"}) is None


def test_missing_content_type_rejected(client):
    r = client.post("/voice/incoming", content=b"stuff", headers={"content-type": "text/plain"})
    assert r.status_code == 415


def test_malformed_body_rejected(client):
    assert client.post("/voice/respond", content=b"a=%FF", headers={"content-type": "application/x-www-form-urlencoded"}).status_code == 400
    assert client.post("/voice/respond", content=b"a", headers={"content-type": "application/x-www-form-urlencoded"}).status_code == 400


def test_duplicate_form_parameters_rejected(client):
    r = client.post("/voice/respond", content=b"SpeechResult=a&SpeechResult=b", headers={"content-type": "application/x-www-form-urlencoded"})
    assert r.status_code == 400


def test_large_body_rejected(client):
    r = client.post("/voice/respond", content=b"SpeechResult=" + b"A" * (main.MAX_BODY + 10),
                    headers={"content-type": "application/x-www-form-urlencoded"})
    assert r.status_code == 413


def test_xml_special_chars_are_escaped(client):
    r = client.post("/voice/respond", data={"SpeechResult": "<teste>&\x01"})
    root = ET.fromstring(r.text)
    assert "<teste>&" in root.find("Gather/Say").text
    assert "\x01" not in r.text


@pytest.mark.parametrize("payload", [
    {"CallSid": SID},
    {"CallSid": SID, "SpeechResult": "Olá"},
    {"CallSid": SID, "Digits": "1234"},
])
def test_twilio_signature_matches_official_sdk(payload):
    token = "TWILIO_TEST_TOKEN"
    url = WEBHOOK + "/voice/respond?step=1"
    signature = RequestValidator(token).compute_signature(url, payload)
    assert main.valid_twilio_signature(url, payload, signature, token)
    assert not main.valid_twilio_signature(url, payload, signature + "x", token)


def test_real_requires_config(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    assert client.post("/voice/incoming", data={"CallSid": SID}).status_code == 503


def test_real_rejects_invalid_signature(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("PUBLIC_BASE_URL", WEBHOOK)
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secure-test-token")
    r = client.post("/voice/incoming", data={"CallSid": SID}, headers={"X-Twilio-Signature": "invalid"})
    assert r.status_code == 403


def test_real_accepts_valid_twilio_signature(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("PUBLIC_BASE_URL", WEBHOOK)
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secure-test-token")
    payload = {"CallSid": SID}
    signature = RequestValidator("secure-test-token").compute_signature(WEBHOOK + "/voice/incoming", payload)
    r = client.post("/voice/incoming", data=payload, headers={"X-Twilio-Signature": signature})
    assert r.status_code == 200


def test_signature_query_string(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("PUBLIC_BASE_URL", WEBHOOK)
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secure-test-token")
    payload = {"CallSid": SID, "SpeechResult": "Oi"}
    sig = RequestValidator("secure-test-token").compute_signature(WEBHOOK + "/voice/respond?step=1", payload)
    r = client.post("/voice/respond?step=1", data=payload, headers={"X-Twilio-Signature": sig})
    assert r.status_code == 200


def test_invalid_call_id_rejected_real(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("PUBLIC_BASE_URL", WEBHOOK)
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secure-test-token")
    payload = {"CallSid": "fake"}
    sig = RequestValidator("secure-test-token").compute_signature(WEBHOOK + "/voice/incoming", payload)
    r = client.post("/voice/incoming", data=payload, headers={"X-Twilio-Signature": sig})
    assert r.status_code == 400


def test_unsafe_public_url_is_rejected(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("PUBLIC_BASE_URL", "http://localhost:8000")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "test")
    assert client.post("/voice/incoming", data={"CallSid": SID}).status_code == 503


def _fake_httpx(monkeypatch, handler):
    monkeypatch.setenv("NINEROUTER_BASE_URL", "https://api.9router.com/v1")
    original = httpx.AsyncClient
    def factory(**kwargs):
        return original(transport=httpx.MockTransport(handler), **kwargs)
    monkeypatch.setattr(main.httpx, "AsyncClient", factory)


def test_9router_mock_success_and_headers(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-test-key")
    def handler(req):
        assert req.url == "https://api.9router.com/v1/chat/completions"
        assert req.headers["authorization"] == "Bearer fake-test-key"
        content = req.read().decode()
        assert "deepseek/deepseek-chat" in content
        return httpx.Response(200, json={"choices": [{"message": {"content": "Resposta simulada em português."}}]})
    _fake_httpx(monkeypatch, handler)
    import asyncio
    result = asyncio.run(main._model_response("Oi"))
    assert result == "Resposta simulada em português."


def test_9router_mock_failure_fallback(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-test-key")
    _fake_httpx(monkeypatch, lambda req: httpx.Response(503, json={"error": "outage"}))
    import asyncio
    result = asyncio.run(main._model_response("Oi"))
    assert "falha temporária" in result.lower()


def test_9router_no_key_safe_fallback(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    import asyncio
    result = asyncio.run(main._model_response("Oi"))
    assert "não foi configurado" in result


def test_9router_rejects_insecure_base_url(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("NINEROUTER_API_KEY", "test")
    monkeypatch.setenv("NINEROUTER_BASE_URL", "http://127.0.0.1:1234/v1")
    import asyncio
    assert "não está disponível" in asyncio.run(main._model_response("Oi"))

def test_twiml_uses_supported_male_brazilian_voice(client):
    result = client.post("/voice/incoming", data={"CallSid": SID})
    say = ET.fromstring(result.text).find("Gather/Say")
    assert say.attrib["voice"] == "Polly.Ricardo"
    assert say.attrib["language"] == "pt-BR"
    gather = ET.fromstring(result.text).find("Gather")
    assert gather.attrib["speechModel"] == "phone_call"
    assert gather.attrib["speechTimeout"] == "2"


def test_secure_end_to_end_twilio_to_mock_9router(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-only-test")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "twilio-fake-only-test")
    monkeypatch.setenv("PUBLIC_BASE_URL", WEBHOOK)
    _fake_httpx(monkeypatch, lambda r: httpx.Response(200, json={"choices": [{"message": {"content": "Olá, resposta mockada."}}]}))
    p1 = {"CallSid": SID}
    sig1 = RequestValidator("twilio-fake-only-test").compute_signature(WEBHOOK + "/voice/incoming", p1)
    first = client.post("/voice/incoming", data=p1, headers={"X-Twilio-Signature": sig1})
    assert first.status_code == 200
    assert ET.fromstring(first.text).find("Gather") is not None
    p2 = {"CallSid": SID, "SpeechResult": "Olá"}
    sig2 = RequestValidator("twilio-fake-only-test").compute_signature(WEBHOOK + "/voice/respond", p2)
    response = client.post("/voice/respond", data=p2, headers={"X-Twilio-Signature": sig2})
    assert response.status_code == 200
    assert "resposta mockada" in ET.fromstring(response.text).find("Gather/Say").text


def test_9router_local_loopback_supported(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-local-key")
    _fake_httpx(monkeypatch, lambda req: httpx.Response(200, json={"choices": [{"message": {"content": "Teste local."}}]}))
    monkeypatch.setenv("NINEROUTER_BASE_URL", "http://127.0.0.1:20128/v1")
    import asyncio
    assert asyncio.run(main._model_response("Oi")) == "Teste local."



def test_default_zero_cost_never_calls_router(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.delenv("ZERO_COST_ONLY", raising=False)
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-test-key")
    def forbidden(**kwargs):
        raise AssertionError("Zero-cost mode must not send billable LLM requests")
    monkeypatch.setattr(main.httpx, "AsyncClient", forbidden)
    import asyncio
    result = asyncio.run(main._model_response("Oi"))
    assert "gratuito" in result.lower()
    assert "não está autorizada" in result.lower()


def test_signed_voice_webhook_zero_cost_fallback(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("ZERO_COST_ONLY", "1")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "test-token-only")
    monkeypatch.setenv("PUBLIC_BASE_URL", WEBHOOK)
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-test-key")
    def forbidden(**kwargs):
        raise AssertionError("Signed zero-cost webhook must not call external AI")
    monkeypatch.setattr(main.httpx, "AsyncClient", forbidden)
    data = {"CallSid": SID, "SpeechResult": "Olá, quero falar"}
    sig = RequestValidator("test-token-only").compute_signature(WEBHOOK + "/voice/respond", data)
    response = client.post("/voice/respond", data=data, headers={"X-Twilio-Signature": sig})
    assert response.status_code == 200
    assert "gratuito" in ET.fromstring(response.text).find("Gather/Say").text.lower()



def test_free_allowlisted_local_route_mock_success(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("ZERO_COST_ONLY", "1")
    monkeypatch.setenv("MODEL_NAME", "oc/mimo-v2.6-flash-free")
    monkeypatch.setenv("NINEROUTER_BASE_URL", "http://127.0.0.1:20128/v1")
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-local-test-key")
    original = httpx.AsyncClient
    def handler(request):
        assert str(request.url) == "http://127.0.0.1:20128/v1/chat/completions"
        assert request.headers["authorization"] == "Bearer fake-local-test-key"
        assert request.method == "POST"
        assert request.content.find(b'oc/mimo-v2.6-flash-free') >= 0
        return httpx.Response(200, json={"choices": [{"message": {"content": "Resposta gratuita simulada."}}]})
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    import asyncio
    assert asyncio.run(main._model_response("Olá")) == "Resposta gratuita simulada."


@pytest.mark.parametrize("not_allowed", [
    "deepseek/deepseek-chat",
    "oc/deepseek-v4.1-flash-free",
    "oc/glm-5.3-flash-free",
    "oc/minimax-m3.1-flash-free",
    "oc/mimo-v2.6-flash-free:paid",
])
def test_zero_cost_rejects_unapproved_models_without_network(monkeypatch, not_allowed):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("ZERO_COST_ONLY", "1")
    monkeypatch.setenv("MODEL_NAME", not_allowed)
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-local-test-key")
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: (_ for _ in ()).throw(AssertionError("Network forbidden")))
    import asyncio
    assert "não está autorizada" in asyncio.run(main._model_response("Oi"))


def test_zero_cost_rejects_remote_gateway_even_for_approved_model(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("ZERO_COST_ONLY", "1")
    monkeypatch.setenv("MODEL_NAME", "oc/mimo-v2.6-flash-free")
    monkeypatch.setenv("NINEROUTER_BASE_URL", "https://api.9router.com/v1")
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-local-test-key")
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: (_ for _ in ()).throw(AssertionError("Network forbidden")))
    import asyncio
    assert "não está autorizada" in asyncio.run(main._model_response("Oi"))


def test_zero_cost_approved_model_still_requires_key(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("ZERO_COST_ONLY", "1")
    monkeypatch.setenv("MODEL_NAME", "oc/mimo-v2.6-flash-free")
    monkeypatch.setenv("NINEROUTER_BASE_URL", "http://127.0.0.1:20128/v1")
    monkeypatch.delenv("NINEROUTER_API_KEY", raising=False)
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: (_ for _ in ()).throw(AssertionError("Network forbidden")))
    import asyncio
    assert "não foi configurado" in asyncio.run(main._model_response("Oi"))



@pytest.mark.parametrize("content", [None, "", "   "])
def test_model_null_or_empty_content_falls_back(monkeypatch, content):
    monkeypatch.setenv("DEMO_MODE", "0")
    monkeypatch.setenv("ZERO_COST_ONLY", "1")
    monkeypatch.setenv("MODEL_NAME", "oc/mimo-v2.6-flash-free")
    monkeypatch.setenv("NINEROUTER_BASE_URL", "http://127.0.0.1:20128/v1")
    monkeypatch.setenv("NINEROUTER_API_KEY", "fake-local-key")
    original = httpx.AsyncClient
    monkeypatch.setattr(
        main.httpx,
        "AsyncClient",
        lambda **kwargs: original(transport=httpx.MockTransport(
            lambda req: httpx.Response(200, json={"choices": [{"message": {"content": content}}]})), **kwargs),
    )
    import asyncio
    result = asyncio.run(main._model_response("Oi"))
    assert result == "Não consegui formular uma resposta."
