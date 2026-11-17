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
    "backend/pet_readonly_tools.py":[AGENT/"pet_readonly_tools.py"],
    "backend/pet_proposals.py":[AGENT/"pet_proposals.py",HUB/"pet_proposals.py"],
    "backend/pet_mission_bridge.py":[HUB/"pet_mission_bridge.py"],
    "backend/pet_scoped_write.py":[HUB/"pet_scoped_write.py"],
    "frontend/pet-proposals.js":[HUB/"pet-proposals.js"],
    "frontend/pet-proposals.css":[HUB/"pet-proposals.css"],
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
      <label class="pet-live-tool-permission"><input type="checkbox" id="petLiveAllowTools"> 🔎 Permitir consultas de infraestrutura (somente leitura) nesta sessão</label>
      <p class="pet-live-tool-status" id="petLiveToolStatus" aria-live="polite">Ferramentas desligadas · nenhum comando operacional será executado. Ao habilitar consultas, resultados filtrados de CPU, GPU e serviços serão enviados ao Google Gemini para compor a resposta, sem credenciais.</p>
      <p class="pet-live-presence" id="petLiveStatus" data-state="idle" role="status" aria-live="polite">● Desligado · sem captura de microfone</p>
      <p class="pet-live-diagnostic" id="petLiveAudioStatus">Nenhuma sessão de áudio em andamento.</p>
      <div id="petLiveTranscript" class="pet-live-transcript" role="log" aria-label="Transcrição da sessão de voz"></div>
      <p class="pet-live-warning">Privacidade: enquanto a sessão estiver ativa, o áudio do microfone é transmitido ao Google Gemini Live pelo MESTRE Agent. As transcrições confirmadas são armazenadas no histórico SQLite existente do MESTRE. Sem captura em segundo plano; pare a sessão para desligar o microfone. Duração máxima: 5 minutos.</p>
    </section>
<!-- MCF-PET-GEMINI-LIVE-END -->
'''

def patch_tool_controls(data: str) -> str:
    if 'id="petLiveAllowTools"' in data:
        # The checkbox may already be deployed; keep its disclosure current
        # without duplicating the element or changing other dashboard areas.
        old_notice="Ferramentas desligadas · nenhum comando operacional será executado."
        new_notice=(old_notice+" Ao habilitar consultas, resultados filtrados "
                    "do sistema serão enviados ao Google Gemini para compor "
                    "a resposta, sem credenciais.")
        if "Ao habilitar consultas" not in data:
            data=replace_once(data,old_notice,new_notice,
                              "permissão de envio de telemetria")
        return data
    anchor='      <p class="pet-live-presence" id="petLiveStatus"'
    controls='''      <label class="pet-live-tool-permission">
        <input type="checkbox" id="petLiveAllowTools">
        🔎 Permitir consultas de infraestrutura (somente leitura) nesta sessão
      </label>
      <p class="pet-live-tool-status" id="petLiveToolStatus" aria-live="polite">
        Ferramentas desligadas · nenhum comando operacional será executado. Ao habilitar consultas, resultados filtrados do sistema serão enviados ao Google Gemini para compor a resposta, sem credenciais.
      </p>
'''
    return replace_once(data,anchor,controls+anchor,"Pet tools checkbox")


PROPOSAL_PANEL='''    <section class="pet-proposal-zone" id="petProposalZone" aria-label="Propostas do MESTRE para revisão, sem execução">
      <div class="pet-proposal-head">
        <div>
          <h3>📝 Propostas do Pet MESTRE</h3>
          <p>Rascunhos estruturados para sua revisão. Marcar como revisada NÃO autoriza comandos, deploy, merge ou HUMAN_GATE.</p>
        </div>
        <span class="pet-proposal-counter" id="petProposalCount">0 aguardando revisão</span>
        <button type="button" id="petProposalRefresh">Atualizar propostas</button>
      </div>
      <p class="pet-proposal-status" id="petProposalStatus" role="status" aria-live="polite">
        Carregando propostas…
      </p>
      <div class="pet-proposal-list" id="petProposalList"></div>
    </section>
