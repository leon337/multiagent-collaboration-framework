#!/usr/bin/env python3
import html, json, os, re, shutil, signal, subprocess, tempfile, threading, time
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

import voicehub_router as vhrouter
import voicehub_chat_bridge as vhchat
import radio_fx as vhfx
from voicehub_speech_queue import SpeechQueue

APP_DIR = Path(__file__).resolve().parent
HOME = Path.home()
SPEECHD_CONF = HOME / '.config/speech-dispatcher/speechd.conf'
RHVOICE_CONF = HOME / '.config/speech-dispatcher/modules/rhvoice.conf'
BACKUP_DIR = APP_DIR / 'backups'
LOG_DIR = APP_DIR / 'logs'
NEURAL_CFG = HOME / '.config/voicehub-linux/neural.json'
MODE_CFG = HOME / '.config/voicehub-linux/mode.json'
ELEVEN_CFG = HOME / '.config/voicehub-linux/elevenlabs.json'
BACKUP_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / 'voicehub.log'

BASE_ENV = os.environ.copy()
BASE_ENV.update({
    'HOME': str(HOME),
    'USER': HOME.name,
    'LOGNAME': HOME.name,
    'XDG_RUNTIME_DIR': f'/run/user/{os.getuid()}',
    'PULSE_SERVER': f'unix:/run/user/{os.getuid()}/pulse/native',
    'DISPLAY': BASE_ENV.get('DISPLAY', ':0'),
    'XAUTHORITY': str(HOME / '.Xauthority'),
})

def log_event(message, level='INFO'):
    line = f"{datetime.now().isoformat(timespec='seconds')} {level} {message}\n"
    with LOG_FILE.open('a', encoding='utf-8') as f:
        f.write(line)

