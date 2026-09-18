#!/usr/bin/env python3
import base64
import fcntl
import html
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path

HOME = Path.home()
CFG_DIR = HOME / ".config/voicehub-linux"
NVIDIA_CFG = CFG_DIR / "nvidia.json"
AZURE_CFG = CFG_DIR / "neural.json"
ELEVEN_CFG = CFG_DIR / "elevenlabs.json"
CLOUDFLARE_CFG = CFG_DIR / "cloudflare.json"
MODE_CFG = CFG_DIR / "mode.json"
ROUTER_CFG = CFG_DIR / "router.json"
HEALTH_CFG = CFG_DIR / "provider-health.json"
USAGE_CFG = CFG_DIR / "provider-usage.json"
LOG = HOME / ".local/share/voicehub-linux/logs/router.log"
ALL_PROVIDERS = ["nvidia", "edge", "cloudflare", "azure", "elevenlabs", "rhvoice"]
DEFAULT_ORDER = ["nvidia", "edge", "azure", "elevenlabs", "rhvoice"]
NVIDIA_BASE = "https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com"
EDGE_TTS_BIN = HOME / ".local/share/voicehub-linux/venv-edge-tts/bin/edge-tts"
EDGE_VOICE = "pt-BR-FranciscaNeural"
AUDIO_LOCK = HOME / ".local/state/voicehub-linux/audio.lock"

@contextmanager
def _exclusive_audio():
    AUDIO_LOCK.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(AUDIO_LOCK, os.O_CREAT | os.O_RDWR, 0o600)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX)
        yield
    finally:
        try:
            fcntl.flock(fd, fcntl.LOCK_UN)
        finally:
            os.close(fd)

CFG_DIR.mkdir(parents=True, exist_ok=True)
os.chmod(CFG_DIR, 0o700)

