"""Pet -> canonical MCF MissionRuntime bridge, strictly draft-only until auth.

Does not use MissionRuntime POST or borrow human account credentials.
The private SQLite spool contains import-ready, non-executable contract drafts.
Canonical READ_ONLY observer stays the sole authority for mission status.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import http.client
import json
import os
from pathlib import Path
import sqlite3
import stat
import uuid

import pet_proposals

ROOT=Path.home()/".local/state/mcf-pet-mission-bridge"
DB_PATH=ROOT/"handoffs.sqlite3"
REPOSITORY="leon337/multiagent-collaboration-framework"
CAPABILITY_ID="mcf.pet.mission.draft.bridge"
MAX_RESPONSE_BYTES=120_000

class BridgeError(Exception):
    def __init__(self,code: str,status: int=400):
        super().__init__(code)
        self.code=code
        self.status=status

def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def _checked_database(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    folder=path.parent.lstat()
    if not stat.S_ISDIR(folder.st_mode) or folder.st_uid!=os.getuid() or folder.st_mode & 0o077:
        raise BridgeError("UNSAFE_BRIDGE_DIRECTORY",503)
    try:
        file_info=path.lstat()
    except FileNotFoundError:
        fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY|
                   getattr(os,"O_NOFOLLOW",0),0o600)
        os.close(fd)
        file_info=path.lstat()
    if not stat.S_ISREG(file_info.st_mode) or file_info.st_uid!=os.getuid() or file_info.st_mode & 0o077:
        raise BridgeError("UNSAFE_BRIDGE_FILE",503)
    try:
        conn=sqlite3.connect(path,timeout=3,isolation_level=None)
        conn.row_factory=sqlite3.Row
        conn.execute("PRAGMA trusted_schema=OFF")
        conn.execute("PRAGMA journal_mode=DELETE")
        conn.execute("""CREATE TABLE IF NOT EXISTS handoffs(
           id TEXT PRIMARY KEY,
           proposal_id TEXT NOT NULL UNIQUE,
           proposal_version INTEGER NOT NULL,
           created_at TEXT NOT NULL,
           contract_json TEXT NOT NULL,
           contract_sha256 TEXT NOT NULL,
           status TEXT NOT NULL CHECK(status='LOCAL_DRAFT_ONLY')
        )""")
        return conn
    except sqlite3.Error as exc:
        raise BridgeError("BRIDGE_STORAGE_UNAVAILABLE",503) from exc

def _proposal(proposal_id: str, expected_version: int,
              proposal_db: Path) -> dict:
    if not isinstance(proposal_id,str) or len(proposal_id)!=32 or any(c not in "0123456789abcdef" for c in proposal_id):
        raise BridgeError("INVALID_PROPOSAL_ID")
    if type(expected_version) is not int or not 1<=expected_version<=100:
        raise BridgeError("INVALID_EXPECTED_VERSION")
    # Reuse the proposal store's permission checks without accepting user paths.
    conn=pet_proposals._open(proposal_db)
    try:
        row=conn.execute("SELECT * FROM proposals WHERE id=?",(proposal_id,)).fetchone()
        if row is None:raise BridgeError("PROPOSAL_NOT_FOUND",404)
        item=pet_proposals._public(row)
    finally:
        conn.close()
    if item["status"]!="reviewed_for_planning":
        raise BridgeError("REVIEW_REQUIRED",409)
    if item["version"]!=expected_version:
        raise BridgeError("PROPOSAL_VERSION_CONFLICT",409)
    if item["executable"] or item["human_gate"]:
        raise BridgeError("UNSAFE_PROPOSAL_STATE",403)
    return item

def contract_for(item: dict) -> dict:
    # CreateMcfMissionRequest-shaped INCOMPLETE local draft. Runtime v1.1
    # requires methodologyPin/alignedPipRef; those cannot be guessed from a Pet
    # proposal. The export is not import-ready without independently verified
    # project context (see _public/runtime_import_blockers).
    # Risk class is conservatively provisional C; NEVER an authorization.
    return {"contract":{
        "title":item["title"][:160],
        "objective":item["objective"][:4000],
        "expectedOutcome":("Plano auditável para: "+item["objective"])[:4000],
        "scope":list(item["steps"]),
        "outOfScope":[
            "Nenhuma mudança de sistema antes de autorização de missão específica.",
            "Nenhum deploy, merge ou publicação implícitos.",
            "Não aceitar a revisão do rascunho como HUMAN_GATE.",
        ],
        "acceptanceCriteria":[
            "As evidências técnicas e os riscos foram revisados pelo time.",
            "Existe estratégia de reversão documentada antes de qualquer ação.",
            "Permissões e gates aplicáveis são validados no MissionRuntime.",
        ],
        "riskClass":"C",
        "selectedAgents":["Mestre","Sofia","Rafael","Renato","Emily"],
        "selectedSkills":["MCF-START-MISSION","MCF-TRACE-MISSION"],
        "sourceOfTruth":[
            "repo://"+REPOSITORY,
            "mcf-pet-proposal:"+item["id"],
            "pet-review-version:"+str(item["version"]),
        ],
        "contractSchemaVersion":"1.1",
        "projectId":"multiagent-collaboration-framework",
        "projectEntryMode":"RESUME_MCF_PROJECT",
    }}

def export_reviewed_proposal(proposal_id: str,expected_version: int,
                             path: Path=DB_PATH,proposal_db: Path=pet_proposals.DB_PATH) -> dict:
    p=_proposal(proposal_id,expected_version,proposal_db)
    obj=contract_for(p)
    payload=json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(",",":"))
    digest=hashlib.sha256(payload.encode()).hexdigest()
    db=_checked_database(path)
    try:
        db.execute("BEGIN IMMEDIATE")
        row=db.execute("SELECT * FROM handoffs WHERE proposal_id=?",(proposal_id,)).fetchone()
        if row:
            if row["proposal_version"]!=expected_version or row["contract_sha256"]!=digest:
                raise BridgeError("HANDOFF_CONFLICT",409)
            db.execute("COMMIT")
        else:
            ident=uuid.uuid4().hex
            db.execute("""INSERT INTO handoffs
               (id,proposal_id,proposal_version,created_at,contract_json,contract_sha256,status)
               VALUES (?,?,?,?,?,?,'LOCAL_DRAFT_ONLY')""",
               (ident,proposal_id,expected_version,now(),payload,digest))
            row=db.execute("SELECT * FROM handoffs WHERE id=?",(ident,)).fetchone()
            db.execute("COMMIT")
        return _public(row)
    except BridgeError:
        db.execute("ROLLBACK")
        raise
    except sqlite3.Error as exc:
        db.execute("ROLLBACK")
        raise BridgeError("BRIDGE_STORAGE_UNAVAILABLE",503) from exc
    finally:
        db.close()

def _public(row: sqlite3.Row) -> dict:
    return {
        "handoff_id":row["id"],
        "proposal_id":row["proposal_id"],
        "proposal_version":row["proposal_version"],
        "created_at":row["created_at"],
        "request":json.loads(row["contract_json"]),
        "payload_sha256":row["contract_sha256"],
        "status":"LOCAL_DRAFT_ONLY",
        "runtime_mission_id":None,
        "execution_authorized":False,
        "human_gate":False,
        # The v1.1 context guard rejects missing methodologyPin/alignedPipRef.
        # Do not imply authentication alone makes this draft importable.
        "import_ready":False,
        "validation_status":"CONTEXT_INCOMPLETE",
        "required_project_context":["methodologyPin","alignedPipRef"],
        "runtime_import_blockers":[
            "METHODOLOGY_PIN_UNVERIFIED",
            "ALIGNED_PIP_REQUIRED",
            "AUTHENTICATED_HUMAN_SESSION_REQUIRED",
            "MCF_PERMISSION_ENGINE_AUTHORIZATION_REQUIRED",
        ],
        "mission_runtime_endpoint":"/v1/mcf/missions",
        "next_gate":"VERIFIED_PROJECT_CONTEXT_THEN_AUTHENTICATED_HUMAN_SESSION",
    }

def list_handoffs(path: Path=DB_PATH, limit: int=25) -> list[dict]:
    if type(limit) is not int or not 1<=limit<=50:
        raise BridgeError("INVALID_LIMIT")
    db=_checked_database(path)
    try:
        rows=db.execute("SELECT * FROM handoffs ORDER BY created_at DESC LIMIT ?",(limit,)).fetchall()
        return [_public(row) for row in rows]
    finally:
        db.close()

def read_canonical_snapshot() -> dict:
    # Local MCF Hub proxies an authority-bearing, credentialed read-only
    # MissionControl view. No fallback to cached guesses or old GitHub PRFs.
    con=http.client.HTTPConnection("127.0.0.1",8898,timeout=2.5)
    try:
        con.request("GET","/api/v1/mcf/observation",headers={"Accept":"application/json"})
        resp=con.getresponse()
        if resp.status!=200 or not (resp.getheader("Content-Type") or "").startswith("application/json"):
            raise BridgeError("OBSERVER_UNAVAILABLE",503)
        payload=resp.read(MAX_RESPONSE_BYTES+1)
        if len(payload)>MAX_RESPONSE_BYTES:
            raise BridgeError("OBSERVER_RESPONSE_TOO_LARGE",503)
        obj=json.loads(payload)
    except (ValueError,OSError,TimeoutError,http.client.HTTPException) as exc:
        raise BridgeError("OBSERVER_UNAVAILABLE",503) from exc
    finally:
        con.close()
    if not isinstance(obj,dict) or obj.get("source")!="MCF_MISSION_CONTROL_READ_ONLY":
        raise BridgeError("UNTRUSTED_OBSERVER",503)
    state=obj.get("status")
    if state!="READY":
        return {"ready":False,"status":str(state)[:75],"mission":None,
                "canonical":False,
                "message":"Leitura canônica não disponível. Não é confirmação de ausência de missões."}
    mission=obj.get("mission")
    if not isinstance(mission,dict) or not isinstance(mission.get("id"),str):
        raise BridgeError("INVALID_MISSION_PROJECTION",503)
    if obj.get("repository")!=REPOSITORY:
        raise BridgeError("REPOSITORY_MISMATCH",503)
    from datetime import timedelta
    try:
        when=datetime.fromisoformat(obj["checkedAt"].replace("Z","+00:00"))
        age=(datetime.now(timezone.utc)-when).total_seconds()
        if when.tzinfo is None or age<0 or age>120:
            raise BridgeError("MISSION_OBSERVATION_STALE",503)
    except (KeyError,ValueError,TypeError) as exc:
        raise BridgeError("INVALID_MISSION_TIMESTAMP",503) from exc
    info={name:mission.get(name) for name in (
        "id","title","state","version","currentAgentId","currentPhaseId","updatedAt"
    )}
    phase=obj.get("currentPhase")
    return {"ready":True,"status":"READY","canonical":True,
            "mission":info,
            "current_phase":{x:phase.get(x) for x in ("id","state","agentId","skillId")}
                if isinstance(phase,dict) else None,
            "blocked":obj.get("blocked") is True,
            "observed_at":obj["checkedAt"],
            "source":obj["source"],
            "repository":REPOSITORY,
            "limits":["LATEST_MISSION_ONLY","NO_EXECUTION_AUTHORITY"]}
