"""MCF Pet Live — strict, inspectable READ_ONLY tool registry.

Only fixed local observability endpoints. No shell, browser, arbitrary URLs,
files, private databases, secret fields, user-defined code or state changes.

Tools are informational, never equivalent to mission authorization.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import http.client
import json
import os
from pathlib import Path
import stat
import threading
import time
import uuid
from typing import Any

HUB_HOST = "127.0.0.1"
HUB_PORT = 8898
MAX_RESPONSE_BYTES = 110_000
MAX_TOOL_RESULT_CHARS = 2_400
AUDIT_LOG = Path.home()/".local/state/mcf-pet-tools/read-only-receipts.jsonl"
_AUDIT_MUTEX = threading.Lock()

# The exact identifiers below are the only service values exposed to the model.
SERVICE_PORTS: dict[str,int] = {
    "mestre":8878,
    "painel":8898,
    "ollama":11434,
    "open_webui":3000,
    "dsh":3081,
    "9router":20128,
    "voicehub":8788,
    "agent_studio":4317,
}
SERVICE_UNITS: dict[str,str] = {
    "mestre":"mestre-agent.service",
    "painel":"mcf-service-hub.service",
    "ollama":"ollama-local.service",
    "open_webui":"open-webui-local.service",
    "dsh":"mcf-dsh-runtime.service",
    "9router":"mcf-9router.service",
    "voicehub":"voicehub-linux.service",
    "agent_studio":"mcf-agent-studio.service",
}
TOOL_DESCRIPTIONS = {
    "mcf_system_status":"Consulta atual de CPU, RAM, disco, swap e GPU no computador do MCF. Nunca altera o sistema.",
    "mcf_service_status":"Consulta o estado observado de um serviço predefinido do MCF, ou uma lista resumida. Não controla/reinicia serviços.",
    "mcf_pet_status":"Consulta se o mascote MESTRE está online, com expressão e telemetria verificadas. Não altera a expressão.",
    "mcf_mission_status":"Consulta o observador de missões MCF. Se estiver desconectado, diga isso; não invente missões nem resultados.",
    "mcf_tool_catalog":"Lista as ferramentas de leitura permitidas e explica que ações operacionais exigem fluxo governado separado.",
}
TOOL_DECLARATIONS = [
    {"name":"mcf_system_status",
     "description":TOOL_DESCRIPTIONS["mcf_system_status"],
     "parameters":{"type":"OBJECT","properties":{}}},
    {"name":"mcf_service_status",
     "description":TOOL_DESCRIPTIONS["mcf_service_status"],
     "parameters":{"type":"OBJECT","properties":{
         "service":{"type":"STRING","description":"Opcional: mestre, painel, ollama, open_webui, dsh, 9router, voicehub, agent_studio ou todos."}
     }}},
    {"name":"mcf_pet_status",
     "description":TOOL_DESCRIPTIONS["mcf_pet_status"],
     "parameters":{"type":"OBJECT","properties":{}}},
    {"name":"mcf_mission_status",
     "description":TOOL_DESCRIPTIONS["mcf_mission_status"],
     "parameters":{"type":"OBJECT","properties":{}}},
    {"name":"mcf_tool_catalog",
     "description":TOOL_DESCRIPTIONS["mcf_tool_catalog"],
     "parameters":{"type":"OBJECT","properties":{}}},
]
TOOL_NAMES = frozenset(TOOL_DESCRIPTIONS)
assert len(TOOL_NAMES)==len(TOOL_DECLARATIONS)

class ToolBlocked(Exception):
    def __init__(self,code: str):
        self.code=code
        super().__init__(code)

def _get(path: str) -> Any:
    if path not in (
        "/api/v1/metrics",
        "/api/v1/services",
        "/api/v1/systemd",
        "/api/v1/pet",
        "/api/v1/mcf/observation",
    ):
        raise ToolBlocked("ENDPOINT_NOT_ALLOWED")
    conn=http.client.HTTPConnection(HUB_HOST,HUB_PORT,timeout=2.5)
    try:
        conn.request("GET",path,headers={
            "Accept":"application/json",
            "Connection":"close",
        })
        res=conn.getresponse()
        if res.status != 200:
            raise ToolBlocked("SOURCE_HTTP_UNAVAILABLE")
        data=res.read(MAX_RESPONSE_BYTES+1)
        if len(data)>MAX_RESPONSE_BYTES:
            raise ToolBlocked("SOURCE_TOO_LARGE")
        if not (res.getheader("Content-Type") or "").lower().startswith("application/json"):
            raise ToolBlocked("INVALID_CONTENT_TYPE")
        return json.loads(data)
    except (OSError,TimeoutError,http.client.HTTPException,UnicodeError,ValueError):
        raise ToolBlocked("SOURCE_UNAVAILABLE")
    finally:
        conn.close()

def _numeric(value: Any, precision: int=1) -> float|int|None:
    if type(value) not in (int,float):
        return None
    if isinstance(value,float) and not (-1e14<value<1e14):
        return None
    return round(value,precision) if isinstance(value,float) else value

def _pick(obj: Any, names: tuple[str,...]) -> dict:
    if not isinstance(obj,dict):
        return {}
    return {name:obj[name] for name in names
            if name in obj and (obj[name] is None or type(obj[name]) in
                                 (str,int,float,bool)) and
            (not isinstance(obj[name],str) or len(obj[name])<=100)}

def system_status() -> dict:
    doc=_get("/api/v1/metrics")
    if not isinstance(doc,dict):
        raise ToolBlocked("UNEXPECTED_METRICS")
    metrics=doc.get("metrics")
    if not isinstance(metrics,dict):
        raise ToolBlocked("UNEXPECTED_METRICS")
    names=("cpu_percent","load_1m","memory_percent","swap_percent",
           "disk_percent","gpu_busy_percent","gpu_vram_percent",
           "gpu_temperature_c","uptime_seconds")
    output={k:_numeric(metrics.get(k)) for k in names}
    output["memory_available_gib"]=(
        round(metrics["memory_available_bytes"]/1073741824,2)
        if type(metrics.get("memory_available_bytes")) in (int,float) else None)
    output["disk_free_gib"]=(
        round(metrics["disk_free_bytes"]/1073741824,2)
        if type(metrics.get("disk_free_bytes")) in (int,float) else None)
    host=doc.get("host") if isinstance(doc.get("host"),dict) else {}
    return {
        "observed_at":str(doc.get("updated") or "")[:60],
        "source":"MCF_SERVICE_HUB_LOCAL_METRICS",
        "host":_pick(host,("hostname","os")),
        "metrics":output,
        "note":"Valores são amostras observadas; não prova que processos específicos estão saudáveis.",
    }

def service_status(service: str) -> dict:
    if service not in SERVICE_PORTS and service != "todos":
        raise ToolBlocked("SERVICE_NOT_ALLOWLISTED")
    observed=_get("/api/v1/services")
    units=_get("/api/v1/systemd")
    if not isinstance(observed,list) or not isinstance(units,list):
        raise ToolBlocked("UNEXPECTED_SERVICE_INVENTORY")
    ports={row.get("port"):row for row in observed
           if isinstance(row,dict) and type(row.get("port")) is int}
    unit_states={row.get("name"):row for row in units
                 if isinstance(row,dict) and isinstance(row.get("name"),str)}
    requested=SERVICE_PORTS if service=="todos" else {service:SERVICE_PORTS[service]}
    values=[]
    for key,port in requested.items():
        row=ports.get(port)
        unit=unit_states.get(SERVICE_UNITS[key])
        values.append({
            "service":key,
            "port":port,
            "status":str(row.get("status"))[:70] if row else "não encontrado no inventário",
            "http_code":row.get("http_code") if row and type(row.get("http_code")) is int else None,
            "unit_status":str(unit.get("status"))[:40] if unit else "unavailable",
            "unit_substate":str(unit.get("substate"))[:40] if unit else None,
            "source":"MCF_SERVICE_HUB_LOCAL_INVENTORY",
        })
    return {"services":values,
            "note":"Porta observada e estado systemd não garantem uma operação E2E."}

def pet_status() -> dict:
    doc=_get("/api/v1/pet")
    if not isinstance(doc,dict) or not isinstance(doc.get("pet"),dict):
        raise ToolBlocked("UNEXPECTED_PET_STATUS")
    pet=doc["pet"]
    return {
        "observed_at":str(doc.get("checked_at") or "")[:55],
        "status":_pick(pet,(
            "status","state","state_verified","process_source",
            "service_active","udp_listening","uptime_seconds",
        )),
        "source":"MCF_PET_OBSERVER",
        "note":"Estado gráfico verificado não concede capacidade de executar ações.",
    }

def mission_status() -> dict:
    doc=_get("/api/v1/mcf/observation")
    if not isinstance(doc,dict):
        raise ToolBlocked("UNEXPECTED_MISSION_OBSERVER")
    mission=doc.get("mission")
    # The observer can be disconnected. Do not imply canonical runtime
    # evidence if the response is merely a local snapshot.
    details=_pick(mission,("id","mission_id","status","phase","phase_id")) if isinstance(mission,dict) else {}
    return {
        "status":str(doc.get("status") or "desconhecido")[:60],
        "checked_at":str(doc.get("checkedAt") or "")[:55],
        "last_success_at":str(doc.get("lastSuccessAt") or "")[:55],
        "source":str(doc.get("source") or "unknown")[:90],
        "mission":details or None,
        "event_count":len(doc.get("events")) if isinstance(doc.get("events"),list) else None,
        "reliability":"NOT_CONNECTED" if not details else "OBSERVATION_ONLY",
        "note":"Ausência de dados canônicos não é prova de que nenhuma missão existe.",
    }

def tool_catalog() -> dict:
    return {
        "permission_profile":"READ_ONLY",
        "available_tools":[{"name":k,"description":v} for k,v in TOOL_DESCRIPTIONS.items()],
        "allowed":"Consultar telemetria e inventário local já expostos em APIs GET.",
        "blocked":"Terminal, escrita, navegador ativo, aprovações, publicação, serviços, finanças e qualquer ação com efeito.",
        "future_authorization":"MCF PermissionEngine + HDF + HUMAN_GATE conforme escopo.",
    }

def _receipt(name: str,code: str,elapsed_ms: int) -> str:
    rid=uuid.uuid4().hex[:16]
    event={"time":datetime.now(timezone.utc).isoformat(),
           "receipt_id":rid,"tool":name[:65],
           "permission":"READ_ONLY","outcome":code[:55],
           "elapsed_ms":max(0,min(int(elapsed_ms),60_000))}
    # No user prompt, query text, tool arguments, raw results, credentials or
    # source endpoint body is stored here.
    AUDIT_LOG.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    with _AUDIT_MUTEX:
        fd=os.open(AUDIT_LOG,os.O_WRONLY|os.O_APPEND|os.O_CREAT|
                   getattr(os,"O_NOFOLLOW",0),0o600)
        try:
            info=os.fstat(fd)
            if (not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid()
                    or info.st_mode & 0o077):
                raise OSError("Unsafe audit log")
            if info.st_size>1_000_000:
                raise OSError("Audit log full: fail closed rather than invent evidence")
            os.write(fd,(json.dumps(event,separators=(",",":"))+"\n").encode("utf-8"))
        finally:
            os.close(fd)
    return rid

def dispatch(name: str,arguments: Any) -> dict:
    start=time.monotonic()
    code="OK"
    response: dict={}
    try:
        if not isinstance(name,str) or name not in TOOL_NAMES:
            raise ToolBlocked("TOOL_NOT_ALLOWED")
        if arguments is None:
            arguments={}
        if not isinstance(arguments,dict) or len(json.dumps(arguments))>256:
            raise ToolBlocked("INVALID_ARGUMENTS")
        if name=="mcf_service_status":
            if set(arguments)-{"service"}:
                raise ToolBlocked("UNRECOGNIZED_ARGUMENTS")
            service=arguments.get("service","todos")
            if not isinstance(service,str):
                raise ToolBlocked("INVALID_SERVICE")
            response=service_status(service)
        else:
            if arguments:
                raise ToolBlocked("UNRECOGNIZED_ARGUMENTS")
            response={
                "mcf_system_status":system_status,
                "mcf_pet_status":pet_status,
                "mcf_mission_status":mission_status,
                "mcf_tool_catalog":tool_catalog,
            }[name]()
        if len(json.dumps(response,ensure_ascii=False))>MAX_TOOL_RESULT_CHARS:
            raise ToolBlocked("RESULT_TOO_LARGE")
    except ToolBlocked as exc:
        code=exc.code
        response={"error":code,"executed":False,
                  "message":"Consulta indisponível ou não autorizada."}
    except Exception:
        # An arbitrary error must not break audio or reveal source internals.
        code="INTERNAL_ERROR"
        response={"error":code,"executed":False,
                  "message":"Não foi possível verificar essa consulta."}
    elapsed=int((time.monotonic()-start)*1000)
    try:
        rid=_receipt(name if isinstance(name,str) else "invalid",code,elapsed)
    except OSError:
        rid="audit-unavailable"
        if code=="OK":
            # Required audit evidence missing => fail closed.
            code="AUDIT_UNAVAILABLE"
            response={"error":code,"executed":False,
                      "message":"Registro de uso indisponível. Consulta bloqueada."}
    return {"ok":code=="OK","status":code,"receipt_id":rid,
            "result":response,"read_only":True}