'''

def patch_proposal_ui(data: str) -> str:
    if '<link rel="stylesheet" href="/pet-proposals.css">' not in data:
        data=replace_once(
            data,'<link rel="stylesheet" href="/pet-live.css">',
            '<link rel="stylesheet" href="/pet-live.css">\n'
            '<link rel="stylesheet" href="/pet-proposals.css">',
            "proposals CSS")
    if '<script src="/pet-proposals.js" defer></script>' not in data:
        data=replace_once(
            data,'<script src="/pet-live.js" defer></script>',
            '<script src="/pet-live.js" defer></script>\n'
            '<script src="/pet-proposals.js" defer></script>',
            "proposals JS")
    if 'id="petLiveAllowProposals"' not in data:
        anchor='      <p class="pet-live-tool-status" id="petLiveToolStatus"'
        controls='''      <label class="pet-live-proposal-permission">
        <input type="checkbox" id="petLiveAllowProposals" disabled>
        📝 Permitir ao Pet salvar propostas para minha revisão nesta sessão (NÃO executa ações).
      </label>
'''
        data=replace_once(data,anchor,controls+anchor,"draft opt-in")
    if 'id="petProposalZone"' not in data:
        anchor='    <section class="pet-talk-zone" id="petTalkZone"'
        data=replace_once(data,anchor,PROPOSAL_PANEL+"\n"+anchor,
                          "proposal review panel")
    return data


def patch_background_controls(data: str) -> str:
    # The user explicitly opts in to background microphone use per session.
    # If omitted, the Live websocket survives tab changes but PCM is muted.
    if 'id="petLiveBackgroundAudio"' in data:
        return data
    anchor='      <label class="pet-live-tool-permission"'
    controls='''      <label class="pet-live-background-permission">
        <input type="checkbox" id="petLiveBackgroundAudio">
        🎙 Continuar ouvindo quando eu mudar de aba (microfone ativo em segundo plano).
      </label>
      <p class="pet-live-background-status" id="petLiveBackgroundStatus" role="status" aria-live="polite">
        Por padrão, a conexão continua ativa, mas o microfone é silenciado em outras abas.
      </p>
'''
    return replace_once(data,anchor,controls+anchor,
                        "explicit background audio consent")


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
    data=patch_tool_controls(data)
    data=patch_proposal_ui(data)
    data=patch_background_controls(data)
    return data

def patch_read_only_ticket(data: str) -> str:
    # Already patched installs must be accepted unchanged before the
    # proposal-scope extension applies; never fallback to legacy anchors.
    if 'code, info = pet_ticket.ticket_response(scope)' in data:
        return data
    old='''                if self.headers.get("Content-Length") != "2":
                    raise pet_voice.ConversationError(400,"INVALID_LENGTH","Corpo inválido.")
                if self.rfile.read(2) != b"{}":
                    raise pet_voice.ConversationError(400,"INVALID_JSON","Corpo inválido.")
                code, info = pet_ticket.ticket_response()
'''
    new='''                length = self.headers.get("Content-Length","")
                if not length.isascii() or not length.isdigit():
                    raise pet_voice.ConversationError(411,"INVALID_LENGTH","Corpo inválido.")
                size=int(length)
                if size<2 or size>48:
                    raise pet_voice.ConversationError(413,"INVALID_LENGTH","Corpo inválido.")
                try:
                    req=json.loads(self.rfile.read(size))
                except (UnicodeDecodeError,ValueError):
                    raise pet_voice.ConversationError(400,"INVALID_JSON","Corpo inválido.")
                if not isinstance(req,dict) or set(req)-{"scope"}:
                    raise pet_voice.ConversationError(400,"INVALID_SCOPE","Escopo inválido.")
                scope=req.get("scope","conversation")
                if scope not in ("conversation","read_only"):
                    raise pet_voice.ConversationError(400,"INVALID_SCOPE","Escopo inválido.")
                code, info = pet_ticket.ticket_response(scope)
