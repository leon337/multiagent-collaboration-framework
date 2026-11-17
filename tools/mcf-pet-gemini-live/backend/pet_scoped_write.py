"""MCF Pet SCOPED_WRITE executor — disabled unless a canonical verifier is wired.

Strictly reversible private note creation/rollback in a dedicated workspace.
No shell, arbitrary paths, network writes, browser clicks, service restarts,
or MissionRuntime mutation. The model is NEVER a source of authorization.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime,timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import stat
import uuid

ROOT=Path.home()/".local/state/mcf-pet-scoped-write"
NOTES=ROOT/"notes"
JOURNAL=ROOT/"receipts.sqlite3"
MISSION_RE=re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
NOTE_RE=re.compile(r"^[a-z][a-z0-9_-]{0,47}$")
ACTION_RE=re.compile(r"^[a-z0-9][a-z0-9._-]{7,99}$")

class ScopedWriteDenied(Exception):
    def __init__(self,code: str):
        self.code=code
        super().__init__(code)

@dataclass(frozen=True)
class AuthorizationVerdict:
    # Issued only from a trusted adapter to canonical MCF PermissionEngine.
    # This is NOT an AI-generated JSON schema or a user-supplied bearer claim.
    issuer: str
    approved: bool
    mission_id: str
    action: str
    resource: str
    authorization_id: str
    expires_at: datetime
    reversible_only: bool
    leo_gate: str

def _now() -> datetime:
    return datetime.now(timezone.utc)

def _validate_name(mission_id: str,note_id: str,action_id: str) -> None:
    if not isinstance(mission_id,str) or not MISSION_RE.fullmatch(mission_id):
        raise ScopedWriteDenied("INVALID_MISSION_ID")
    if not isinstance(note_id,str) or not NOTE_RE.fullmatch(note_id):
        raise ScopedWriteDenied("INVALID_NOTE_ID")
    if not isinstance(action_id,str) or not ACTION_RE.fullmatch(action_id):
        raise ScopedWriteDenied("INVALID_ACTION_ID")

def _content(text: object) -> bytes:
    if not isinstance(text,str) or not 1<=len(text)<=4096:
        raise ScopedWriteDenied("INVALID_CONTENT")
    if any(ord(c)<32 and c not in "\n\t" for c in text):
        raise ScopedWriteDenied("INVALID_CONTENT")
    return text.encode("utf-8")

def _mode_private(path: Path,mode: int=0o700) -> None:
    path.mkdir(parents=True,exist_ok=True,mode=mode)
    info=path.lstat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid!=os.getuid() or info.st_mode & 0o077:
        raise ScopedWriteDenied("UNSAFE_STORAGE_DIRECTORY")

def _get_db(path: Path) -> sqlite3.Connection:
    _mode_private(path.parent)
    if path.exists() or path.is_symlink():
        info=path.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid() or info.st_mode & 0o077:
            raise ScopedWriteDenied("UNSAFE_RECEIPT_DATABASE")
    try:
        db=sqlite3.connect(path,timeout=3,isolation_level=None)
        os.chmod(path,0o600)
        db.row_factory=sqlite3.Row
        db.execute("PRAGMA trusted_schema=OFF")
        db.execute("PRAGMA journal_mode=DELETE")
        db.execute("""CREATE TABLE IF NOT EXISTS receipts(
            id TEXT PRIMARY KEY,
            mission_id TEXT NOT NULL,
            note_id TEXT NOT NULL,
            action_id TEXT NOT NULL,
            content_sha256 TEXT NOT NULL,
            authorization_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            rolled_back_at TEXT,
            status TEXT NOT NULL CHECK(status IN ('APPLIED','ROLLED_BACK')),
            UNIQUE(mission_id,action_id)
        )""")
        return db
    except sqlite3.Error as exc:
        raise ScopedWriteDenied("RECEIPT_DATABASE_UNAVAILABLE") from exc

def _authorization(verifier,mission_id: str,operation: str,resource: str) -> AuthorizationVerdict:
    if verifier is None or not callable(verifier):
        raise ScopedWriteDenied("PERMISSION_ENGINE_NOT_CONNECTED")
    try:
        result=verifier(mission_id,operation,resource)
    except Exception as exc:
        raise ScopedWriteDenied("PERMISSION_ENGINE_UNAVAILABLE") from exc
    if not isinstance(result,AuthorizationVerdict):
        raise ScopedWriteDenied("INVALID_PERMISSION_VERDICT")
    if (result.issuer!="MCF_PERMISSION_ENGINE" or result.approved is not True or
            result.mission_id!=mission_id or result.action!=operation or
            result.resource!=resource or not result.authorization_id or
            result.leo_gate!="APPROVED" or result.reversible_only is not True):
        raise ScopedWriteDenied("PERMISSION_DENIED")
    if not isinstance(result.expires_at,datetime) or result.expires_at.tzinfo is None:
        raise ScopedWriteDenied("INVALID_PERMISSION_EXPIRY")
    if result.expires_at<=_now():
        raise ScopedWriteDenied("PERMISSION_EXPIRED")
    return result

def dry_run(mission_id: str,note_id: str,action_id: str,text: str) -> dict:
    _validate_name(mission_id,note_id,action_id)
    raw=_content(text)
    return {
        "operation":"workspace.note.create",
        "mission_id":mission_id,
        "resource":f"mcf-pet-workspace:{mission_id}/{note_id}.md",
        "bytes":len(raw),
        "sha256":hashlib.sha256(raw).hexdigest(),
        "requires":"MCF_PERMISSION_ENGINE_AND_LEO_GATE",
        "status":"DRY_RUN_ONLY",
        "executed":False,
    }

def create_note(mission_id: str,note_id: str,action_id: str,
                text: str,*,verifier=None,
                notes_root: Path=NOTES,db_path: Path=JOURNAL) -> dict:
    proposal=dry_run(mission_id,note_id,action_id,text)
    resource=proposal["resource"]
    authorization=_authorization(verifier,mission_id,"workspace.note.create",resource)
    _mode_private(notes_root)
    directory=notes_root/mission_id
    _mode_private(directory)
    filename=directory/(note_id+".md")
    raw=text.encode("utf-8")
    conn=_get_db(db_path)
    try:
        conn.execute("BEGIN IMMEDIATE")
        row=conn.execute("SELECT * FROM receipts WHERE mission_id=? AND action_id=?",
                         (mission_id,action_id)).fetchone()
        if row:
            if row["note_id"]!=note_id or row["content_sha256"]!=proposal["sha256"]:
                raise ScopedWriteDenied("IDEMPOTENCY_CONFLICT")
            if row["status"]!="APPLIED":
                raise ScopedWriteDenied("ACTION_ALREADY_ROLLED_BACK")
            conn.execute("COMMIT")
            return {"receipt_id":row["id"],"status":"APPLIED","idempotent":True,
                    "content_sha256":row["content_sha256"],"reversible":True}
        if filename.exists() or filename.is_symlink():
            raise ScopedWriteDenied("NOTE_ALREADY_EXISTS")
        fd=os.open(filename,os.O_CREAT|os.O_EXCL|os.O_WRONLY|
                   getattr(os,"O_NOFOLLOW",0),0o600)
        try:
            with os.fdopen(fd,"wb") as out:
                out.write(raw)
                out.flush()
                os.fsync(out.fileno())
            receipt=uuid.uuid4().hex
            conn.execute("""INSERT INTO receipts(id,mission_id,note_id,action_id,
                content_sha256,authorization_id,created_at,status)
                VALUES (?,?,?,?,?,?,?,'APPLIED')""",(
                receipt,mission_id,note_id,action_id,proposal["sha256"],
                authorization.authorization_id,_now().isoformat()))
            conn.execute("COMMIT")
            return {"receipt_id":receipt,"status":"APPLIED","idempotent":False,
                    "content_sha256":proposal["sha256"],"reversible":True}
        except BaseException:
            # Clean up even after a partial write or failed SQLite receipt.
            if filename.is_file() and not filename.is_symlink():
                filename.unlink(missing_ok=True)
            raise
    except (sqlite3.Error,OSError) as exc:
        conn.execute("ROLLBACK")
        raise ScopedWriteDenied("WORKSPACE_WRITE_FAILED") from exc
    except ScopedWriteDenied:
        conn.execute("ROLLBACK")
        raise
    finally:
        conn.close()

def rollback_note(mission_id: str,receipt_id: str,*,verifier=None,
                  notes_root: Path=NOTES,db_path: Path=JOURNAL) -> dict:
    if not isinstance(mission_id,str) or not MISSION_RE.fullmatch(mission_id):
        raise ScopedWriteDenied("INVALID_MISSION_ID")
    if not isinstance(receipt_id,str) or not re.fullmatch(r"[0-9a-f]{32}",receipt_id):
        raise ScopedWriteDenied("INVALID_RECEIPT_ID")
    _authorization(verifier,mission_id,"workspace.note.rollback",
                   f"mcf-pet-receipt:{receipt_id}")
    conn=_get_db(db_path)
    try:
        conn.execute("BEGIN IMMEDIATE")
        row=conn.execute("SELECT * FROM receipts WHERE id=? AND mission_id=?",
                         (receipt_id,mission_id)).fetchone()
        if not row:
            raise ScopedWriteDenied("RECEIPT_NOT_FOUND")
        if row["status"]=="ROLLED_BACK":
            conn.execute("COMMIT")
            return {"receipt_id":receipt_id,"status":"ROLLED_BACK","idempotent":True}
        note=notes_root/mission_id/(row["note_id"]+".md")
        if not note.is_file() or note.is_symlink():
            raise ScopedWriteDenied("NOTE_UNAVAILABLE")
        if hashlib.sha256(note.read_bytes()).hexdigest()!=row["content_sha256"]:
            raise ScopedWriteDenied("ROLLBACK_HASH_MISMATCH")
        tombstone=note.with_name(".rollback-"+receipt_id+".pending")
        if tombstone.exists() or tombstone.is_symlink():
            raise ScopedWriteDenied("ROLLBACK_TOMBSTONE_EXISTS")
        os.replace(note,tombstone)
        try:
            conn.execute("UPDATE receipts SET status='ROLLED_BACK',rolled_back_at=? WHERE id=?",
                         (_now().isoformat(),receipt_id))
            conn.execute("COMMIT")
        except BaseException:
            # Restore the note on DB update/commit failure.
            if tombstone.is_file() and not tombstone.is_symlink() and not note.exists():
                os.replace(tombstone,note)
            raise
        try:
            tombstone.unlink()
        except OSError:
            # The receipt is durable and the note is no longer reachable by
            # the public resource path; explicit janitor can clean tombstones.
            pass
        return {"receipt_id":receipt_id,"status":"ROLLED_BACK","idempotent":False}
    except ScopedWriteDenied:
        conn.execute("ROLLBACK")
        raise
    except (sqlite3.Error,OSError) as exc:
        conn.execute("ROLLBACK")
        raise ScopedWriteDenied("ROLLBACK_FAILED") from exc
    finally:
        conn.close()

def browser_tabs_read(*,verifier=None,adapter=None,mission_id: str="") -> dict:
    # Explicit opt-in + canonical permission required even for private tab names.
    if not isinstance(mission_id,str) or not MISSION_RE.fullmatch(mission_id):
        raise ScopedWriteDenied("INVALID_MISSION_ID")
    _authorization(verifier,mission_id,"browser.tabs.read","mestre-playwright-mcp")
    if not callable(adapter):
        raise ScopedWriteDenied("BROWSER_ADAPTER_NOT_CONNECTED")
    try:
        raw=adapter("browser_tabs",{"arguments_json":'{"action":"list"}'})
    except Exception as exc:
        raise ScopedWriteDenied("BROWSER_ADAPTER_UNAVAILABLE") from exc
    if not isinstance(raw,dict) or raw.get("ok") is not True:
        raise ScopedWriteDenied("BROWSER_READ_FAILED")
    return {"status":"OBSERVED","source":"MESTRE_PLAYWRIGHT_MCP",
            "observation":str(raw.get("observation") or "")[:1300],
            "write_performed":False}
