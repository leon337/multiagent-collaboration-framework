"""Trusted-MCF-only GitHub App execution adapter.

Not registered as a DSH MCP tool. Never callable through untrusted model input.
The canonical MissionRuntime must validate the intent with HDF/PermissionEngine,
then supply a trusted, independently verified authorization callback.
"""
from __future__ import annotations
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import proposal

class GateError(RuntimeError): pass
class EffectUnknown(RuntimeError): pass

def _b64(data:bytes):
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")

class GitHubApp:
    def __init__(self, app_id:str, installation_id:str, private_key_file:str, opener=None, clock=None):
        if not app_id.isdigit() or not installation_id.isdigit():raise GateError("invalid app/installation id")
        self.app_id=app_id
        self.installation_id=installation_id
        self.key_path=Path(private_key_file)
        self.opener=opener or urllib.request.urlopen
        self.clock=clock or time.time
    @classmethod
    def from_env(cls,env=None):
        e=os.environ if env is None else env
        names=["MCF_GITHUB_APP_ID","MCF_GITHUB_INSTALLATION_ID","MCF_GITHUB_APP_PRIVATE_KEY_FILE"]
        if not all(e.get(n) for n in names):raise GateError("GITHUB_APP_IDENTITY_NOT_PROVISIONED")
        return cls(e[names[0]],e[names[1]],e[names[2]])
    def _jwt(self):
        st=self.key_path.stat()
        if (st.st_mode & 0o077)!=0 or st.st_uid!=os.geteuid() or self.key_path.is_symlink() or not self.key_path.is_file():
            raise GateError("GitHub App private key must be owned by executor, regular, not symlink, mode 0600")
        header=_b64(b'{"alg":"RS256","typ":"JWT"}')
        now=int(self.clock())
        payload=_b64(json.dumps({"iat":now-60,"exp":now+480,"iss":self.app_id},separators=(",",":")).encode())
        message=(header+"."+payload).encode("ascii")
        proc=subprocess.run(["/usr/bin/openssl","dgst","-sha256","-sign",str(self.key_path)],
                            input=message,capture_output=True,timeout=8,check=True)
        return header+"."+payload+"."+_b64(proc.stdout)
    def _call(self,method,path,body,token):
        data=json.dumps(body,separators=(",",":")).encode() if body is not None else None
        headers={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",
                 "User-Agent":"mcf-dsh-app-executor/1","Authorization":"Bearer "+token}
        if data is not None:headers["Content-Type"]="application/json"
        req=urllib.request.Request("https://api.github.com"+path,data=data,headers=headers,method=method)
        try:
            with self.opener(req,timeout=12) as resp:
                raw=resp.read(100001)
                if len(raw)>100000:raise GateError("GitHub response limit exceeded")
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            raise GateError(f"GitHub HTTP {e.code} on {method} {path.split('?')[0]}") from None
    def installation_token(self):
        body={"repositories":["multiagent-collaboration-framework"],
              "permissions":{"contents":"write","pull_requests":"write"}}
        v=self._call("POST",f"/app/installations/{self.installation_id}/access_tokens",body,self._jwt())
        token=v.get("token","")
        if not isinstance(token,str) or len(token)<20:raise GateError("invalid installation access token")
        # Explicit scope is included in request. GitHub may return fewer permissions.
        granted=v.get("permissions",{})
        if granted.get("contents")!="write" or granted.get("pull_requests")!="write":
            raise GateError("GitHub App permissions insufficient")
        repos=v.get("repositories")
        if not isinstance(repos,list) or {r.get("full_name") for r in repos if isinstance(r,dict)}!={proposal.REPO}:
            raise GateError("Installation token repository scope not proven")
        return token
    def call(self,method,path,body=None,token=None):
        if not token:raise GateError("installation token missing")
        root="/repos/"+proposal.REPO+"/"
        if not path.startswith(root) or ".." in path or "://" in path:
            raise GateError("GitHub API path out of repository allowlist")
        rel=path[len(root):]
        allowed=False
        if method=="GET" and body is None:
            allowed=(rel=="git/ref/heads/main" or
                     bool(re.fullmatch(r"git/ref/heads/agent/dsh3085/[a-z0-9][a-z0-9-]{3,55}",rel)) or
                     bool(re.fullmatch(r"pulls/[1-9][0-9]*",rel)) or
                     (rel.startswith("contents/tools/") or rel.startswith("contents/docs/")) and "?ref=" in rel)
        elif method=="POST" and isinstance(body,dict):
            if rel=="git/refs":
                allowed=(set(body)=={"ref","sha"} and isinstance(body["ref"],str)
                         and proposal.BRANCH.fullmatch(body["ref"].removeprefix("refs/heads/")) is not None
                         and body["ref"].startswith("refs/heads/") and
                         isinstance(body["sha"],str) and proposal.SHA.fullmatch(body["sha"]) is not None)
            elif rel=="pulls":
                allowed=(set(body)=={"title","body","head","base","draft","maintainer_can_modify"}
                         and body.get("draft") is True and body.get("base")=="main"
                         and body.get("maintainer_can_modify") is False
                         and isinstance(body.get("head"),str) and proposal.BRANCH.fullmatch(body["head"]) is not None)
        elif method=="PUT" and isinstance(body,dict):
            allowed=((rel.startswith("contents/tools/") or rel.startswith("contents/docs/"))
                     and set(body)=={"message","content","branch"} and
                     isinstance(body.get("branch"),str) and proposal.BRANCH.fullmatch(body["branch"]) is not None)
        if not allowed:raise GateError("GitHub method or endpoint forbidden by write allowlist")
        return self._call(method,path,body,token)