'''
    if new in data:
        return data
    return replace_once(data,old,new,"read-only ticket scope")


def patch_proposal_ticket_scope(data: str) -> str:
    old='if scope not in ("conversation","read_only"):'
    new='if scope not in ("conversation","read_only","read_and_propose"):'
    if new in data:
        return data
    return replace_once(data,old,new,"proposals scoped ticket")


def patch_proposal_routes(data: str) -> str:
    if "import pet_proposals as pet_drafts" not in data:
        data=replace_once(data,"import pet_live_ticket as pet_ticket",
                          "import pet_live_ticket as pet_ticket\n"
                          "import pet_proposals as pet_drafts",
                          "proposals import")
    if '"/pet-proposals.js":' not in data:
        anchor='    "/pet-live.js": ("pet-live.js", "text/javascript; charset=utf-8"),'
        extra=anchor+'''
    "/pet-proposals.js": ("pet-proposals.js", "text/javascript; charset=utf-8"),
    "/pet-proposals.css": ("pet-proposals.css", "text/css; charset=utf-8"),'''
        data=replace_once(data,anchor,extra,"proposals static assets")
    if 'if path in {"/api/pet-voice/proposals/list",' in data:
        # Upgrade legacy deployments that already had this handler before
        # the Codex-review pagination fix; insertion alone is not enough.
        old_list='''                    if item!={}:
                        raise pet_voice.ConversationError(400,"INVALID_REQUEST","Parâmetros não aceitos.")
                    payload={"ok":True,"proposals":pet_drafts.list_proposals(25)}'''
        new_list='''                    if set(item)-{"offset","limit"}:
                        raise pet_voice.ConversationError(400,"INVALID_REQUEST","Parâmetros inválidos.")
                    offset=item.get("offset",0)
                    limit=item.get("limit",25)
                    rows=pet_drafts.list_proposals(limit,offset=offset)
                    counts=pet_drafts.proposal_counts()
                    payload={"ok":True,"proposals":rows,"total":counts["total"],
                             "pending_count":counts["pending"],
                             "offset":offset,"has_more":offset+len(rows)<counts["total"]}'''
        if old_list in data:
            return replace_once(data,old_list,new_list,"proposal pagination upgrade")
        return data
    anchor='''        if path not in pet_voice.POST_PATHS:
