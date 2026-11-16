#!/usr/bin/env python3
"""Reproducible, reversible local deployment for the Pet Gemini Live adapter.

Only touches the already installed MESTRE Agent and MCF Service Hub.
Neither the MCF MissionRuntime nor network/Tailscale configuration is changed.
No secrets are printed, copied into the repository, or accepted in arguments.
"""
from __future__ import annotations
import argparse
import os
from pathlib import Path
import secrets
import shutil
import stat
import sys
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parent
HOME=Path.home()
AGENT=HOME/"Aplicativos/MESTRE-agent"
HUB=HOME/".local/share/mcf-service-hub"
SECRET=HOME/".config/mcf-service-hub/pet-live-signing-key"

ASSETS={
    "backend/pet_live_auth.py":[AGENT/"pet_live_auth.py",HUB/"pet_live_auth.py"],
    "backend/pet_conversation.py":[HUB/"pet_conversation.py"],
    "backend/pet_observer.py":[HUB/"pet_observer.py"],
    "frontend/pet-hub.js":[HUB/"pet-hub.js"],
    "backend/pet_live_gateway.py":[AGENT/"pet_live_gateway.py"],
    "backend/pet_live_ticket.py":[HUB/"pet_live_ticket.py"],
    "frontend/pet-live.js":[HUB/"pet-live.js"],
    "frontend/pet-live.css":[HUB/"pet-live.css"],
    "frontend/pet-live-worklet.js":[HUB/"pet-live-worklet.js"],
    # Version the classical Pet UI too; sessions can expire during recording.
    "frontend/pet-conversation.js":[HUB/"pet-conversation.js"],
}
APP_IMPORT="from pet_live_gateway import router as pet_live_router\napp.include_router(pet_live_router)"
LIVE_CSP="connect-src 'self' ws://127.0.0.1:8878 ws://localhost:8878 wss://mcf-leo-n43sm.tail582305.ts.net:8466;"
PANEL_MARK="<!-- MCF-PET-GEMINI-LIVE-START -->"

class PatchError(Exception):pass

def replace_once(data: str, old: str, new: str, label: str) -> str:
    if old not in data:
        raise PatchError("Missing expected anchor: "+label)
    return data.replace(old,new,1)

def patch_agent(data: str) -> str:
    if APP_IMPORT in data:return data
    anchor="app.include_router(live_router)"
    return replace_once(data,anchor,anchor+"\n"+APP_IMPORT,"MESTRE app router")

def patch_hub(data: str) -> str:
    if "import pet_live_ticket as pet_ticket" not in data:
        data=replace_once(data,"import pet_conversation as pet_voice",
            "import pet_conversation as pet_voice\nimport pet_live_ticket as pet_ticket","HUB import")
    if '"/pet-live.js":' not in data:
        anchor='    "/pet-conversation.js": ("pet-conversation.js", "text/javascript; charset=utf-8"),'
        new=anchor+'''
    "/pet-live.js": ("pet-live.js", "text/javascript; charset=utf-8"),
    "/pet-live.css": ("pet-live.css", "text/css; charset=utf-8"),
    "/pet-live-worklet.js": ("pet-live-worklet.js", "text/javascript; charset=utf-8"),'''
        data=replace_once(data,anchor,new,"static live assets")
    if LIVE_CSP not in data:
        data=replace_once(data,"connect-src 'self';",LIVE_CSP,"WS allowlist CSP")
    if 'path == "/api/pet-voice/live-ticket"' not in data:
        anchor="""    def do_POST(self):
        path = urlparse(self.path).path
"""
        handler='''    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/pet-voice/live-ticket":
            try:
                pet_voice.authorize(self.headers)
                if self.headers.get("Content-Type","").split(";",1)[0].strip().lower() != "application/json":
                    raise pet_voice.ConversationError(415,"JSON_REQUIRED","Envie JSON.")
                if self.headers.get("Content-Length") != "2":
                    raise pet_voice.ConversationError(400,"INVALID_LENGTH","Corpo inválido.")
                if self.rfile.read(2) != b"{}":
                    raise pet_voice.ConversationError(400,"INVALID_JSON","Corpo inválido.")
                code, info = pet_ticket.ticket_response()
                return self._send(json.dumps(info,ensure_ascii=False).encode("utf-8"),
                                  "application/json; charset=utf-8",code)
            except pet_voice.ConversationError as err:
                return self._send(json.dumps({"ok":False,"error":err.code}).encode("utf-8"),
                                  "application/json; charset=utf-8",err.status)
'''
        data=replace_once(data,anchor,handler,"ticket scoped POST")
    return data