def proc_running(pattern):
    r = subprocess.run(['pgrep','-f',pattern], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return r.returncode == 0

def _chat_voice_chunks(text, max_chars=420):
    clean = re.sub(r'[\*_#>|]+', ' ', str(text or ''))
    clean = re.sub(r'\s+', ' ', clean).strip()
    if not clean:
        return []
    chunks = []
    while clean:
        if len(clean) <= max_chars:
            chunks.append(clean)
            break
        cut = max(clean.rfind('. ', 0, max_chars), clean.rfind('? ', 0, max_chars), clean.rfind('! ', 0, max_chars))
        if cut < max_chars // 2:
            cut = clean.rfind(' ', 0, max_chars)
        if cut <= 0:
            cut = max_chars
        else:
            cut += 1
        chunks.append(clean[:cut].strip())
        clean = clean[cut:].strip()
    return chunks

def speak_chat_reply(text):
    for chunk in _chat_voice_chunks(text):
        try:
            SPEECH_QUEUE.enqueue(
                chunk,
                mode='Edge Grátis',
                meta={
                    'agent': 'VoiceHub Chat',
                    'project': 'VoiceHub',
                    'mission': 'CHAT',
                    'phase': 'reply',
                    'source': 'chat',
                },
                identify=False,
                wait=True,
                timeout=180,
            )
        except Exception as exc:
            log_event(f'Falha ao enfileirar resposta do chat: {exc}', 'WARN')
            break


def read_text(path):
    try: return path.read_text(encoding='utf-8', errors='replace')
    except Exception: return ''

def neural_state():
    if ELEVEN_CFG.exists():
        try:
            data = json.loads(ELEVEN_CFG.read_text(encoding='utf-8'))
            configured = bool(data.get('provider') == 'elevenlabs' and data.get('key') and data.get('voice_id') and data.get('model_id'))
            if configured:
                return {
                    'configured': True,
                    'provider': 'elevenlabs',
                    'region': 'global',
                    'voice': data.get('voice_name') or data.get('voice_id'),
                }
        except Exception:
            pass
    if NEURAL_CFG.exists():
        try:
            data = json.loads(NEURAL_CFG.read_text(encoding='utf-8'))
            configured = bool(data.get('provider') and data.get('region') and data.get('key'))
            return {
                'configured': configured,
                'provider': data.get('provider'),
                'region': data.get('region'),
                'voice': data.get('voice'),
            }
        except Exception:
            pass
    return {'configured': False, 'provider': None, 'region': None, 'voice': None}

def status_payload():
    conf = read_text(SPEECHD_CONF)
    neural = neural_state()
    voice_dir = Path('/usr/share/RHVoice/voices/Leticia-F123')
    runtime_sock = Path(f'/run/user/{os.getuid()}/speech-dispatcher/speechd.sock')
    return {
        'ok': True,
        'timestamp': datetime.now().isoformat(timespec='seconds'),
        'orca_running': proc_running(r'(^|/)orca( |$)'),
        'speech_dispatcher_running': proc_running(r'^/usr/bin/speech-dispatcher'),
        'speech_dispatcher_socket': runtime_sock.exists(),
        'rhvoice_installed': bool(shutil.which('RHVoice-test')) and voice_dir.exists(),
        'rhvoice_configured': 'AddModule "rhvoice"' in conf,
        'voice': 'Letícia-F123' if voice_dir.exists() else None,
        'language': 'pt',
        'neural': neural,
        'mode': current_speechd_mode(),
        'fallback_ready': voice_dir.exists(),
        'config_path': str(SPEECHD_CONF),
        'backup_count': len(list(BACKUP_DIR.glob('speech-dispatcher-*'))),
        'providers': vhrouter.provider_status(),
        'router': vhrouter.get_router_config(),
        'speech_queue': SPEECH_QUEUE.status() if 'SPEECH_QUEUE' in globals() else {'busy':False,'pending_count':0,'current':None,'recent':[]},
    }

def synthesize_eleven(text):
    data = json.loads(ELEVEN_CFG.read_text(encoding='utf-8'))
    key = str(data.get('key','')).strip()
    voice = str(data.get('voice_id','')).strip()
    voice_name = str(data.get('voice_name') or voice).strip()
    model = str(data.get('model_id') or 'eleven_multilingual_v2').strip()
    if not key or not voice:
        raise RuntimeError('Configuração ElevenLabs incompleta')
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128'
    body = json.dumps({
        'text': text,
        'model_id': model,
        'voice_settings': {'stability': 0.45, 'similarity_boost': 0.75}
    }).encode('utf-8')
    req = Request(url, data=body, headers={
        'xi-api-key': key,
        'Content-Type': 'application/json',
        'User-Agent': 'VoiceHub-Linux/1.0'
    }, method='POST')
    try:
        with urlopen(req, timeout=30) as r:
            audio = r.read()
    except HTTPError as e:
        detail = e.read().decode('utf-8','replace')[:500]
        raise RuntimeError(f'ElevenLabs HTTP {e.code}: {detail}')
    except URLError as e:
        raise RuntimeError(f'ElevenLabs rede: {e.reason}')
    fd, mp3 = tempfile.mkstemp(prefix='voicehub-eleven-', suffix='.mp3')
    os.close(fd)
    try:
        Path(mp3).write_bytes(audio)
        player = shutil.which('ffplay')
        if not player:
            raise RuntimeError('ffplay não encontrado')
        play = subprocess.run([player,'-nodisp','-autoexit','-loglevel','quiet',mp3], capture_output=True, text=True, timeout=40, env=BASE_ENV)
        if play.returncode != 0:
            raise RuntimeError((play.stderr or 'Falha ao reproduzir áudio ElevenLabs').strip())
        log_event(f'Teste neural reproduzido com ElevenLabs / {voice_name}')
        return voice_name
    finally:
        try: os.unlink(mp3)
        except OSError: pass

def synthesize_neural(text):
    n = neural_state()
    if not n.get('configured'):
        raise RuntimeError('Voz neural não configurada')
    if n.get('provider') == 'elevenlabs':
        return 'ElevenLabs', synthesize_eleven(text)
    return 'Azure Speech', synthesize_azure(text)

def synthesize_azure(text):
    data = json.loads(NEURAL_CFG.read_text(encoding='utf-8'))
    key = str(data.get('key','')).strip()
    region = str(data.get('region','')).strip()
    voice = str(data.get('voice') or 'pt-BR-FranciscaNeural').strip()
    if not key or not region:
        raise RuntimeError('Configuração Azure incompleta')
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    ssml = f'<speak version="1.0" xml:lang="pt-BR"><voice name="{html.escape(voice)}">{html.escape(text)}</voice></speak>'
    req = Request(url, data=ssml.encode('utf-8'), headers={
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
        'User-Agent': 'VoiceHub-Linux/1.0'
    }, method='POST')
    try:
        with urlopen(req, timeout=20) as r:
            audio = r.read()
    except HTTPError as e:
        raise RuntimeError(f'Azure Speech HTTP {e.code}')
    except URLError as e:
        raise RuntimeError(f'Azure Speech rede: {e.reason}')
    fd, wav = tempfile.mkstemp(prefix='voicehub-azure-', suffix='.wav')
    os.close(fd)
    try:
        Path(wav).write_bytes(audio)
        player = shutil.which('paplay') or shutil.which('aplay')
        if not player:
            raise RuntimeError('Nenhum player local encontrado')
        play = subprocess.run([player, wav], capture_output=True, text=True, timeout=30, env=BASE_ENV)
        if play.returncode != 0:
            raise RuntimeError((play.stderr or 'Falha ao reproduzir áudio Azure').strip())
        log_event(f'Teste neural reproduzido com {voice}')
        return voice
    finally:
        try: os.unlink(wav)
        except OSError: pass

def synthesize_local(text, rate=1.0, pitch=0, volume=80):
    if not shutil.which('RHVoice-test'):
        raise RuntimeError('RHVoice-test não encontrado')
    rate_pct = max(50, min(200, int(float(rate) * 100)))
    pitch_pct = max(50, min(150, 100 + int(float(pitch))))
    volume_pct = max(20, min(150, int(float(volume))))
    fd, wav = tempfile.mkstemp(prefix='voicehub-', suffix='.wav')
    os.close(fd)
    try:
        cmd = ['RHVoice-test','-p','Leticia-F123','-r',str(rate_pct),'-t',str(pitch_pct),'-v',str(volume_pct),'-o',wav]
        p = subprocess.run(cmd, input=text+'\n', text=True, capture_output=True, timeout=20, env=BASE_ENV)
        if p.returncode != 0:
            raise RuntimeError((p.stderr or p.stdout or 'Falha no RHVoice').strip())
        player = shutil.which('paplay') or shutil.which('aplay')
        if not player:
            raise RuntimeError('Nenhum player local encontrado')
        play = subprocess.run([player, wav], capture_output=True, text=True, timeout=30, env=BASE_ENV)
        if play.returncode != 0:
            raise RuntimeError((play.stderr or 'Falha ao reproduzir áudio').strip())
        log_event('Teste local reproduzido com Letícia-F123')
    finally:
        try: os.unlink(wav)
        except OSError: pass

def current_speechd_mode():
    return vhrouter.get_mode()

def set_speechd_mode(mode):
    vhrouter.set_mode(mode)
    log_event(f'Modo VoiceHub alterado para {mode}')

def _execute_queued_speech(text, mode=None, meta=None):
    radio_fx=bool((meta or {}).get('radio_fx',False))
    if radio_fx: vhfx.play('start')
    try:
        return vhrouter.route_speak(text, mode or current_speechd_mode())
    finally:
        if radio_fx: vhfx.play('end')

SPEECH_QUEUE = SpeechQueue(_execute_queued_speech, log_event)

def create_backup():
    if not SPEECHD_CONF.parent.exists():
        raise RuntimeError('Configuração do Speech Dispatcher não encontrada')
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    target = BACKUP_DIR / f'speech-dispatcher-{stamp}'
    shutil.copytree(SPEECHD_CONF.parent, target)
    manifest = {
        'created_at': datetime.now().isoformat(timespec='seconds'),
        'source': str(SPEECHD_CONF.parent),
        'voice': 'Letícia-F123',
        'reason': 'VoiceHub Linux manual backup'
    }
    (target/'VOICEHUB-BACKUP.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    log_event(f'Backup criado: {target.name}')
    return target.name

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)
    def log_message(self, fmt, *args):
        log_event(fmt % args, 'HTTP')
    def send_json(self, payload, code=200):
        data=json.dumps(payload,ensure_ascii=False).encode('utf-8')
        self.send_response(code); self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(data))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(data)
    def read_json(self):
        n=int(self.headers.get('Content-Length','0') or 0)
        if n > 8192: raise ValueError('Payload muito grande')
        return json.loads(self.rfile.read(n).decode('utf-8') or '{}')
    def do_GET(self):
        parsed=urlparse(self.path); path=parsed.path
        if path == '/api/status': return self.send_json(status_payload())
        if path == '/api/speech/queue':
            return self.send_json({'ok':True, **SPEECH_QUEUE.status()})
        if path == '/api/speech/job':
            job_id=(parse_qs(parsed.query).get('id') or [''])[0]
            job=SPEECH_QUEUE.job(job_id)
            if not job:
                return self.send_json({'ok':False,'error':'Job não encontrado'},404)
            return self.send_json({'ok':True,'job':job})
        if path == '/api/chat/status':
            return self.send_json({'ok':True, **vhchat.status()})
        if path == '/api/chat/history':
            return self.send_json({'ok':True, 'messages':vhchat.history(80)})
        if path == '/api/chat/events':
            return self.send_json({'ok':True, 'events':vhchat.events(120)})
        if path == '/api/logs':
            lines=read_text(LOG_FILE).splitlines()[-100:]
            return self.send_json({'ok':True,'lines':lines})
        if path == '/': self.path='/index.html'
        return super().do_GET()
    def do_POST(self):
        path=urlparse(self.path).path
        try:
            if path == '/api/chat/send':
                data=self.read_json()
                text=str(data.get('text','')).strip()
                timeout=int(data.get('timeout',90) or 90)
                source=str(data.get('source','voicehub_ui') or 'voicehub_ui')
                result=vhchat.send_message(
                    text,
                    timeout=max(15,min(timeout,120)),
                    source=source,
                )
                if data.get('speak',True):
                    threading.Thread(target=speak_chat_reply,args=(result.get('reply',''),),daemon=True).start()
                return self.send_json(result)
            if path == '/api/chat/clear':
                vhchat.clear_history()
                return self.send_json({'ok':True})
            if path == '/api/speech/enqueue':
                data=self.read_json(); text=str(data.get('text','')).strip()
                if not text:
                    return self.send_json({'ok':False,'error':'Texto vazio'},400)
                if len(text)>420:
                    return self.send_json({'ok':False,'error':'Limite de 420 caracteres para reporte identificado'},400)
                meta={
                    'agent': str(data.get('agent','')).strip(),
                    'project': str(data.get('project','')).strip(),
                    'mission': str(data.get('mission','')).strip(),
                    'phase': str(data.get('phase','')).strip(),
                    'source': str(data.get('source','api')).strip() or 'api',
                    'radio_fx': bool(data.get('radio_fx',False)),
                }
                wait=bool(data.get('wait',False))
                timeout=max(15,min(int(data.get('timeout',180) or 180),300))
                try:
                    job=SPEECH_QUEUE.enqueue(
                        text,
                        mode=str(data.get('mode','')).strip() or current_speechd_mode(),
                        meta=meta,
                        identify=True,
                        wait=wait,
                        timeout=timeout,
                    )
                except ValueError as exc:
                    return self.send_json({'ok':False,'error':str(exc)},400)
                code=200 if wait and job.get('status') in ('DONE','FAILED') else 202
                return self.send_json({'ok':job.get('status')!='FAILED','job':job},code)

            if path == '/api/speak':
                data=self.read_json(); text=str(data.get('text','')).strip()
                if not text: return self.send_json({'ok':False,'error':'Texto vazio'},400)
                if len(text)>500: return self.send_json({'ok':False,'error':'Limite de 500 caracteres'},400)
                meta={
                    'agent': str(data.get('agent','')).strip() or None,
                    'project': str(data.get('project','')).strip() or None,
                    'mission': str(data.get('mission','')).strip() or None,
                    'phase': str(data.get('phase','')).strip() or None,
                    'source': str(data.get('source','legacy_api')).strip() or 'legacy_api',
                    'radio_fx': bool(data.get('radio_fx',False)),
                }
                identify=bool(data.get('identify',False))
                wait=bool(data.get('wait',True))
                timeout=max(15,min(int(data.get('timeout',180) or 180),300))
                try:
                    job=SPEECH_QUEUE.enqueue(
                        text,
                        mode=current_speechd_mode(),
                        meta=meta,
                        identify=identify,
                        wait=wait,
                        timeout=timeout,
                    )
                except ValueError as exc:
                    return self.send_json({'ok':False,'error':str(exc)},400)
                result=job.get('result') or {}
                if job.get('status') == 'FAILED':
                    return self.send_json({'ok':False,'job':job,'error':job.get('error')},500)
                return self.send_json({
                    'ok':True,
                    'job':job,
                    'engine':result.get('provider'),
                    'voice':result.get('voice'),
                    'fallback':result.get('fallback'),
                    'attempts':result.get('attempts',[]),
                    'radio_fx': bool(meta.get('radio_fx')),
                }, 200 if job.get('status') == 'DONE' else 202)
            if path == '/api/mode':
                data=self.read_json(); mode=str(data.get('mode','')).strip()
                allowed=('Auto Grátis','NVIDIA','Edge Grátis','Microsoft','ElevenLabs','Privado')
                if mode not in allowed:
                    return self.send_json({'ok':False,'error':'Modo inválido'},400)
                if mode == 'NVIDIA' and not vhrouter.provider_configured('nvidia'):
                    return self.send_json({'ok':False,'error':'NVIDIA não configurada'},409)
                if mode == 'Edge Grátis' and not vhrouter.provider_configured('edge'):
                    return self.send_json({'ok':False,'error':'Microsoft Edge TTS não disponível'},409)
                if mode == 'Microsoft' and not vhrouter.provider_configured('azure'):
                    return self.send_json({'ok':False,'error':'Microsoft Azure não configurada'},409)
                if mode == 'ElevenLabs' and not vhrouter.provider_configured('elevenlabs'):
                    return self.send_json({'ok':False,'error':'ElevenLabs não configurada'},409)
                set_speechd_mode(mode)
                return self.send_json(status_payload())
            if path == '/api/provider/nvidia/save':
                data=self.read_json()
                result=vhrouter.save_nvidia_config(data.get('key'), data.get('voice'))
                return self.send_json({'ok':True, **result})
            if path == '/api/provider/azure/save':
                data=self.read_json()
                result=vhrouter.save_azure_config(
                    data.get('key'), data.get('region'), data.get('voice') or 'pt-BR-FranciscaNeural'
                )
                return self.send_json({'ok':True, **result})
            if path == '/api/test-provider':
                data=self.read_json(); provider=str(data.get('provider','')).strip().lower()
                result=vhrouter.test_provider(provider, 'Teste do VoiceHub Multi-Provider.')
                return self.send_json({'ok':True, **result})
            if path == '/api/router/order':
                data=self.read_json(); order=data.get('order') or []
                clean=vhrouter.set_router_order(order)
                return self.send_json({'ok':True,'order':clean})
            if path == '/api/backup':
                name=create_backup(); return self.send_json({'ok':True,'backup':name})
            if path in ('/api/restart','/api/restore'):
                return self.send_json({'ok':False,'requires_human_gate':True,'error':'Ação protegida pelo HUMAN_GATE do MCF.'},403)
            if path == '/api/test-neural':
                result=vhrouter.route_speak(
                    'Olá, Leandro. O modo automático do VoiceHub está funcionando.',
                    current_speechd_mode()
                )
                return self.send_json({
                    'ok':True,
                    'configured':True,
                    'provider':result['provider'],
                    'engine':result['provider'],
                    'region':'multi-provider',
                    'voice':result['voice'],
                    'attempts':result['attempts'],
                })
            return self.send_json({'ok':False,'error':'Endpoint não encontrado'},404)
        except subprocess.TimeoutExpired:
            log_event(f'Timeout em {path}','ERROR')
            return self.send_json({'ok':False,'error':'Tempo limite excedido'},504)
        except TimeoutError as e:
            log_event(f'{path}: {e}','ERROR')
            return self.send_json({'ok':False,'error':str(e),'type':'timeout'},504)
        except RuntimeError as e:
            log_event(f'{path}: {e}','ERROR')
            code = 409 if path.startswith('/api/chat/') else 500
            return self.send_json({'ok':False,'error':str(e),'type':'bridge_state'},code)
        except Exception as e:
            log_event(f'{path}: {e}','ERROR')
            return self.send_json({'ok':False,'error':str(e)},500)

def main():
    host='127.0.0.1'; port=int(os.environ.get('VOICEHUB_PORT','8788'))
    server=ThreadingHTTPServer((host,port),Handler)
    log_event(f'VoiceHub iniciado em http://{host}:{port}')
    print(f'VOICEHUB_READY http://{host}:{port}', flush=True)
    server.serve_forever()

if __name__=='__main__': main()