class Ledger:
    def __init__(self,root):
        self.root=Path(root)
        self.root.mkdir(mode=0o700,parents=True,exist_ok=True)
        if self.root.is_symlink() or self.root.stat().st_mode & 0o077:
            raise GateError("ledger directory not private")
    def reserve(self,key,record):
        p=self.root/(key+".json")
        try:
            fd=os.open(p,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        except FileExistsError:
            raise GateError("DUPLICATE_OR_UNKNOWN_WRITE: manual reconciliation required")
        with os.fdopen(fd,"w") as f:
            json.dump(record,f,sort_keys=True);f.flush();os.fsync(f.fileno())
        dirfd=os.open(self.root,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
        try:os.fsync(dirfd)
        finally:os.close(dirfd)
        return p
    def update(self,path,record):
        temp=path.with_name(path.name+"."+uuid.uuid4().hex+".tmp")
        with os.fdopen(os.open(temp,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600),"w") as f:
            json.dump(record,f,sort_keys=True);f.flush();os.fsync(f.fileno())
        os.replace(temp,path)
        dirfd=os.open(self.root,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
        try:os.fsync(dirfd)
        finally:os.close(dirfd)

def run_authorized(envelope,authorize,app:GitHubApp,ledger:Ledger):
    """authorize MUST be a trusted runtime callback, not a field provided by a model."""
    if not callable(authorize):raise GateError("MCF_HDF_PERMISSION_ENGINE_NOT_CONNECTED")
    if not isinstance(envelope,dict) or set(envelope)!={"proposal_id","digest_sha256","created_unix","proposal"}:
        raise GateError("proposal envelope malformed")
    if not isinstance(envelope["proposal_id"],str) or not uuid.UUID(envelope["proposal_id"]):
        raise GateError("proposal_id invalid")
    raw=envelope["proposal"]
    expected=proposal.normalize({k:raw[k] for k in ("mission_id","phase_id","agent_id","branch","base_sha","title","body","files")})
    if raw!=expected or envelope["digest_sha256"]!=proposal.digest(expected):
        raise GateError("proposal digest or schema mismatch")
    if int(time.time())-envelope["created_unix"]>3600 or envelope["created_unix"]>int(time.time())+120:
        raise GateError("stale proposal")
    auth=authorize({"mission_id":expected["mission_id"],"phase_id":expected["phase_id"],
                    "proposal_digest":envelope["digest_sha256"],
                    "repository":proposal.REPO,"operation":"create-branch-pr","agent_id":expected["agent_id"]})
    if not isinstance(auth,dict) or auth.get("status")!="AUTHORIZED" or auth.get("digest")!=envelope["digest_sha256"] or auth.get("authority")!="MCF_RUNTIME_VERIFIED":
        raise GateError("CANONICAL_MCF_AUTHORIZATION_REQUIRED")
    key=hashlib.sha256((proposal.REPO+"|"+envelope["proposal_id"]+"|"+envelope["digest_sha256"]).encode()).hexdigest()
    record={"proposal_id":envelope["proposal_id"],"digest_sha256":envelope["digest_sha256"],"status":"RESERVED","events":[],
            "execution_identity":"github-app-installation:"+app.installation_id}
    path=ledger.reserve(key,record)
    try:
        # Token requested only after canonical approval + durable reservation.
        token=app.installation_token()
        main=app.call("GET","/repos/"+proposal.REPO+"/git/ref/heads/main",token=token)
        if main.get("object",{}).get("sha")!=expected["base_sha"]:
            record["status"]="FAILED_STALE_MAIN"; ledger.update(path,record)
            raise GateError("main SHA changed: new approval required")
        branch=expected["branch"]
        path_ref="/repos/"+proposal.REPO+"/git/refs"
        record["status"]="EFFECT_UNKNOWN";record["events"].append("branch_create_started");ledger.update(path,record)
        app.call("POST",path_ref,{"ref":"refs/heads/"+branch,"sha":expected["base_sha"]},token=token)
        observed_ref=app.call("GET","/repos/"+proposal.REPO+"/git/ref/heads/"+branch,token=token)
        if observed_ref.get("object",{}).get("sha")!=expected["base_sha"]:
            raise EffectUnknown("branch read-back does not match authorized SHA")
        record["events"].append("branch_created_sha_verified");ledger.update(path,record)
        for entry in expected["files"]:
            path_item="/repos/"+proposal.REPO+"/contents/"+urllib.parse.quote(entry["path"],safe="/")
            # New files only. Existing file updates need explicit expected SHA in a future contract.
            try:
                app.call("GET",path_item+"?ref="+urllib.parse.quote(branch,safe=""),token=token)
            except GateError as e:
                if "HTTP 404" not in str(e):raise
            else:raise GateError("path already exists; refusing overwrite")
            app.call("PUT",path_item,
                     {"message":"feat(mcf): agent proposal "+envelope["proposal_id"][:8],
                      "content":base64.b64encode(entry["content"].encode()).decode(),
                      "branch":branch},token=token)
            record["events"].append("file_created:"+entry["path"]);ledger.update(path,record)
        pr=app.call("POST","/repos/"+proposal.REPO+"/pulls",
                    {"title":expected["title"],"body":expected["body"]+"\n\nMCF proposal: "+envelope["proposal_id"]+
                     "\nSHA256: "+envelope["digest_sha256"],
                     "head":branch,"base":"main","draft":True,
                     "maintainer_can_modify":False},token=token)
        if pr.get("draft") is not True or not pr.get("html_url") or not isinstance(pr.get("number"),int):
            raise EffectUnknown("GitHub PR result not provable")
        observed=app.call("GET","/repos/"+proposal.REPO+"/pulls/"+str(pr["number"]),token=token)
        if observed.get("draft") is not True or observed.get("state")!="open" or observed.get("head",{}).get("ref")!=branch or observed.get("base",{}).get("ref")!="main":
            raise EffectUnknown("draft PR read-back mismatch; reconciliation required")
        record.update({"status":"EXECUTED","pr_number":pr["number"],"pr_url":pr["html_url"],"proof":"GET_PR_DRAFT_HEAD_BASE"})
        ledger.update(path,record)
        return {"status":"EXECUTED","pr_number":pr["number"],"pr_url":pr["html_url"],
                "branch":branch,"proposal_id":envelope["proposal_id"],
                "digest_sha256":envelope["digest_sha256"]}
    except Exception as exc:
        if record["status"] not in ("FAILED_STALE_MAIN","EXECUTED"):
            record["status"]="EFFECT_UNKNOWN"
            record["error_class"]=type(exc).__name__
            ledger.update(path,record)
        raise
