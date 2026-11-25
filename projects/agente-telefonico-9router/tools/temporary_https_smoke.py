"""One-shot controlled public HTTPS smoke; does not place any phone calls.

Uses an EPHEMERAL TEST HMAC key, NEVER a live Twilio credential.
Starts a Cloudflare Quick Tunnel pointing to a loopback-only FastAPI server,
proves invalid signatures are rejected and an independently signed synthetic
Twilio request is accepted, and ALWAYS terminates both processes.
"""
import base64
import hashlib
import hmac
import os
import re
import secrets
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from xml.etree import ElementTree
import requests
from twilio.request_validator import RequestValidator

ROOT = Path(__file__).resolve().parents[1]
PYTHON = "/home/leo/Documentos/MCF-AGENTE-TELEFONICO/.venv/bin/python"
CLOUDFLARED = "/home/leo/.local/bin/cloudflared"
PORT = "18949"
SECRET = secrets.token_hex(32)
CALL_ID = "CA" + "b"*32
PROCESSES = []
def stop():
    for proc in reversed(PROCESSES):
        if proc.poll() is None:
            proc.terminate()
            try: proc.wait(timeout=4)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=3)

with tempfile.TemporaryDirectory(prefix="mcf449-smoke-") as folder:
    temp=Path(folder)
    os.chmod(temp,0o700)
    try:
        env=dict(os.environ)
        env.update(DEMO_MODE="0",ZERO_COST_ONLY="1",MODEL_NAME="oc/mimo-v2.6-flash-free",
                   NINEROUTER_BASE_URL="http://127.0.0.1:20128/v1",
                   TWILIO_AUTH_TOKEN=SECRET,PUBLIC_BASE_URL="https://invalid-until-tunnel.trycloudflare.com")
        # Use an explicit start barrier because the PUBLIC_BASE_URL must match
        # the random Cloudflare hostname; recreate the app once URL is known.
        tunnel_log=temp/"tunnel.log"
        with tunnel_log.open("w") as logfile:
            proc=subprocess.Popen([CLOUDFLARED,"tunnel","--no-autoupdate","--protocol","http2","--url",f"http://127.0.0.1:{PORT}"],
                stdout=logfile,stderr=subprocess.STDOUT,stdin=subprocess.DEVNULL,start_new_session=True)
        PROCESSES.append(proc)
        url=None
        for _ in range(60):
            text=tunnel_log.read_text(errors="ignore")
            match=re.search(r"https://[a-z0-9-]+\.trycloudflare\.com",text)
            if match:
                url=match.group()
                break
            if proc.poll() is not None: break
            time.sleep(.5)
        print("TUNNEL_HOST_CREATED",bool(url),flush=True)
        if not url: raise RuntimeError("Quick Tunnel did not start")
        env["PUBLIC_BASE_URL"]=url
        uv=subprocess.Popen([PYTHON,"-m","uvicorn","app.main:app","--host","127.0.0.1","--port",PORT,"--no-access-log","--log-level","error"],
          cwd=str(ROOT),env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,stdin=subprocess.DEVNULL,start_new_session=True)
        PROCESSES.append(uv)
        ready=False
        for i in range(45):
            try:
                local=requests.get(f"http://127.0.0.1:{PORT}/health",timeout=1)
                if local.status_code==200:
                    ready=True
                    break
            except requests.RequestException: pass
            time.sleep(.25)
        assert ready,"Private staging process did not start"
        print("LOCAL_HEALTH",local.status_code,flush=True)
        public=None
        for i in range(30):
            try:
                public=requests.get(url+"/health",timeout=3)
                if public.status_code==200:break
            except requests.RequestException:pass
            time.sleep(.3)
        print("HTTPS_HEALTH",public.status_code if public is not None else "missing",flush=True)
        assert public is not None and public.status_code==200,"Public HTTPS failed"
        bad=requests.post(url+"/voice/incoming",data={"CallSid":CALL_ID},timeout=5)
        print("UNSIGNED_WEBHOOK_REJECTED",bad.status_code==403,"HTTP",bad.status_code,flush=True)
        assert bad.status_code==403,"Invalid signature accepted"
        # Independently signed by Twilio official Python SDK.
        params={"CallSid":CALL_ID}
        signed=RequestValidator(SECRET).compute_signature(url+"/voice/incoming",params)
        good=requests.post(url+"/voice/incoming",data=params,
          headers={"X-Twilio-Signature":signed},timeout=5)
        print("SIGNED_WEBHOOK_ACCEPTED",good.status_code==200,"HTTP",good.status_code,flush=True)
        assert good.status_code==200,"Valid signature rejected"
        doc=ElementTree.fromstring(good.text)
        assert doc.find("Gather/Say").text.startswith("Olá")
        print("SIGNED_TWIML_GATHER_VALID",True,"LANG",doc.find("Gather").attrib.get("language"),flush=True)
        bad2=requests.post(url+"/voice/respond",data={"CallSid":CALL_ID,"SpeechResult":"Teste"},
            headers={"X-Twilio-Signature":"invalid"},timeout=5)
        assert bad2.status_code==403
        print("UNSIGNED_SPEECH_REJECTED",True,flush=True)
    except Exception as e:
        print("SMOKE_FAILED",type(e).__name__,str(e)[:170],flush=True)
        sys.exit(2)
    finally:
        stop()
        print("EPHEMERAL_TUNNEL_AND_APP_STOPPED",all(p.poll() is not None for p in PROCESSES),flush=True)