PANEL='''<!-- MCF-PET-GEMINI-LIVE-START -->
    <section class="pet-live-zone" id="petLiveZone" aria-label="Conversa natural Gemini Live com Pet MESTRE">
      <div class="pet-live-header">
        <div>
          <h3>🐱 Conversa Viva · Gemini Live</h3>
          <p>Fale naturalmente com o MESTRE sem pressionar a cada frase. A sessão só começa ao clicar e não executa ferramentas nem missões.</p>
        </div>
        <span class="pet-live-tag" id="petLiveModel">Gemini 3.8 Live</span>
      </div>
      <div class="pet-live-actions">
        <button type="button" id="petLiveStart">🎙 Iniciar conversa contínua</button>
        <button type="button" class="negative" id="petLiveStop" disabled>■ Encerrar e desligar microfone</button>
        <button type="button" class="secondary" id="petLiveTest" disabled>▶ Testar resposta</button>
        <label for="petLiveVoice">Voz
          <select id="petLiveVoice" aria-label="Voz Gemini Live">
            <option value="Fenrir" selected>Fenrir</option>
            <option value="Puck">Puck</option>
            <option value="Kore">Kore</option>
            <option value="Aoede">Aoede</option>
            <option value="Zephyr">Zephyr</option>
          </select>
        </label>
      </div>
      <p class="pet-live-presence" id="petLiveStatus" data-state="idle" role="status" aria-live="polite">● Desligado · sem captura de microfone</p>
      <p class="pet-live-diagnostic" id="petLiveAudioStatus">Nenhuma sessão de áudio em andamento.</p>
      <div id="petLiveTranscript" class="pet-live-transcript" role="log" aria-label="Transcrição da sessão de voz"></div>
      <p class="pet-live-warning">Privacidade: enquanto a sessão estiver ativa, o áudio do microfone é transmitido ao Google Gemini Live pelo MESTRE Agent. As transcrições confirmadas são armazenadas no histórico SQLite existente do MESTRE. Sem captura em segundo plano; pare a sessão para desligar o microfone. Duração máxima: 5 minutos.</p>
    </section>
<!-- MCF-PET-GEMINI-LIVE-END -->
'''

def patch_index(data: str) -> str:
    if '<link rel="stylesheet" href="/pet-live.css">' not in data:
        data=replace_once(data,'<link rel="stylesheet" href="/pet-conversation.css">',
            '<link rel="stylesheet" href="/pet-conversation.css">\n<link rel="stylesheet" href="/pet-live.css">',"live CSS")
    if '<script src="/pet-live.js" defer></script>' not in data:
        data=replace_once(data,'<script src="/pet-conversation.js" defer></script>',
            '<script src="/pet-conversation.js" defer></script>\n<script src="/pet-live.js" defer></script>',
            "live JS")
    if PANEL_MARK not in data:
        data=replace_once(data,
            '    <section class="pet-talk-zone" id="petTalkZone"',
            PANEL+'\n    <section class="pet-talk-zone" id="petTalkZone"',
            "live panel insertion")
    return data

def patch_tab_session_route(data: str) -> str:
    old='data, cookie = pet_voice.make_session(self.headers.get("Host",""))'
    new='data, cookie = pet_voice.make_session(self.headers.get("Host",""), self.headers.get("X-MCF-Pet-Tab"))'
    if new in data:
        return data
    return replace_once(data,old,new,"per-tab session creation")


def patch_classic(data: str) -> str:
    if "window.McfPetAuth = Object.freeze" in data:return data
    return replace_once(data,'  let csrf = "";',
        '  let csrf = "";\n  window.McfPetAuth = Object.freeze({getCsrf: () => csrf});',
        "CSRF handoff to same-origin pet-live script")

def plan() -> dict[Path,bytes]:
    if not AGENT.joinpath("app.py").is_file() or not HUB.joinpath("server.py").is_file():
        raise PatchError("MESTRE or Hub is not installed on this machine")
    payload={}
    for source, dests in ASSETS.items():
        content=(ROOT/source).read_bytes()
        for dest in dests:payload[dest]=content
    for source,patch in (
        (AGENT/"app.py",patch_agent),
        (HUB/"server.py",lambda data: patch_tab_session_route(patch_hub(data))),
        (HUB/"index.html",patch_index),
    ):
        payload[source]=patch(source.read_text(encoding="utf-8")).encode("utf-8")
    return payload

def install():
    payload=plan()
    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup=HUB/"backups"/("mcf-pet-live-"+stamp)
    backup.mkdir(parents=True,exist_ok=False,mode=0o700)
    for destination,content in payload.items():
        if destination.is_file():
            dest=backup/("agent" if destination.is_relative_to(AGENT) else "hub")/destination.name
            dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(destination,dest)
        else:
            destination.parent.mkdir(parents=True,exist_ok=True)
    SECRET.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    os.chmod(SECRET.parent,0o700)
    if not SECRET.exists():
        fd=os.open(SECRET,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,"wb") as stream:stream.write(secrets.token_bytes(32))
    info=SECRET.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid() or info.st_mode & 0o077 or info.st_size!=32:
        raise PatchError("Refusing to use insecure or malformed signing key")
    for destination,content in payload.items():
        tmp=destination.with_name(destination.name+".mcf-live-stage")
        tmp.write_bytes(content)
        os.replace(tmp,destination)
    print("LOCAL_INSTALL_APPLIED files="+str(len(payload))+" backup="+str(backup))
    return backup

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    group=cli.add_mutually_exclusive_group(required=True)
    group.add_argument("--check",action="store_true")
    group.add_argument("--apply",action="store_true")
    args=cli.parse_args()
    try:
        if args.check:
            updates=plan()
            print("LOCAL_PATCH_PLAN_OK files="+str(len(updates))+" new_or_modified="+
                  str(sum((not p.exists()) or p.read_bytes()!=value for p,value in updates.items())))
        else:
            install()
    except (PatchError,OSError,UnicodeError) as err:
        print("LOCAL_DEPLOY_BLOCKED "+str(err),file=sys.stderr)
        sys.exit(1)
