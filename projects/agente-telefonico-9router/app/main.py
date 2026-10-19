"""MCF #449 — Twilio Voice webhook gateway and 9Router assistant.

Default fails closed: DEMO_MODE must explicitly be 1 to skip Twilio signatures.
No external calls or persistent storage are performed in demo mode.
"""
import base64
import hashlib
import hmac
import os
import re
import time
import urllib.parse
from collections import OrderedDict
from xml.etree.ElementTree import Element, SubElement, tostring

import httpx
from fastapi import FastAPI, HTTPException, Request, Response

app = FastAPI(title="MCF — Agente Telefônico", version="0.2.0", docs_url=None, redoc_url=None)
MAX_INPUT = 350
MAX_RESPONSE = 420
MAX_BODY = 12000
MAX_CALLS = 50
MAX_HISTORY_PAIRS = 3
CALL_TTL = 900
MAX_TURNS = 6

# Ephemeral in-process context: never store this in logs/files. Resets on restart.
_sessions: OrderedDict[str, dict] = OrderedDict()


def demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "0") == "1"


def _clean(value: str, limit: int) -> str:
    # TwiML is XML 1.0: remove control characters and bound input/output.
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(value))[:limit].strip()


def _twiml(message: str, *, gather: bool = False, next_action: str = "/voice/respond") -> Response:
    root = Element("Response")
    if gather:
        node = SubElement(
            root, "Gather",
            {"input": "speech", "language": "pt-BR", "speechModel": "phone_call", "speechTimeout": "auto",
             "action": next_action, "method": "POST", "timeout": "6"},
        )
        SubElement(node, "Say", {"language": "pt-BR", "voice": "Polly.Ricardo"}).text = _clean(message, MAX_RESPONSE)
        SubElement(root, "Say", {"language": "pt-BR", "voice": "Polly.Ricardo"}).text = "Não ouvi sua resposta. Até logo."
    else:
        SubElement(root, "Say", {"language": "pt-BR", "voice": "Polly.Ricardo"}).text = _clean(message, MAX_RESPONSE)
    if not gather:
        SubElement(root, "Hangup")
    return Response(tostring(root, encoding="unicode"), media_type="application/xml; charset=utf-8",
                    headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


def valid_twilio_signature(url: str, params: dict, signature: str, token: str) -> bool:
    """Twilio form webhook canonical signature; verified against official SDK in tests."""
    if not signature or not token or not url.startswith("https://"):
        return False
    canonical = url + "".join(key + str(params[key]) for key in sorted(params))
    expected = base64.b64encode(hmac.new(token.encode(), canonical.encode(), hashlib.sha1).digest()).decode()
    return hmac.compare_digest(signature.strip(), expected)


async def _read_form(request: Request) -> dict[str, str]:
    if request.headers.get("content-type", "").split(";")[0].lower() != "application/x-www-form-urlencoded":
        raise HTTPException(415, "Unsupported form type")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > MAX_BODY:
            raise HTTPException(413, "Request body too large")
    try:
        decoded = body.decode("utf-8", errors="strict")
        if re.search(r"%(?![0-9A-Fa-f]{2})", decoded):
            raise ValueError("Invalid percent escape")
        urllib.parse.unquote_to_bytes(decoded).decode("utf-8", errors="strict")
        parsed = urllib.parse.parse_qs(decoded, keep_blank_values=True, max_num_fields=60, strict_parsing=True)
    except (UnicodeDecodeError, ValueError):
        raise HTTPException(400, "Invalid form encoding") from None
    if any(len(values) != 1 for values in parsed.values()):
        raise HTTPException(400, "Duplicate form parameters")
    return {name: values[0] for name, values in parsed.items()}


async def _authorize(request: Request, values: dict[str, str]) -> None:
    if demo_mode():
        return
    token = os.getenv("TWILIO_AUTH_TOKEN", "")
    public_base = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    parsed = urllib.parse.urlsplit(public_base)
    if (not token or parsed.scheme != "https" or not parsed.netloc
            or parsed.username or parsed.password or parsed.query or parsed.fragment):
        raise HTTPException(503, "Webhook configuration incomplete")
    # Ignore X-Forwarded-* (untrusted). The base URL is explicit and trusted.
    full_url = public_base + request.url.path
    if request.url.query:
        full_url += "?" + request.url.query
    if not valid_twilio_signature(full_url, values, request.headers.get("X-Twilio-Signature", ""), token):
        raise HTTPException(403, "Invalid Twilio signature")


def _call_id(form: dict[str, str]) -> str | None:
    sid = form.get("CallSid", "")
    return sid if re.fullmatch(r"CA[a-fA-F0-9]{32}", sid) else None


def _session(call_id: str | None) -> dict | None:
    if not call_id:
        return None
    now = time.monotonic()
    for key in tuple(_sessions):
        if now - _sessions[key]["updated"] > CALL_TTL:
            del _sessions[key]
    if call_id not in _sessions:
        if len(_sessions) >= MAX_CALLS:
            _sessions.popitem(last=False)
        _sessions[call_id] = {"updated": now, "turns": 0, "history": []}
    row = _sessions[call_id]
    row["updated"] = now
    _sessions.move_to_end(call_id)
    return row


@app.get("/health")
async def health():
    return {"status": "ok", "mode": "demo" if demo_mode() else "secured", "version": "0.2.0"}


@app.post("/voice/incoming")
async def incoming(request: Request):
    form = await _read_form(request)
    await _authorize(request, form)
    sid = _call_id(form)
    if not demo_mode() and not sid:
        raise HTTPException(400, "Invalid CallSid")
    if sid:
        _sessions.pop(sid, None)  # Reset if a new call begins.
    return _twiml("Olá! Sou seu assistente virtual. Como posso ajudar?", gather=True)


async def _model_response(text: str, history: list[dict] | None = None) -> str:
    if demo_mode():
        return "Modo demonstração. Você disse: " + text[:160]
    key = os.getenv("NINEROUTER_API_KEY", "")
    if not key:
        return "O serviço de inteligência artificial ainda não foi configurado."
    base = os.getenv("NINEROUTER_BASE_URL", "https://api.9router.com/v1").rstrip("/")
    parts = urllib.parse.urlsplit(base)
    if parts.scheme != "https" or not parts.netloc or parts.username or parts.password or parts.query:
        return "O serviço de inteligência artificial não está disponível."
    messages = [
        {"role": "system", "content": "Você é um agente de atendimento telefônico em português do Brasil. "
         "Seja objetivo (até duas frases), educado, sem pedir senhas, dados bancários ou informações sensíveis. "
         "Não execute ações fora da conversa."}
    ]
    messages.extend(history or [])
    messages.append({"role": "user", "content": text})
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=4.0), follow_redirects=False) as client:
            result = await client.post(
                base + "/chat/completions",
                headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
                json={"model": os.getenv("MODEL_NAME", "deepseek/deepseek-chat"),
                      "messages": messages, "max_tokens": 150, "temperature": 0.4},
            )
            result.raise_for_status()
            answer = result.json()["choices"][0]["message"]["content"]
            return _clean(answer, MAX_RESPONSE) or "Não consegui formular uma resposta."
    except (httpx.HTTPError, KeyError, ValueError, TypeError, IndexError):
        return "Ocorreu uma falha temporária no atendimento. Tente novamente mais tarde."


