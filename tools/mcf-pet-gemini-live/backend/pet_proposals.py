"""MCF Pet proposal queue. Drafts and human review only: no action executor.

MESTRE Live may create AI-generated proposals in a scoped READ_AND_PROPOSE
session. A human may mark them reviewed for PLANNING or reject them. Neither
status is a HUMAN_GATE, MissionRuntime permission, execution approval, or
instruction to an automation.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import stat
import time
import uuid

DB_PATH = Path.home() / ".local/state/mcf-pet-proposals/proposals.sqlite3"
MAX_RECORDS = 300
MAX_PER_SESSION = 4
VALID_STATUS = frozenset(("pending_review", "reviewed_for_planning", "rejected"))
VALID_PRIORITY = frozenset(("baixa", "media", "alta"))
ID_RE = re.compile(r"^[0-9a-f]{32}$")
PROOF_RE = re.compile(r"^[a-f0-9]{16}$")
SECRET_RE = re.compile(
    r"(?i)(sk-[a-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{20,}|"
    r"bearer\s+\S{14,}|(?:api[_ -]?key|senha|password|token|secret)"
    r"\s*[:=]\s*\S{12,})"
)
ALLOWED_FIELDS = frozenset(
    ("title","objective","summary","steps","risks","rollback","priority")
)

class ProposalError(Exception):
    def __init__(self, code: str, status: int = 400):
        super().__init__(code)
        self.code = code
        self.status = status

def _text(value: object, minimum: int, maximum: int, name: str) -> str:
    if not isinstance(value,str) or not minimum <= len(value.strip()) <= maximum:
        raise ProposalError("INVALID_" + name.upper())
    text=value.strip()
    if any((ord(c)<32 and c not in "\n\t") or ord(c)==127 for c in text):
        raise ProposalError("CONTROL_CHARACTER")
    if SECRET_RE.search(text):
        raise ProposalError("SENSITIVE_VALUE_REJECTED")
    return text

def _proposal_data(raw: object) -> dict:
    if not isinstance(raw,dict) or set(raw) != ALLOWED_FIELDS:
        raise ProposalError("INVALID_PROPOSAL_SCHEMA")
    steps=raw.get("steps")
    if not isinstance(steps,list) or not 2 <= len(steps) <= 6:
        raise ProposalError("INVALID_STEPS")
    items=[_text(step,8,240,"step") for step in steps]
    priority=raw.get("priority")
    if priority not in VALID_PRIORITY or not isinstance(priority,str):
        raise ProposalError("INVALID_PRIORITY")
    return {
        "title":_text(raw["title"],6,120,"title"),
        "objective":_text(raw["objective"],12,450,"objective"),
        "summary":_text(raw["summary"],15,900,"summary"),
        "steps":items,
        "risks":_text(raw["risks"],12,600,"risks"),
        "rollback":_text(raw["rollback"],12,600,"rollback"),
        "priority":priority,
    }

def _checked_path(path: Path) -> None:
    parent=path.parent
    parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    parent_info=parent.lstat()
    if (not stat.S_ISDIR(parent_info.st_mode)
            or parent_info.st_uid != os.getuid()
            or stat.S_IMODE(parent_info.st_mode) & 0o077):
        raise ProposalError("UNSAFE_STORAGE_DIRECTORY",503)
    try:
        current=path.lstat()
    except FileNotFoundError:
        descriptor=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY|
                           getattr(os,"O_NOFOLLOW",0),0o600)
        os.close(descriptor)
        current=path.lstat()
    if (not stat.S_ISREG(current.st_mode)
            or current.st_uid != os.getuid()
            or stat.S_IMODE(current.st_mode) & 0o077):
        raise ProposalError("UNSAFE_STORAGE_FILE",503)

def _open(path: Path) -> sqlite3.Connection:
    _checked_path(path)
    try:
        db=sqlite3.connect(path,timeout=3,isolation_level=None)
        db.row_factory=sqlite3.Row
        db.execute("PRAGMA busy_timeout=3000")
        db.execute("PRAGMA trusted_schema=OFF")
        db.execute("PRAGMA journal_mode=DELETE")
        db.execute("""
            CREATE TABLE IF NOT EXISTS proposals(
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                session_id TEXT NOT NULL,
                call_key TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                objective TEXT NOT NULL,
                summary TEXT NOT NULL,
                steps_json TEXT NOT NULL,
                risks TEXT NOT NULL,
                rollback TEXT NOT NULL,
                priority TEXT NOT NULL,
                evidence_json TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN (
                    'pending_review','reviewed_for_planning','rejected'
                )),
                version INTEGER NOT NULL DEFAULT 1,
                review_note TEXT NOT NULL DEFAULT '',
                reviewed_at TEXT
            )
        """)
        return db
    except sqlite3.Error as exc:
        raise ProposalError("STORAGE_UNAVAILABLE",503) from exc

def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def _public(row: sqlite3.Row) -> dict:
    return {
        "id":row["id"],
        "created_at":row["created_at"],
        "updated_at":row["updated_at"],
        "title":row["title"],
        "objective":row["objective"],
        "summary":row["summary"],
        "steps":json.loads(row["steps_json"]),
        "risks":row["risks"],
        "rollback":row["rollback"],
        "priority":row["priority"],
        "evidence_refs":json.loads(row["evidence_json"]),
        "status":row["status"],
        "version":row["version"],
        "review_note":row["review_note"],
        "reviewed_at":row["reviewed_at"],
        "authority":"AI_DRAFT_ONLY",
        "executable":False,
        "human_gate":False,
    }

def create_proposal(raw: object, session_id: str, call_id: str,
                    receipt_ids: object, path: Path = DB_PATH) -> dict:
    item=_proposal_data(raw)
    if not isinstance(session_id,str) or not ID_RE.fullmatch(session_id):
        raise ProposalError("INVALID_SESSION_KEY")
    if not isinstance(call_id,str) or not 1 <= len(call_id) <= 160:
        raise ProposalError("INVALID_CALL_KEY")
    if not isinstance(receipt_ids,list) or len(receipt_ids)>12:
        raise ProposalError("INVALID_EVIDENCE")
    # Only receipts originating in this live session are passed by the gateway.
    references=list(dict.fromkeys(x for x in receipt_ids if
        isinstance(x,str) and PROOF_RE.fullmatch(x)))[:6]
    fingerprint=hashlib.sha256((session_id+":"+call_id).encode()).hexdigest()
    db=_open(path)
    try:
        db.execute("BEGIN IMMEDIATE")
        prior=db.execute("SELECT * FROM proposals WHERE call_key=?",
                         (fingerprint,)).fetchone()
        if prior:
            db.execute("COMMIT")
            return _public(prior)
        count=db.execute("SELECT COUNT(*) FROM proposals").fetchone()[0]
        mine=db.execute("SELECT COUNT(*) FROM proposals WHERE session_id=?",
                        (session_id,)).fetchone()[0]
        if count>=MAX_RECORDS or mine>=MAX_PER_SESSION:
            raise ProposalError("PROPOSAL_LIMIT",429)
        ident=uuid.uuid4().hex
        now=_timestamp()
        db.execute("""
           INSERT INTO proposals(
             id,created_at,updated_at,session_id,call_key,title,
             objective,summary,steps_json,risks,rollback,priority,
             evidence_json,status,version
           ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
        """,(ident,now,now,session_id,fingerprint,item["title"],
             item["objective"],item["summary"],
             json.dumps(item["steps"],ensure_ascii=False),
             item["risks"],item["rollback"],item["priority"],
             json.dumps(references), "pending_review"))
        row=db.execute("SELECT * FROM proposals WHERE id=?",(ident,)).fetchone()
        db.execute("COMMIT")
        return _public(row)
    except ProposalError:
        db.execute("ROLLBACK")
        raise
    except sqlite3.Error as exc:
        db.execute("ROLLBACK")
        raise ProposalError("STORAGE_UNAVAILABLE",503) from exc
    finally:
        db.close()

def list_proposals(limit: int = 25, path: Path = DB_PATH) -> list[dict]:
    if type(limit) is not int or not 1 <= limit <= 40:
        raise ProposalError("INVALID_LIMIT")
    db=_open(path)
    try:
        rows=db.execute("SELECT * FROM proposals ORDER BY created_at DESC,id DESC LIMIT ?",
                        (limit,)).fetchall()
        return [_public(row) for row in rows]
    except (sqlite3.Error,ValueError,TypeError) as exc:
        raise ProposalError("STORAGE_UNAVAILABLE",503) from exc
    finally:
        db.close()

def review_proposal(ident: object,decision: object,version: object,
                    note: object="",path: Path=DB_PATH) -> dict:
    if not isinstance(ident,str) or not ID_RE.fullmatch(ident):
        raise ProposalError("INVALID_PROPOSAL_ID")
    if decision not in ("reviewed_for_planning","rejected"):
        raise ProposalError("INVALID_REVIEW_DECISION")
    if type(version) is not int or not 1 <= version <= 100:
        raise ProposalError("INVALID_VERSION")
    comment=_text(note,0,280,"review_note") if isinstance(note,str) else None
    if comment is None:
        raise ProposalError("INVALID_REVIEW_NOTE")
    db=_open(path)
    try:
        db.execute("BEGIN IMMEDIATE")
        row=db.execute("SELECT * FROM proposals WHERE id=?",(ident,)).fetchone()
        if row is None:
            raise ProposalError("PROPOSAL_NOT_FOUND",404)
        if row["version"]!=version or row["status"]!="pending_review":
            raise ProposalError("REVIEW_CONFLICT",409)
        now=_timestamp()
        db.execute("""
            UPDATE proposals
            SET status=?, version=version+1, updated_at=?,
                reviewed_at=?,review_note=? WHERE id=? AND version=?
                AND status='pending_review'
        """,(decision,now,now,comment,ident,version))
        result=db.execute("SELECT * FROM proposals WHERE id=?",(ident,)).fetchone()
        db.execute("COMMIT")
        return _public(result)
    except ProposalError:
        db.execute("ROLLBACK")
        raise
    except sqlite3.Error as exc:
        db.execute("ROLLBACK")
        raise ProposalError("STORAGE_UNAVAILABLE",503) from exc
    finally:
        db.close()
