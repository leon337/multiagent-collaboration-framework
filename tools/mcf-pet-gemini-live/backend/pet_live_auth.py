"""One-time, short-lived HMAC bridge ticket for the original MESTRE Live agent.

No Google key reaches the dashboard. This file is installed both in the
Service Hub and in the existing MESTRE Agent; shared signing key is private.
"""
from __future__ import annotations
import hashlib
import hmac
import os
from pathlib import Path
import re
import secrets
import stat
import threading
import time

KEY_FILE = Path.home()/".config/mcf-service-hub/pet-live-signing-key"
MAX_AGE_SECONDS = 30
TOKEN = re.compile(r"^v2\.([0-9]{10})\.([A-Za-z0-9_-]{22,60})\.(conversation|read_only)\.([0-9a-f]{64})$")
LEGACY = re.compile(r"^v1\.([0-9]{10})\.([A-Za-z0-9_-]{22,60})\.([0-9a-f]{64})$")
SCOPES=frozenset(("conversation","read_only"))
_seen: dict[str,float] = {}
_lock = threading.Lock()

def secret(path: Path = KEY_FILE) -> bytes:
    flags = os.O_RDONLY | getattr(os,"O_NOFOLLOW",0)
    fd=os.open(path,flags)
    try:
        info=os.fstat(fd)
        if (not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid()
                or info.st_mode & 0o077 or info.st_size != 32):
            raise ValueError("Invalid bridge signing key permissions/length")
        raw=os.read(fd,33)
        if len(raw)!=32:
            raise ValueError("Invalid bridge signing key")
        return raw
    finally:
        os.close(fd)

def signature(key: bytes, timestamp: str, nonce: str, scope: str="conversation",
              legacy: bool=False) -> str:
    if scope not in SCOPES:
        raise ValueError("Scope not allowed")
    data=(f"mcf-pet-live/v1:{timestamp}:{nonce}" if legacy else
          f"mcf-pet-live/v2:{timestamp}:{nonce}:{scope}").encode("ascii")
    return hmac.new(key,data,hashlib.sha256).hexdigest()

def issue_ticket(key_file: Path = KEY_FILE, now: float | None = None,
                 scope: str="conversation") -> str:
    if scope not in SCOPES:
        raise ValueError("Scope not allowed")
    clock=int(time.time() if now is None else now)
    nonce=secrets.token_urlsafe(20)
    ts=str(clock)
    return f"v2.{ts}.{nonce}.{scope}.{signature(secret(key_file),ts,nonce,scope)}"

def validate_ticket(ticket: str, key_file: Path=KEY_FILE,
                    now: float | None=None, expected_scope: str="conversation") -> bool:
    if expected_scope not in SCOPES or not isinstance(ticket,str) or len(ticket)>180:
        return False
    match=TOKEN.fullmatch(ticket)
    legacy=False
    if match:
        timestamp,nonce,scope,presented=match.groups()
    else:
        old=LEGACY.fullmatch(ticket)
        if not old:
            return False
        timestamp,nonce,presented=old.groups()
        scope="conversation"
        legacy=True
    if scope != expected_scope:
        return False
    clock=int(time.time() if now is None else now)
    try:
        ts=int(timestamp)
        if not (0 <= clock-ts <= MAX_AGE_SECONDS):
            return False
        expected=signature(secret(key_file),timestamp,nonce,scope,legacy=legacy)
    except (OSError,ValueError):
        return False
    if not hmac.compare_digest(expected,presented):
        return False
    with _lock:
        for seen,expiry in list(_seen.items()):
            if expiry<clock:_seen.pop(seen,None)
        if ticket in _seen:return False
        if len(_seen)>256:_seen.clear()
        _seen[ticket]=clock+MAX_AGE_SECONDS
    return True

def subprotocol_ticket(header: str) -> str | None:
    if not isinstance(header,str) or len(header)>400:
        return None
    options=[v.strip() for v in header.split(",")]
    if len(options)!=2 or options[0]!="mcf-pet-live":
        return None
    candidate=options[1]
    if not candidate.startswith("ticket."):
        return None
    return candidate[7:]
