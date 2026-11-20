#!/usr/bin/env python3
"""Credential-free, read-only GitHub MCP server for the public MCF repository.
No GitHub token, local filesystem access tool, or mutating GitHub operation.
"""
import base64
import json
import re
import sys
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
import proposal

REPO = "leon337/multiagent-collaboration-framework"
API = "https://api.github.com"
USER_AGENT = "MCF-DSH-3085-GitHub-Readonly-MCP/1"
VERSION = "0.1.0"
MAX_BODY = 65536
TOOLS = [
    {"name":"github_repo_info","description":"Read current metadata for the public MCF repository, without authentication.",
     "inputSchema":{"type":"object","properties":{},"additionalProperties":False}},
    {"name":"github_main_head","description":"Read live main branch commit SHA of public MCF repository.",
     "inputSchema":{"type":"object","properties":{},"additionalProperties":False}},
    {"name":"github_read_file","description":"Read bounded UTF-8 text file on public MCF main and return path, SHA and content. No local files.",
     "inputSchema":{"type":"object","properties":{"path":{"type":"string","minLength":1,"maxLength":250}},"required":["path"],"additionalProperties":False}},
    {"name":"github_open_issues","description":"Read latest open issues on public MCF repo (excluding pull requests).",
     "inputSchema":{"type":"object","properties":{"limit":{"type":"integer","minimum":1,"maximum":20}},"additionalProperties":False}},
    {"name":"github_submit_proposal","description":"Prepare and store a GitHub branch+draft PR change proposal for MCF review. PROPOSAL ONLY, NO GITHUB WRITE; NOT AN AUTHORIZATION.",
     "inputSchema":{"type":"object","properties":{
        "mission_id":{"type":"string"},"phase_id":{"type":"string"},"agent_id":{"type":"string"},
        "branch":{"type":"string"},"base_sha":{"type":"string"},"title":{"type":"string"},"body":{"type":"string"},
        "files":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"],"additionalProperties":False}}
     },"required":["mission_id","phase_id","agent_id","branch","base_sha","title","body","files"],"additionalProperties":False}},
    {"name":"github_open_prs","description":"Read latest open PR metadata on public MCF repo.",
     "inputSchema":{"type":"object","properties":{"limit":{"type":"integer","minimum":1,"maximum":20}},"additionalProperties":False}}
]
def api_get(path):
    req=urllib.request.Request(API+path,headers={
        "User-Agent":USER_AGENT,"Accept":"application/vnd.github+json",
        "X-GitHub-Api-Version":"2022-11-28"
    })
    with urllib.request.urlopen(req,timeout=10) as response:
        data=response.read(MAX_BODY+1)
        if len(data)>MAX_BODY: raise ValueError("github response too large")
        return json.loads(data)
def operate(name,args):
    if not isinstance(args,dict):raise ValueError("Invalid arguments")
    if name=="github_submit_proposal":
        return proposal.submit(args,Path(__file__).parent/"proposals")
    if name=="github_repo_info":
        x=api_get("/repos/"+REPO)
        return {"repository":x.get("full_name"),"private":x.get("private"),"default_branch":x.get("default_branch"),"url":x.get("html_url"),"updated_at":x.get("updated_at")}
    if name=="github_main_head":
        x=api_get("/repos/"+REPO+"/git/ref/heads/main")
        return {"repository":REPO,"branch":"main","sha":x.get("object",{}).get("sha"),"url":"https://github.com/"+REPO+"/tree/main"}
    if name=="github_read_file":
        p=args.get("path")
        if not isinstance(p,str) or len(p)>250 or p.startswith("/") or "\\" in p or any(z in ("",".","..") for z in p.split("/")) or not re.fullmatch(r"[a-zA-Z0-9_./@-]+",p):
            raise ValueError("Invalid repository path")
        encoded=urllib.parse.quote(p,safe="/")
        x=api_get("/repos/"+REPO+"/contents/"+encoded+"?ref=main")
        if not isinstance(x,dict) or x.get("type")!="file" or x.get("encoding")!="base64":raise ValueError("Not a regular UTF-8 file")
        raw=base64.b64decode(x.get("content",""))
        if len(raw)>32768:raise ValueError("File exceeds 32 KiB read limit; request a smaller file")
        return {"repository":REPO,"path":p,"sha":x.get("sha"),"html_url":x.get("html_url"),"text":raw.decode("utf-8","replace")}
    if name=="github_open_issues":
        n=args.get("limit",8)
        if type(n) is not int or not 1<=n<=20:raise ValueError("limit 1..20 required")
        items=api_get("/repos/"+REPO+"/issues?state=open&sort=updated&direction=desc&per_page="+str(n*2))
        return {"repository":REPO,"issues":[{"number":x.get("number"),"title":x.get("title"),"state":x.get("state"),"url":x.get("html_url")} for x in items if "pull_request" not in x][:n]}
    if name=="github_open_prs":
        n=args.get("limit",8)
        if type(n) is not int or not 1<=n<=20:raise ValueError("limit 1..20 required")
        items=api_get("/repos/"+REPO+"/pulls?state=open&sort=updated&direction=desc&per_page="+str(n))
        return {"repository":REPO,"prs":[{"number":x.get("number"),"title":x.get("title"),"draft":x.get("draft"),"head_sha":x.get("head",{}).get("sha"),"url":x.get("html_url")} for x in items]}
    raise ValueError("Tool not supported")
def answer(rid,result=None,error=None):
    if rid is None:return
    body={"jsonrpc":"2.0","id":rid}
    body["error"]=error if error else None
    if not error:body.pop("error");body["result"]=result
    sys.stdout.write(json.dumps(body,ensure_ascii=False,separators=(",",":"))+"\n")
    sys.stdout.flush()
def handle(msg):
    if not isinstance(msg,dict) or msg.get("jsonrpc")!="2.0":return
    method=msg.get("method");rid=msg.get("id")
    if rid is None:return
    if method=="initialize":
        p=msg.get("params") or {}
        pv=p.get("protocolVersion") or "2024-11-05"
        answer(rid,{"protocolVersion":pv,"capabilities":{"tools":{}},"serverInfo":{"name":"mcf-github-readonly-3085","version":VERSION}})
    elif method=="ping":answer(rid,{})
    elif method=="tools/list":answer(rid,{"tools":TOOLS})
    elif method=="tools/call":
        p=msg.get("params") or {};name=p.get("name")
        try:
            value=operate(name,p.get("arguments") or {})
            answer(rid,{"content":[{"type":"text","text":json.dumps(value,ensure_ascii=False)}],"isError":False})
        except Exception as exc:
            msg=str(exc)
            if isinstance(exc,urllib.error.HTTPError):msg="GitHub HTTP "+str(exc.code)
            answer(rid,{"content":[{"type":"text","text":"read-only GitHub tool error: "+msg[:180]}],"isError":True})
    else:
        answer(rid,error={"code":-32601,"message":"Method not found"})
def main():
    for line in sys.stdin:
        try: handle(json.loads(line))
        except Exception as exc:
            sys.stderr.write("MCP input error: "+type(exc).__name__+"\n")
if __name__=="__main__":main()