'''
    route='''        if path in {"/api/pet-voice/proposals/list",
                    "/api/pet-voice/proposals/review"}:
            try:
                # Every request requires the existing per-tab HttpOnly cookie,
                # CSRF, Host and Origin; reviewing is NOT a HUMAN_GATE.
                pet_voice.authorize(self.headers)
                mime=(self.headers.get("Content-Type") or "").split(";",1)[0].strip().lower()
                if mime!="application/json":
                    raise pet_voice.ConversationError(415,"JSON_REQUIRED","Somente JSON.")
                length=self.headers.get("Content-Length","")
                if not length.isascii() or not length.isdigit():
                    raise pet_voice.ConversationError(411,"INVALID_LENGTH","Corpo inválido.")
                size=int(length)
                if not 2<=size<=1100:
                    raise pet_voice.ConversationError(413,"INVALID_LENGTH","Corpo inválido.")
                source=self.rfile.read(size)
                if len(source)!=size:
                    raise pet_voice.ConversationError(400,"INCOMPLETE_BODY","Corpo incompleto.")
                try:
                    item=json.loads(source)
                except (UnicodeDecodeError,ValueError):
                    raise pet_voice.ConversationError(400,"INVALID_JSON","JSON inválido.")
                if not isinstance(item,dict):
                    raise pet_voice.ConversationError(400,"INVALID_JSON","Objeto obrigatório.")
                if path.endswith("/list"):
                    if set(item)-{"offset","limit"}:
                        raise pet_voice.ConversationError(400,"INVALID_REQUEST","Parâmetros inválidos.")
                    offset=item.get("offset",0)
                    limit=item.get("limit",25)
                    rows=pet_drafts.list_proposals(limit,offset=offset)
                    counts=pet_drafts.proposal_counts()
                    payload={"ok":True,"proposals":rows,"total":counts["total"],
                             "pending_count":counts["pending"],
                             "offset":offset,"has_more":offset+len(rows)<counts["total"]}
                else:
                    if set(item)-{"proposal_id","decision","version","note"}:
                        raise pet_voice.ConversationError(400,"INVALID_REQUEST","Parâmetros inválidos.")
                    payload={"ok":True,"proposal":pet_drafts.review_proposal(
                        item.get("proposal_id"),item.get("decision"),
                        item.get("version"),item.get("note",""))}
                return self._send(json.dumps(payload,ensure_ascii=False).encode("utf-8"),
                                  "application/json; charset=utf-8")
            except pet_voice.ConversationError as err:
                return self._send(json.dumps({"ok":False,"error":err.code}).encode("utf-8"),
                                  "application/json; charset=utf-8",err.status)
            except pet_drafts.ProposalError as err:
                return self._send(json.dumps({"ok":False,"error":err.code}).encode("utf-8"),
                                  "application/json; charset=utf-8",err.status)