def _load(path, default=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {} if default is None else default

def _save(path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    os.chmod(tmp, 0o600)
    tmp.replace(path)
    os.chmod(path, 0o600)

def _log(message):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"{time.strftime('%Y-%m-%dT%H:%M:%S')} {message}\n")
def get_mode():
    data = _load(MODE_CFG, {})
    mode = data.get("mode", "Auto Grátis")
    aliases = {"Neural": "Auto Grátis", "Auto": "Auto Grátis"}
    return aliases.get(mode, mode)

def set_mode(mode):
    allowed = {"Auto Grátis", "NVIDIA", "Edge Grátis", "Cloudflare", "Microsoft", "ElevenLabs", "Privado"}
    if mode not in allowed:
        raise ValueError("Modo inválido")
    _save(MODE_CFG, {"mode": mode})
    return mode

def get_router_config():
    data = _load(ROUTER_CFG, {})
    order = [x for x in data.get("order", DEFAULT_ORDER) if x in ALL_PROVIDERS]
    for p in DEFAULT_ORDER:
        if p not in order:
            order.append(p)
    return {
        "order": order,
        "cooldown_enabled": bool(data.get("cooldown_enabled", True)),
    }

def set_router_order(order):
    clean = []
    for item in order:
        if item in ALL_PROVIDERS and item not in clean:
            clean.append(item)
    for p in DEFAULT_ORDER:
        if p not in clean:
            clean.append(p)
    _save(ROUTER_CFG, {"order": clean, "cooldown_enabled": True})
    return clean

def _usage():
    data = _load(USAGE_CFG, {})
    today = time.strftime("%Y-%m-%d")
    if data.get("date") != today:
        data = {"date": today, "providers": {}}
    return data

def _record_usage(provider, text):
    data = _usage()
    p = data.setdefault("providers", {}).setdefault(provider, {"calls": 0, "chars": 0})
    p["calls"] = int(p.get("calls", 0)) + 1
    p["chars"] = int(p.get("chars", 0)) + len(text)
    p["last_success"] = int(time.time())
    _save(USAGE_CFG, data)

def _health():
    return _load(HEALTH_CFG, {})

def _save_health(data):
    _save(HEALTH_CFG, data)

def provider_configured(provider):
    if provider == "nvidia":
        d = _load(NVIDIA_CFG)
        return bool(d.get("key") and d.get("voice"))
    if provider == "edge":
        return EDGE_TTS_BIN.exists() and os.access(EDGE_TTS_BIN, os.X_OK)
    if provider == "cloudflare":
        d = _load(CLOUDFLARE_CFG)
        return bool(d.get("account_id") and d.get("token") and d.get("active"))
    if provider == "azure":
        d = _load(AZURE_CFG)
        return bool(d.get("key") and d.get("region"))
    if provider == "elevenlabs":
        d = _load(ELEVEN_CFG)
        return bool(d.get("key") and d.get("voice_id"))
    if provider == "rhvoice":
        return bool(shutil.which("RHVoice-test"))
    return False
def provider_status():
    health = _health()
    out = {}
    labels = {
        "nvidia": "NVIDIA Magpie",
        "edge": "Microsoft Edge TTS",
        "cloudflare": "Cloudflare MeloTTS",
        "azure": "Microsoft Azure",
        "elevenlabs": "ElevenLabs",
        "rhvoice": "RHVoice Letícia",
    }
    for p in ALL_PROVIDERS:
        h = health.get(p, {})
        cooldown_until = float(h.get("cooldown_until", 0) or 0)
        u = _usage().get("providers", {}).get(p, {})
        cloud = _load(CLOUDFLARE_CFG) if p == "cloudflare" else {}
        configured = provider_configured(p)
        out[p] = {
            "label": labels[p],
            "configured": configured,
            "available": configured and cooldown_until <= time.time(),
            "credentials_present": bool(cloud.get("account_id") and cloud.get("token")) if p == "cloudflare" else configured,
            "active": bool(cloud.get("active")) if p == "cloudflare" else configured,
            "cooldown_until": cooldown_until,
            "last_success": h.get("last_success"),
            "last_error": h.get("last_error"),
            "last_code": h.get("last_code"),
            "failures": int(h.get("failures", 0) or 0),
            "today_calls": int(u.get("calls", 0) or 0),
            "today_chars": int(u.get("chars", 0) or 0),
        }
    return out

def _mark_success(provider):
    h = _health()
    h[provider] = {
        "failures": 0,
        "cooldown_until": 0,
        "last_success": int(time.time()),
        "last_error": None,
        "last_code": 200,
    }
    _save_health(h)

def _mark_failure(provider, exc):
    h = _health()
    prev = h.get(provider, {})
    failures = int(prev.get("failures", 0) or 0) + 1
    code = getattr(exc, "code", None)
    if code is None:
        import re
        m = re.search(r"\b(401|402|403|429|5\d\d)\b", str(exc))
        code = int(m.group(1)) if m else None
    if code in (401, 403):
        seconds = 300
    elif code == 402:
        seconds = 3600
    elif code == 429:
        seconds = 900
    elif code and int(code) >= 500:
        seconds = 60
    else:
        seconds = min(300, 15 * failures)
    h[provider] = {
        "failures": failures,
        "cooldown_until": int(time.time() + seconds),
        "last_success": prev.get("last_success"),
        "last_error": f"{type(exc).__name__}: {str(exc)[:240]}",
        "last_code": code,
    }
    _save_health(h)
def _pulse_env():
    env = os.environ.copy()
    env["XDG_RUNTIME_DIR"] = f"/run/user/{os.getuid()}"
    env["PULSE_SERVER"] = f"unix:/run/user/{os.getuid()}/pulse/native"
    return env

def _play_file(path):
    ext = Path(path).suffix.lower()
    if ext == ".wav":
        player = shutil.which("paplay") or shutil.which("aplay")
        cmd = [player, path]
    else:
        player = shutil.which("ffplay")
        cmd = [player, "-nodisp", "-autoexit", "-loglevel", "quiet", path]
    if not player:
        raise RuntimeError("Player de áudio local não encontrado")
    p = subprocess.run(cmd, env=_pulse_env(), capture_output=True, text=True, timeout=45)
    if p.returncode != 0:
        raise RuntimeError((p.stderr or "Falha ao reproduzir áudio").strip())

def speak_rhvoice(text):
    fd, wav = tempfile.mkstemp(prefix="voicehub-rh-", suffix=".wav")
    os.close(fd)
    try:
        p = subprocess.run(
            ["RHVoice-test", "-p", "Leticia-F123", "-o", wav],
            input=text + "\n", text=True, capture_output=True, timeout=20, env=_pulse_env()
        )
        if p.returncode != 0:
            raise RuntimeError((p.stderr or "Falha no RHVoice").strip())
        _play_file(wav)
        return "Letícia-F123"
    finally:
        try: os.unlink(wav)
        except OSError: pass

def speak_nvidia(text):
    d = _load(NVIDIA_CFG)
    key = str(d.get("key", "")).strip()
    voice = str(d.get("voice", "")).strip()
    language = str(d.get("language", "pt-BR")).strip()
    if not key or not voice:
        raise RuntimeError("NVIDIA não configurada")
    fd, wav = tempfile.mkstemp(prefix="voicehub-nvidia-", suffix=".wav")
    os.close(fd)
    try:
        boundary = f"----voicehub{time.time_ns():x}"
        fields = {
            "text": text,
            "language": language,
            "voice": voice,
            "encoding": "LINEAR_PCM",
            "sample_rate_hz": "44100",
        }
        parts = []
        for name, value in fields.items():
            parts.append(
                (
                    f"--{boundary}\r\n"
                    f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                    f"{value}\r\n"
                ).encode("utf-8")
            )
        parts.append(f"--{boundary}--\r\n".encode("ascii"))
        body = b"".join(parts)
        req = urllib.request.Request(
            NVIDIA_BASE + "/v1/audio/synthesize",
            data=body,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "User-Agent": "VoiceHub-Router/2.1",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                audio = response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:240]
            raise RuntimeError(f"NVIDIA HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"NVIDIA rede: {exc.reason}") from exc
        if len(audio) < 512:
            raise RuntimeError("NVIDIA retornou áudio inválido")
        Path(wav).write_bytes(audio)
        _play_file(wav)
        return voice
    finally:
        try:
            os.unlink(wav)
        except OSError:
            pass

def speak_edge(text):
    if not provider_configured("edge"):
        raise RuntimeError("Microsoft Edge TTS não disponível")
    fd, mp3 = tempfile.mkstemp(prefix="voicehub-edge-", suffix=".mp3")
    os.close(fd)
    try:
        p = subprocess.run(
            [str(EDGE_TTS_BIN), "--voice", EDGE_VOICE, "--text", text, "--write-media", mp3],
            capture_output=True, text=True, timeout=25, env=_pulse_env()
        )
        if p.returncode != 0:
            raise RuntimeError((p.stderr or f"edge-tts rc={p.returncode}").strip())
        if not Path(mp3).exists() or Path(mp3).stat().st_size < 512:
            raise RuntimeError("Edge TTS não retornou áudio válido")
        _play_file(mp3)
        return EDGE_VOICE
    finally:
        try: os.unlink(mp3)
        except OSError: pass

def _cloudflare_audio(account_id, token, text, lang="pt"):
    account_id = str(account_id or "").strip()
    token = str(token or "").strip()
    lang = str(lang or "pt").strip()
    if not account_id or not token:
        raise RuntimeError("Cloudflare sem Account ID ou token")
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/myshell-ai/melotts"
    payload = json.dumps({"prompt": text, "lang": lang}).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
            "User-Agent": "VoiceHub-Router/2.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read()
            ctype = (resp.headers.get("content-type") or "").lower()
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:500]
        raise RuntimeError(f"Cloudflare HTTP {e.code}: {detail}") from e
    if not raw:
        raise RuntimeError("Cloudflare retornou áudio vazio")
    if "audio" in ctype or raw[:3] == b"ID3" or raw[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
        return raw
    try:
        obj = json.loads(raw.decode("utf-8"))
    except Exception:
        raise RuntimeError(f"Resposta Cloudflare inesperada: {ctype or 'sem content-type'}")
    if not obj.get("success", True):
        raise RuntimeError("Cloudflare API retornou success=false")
    result = obj.get("result", obj)
    audio = None
    if isinstance(result, dict):
        audio = result.get("audio") or result.get("audio_base64")
    elif isinstance(result, str):
        audio = result
    if isinstance(audio, str):
        if "," in audio and audio.startswith("data:audio"):
            audio = audio.split(",", 1)[1]
        try:
            return base64.b64decode(audio)
        except Exception as e:
            raise RuntimeError("Cloudflare retornou áudio JSON inválido") from e
    raise RuntimeError("Cloudflare não retornou áudio reproduzível")

def _play_cloudflare_bytes(raw):
    fd, mp3 = tempfile.mkstemp(prefix="voicehub-cloudflare-", suffix=".mp3")
    os.close(fd)
    try:
        Path(mp3).write_bytes(raw)
        _play_file(mp3)
    finally:
        try: os.unlink(mp3)
        except OSError: pass

def speak_cloudflare(text):
    d = _load(CLOUDFLARE_CFG)
    raw = _cloudflare_audio(d.get("account_id"), d.get("token"), text, d.get("lang", "pt"))
    _play_cloudflare_bytes(raw)
    return f"Cloudflare MeloTTS ({d.get('lang','pt')})"

def test_cloudflare_credentials(account_id, token, lang="pt", text="Leandro, este é o teste da voz Cloudflare em português."):
    raw = _cloudflare_audio(account_id, token, text, lang)
    _play_cloudflare_bytes(raw)
    return {"provider": "cloudflare", "voice": f"MeloTTS ({lang})", "bytes": len(raw), "lang": lang}

def save_cloudflare_config(account_id, token, lang="pt", active=False):
    account_id = str(account_id or "").strip()
    token = str(token or "").strip()
    lang = str(lang or "pt").strip()
    if not account_id or not token:
        raise ValueError("Account ID e token Cloudflare são obrigatórios")
    _save(CLOUDFLARE_CFG, {
        "provider": "cloudflare",
        "account_id": account_id,
        "token": token,
        "model": "@cf/myshell-ai/melotts",
        "lang": lang,
        "active": bool(active),
    })
    return {"provider": "cloudflare", "lang": lang, "active": bool(active)}

def activate_cloudflare(active=True):
    d = _load(CLOUDFLARE_CFG)
    if not d.get("account_id") or not d.get("token"):
        raise RuntimeError("Cloudflare ainda não tem credenciais salvas")
    d["active"] = bool(active)
    _save(CLOUDFLARE_CFG, d)
    order = get_router_config()["order"]
    order = [x for x in order if x != "cloudflare"]
    if active:
        try:
            idx = order.index("edge") + 1
        except ValueError:
            idx = 0
        order.insert(idx, "cloudflare")
    set_router_order(order)
    return {"active": bool(active), "order": get_router_config()["order"]}

def speak_azure(text):
    d = _load(AZURE_CFG)
    key = str(d.get("key", "")).strip()
    region = str(d.get("region", "")).strip()
    voice = str(d.get("voice") or "pt-BR-FranciscaNeural").strip()
    if not key or not region:
        raise RuntimeError("Microsoft Azure não configurada")
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    ssml = f'<speak version="1.0" xml:lang="pt-BR"><voice name="{html.escape(voice)}">{html.escape(text)}</voice></speak>'
    req = urllib.request.Request(
        url, data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
            "User-Agent": "VoiceHub-Router/2.0",
        }, method="POST"
    )
    fd, wav = tempfile.mkstemp(prefix="voicehub-azure-", suffix=".wav")
    os.close(fd)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            Path(wav).write_bytes(r.read())
        _play_file(wav)
        return voice
    finally:
        try: os.unlink(wav)
        except OSError: pass

def speak_elevenlabs(text):
    d = _load(ELEVEN_CFG)
    key = str(d.get("key", "")).strip()
    voice = str(d.get("voice_id", "")).strip()
    voice_name = str(d.get("voice_name") or voice).strip()
    model = "eleven_flash_v2_5"
    if not key or not voice:
        raise RuntimeError("ElevenLabs não configurada")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/stream?output_format=pcm_24000"
    body = json.dumps({"text": text, "model_id": model, "language_code": "pt"}).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={"xi-api-key": key, "Content-Type": "application/json", "User-Agent": "VoiceHub-Router/2.0"},
        method="POST"
    )
    env = _pulse_env()
    player = subprocess.Popen(
        ["paplay", "--raw", "--format=s16le", "--rate=24000", "--channels=1"],
        stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            while True:
                chunk = r.read(8192)
                if not chunk: break
                player.stdin.write(chunk)
        player.stdin.close()
        if player.wait(timeout=30) != 0:
            raise RuntimeError("Falha no player ElevenLabs")
        return voice_name
    finally:
        if player.poll() is None:
            player.terminate()
SPEAKERS = {
    "nvidia": speak_nvidia,
    "edge": speak_edge,
    "cloudflare": speak_cloudflare,
    "azure": speak_azure,
    "elevenlabs": speak_elevenlabs,
    "rhvoice": speak_rhvoice,
}

def _route_for_mode(mode):
    mode = {"Neural": "Auto Grátis"}.get(mode, mode)
    if mode == "Privado":
        return ["rhvoice"]
    if mode == "NVIDIA":
        return ["nvidia", "rhvoice"]
    if mode == "Edge Grátis":
        return ["edge", "rhvoice"]
    if mode == "Cloudflare":
        return ["cloudflare", "rhvoice"]
    if mode == "Microsoft":
        return ["azure", "rhvoice"]
    if mode == "ElevenLabs":
        return ["elevenlabs", "rhvoice"]
    order = get_router_config()["order"]
    return order

def _route_speak_locked(text, mode=None):
    mode = mode or get_mode()
    status = provider_status()
    attempts = []
    last_error = None
    for provider in _route_for_mode(mode):
        if provider != "rhvoice" and not status.get(provider, {}).get("configured"):
            attempts.append({"provider": provider, "result": "not_configured"})
            continue
        if provider != "rhvoice" and not status.get(provider, {}).get("available"):
            attempts.append({"provider": provider, "result": "cooldown"})
            continue
        try:
            voice = SPEAKERS[provider](text)
            _mark_success(provider)
            _record_usage(provider, text)
            attempts.append({"provider": provider, "result": "ok"})
            _log(f"ROUTE OK mode={mode} provider={provider} voice={voice}")
            return {"provider": provider, "voice": voice, "attempts": attempts, "fallback": len(attempts) > 1}
        except Exception as exc:
            last_error = exc
            attempts.append({"provider": provider, "result": "error", "error": str(exc)[:180]})
            if provider != "rhvoice":
                _mark_failure(provider, exc)
            _log(f"ROUTE FAIL mode={mode} provider={provider} error={type(exc).__name__}:{exc}")
    raise RuntimeError(f"Nenhum provedor conseguiu falar: {last_error}")

def route_speak(text, mode=None):
    with _exclusive_audio():
        return _route_speak_locked(text, mode)

def _test_provider_locked(provider, text="Teste do VoiceHub."):
    if provider not in SPEAKERS:
        raise ValueError("Provedor inválido")
    if not provider_configured(provider):
        raise RuntimeError("Provedor não configurado")
    voice = SPEAKERS[provider](text)
    _mark_success(provider)
    _record_usage(provider, text)
    return {"provider": provider, "voice": voice}

def test_provider(provider, text="Teste do VoiceHub."):
    with _exclusive_audio():
        return _test_provider_locked(provider, text)

if not ROUTER_CFG.exists():
    _save(ROUTER_CFG, {"order": DEFAULT_ORDER, "cooldown_enabled": True})
if not MODE_CFG.exists():
    _save(MODE_CFG, {"mode": "Auto Grátis"})

NVIDIA_PTBR_VOICES = [
    "Magpie-Multilingual.PT-BR.Isabela",
    "Magpie-Multilingual.PT-BR.Louise",
    "Magpie-Multilingual.PT-BR.Diego",
]

def validate_nvidia_key(key):
    req = urllib.request.Request(
        NVIDIA_BASE + "/v1/audio/list_voices",
        headers={"Authorization": f"Bearer {key}", "User-Agent": "VoiceHub-Router/2.0"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(f"NVIDIA HTTP {e.code}: {detail}") from e
    text = raw.decode("utf-8", "replace")
    return {
        "ok": True,
        "ptbr_visible": [v for v in NVIDIA_PTBR_VOICES if v in text],
        "bytes": len(raw),
    }

def save_nvidia_config(key, voice=None):
    key = str(key or "").strip()
    voice = str(voice or NVIDIA_PTBR_VOICES[0]).strip()
    if not key:
        raise ValueError("Chave NVIDIA vazia")
    if voice not in NVIDIA_PTBR_VOICES:
        raise ValueError("Voz NVIDIA PT-BR inválida")
    result = validate_nvidia_key(key)
    _save(NVIDIA_CFG, {
        "provider": "nvidia",
        "key": key,
        "language": "pt-BR",
        "voice": voice,
        "endpoint": NVIDIA_BASE,
    })
    return {"provider": "nvidia", "voice": voice, **result}

def validate_azure_key(key, region, voice):
    key = str(key or "").strip()
    region = str(region or "").strip().lower()
    voice = str(voice or "pt-BR-FranciscaNeural").strip()
    if not key or not region:
        raise ValueError("Chave e região Azure são obrigatórias")
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list"
    req = urllib.request.Request(
        url,
        headers={"Ocp-Apim-Subscription-Key": key, "User-Agent": "VoiceHub-Router/2.0"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            voices = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Azure HTTP {e.code}") from e
    names = {v.get("ShortName") for v in voices if isinstance(v, dict)}
    if voice not in names:
        raise RuntimeError(f"Voz {voice} não disponível nesse recurso")
    return {"ok": True, "voice_count": len(names)}

def save_azure_config(key, region, voice="pt-BR-FranciscaNeural"):
    result = validate_azure_key(key, region, voice)
    _save(AZURE_CFG, {
        "provider": "azure-speech",
        "key": str(key).strip(),
        "region": str(region).strip().lower(),
        "voice": voice,
    })
    return {"provider": "azure", "region": str(region).strip().lower(), "voice": voice, **result}
