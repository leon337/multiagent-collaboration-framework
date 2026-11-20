"""Untrusted agent proposal boundary. No GitHub credential or write permission."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
import time
import uuid

REPO = "leon337/multiagent-collaboration-framework"
BRANCH = re.compile(r"^agent/dsh3085/[a-z0-9][a-z0-9-]{3,55}$")
AGENT = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{1,40}$")
MISSION = re.compile(r"^MCF-[A-Z0-9_-]{6,100}$")
SHA = re.compile(r"^[a-f0-9]{40}$")
SAFE_PATH = re.compile(r"^[A-Za-z0-9._/-]{1,220}$")
SECRET = re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]{15,}|AKIA[0-9A-Z]{16}",re.I)
RESERVED_SEGMENTS = {"..",".",".git",".github",".env","node_modules",".venv","secrets","credentials"}
MAX_FILES = 6
MAX_TOTAL = 48000

class Rejected(ValueError):
    pass

def _text(d,key,limit):
    v=d.get(key)
    if not isinstance(v,str) or not v.strip() or len(v)>limit or "\x00" in v:
        raise Rejected(f"invalid {key}")
    return v

def normalize(raw):
    if not isinstance(raw,dict): raise Rejected("invalid proposal")
    allowed={"mission_id","phase_id","agent_id","branch","base_sha","title","body","files"}
    if set(raw)!=allowed:raise Rejected("missing or unexpected fields")
    mission=_text(raw,"mission_id",110)
    if not MISSION.fullmatch(mission):raise Rejected("mission_id outside MCF")
    phase=_text(raw,"phase_id",75)
    if not re.fullmatch(r"[A-Z0-9_-]{2,75}",phase): raise Rejected("invalid phase_id")
    agent=_text(raw,"agent_id",42)
    if not AGENT.fullmatch(agent):raise Rejected("invalid agent_id")
    branch=_text(raw,"branch",76)
    if not BRANCH.fullmatch(branch): raise Rejected("branch outside delegated namespace")
    sha=_text(raw,"base_sha",40)
    if not SHA.fullmatch(sha):raise Rejected("base_sha must be immutable 40-hex")
    title=_text(raw,"title",115)
    body=_text(raw,"body",3500)
    if SECRET.search(title+"\n"+body):raise Rejected("secret-like material")
    files=raw.get("files")
    if not isinstance(files,list) or not (1<=len(files)<=MAX_FILES):raise Rejected("invalid file count")
    seen=set();out=[];total=0
    for file in files:
        if not isinstance(file,dict) or set(file)!={"path","content"}:raise Rejected("invalid file schema")
        path=_text(file,"path",220)
        parts=path.split("/")
        if not SAFE_PATH.fullmatch(path) or len(parts)<2 or any(x in RESERVED_SEGMENTS or x.startswith(".") for x in parts):
            raise Rejected("unsafe file path")
        if not (path.startswith("tools/") or path.startswith("docs/")):
            raise Rejected("path out of allowlist")
        if path.lower().endswith((".pem",".key",".p12",".pfx",".env",".secret")):
            raise Rejected("secret or binary path")
        if path in seen:raise Rejected("duplicate path")
        seen.add(path)
        content=_text(file,"content",16384)
        if SECRET.search(content):raise Rejected("secret-like content")
        total+=len(content.encode("utf-8"))
        if total>MAX_TOTAL:raise Rejected("proposal too large")
        out.append({"path":path,"content":content})
    return {"version":1,"repository":REPO,"base_ref":"main","mission_id":mission,"phase_id":phase,
            "agent_id":agent,"branch":branch,"base_sha":sha,"title":title,"body":body,"files":out,
            "effect_class":"github-draft-pr","approval_state":"PROPOSED_UNAUTHORIZED"}

def canonical_bytes(plan):
    return json.dumps(plan,sort_keys=True,ensure_ascii=False,separators=(",",":")).encode("utf-8")

def digest(plan):
    return hashlib.sha256(canonical_bytes(plan)).hexdigest()

def submit(raw,spool):
    plan=normalize(raw)
    root=Path(spool)
    root.mkdir(mode=0o700,parents=True,exist_ok=True)
    if root.is_symlink() or not root.is_dir() or root.stat().st_mode & 0o077:
        raise Rejected("unsafe proposal dir or permissions")
    proposal_id=str(uuid.uuid4())
    envelope={"proposal_id":proposal_id,"digest_sha256":digest(plan),"created_unix":int(time.time()),"proposal":plan}
    target=root/(proposal_id+".json")
    flags=os.O_WRONLY|os.O_CREAT|os.O_EXCL
    fd=os.open(target,flags,0o600)
    try:
        with os.fdopen(fd,"w",encoding="utf8") as f:
            json.dump(envelope,f,sort_keys=True,ensure_ascii=False)
            f.flush();os.fsync(f.fileno())
    except:
        try:target.unlink()
        except OSError:pass
        raise
    return {"proposal_id":proposal_id,"digest_sha256":envelope["digest_sha256"],
            "state":"PROPOSED_UNAUTHORIZED","mission_id":plan["mission_id"],
            "branch":plan["branch"],"file_count":len(plan["files"]),
            "effect":"NO_GITHUB_WRITE","note":"Requires canonical MCF authorization before any GitHub mutation."}