'''
    return replace_once(data,anchor,route+anchor,"proposals isolated POST routes")


def patch_mission_bridge_routes(data: str) -> str:
    if "import pet_mission_bridge as pet_missions" not in data:
        data=replace_once(data,"import pet_proposals as pet_drafts",
                          "import pet_proposals as pet_drafts\n"
                          "import pet_mission_bridge as pet_missions",
                          "mission bridge import")
    if 'if path in {"/api/pet-voice/mission-bridge/status",' in data:
        return data
    anchor='''        if path in {"/api/pet-voice/proposals/list",
'''
    handler='''        if path in {"/api/pet-voice/mission-bridge/status",
                    "/api/pet-voice/mission-bridge/export",
                    "/api/pet-voice/mission-bridge/list"}:
            try:
                pet_voice.authorize(self.headers)
                mime=(self.headers.get("Content-Type") or "").split(";",1)[0].strip().lower()
                if mime!="application/json":
                    raise pet_voice.ConversationError(415,"JSON_REQUIRED","Somente JSON.")
                length=self.headers.get("Content-Length","")
                if not length.isascii() or not length.isdigit():
                    raise pet_voice.ConversationError(411,"INVALID_LENGTH","Corpo inválido.")
                size=int(length)
                if not 2<=size<=260:
                    raise pet_voice.ConversationError(413,"INVALID_LENGTH","Corpo inválido.")
                source=self.rfile.read(size)
                if len(source)!=size:
                    raise pet_voice.ConversationError(400,"INCOMPLETE_BODY","Corpo incompleto.")
                try:
                    item=json.loads(source)
                except (UnicodeDecodeError,ValueError):
                    raise pet_voice.ConversationError(400,"INVALID_JSON","JSON inválido.")
                if not isinstance(item,dict):
                    raise pet_voice.ConversationError(400,"INVALID_REQUEST","Objeto obrigatório.")
                if path.endswith("/status"):
                    if item!={}:
                        raise pet_voice.ConversationError(400,"INVALID_REQUEST","Sem parâmetros.")
                    response={"ok":True,"snapshot":pet_missions.read_canonical_snapshot()}
                elif path.endswith("/list"):
                    if item!={}:
                        raise pet_voice.ConversationError(400,"INVALID_REQUEST","Sem parâmetros.")
                    response={"ok":True,"handoffs":pet_missions.list_handoffs()}
                else:
                    if set(item)!={"proposal_id","expected_version"}:
                        raise pet_voice.ConversationError(400,"INVALID_REQUEST","Parâmetros inválidos.")
                    response={"ok":True,"handoff":pet_missions.export_reviewed_proposal(
                        item["proposal_id"],item["expected_version"])}
                return self._send(json.dumps(response,ensure_ascii=False).encode("utf-8"),
                                  "application/json; charset=utf-8")
            except pet_voice.ConversationError as err:
                return self._send(json.dumps({"ok":False,"error":err.code}).encode("utf-8"),
                                  "application/json; charset=utf-8",err.status)
            except pet_missions.BridgeError as err:
                return self._send(json.dumps({"ok":False,"error":err.code}).encode("utf-8"),
                                  "application/json; charset=utf-8",err.status)
'''
    return replace_once(data,anchor,handler+anchor,"mission bridge protected routes")


def patch_scoped_write_preview(data: str) -> str:
    # The only exposed operation is dry-run. No create_note or rollback route.
    if "import pet_scoped_write as pet_scope" not in data:
        data=replace_once(data,"import pet_mission_bridge as pet_missions",
                          "import pet_mission_bridge as pet_missions\n"
                          "import pet_scoped_write as pet_scope",
                          "scoped write import")
    if 'if path == "/api/pet-voice/scoped-write/preview":' in data:
        return data
    anchor='''        if path in {"/api/pet-voice/mission-bridge/status",
'''
    handler='''        if path == "/api/pet-voice/scoped-write/preview":
            try:
                # A model conversation or browser checkbox is not a permission.
                # The dry-run cannot be promoted to a real write in this API.
                pet_voice.authorize(self.headers)
                if (self.headers.get("Content-Type") or "").split(";",1)[0].strip().lower()!="application/json":
                    raise pet_voice.ConversationError(415,"JSON_REQUIRED","Somente JSON.")
                length=self.headers.get("Content-Length","")
                if not length.isascii() or not length.isdigit():
                    raise pet_voice.ConversationError(411,"INVALID_LENGTH","Corpo inválido.")
                size=int(length)
                if not 2<=size<=4500:
                    raise pet_voice.ConversationError(413,"INVALID_LENGTH","Corpo inválido.")
                raw=self.rfile.read(size)
                if len(raw)!=size:
                    raise pet_voice.ConversationError(400,"INCOMPLETE_BODY","Corpo incompleto.")
                try:
                    request=json.loads(raw)
                except (ValueError,UnicodeDecodeError):
                    raise pet_voice.ConversationError(400,"INVALID_JSON","Corpo inválido.")
                if not isinstance(request,dict) or set(request)!={
                        "mission_id","note_id","action_id","text"}:
                    raise pet_voice.ConversationError(400,"INVALID_SCHEMA","Campos inválidos.")
                preview=pet_scope.dry_run(request["mission_id"],request["note_id"],
                                           request["action_id"],request["text"])
                return self._send(json.dumps({"ok":True,"preview":preview,
                    "write_enabled":False,"runtime_connected":False,
                    "human_gate":False},ensure_ascii=False).encode("utf-8"),
                    "application/json; charset=utf-8")
            except pet_voice.ConversationError as error:
                return self._send(json.dumps({"ok":False,"error":error.code}).encode("utf-8"),
                    "application/json; charset=utf-8",error.status)
            except pet_scope.ScopedWriteDenied as error:
                return self._send(json.dumps({"ok":False,"error":error.code}).encode("utf-8"),
                    "application/json; charset=utf-8",400)
'''
    return replace_once(data,anchor,handler+anchor,"scoped write dry-run route")


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
        (HUB/"server.py",lambda data: patch_scoped_write_preview(
            patch_mission_bridge_routes(patch_proposal_routes(
                patch_proposal_ticket_scope(patch_read_only_ticket(
                    patch_tab_session_route(patch_hub(data)))))))),
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
