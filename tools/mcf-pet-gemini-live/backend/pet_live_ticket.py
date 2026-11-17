"""Scoped browser-to-MESTRE Live session ticket on existing Pet conversation auth."""
from __future__ import annotations
import http.client
import json
from pet_live_auth import issue_ticket

def readiness() -> dict:
    conn=http.client.HTTPConnection("127.0.0.1",8878,timeout=2.5)
    try:
        conn.request("GET","/api/pet-live/status",headers={"Accept":"application/json"})
        resp=conn.getresponse()
        body=resp.read(4097)
        if resp.status!=200 or len(body)>4096:
            return {"ready":False,"reason":"GATEWAY_UNAVAILABLE"}
        data=json.loads(body)
        if not isinstance(data,dict) or data.get("available") is not True:
            return {"ready":False,"reason":"MODEL_NOT_CONFIGURED"}
        if data.get("execution_tools") is not False:
            return {"ready":False,"reason":"UNSAFE_GATEWAY_CONTRACT"}
        return {"ready":True,"model":"gemini-3.8-live",
                "seconds":min(int(data.get("max_session_seconds",300)),300),
                "tools_enabled":False,
                "read_only_tools_available":data.get("read_only_tools_available") is True}
    except (OSError,TimeoutError,ValueError,TypeError,OverflowError):
        return {"ready":False,"reason":"GATEWAY_UNAVAILABLE"}
    finally:
        conn.close()

def ticket_response(scope: str="conversation") -> tuple[int,dict]:
    if scope not in ("conversation","read_only","read_and_propose"):
        return 400,{"ready":False,"reason":"SCOPE_NOT_ALLOWED"}
    info=readiness()
    if not info["ready"]:
        return 503,info
    if scope in ("read_only","read_and_propose") and info.get("read_only_tools_available") is not True:
        return 503,{"ready":False,"reason":"READ_ONLY_TOOLS_UNAVAILABLE"}
    try:
        ticket=issue_ticket(scope=scope)
    except (OSError,ValueError):
        return 503,{"ready":False,"reason":"TICKET_SIGNER_UNAVAILABLE"}
    return 200,{**info,"ticket":ticket,"ttl_seconds":30,
                "tool_scope":scope,"tools_enabled":scope!="conversation",
                "proposal_drafts_enabled":scope=="read_and_propose"}