@app.post("/voice/respond")
async def respond(request: Request):
    form = await _read_form(request)
    await _authorize(request, form)
    sid = _call_id(form)
    if not demo_mode() and not sid:
        raise HTTPException(400, "Invalid CallSid")
    row = _session(sid)
    speech = _clean(form.get("SpeechResult", ""), MAX_INPUT)
    if not speech:
        return _twiml("Não consegui compreender. Pode repetir sua pergunta?", gather=True)
    if row and row["turns"] >= MAX_TURNS:
        _sessions.pop(sid, None)
        return _twiml("Encerramos este atendimento. Obrigado e até logo.")
    history = list(row["history"]) if row and os.getenv("ENABLE_CALL_CONTEXT") == "1" else []
    answer = await _model_response(speech, history)
    if row:
        row["turns"] += 1
        if os.getenv("ENABLE_CALL_CONTEXT") == "1":
            row["history"].extend([{"role": "user", "content": speech},
                                   {"role": "assistant", "content": answer}])
            row["history"] = row["history"][-MAX_HISTORY_PAIRS * 2:]
    if row and row["turns"] >= MAX_TURNS:
        _sessions.pop(sid, None)
        return _twiml(answer + " Obrigado pelo contato. Até logo.")
    return _twiml(answer + " Deseja perguntar mais alguma coisa?", gather=True)
