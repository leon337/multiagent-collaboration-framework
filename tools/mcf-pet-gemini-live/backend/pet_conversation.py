#!/usr/bin/env python3
"""User-initiated Pet MESTRE conversation adapter.

Reuse MESTRE Agent (:8878) for chat, local Vosk STT and Piper TTS;
optionally enqueue to VoiceHub (:8788) only when its dispatcher is active.
The infrastructure collection and canonical MCF runtime stay read-only.

Strict browser Origin + CSRF cookies, request bounds, idempotency and
no automatic microphone access, no tool execution, no content logging.
"""
from __future__ import annotations

import hashlib
import http.client
from http.cookies import SimpleCookie
import json
import re
import secrets
import socket
import threading
import time
import uuid
from typing import Any

SAFE_HOSTS = frozenset((
    "127.0.0.1:8898",
    "localhost:8898",
    "mcf-leo-n43sm.tail582305.ts.net:8446",
))
SAFE_ORIGINS = frozenset((
    "http://127.0.0.1:8898",
    "http://localhost:8898",
    "https://mcf-leo-n43sm.tail582305.ts.net:8446",
))
SESSION_TTL = 3600
MAX_SESSIONS = 60
MAX_AUDIO = 4_500_000
MAX_JSON = 8_192
MAX_REPLY = 6500
MODEL_HOST = "127.0.0.1"
MODEL_PORT = 8878
VOICEHUB_PORT = 8788
PET_PORT = 18765
STATES = frozenset(("ocioso", "ouvindo", "raciocinando", "executando", "concluido", "erro"))
VOICES = frozenset(("piper-faber", "piper-cadu", "piper-jeff", "piper-dii"))
ALLOW_AUDIO = frozenset(("audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "application/octet-stream"))
COOKIE = "mcfpet_session"
TAB_COOKIE_PREFIX = "mcfpet_tab_"
TAB_ID_RE = re.compile(r"^[0-9a-f]{32}$")

_sessions: dict[str, dict[str, Any]] = {}
_mutex = threading.RLock()
_chat_busy = threading.Lock()
_completed: dict[tuple[str,str], tuple[float,str,dict]] = {}


class ConversationError(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def safe_host(host: str) -> bool:
    return host.strip().lower() in SAFE_HOSTS


def make_session(host: str, tab_id: str | None = None) -> tuple[dict, str]:
    if not safe_host(host):
        raise ConversationError(403, "HOST_FORBIDDEN", "Host não autorizado.")
    if tab_id:
        if not isinstance(tab_id,str) or not TAB_ID_RE.fullmatch(tab_id):
            raise ConversationError(400, "INVALID_TAB_ID", "Identificador de aba inválido.")
        cookie_name = TAB_COOKIE_PREFIX + tab_id
    else:
        # Legacy clients remain supported until all old pages are reloaded.
        cookie_name = COOKIE
    now = time.monotonic()
    with _mutex:
        stale = [k for k,v in _sessions.items() if v["expires"] < now]
        for key in stale:
            _sessions.pop(key, None)
        if len(_sessions) >= MAX_SESSIONS:
            oldest = min(_sessions, key=lambda k:_sessions[k]["expires"])
            _sessions.pop(oldest, None)
        sid = secrets.token_urlsafe(24)
        csrf = secrets.token_urlsafe(32)
        _sessions[sid] = {"csrf": csrf, "expires": now + SESSION_TTL, "last": 0.0}
    secure = "; Secure" if host.lower().startswith("mcf-leo-") else ""
    cookie = f"{cookie_name}={sid}; Path=/api/pet-voice; Max-Age={SESSION_TTL}; HttpOnly; SameSite=Strict{secure}"
    return {
        "ok": True,
        "csrf": csrf,
        "expires_in": SESSION_TTL,
        "mode": "push-to-talk",
        "agent": "MESTRE Agent:8878",
        "stt": "Vosk local",
        "tts_default": "Piper local",
        "content_persists_in": "MESTRE Agent SQLite",
    }, cookie


def authorize(headers: Any) -> str:
    host = str(headers.get("Host") or "")
    origin = str(headers.get("Origin") or "")
    if not safe_host(host) or origin not in SAFE_ORIGINS:
        raise ConversationError(403, "ORIGIN_FORBIDDEN", "Origem do navegador não autorizada.")
    tab_id = str(headers.get("X-MCF-Pet-Tab") or "")
    if tab_id and not TAB_ID_RE.fullmatch(tab_id):
        raise ConversationError(403, "INVALID_SESSION", "Sessão inválida.")
    cookie_name = TAB_COOKIE_PREFIX + tab_id if tab_id else COOKIE
    raw = headers.get("Cookie") or ""
    # Several independent tabs can coexist; cookies have an hour-long TTL.
    if len(raw) > 8192:
        raise ConversationError(403, "INVALID_SESSION", "Sessão inválida.")
    cookie = SimpleCookie()
    try:
        cookie.load(raw)
    except Exception as exc:
        raise ConversationError(403, "INVALID_SESSION", "Sessão inválida.") from exc
    sid = cookie.get(cookie_name).value if cookie_name in cookie else ""
    csrf = str(headers.get("X-MCF-Pet-CSRF") or "")
    if not sid or len(csrf) > 128:
        raise ConversationError(403, "INVALID_SESSION", "Sessão de voz ausente.")
    with _mutex:
        entry = _sessions.get(sid)
        if not entry or entry["expires"] < time.monotonic() or not secrets.compare_digest(csrf, entry["csrf"]):
            raise ConversationError(403, "INVALID_SESSION", "Sessão de voz inválida ou expirada.")
    return sid


def _request_json(body: bytes, limit: int = MAX_JSON) -> dict:
    if len(body) > limit or not body:
        raise ConversationError(413, "INVALID_LENGTH", "Conteúdo fora do limite.")
    try:
        item = json.loads(body)
    except (ValueError, UnicodeDecodeError) as exc:
        raise ConversationError(400, "INVALID_JSON", "Mensagem JSON inválida.") from exc
    if not isinstance(item, dict):
        raise ConversationError(400, "INVALID_JSON", "Objeto JSON obrigatório.")
    return item


def _request(
    port: int,
    method: str,
    path: str,
    body: bytes | None = None,
    media_type: str = "application/json",
    timeout: int = 35,
    response_limit: int = MAX_AUDIO + 4096,
) -> tuple[int, bytes, str]:
    conn = http.client.HTTPConnection(MODEL_HOST, port, timeout=timeout)
    headers = {"Accept": "application/json", "Connection": "close"}
    if body is not None:
        headers["Content-Type"] = media_type
    try:
        conn.request(method, path, body=body, headers=headers)
        resp = conn.getresponse()
        binary = resp.read(response_limit + 1)
        if len(binary) > response_limit:
            raise ConversationError(502, "UPSTREAM_TOO_LARGE", "A resposta excedeu o tamanho permitido.")
        return resp.status, binary, resp.getheader("Content-Type", "")
    except (OSError, http.client.HTTPException, TimeoutError) as exc:
        raise ConversationError(503, "UPSTREAM_UNAVAILABLE", "Serviço do MESTRE temporariamente indisponível.") from exc
    finally:
        conn.close()


def _pet_state(state: str) -> bool:
    if state not in STATES:
        return False
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.sendto(state.encode("ascii"), ("127.0.0.1", PET_PORT))
        return True
    except OSError:
        return False


def set_pet_state(body: bytes) -> dict:
    data = _request_json(body)
    state = data.get("state")
    if not isinstance(state, str) or state not in STATES:
        raise ConversationError(400, "INVALID_PET_STATE", "Estado do Pet não permitido.")
    return {"ok": _pet_state(state), "state": state}


def _parse_sse(status: int, binary: bytes) -> dict:
    # Kept for isolated tests. Live network path is streamed, not buffered.
    if status != 200:
        raise ConversationError(503, "CHAT_UNAVAILABLE", "O MESTRE não aceitou a conversa.")
    return _events_to_reply(binary.decode("utf-8", "replace").splitlines())


def _events_to_reply(lines: list[str]) -> dict:
    parts: list[str] = []
    chars = 0
    done = False
    model = "não identificado"
    fallback = False
    for line in lines:
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if not payload or payload == "[DONE]":
            continue
        try:
            event = json.loads(payload)
        except ValueError:
            continue
        if not isinstance(event, dict):
            continue
        if isinstance(event.get("token"), str):
            piece = event["token"]
            chars += len(piece)
            if chars > MAX_REPLY:
                raise ConversationError(502, "CHAT_TOO_LONG", "Resposta ultrapassou o limite de leitura.")
            parts.append(piece)
        if isinstance(event.get("error"), str):
            raise ConversationError(503, "CHAT_FAILED", "O modelo não concluiu a resposta.")
        if event.get("done") is True:
            done = True
            model_raw = event.get("model_used")
            model = model_raw[:90] if isinstance(model_raw, str) else model
            fallback = event.get("fallback") is True
    reply = "".join(parts).strip()
    if not done or not reply:
        raise ConversationError(503, "CHAT_INCOMPLETE", "O MESTRE não retornou uma resposta completa.")
    return {"ok": True, "reply": reply, "model": model, "fallback": fallback,
            "source": "MESTRE_AGENT_CHAT", "executed_tools": False}


def _chat_live(text: str) -> dict:
    payload = json.dumps({"content": text, "web_search": "off"},
                         ensure_ascii=False).encode("utf-8")
    conn = http.client.HTTPConnection(MODEL_HOST, MODEL_PORT, timeout=12)
    try:
        conn.request("POST", "/api/chat", body=payload, headers={
            "Content-Type":"application/json", "Accept":"text/event-stream",
            "Connection":"close",
        })
        resp = conn.getresponse()
        if resp.status != 200:
            raise ConversationError(503, "CHAT_UNAVAILABLE", "O MESTRE não aceitou a conversa.")
        # The MESTRE API emits SSE. Parse bounded lines without storing its raw history.
        if not (resp.getheader("Content-Type") or "").startswith("text/event-stream"):
            raise ConversationError(502, "UPSTREAM_PROTOCOL", "Contrato de chat inesperado.")
        deadline = time.monotonic() + 95
        lines = []
        total = 0
        while time.monotonic() < deadline:
            raw = resp.readline(8193)
            if not raw:
                break
            total += len(raw)
            if len(raw) > 8192 or total > 65_536:
                raise ConversationError(502, "CHAT_TOO_LARGE", "Resposta do MESTRE muito longa.")
            line = raw.decode("utf-8", "replace").strip()
            lines.append(line)
            if line.startswith("data:"):
                try:
                    event = json.loads(line[5:].strip())
                    if isinstance(event,dict) and (event.get("done") is True or event.get("error")):
                        break
                except ValueError:
                    continue
        return _events_to_reply(lines)
    except (OSError, http.client.HTTPException, TimeoutError) as exc:
        raise ConversationError(503, "CHAT_UNAVAILABLE", "O MESTRE não concluiu a conversa.") from exc
    finally:
        conn.close()


def chat(body: bytes, sid: str) -> tuple[int, dict]:
    data = _request_json(body, 4096)
    content = data.get("text")
    request_id = data.get("request_id")
    if not isinstance(content, str) or not (1 <= len(content.strip()) <= 700):
        raise ConversationError(400, "INVALID_TEXT", "Digite até 700 caracteres.")
    content = content.strip()
    if not isinstance(request_id, str) or not re.fullmatch(r"[0-9a-fA-F-]{36}", request_id):
        raise ConversationError(400, "INVALID_REQUEST_ID", "ID de conversa inválido.")
    try:
        uuid.UUID(request_id)
    except ValueError as exc:
        raise ConversationError(400, "INVALID_REQUEST_ID", "ID de conversa inválido.") from exc
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
    key = (sid, request_id)
    now = time.monotonic()
    with _mutex:
        expired = [k for k,v in _completed.items() if now - v[0] > 300]
        for k in expired:
            _completed.pop(k, None)
        if key in _completed:
            _, original_hash, response = _completed[key]
            if original_hash != digest:
                raise ConversationError(409, "ID_REUSED", "Identificador reutilizado com outra mensagem.")
            return 200, dict(response)
    if not _chat_busy.acquire(blocking=False):
        raise ConversationError(409, "CHAT_BUSY", "Uma conversa já está em andamento.")
    try:
        _pet_state("raciocinando")
        try:
            response = _chat_live(content)
        except ConversationError:
            _pet_state("erro")
            raise
        _pet_state("concluido")
        with _mutex:
            _completed[key] = (time.monotonic(), digest, dict(response))
            # Bound in-memory response cache. No disk persistence in this adapter.
            while len(_completed) > 40:
                oldest = next(iter(_completed))
                _completed.pop(oldest, None)
        return 200, response
    finally:
        _chat_busy.release()


def stt(body: bytes, mime: str) -> dict:
    content_type = mime.split(";", 1)[0].lower().strip()
    if content_type not in ALLOW_AUDIO:
        raise ConversationError(415, "UNSUPPORTED_AUDIO", "Formato de áudio não permitido.")
    if not (500 <= len(body) <= MAX_AUDIO):
        raise ConversationError(413, "INVALID_AUDIO_LENGTH", "Áudio vazio ou acima do limite.")
    _pet_state("raciocinando")
    status, raw, _ = _request(
        MODEL_PORT, "POST", "/api/stt", body,
        media_type=content_type, timeout=30, response_limit=8192,
    )
    if status != 200:
        _pet_state("erro")
        raise ConversationError(422 if status in (400,415,422) else 503,
                                "STT_FAILED", "Não foi possível transcrever a gravação.")
    try:
        result = json.loads(raw)
        text = str(result.get("text") or "").strip()
        seconds = result.get("seconds")
    except (ValueError, AttributeError, TypeError) as exc:
        raise ConversationError(502, "STT_PROTOCOL", "Resposta de transcrição inválida.") from exc
    if len(text) > 700:
        raise ConversationError(422,"STT_TOO_LONG","Fala muito longa para este modo.")
    return {"ok": True, "text": text, "seconds": seconds,
            "engine": "VOSK_LOCAL", "audio_saved": False}


def _voicehub_status() -> bool:
    try:
        status, raw, _ = _request(VOICEHUB_PORT, "GET", "/api/status",
                                  timeout=2, response_limit=8192)
        if status != 200:
            return False
        data = json.loads(raw)
        return data.get("ok") is True and data.get("speech_dispatcher_running") is True
    except (ValueError, ConversationError, AttributeError):
        return False


def speak(body: bytes) -> tuple[int, bytes, str]:
    data = _request_json(body, 4000)
    text = data.get("text")
    mode = data.get("mode", "local")
    voice = data.get("voice", "piper-faber")
    if not isinstance(text, str) or not (1 <= len(text.strip()) <= 900):
        raise ConversationError(400, "INVALID_SPEECH", "A resposta falada deve ter até 900 caracteres.")
    if mode not in ("local", "voicehub"):
        raise ConversationError(400, "INVALID_VOICE_MODE", "Modo de voz não permitido.")
    _pet_state("executando")
    if mode == "voicehub":
        if not _voicehub_status():
            _pet_state("erro")
            raise ConversationError(503, "VOICEHUB_UNAVAILABLE",
                                    "Despachante do VoiceHub indisponível. Selecione voz local.")
        payload = json.dumps({
            "text": text.strip(),
            "agent": "MESTRE", "project": "MCF",
            "source": "mcf_pet_user_initiated",
            "wait": False, "radio_fx": False,
        }, ensure_ascii=False).encode("utf-8")
        code, raw, _ = _request(VOICEHUB_PORT, "POST", "/api/speech/enqueue",
                                payload, timeout=8, response_limit=8192)
        try:
            obj = json.loads(raw)
        except ValueError as exc:
            raise ConversationError(502, "VOICEHUB_PROTOCOL", "Resposta do VoiceHub inválida.") from exc
        if code not in (200, 202) or obj.get("ok") is not True:
            _pet_state("erro")
            raise ConversationError(503, "VOICEHUB_FAILED", "VoiceHub não aceitou o envio.")
        return 202, json.dumps({"ok":True,"queued":True,"playback_confirmed":False,
                                  "provider":"VOICEHUB"}).encode(), "application/json"
    if voice not in VOICES:
        raise ConversationError(400, "INVALID_VOICE", "Voz local não permitida.")
    payload = json.dumps({"text":text.strip(),"voice":voice,"rate":100},ensure_ascii=False).encode()
    code, wave, mime = _request(MODEL_PORT, "POST", "/api/tts",payload,
                                timeout=45,response_limit=3_500_000)
    if code != 200 or not mime.lower().startswith("audio/wav") or len(wave) < 500:
        _pet_state("erro")
        raise ConversationError(503,"TTS_FAILED","O sintetizador de voz local não respondeu.")
    return 200, wave, "audio/wav"


def status() -> dict:
    status_code, raw, _ = _request(MODEL_PORT, "GET", "/health", timeout=2,response_limit=2048)
    configured = False
    if status_code == 200:
        try:
            d=json.loads(raw)
            configured = d.get("ok") is True and d.get("configured") is True
        except (ValueError, AttributeError):
            pass
    return {"ok":True, "chat_configured":configured,
            "stt":"local_vosk", "voice_default":"piper-faber",
            "voicehub_dispatcher_available":_voicehub_status(),
            "mic_requires_click":True,
            "chat_web_search":False,
            "tools_executable":False}

POST_PATHS=frozenset(("/api/pet-voice/chat","/api/pet-voice/stt",
                      "/api/pet-voice/speak","/api/pet-voice/state"))
