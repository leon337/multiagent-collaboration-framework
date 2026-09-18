from __future__ import annotations
import base64, hashlib, hmac, json, os, secrets, time
from pathlib import Path
from typing import Any

class CapabilityError(RuntimeError): pass
class CapabilityDenied(CapabilityError): pass


def b64e(b:bytes)->str:return base64.urlsafe_b64encode(b).rstrip(b'=').decode()
def b64d(s:str)->bytes:return base64.urlsafe_b64decode(s+'='*((4-len(s)%4)%4))
def canonical(v:Any)->bytes:return json.dumps(v,sort_keys=True,separators=(',',':')).encode()

class CapabilityIssuer:
    def __init__(self,key_path:str|Path,revocations_path:str|Path|None=None):
        self.key_path=Path(key_path); self.key_path.parent.mkdir(parents=True,exist_ok=True)
        if not self.key_path.exists():
            self.key_path.write_bytes(secrets.token_bytes(32)); os.chmod(self.key_path,0o600)
        self.key=self.key_path.read_bytes()
        self.revocations=Path(revocations_path) if revocations_path else self.key_path.with_name('revoked-capabilities.jsonl')
        self.revocations.touch(exist_ok=True)
    def _sign(self,payload):return hmac.new(self.key,canonical(payload),hashlib.sha256).digest()
    def _decode(self,token):
        try:
            p,s=token.split('.',1); payload=json.loads(b64d(p)); sig=b64d(s)
        except Exception as e: raise CapabilityDenied('malformed capability token') from e
        if not hmac.compare_digest(sig,self._sign(payload)): raise CapabilityDenied('invalid capability signature')
        return payload
    def _revoked(self):
        out=set()
        for line in self.revocations.read_text().splitlines():
            if line.strip(): out.add(json.loads(line)['nonce'])
        return out
    def issue(self,agent_id,task_id,allowed_tools,ttl_seconds,*,now=None,parent_token=None):
        now=float(time.time() if now is None else now)
        if ttl_seconds<=0: raise CapabilityDenied('ttl must be positive')
        tools=sorted(set(allowed_tools))
        expires=now+ttl_seconds
        parent_nonce=None
        if parent_token:
            parent=self.verify(parent_token,now=now)
            if parent['agent_id']!=agent_id or parent['task_id']!=task_id: raise CapabilityDenied('parent scope mismatch')
            if not set(tools).issubset(set(parent['allowed_tools'])): raise CapabilityDenied('capability widening denied')
            expires=min(expires,float(parent['expires_at'])); parent_nonce=parent['nonce']
        payload={'v':1,'agent_id':agent_id,'task_id':task_id,'allowed_tools':tools,'issued_at':now,'expires_at':expires,'nonce':secrets.token_hex(16),'parent_nonce':parent_nonce}
        return b64e(canonical(payload))+'.'+b64e(self._sign(payload))
    def verify(self,token,tool=None,*,now=None):
        payload=self._decode(token); now=float(time.time() if now is None else now)
        if payload['nonce'] in self._revoked(): raise CapabilityDenied('capability revoked')
        if now>=float(payload['expires_at']): raise CapabilityDenied('capability expired')
        if now<float(payload['issued_at'])-1: raise CapabilityDenied('capability not yet valid')
        if tool is not None and tool not in set(payload['allowed_tools']): raise CapabilityDenied(f'tool {tool} not allowed')
        return payload
    def revoke(self,token,reason='revoked'):
        payload=self._decode(token)
        with self.revocations.open('a',encoding='utf-8') as f:
            f.write(json.dumps({'nonce':payload['nonce'],'reason':reason,'revoked_at':time.time()},sort_keys=True)+'\n'); f.flush(); os.fsync(f.fileno())
        return payload['nonce']
