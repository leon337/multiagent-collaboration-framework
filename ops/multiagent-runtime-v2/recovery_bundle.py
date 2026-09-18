from __future__ import annotations
import hashlib, json, os, time
from pathlib import Path
from typing import Any, Iterable
from runtime import MissionStore, Event, replay, _canonical_json, SCHEMA_VERSION

class RecoveryError(RuntimeError): pass
class RecoveryIntegrityError(RecoveryError): pass
SCHEMA='mcf_recovery_bundle/v1'

def _sha_bytes(data:bytes)->str:return hashlib.sha256(data).hexdigest()

def _event_dict(e:Event)->dict[str,Any]:
    return {
      'mission_id':e.mission_id,'seq':e.seq,'event_id':e.event_id,'event_type':e.event_type,
      'actor_id':e.actor_id,'timestamp':e.timestamp,'idempotency_key':e.idempotency_key,
      'correlation_id':e.correlation_id,'causation_id':e.causation_id,'payload':e.payload,
      'payload_sha256':e.payload_sha256,
    }

def export_events(store:MissionStore, mission_id:str, path:str|Path)->dict[str,Any]:
    events=store.events(mission_id); replay(events)
    out=Path(path); out.parent.mkdir(parents=True,exist_ok=True)
    lines=[json.dumps(_event_dict(e),ensure_ascii=False,sort_keys=True,separators=(',',':')) for e in events]
    data=(('\n'.join(lines)+'\n') if lines else '').encode()
    tmp=out.with_suffix(out.suffix+'.tmp'); tmp.write_bytes(data); os.replace(tmp,out)
    return {'schema':SCHEMA,'mission_id':mission_id,'event_count':len(events),'journal_export_sha256':_sha_bytes(data),'exported_at':time.time()}

def load_export(path:str|Path)->list[Event]:
    events=[]
    for n,line in enumerate(Path(path).read_text(encoding='utf-8').splitlines(),1):
        if not line.strip():continue
        try:r=json.loads(line)
        except Exception as e:raise RecoveryIntegrityError(f'invalid JSONL line {n}') from e
        try:e=Event(**r)
        except Exception as e2:raise RecoveryIntegrityError(f'invalid event shape line {n}') from e2
        actual=hashlib.sha256(_canonical_json(e.payload).encode()).hexdigest()
        if actual!=e.payload_sha256:raise RecoveryIntegrityError(f'payload digest mismatch line {n}')
        events.append(e)
    try:replay(events)
    except Exception as e:raise RecoveryIntegrityError(f'event replay failed: {e}') from e
    return events

def import_events(store:MissionStore,path:str|Path)->dict[str,Any]:
    raw=Path(path).read_bytes(); events=load_export(path)
    if not events:return {'event_count':0,'mission_id':None,'journal_export_sha256':_sha_bytes(raw)}
    mission_id=events[0].mission_id
    if any(e.mission_id!=mission_id for e in events):raise RecoveryIntegrityError('mixed mission ids')
    if store.events(mission_id):raise RecoveryError('target store already contains mission events')
    projection=replay(events)
    store.conn.execute('BEGIN IMMEDIATE')
    try:
        for e in events:
            store.conn.execute(
              '''INSERT INTO mission_events(
                   mission_id,seq,event_id,schema_version,event_type,actor_id,ts,
                   idempotency_key,correlation_id,causation_id,payload_json,payload_sha256
                 ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)''',
              (e.mission_id,e.seq,e.event_id,SCHEMA_VERSION,e.event_type,e.actor_id,e.timestamp,
               e.idempotency_key,e.correlation_id,e.causation_id,_canonical_json(e.payload),e.payload_sha256))
        store.conn.execute('INSERT OR REPLACE INTO mission_seq(mission_id,next_seq) VALUES(?,?)',(mission_id,max(e.seq for e in events)+1))
        for tid,t in projection.tasks.items():
            store.conn.execute('INSERT OR REPLACE INTO task_heads(mission_id,task_id,revision) VALUES(?,?,?)',(mission_id,tid,int(t['revision'])))
        store.conn.execute('COMMIT')
    except Exception:
        store.conn.execute('ROLLBACK');raise
    return {'event_count':len(events),'mission_id':mission_id,'journal_export_sha256':_sha_bytes(raw)}

def build_capsule(root:str|Path,mission_id:str,files:Iterable[str],output:str|Path,*,public_safe:bool=False)->dict[str,Any]:
    root=Path(root);manifest={}
    for rel in files:
        p=root/rel
        if not p.is_file():raise RecoveryError(f'missing recovery file: {rel}')
        b=p.read_bytes();manifest[rel]={'sha256':_sha_bytes(b),'size':len(b)}
    c={'schema':SCHEMA,'mission_id':mission_id,'created_at':time.time(),'public_safe':bool(public_safe),'files':manifest}
    out=Path(output);out.parent.mkdir(parents=True,exist_ok=True);tmp=out.with_suffix(out.suffix+'.tmp');tmp.write_text(json.dumps(c,ensure_ascii=False,indent=2,sort_keys=True)+'\n');os.replace(tmp,out);return c

def validate_capsule(root:str|Path,capsule_path:str|Path)->dict[str,Any]:
    root=Path(root);c=json.loads(Path(capsule_path).read_text());failures=[]
    for rel,meta in c.get('files',{}).items():
        p=root/rel
        if not p.is_file():failures.append({'file':rel,'reason':'missing'});continue
        actual=_sha_bytes(p.read_bytes())
        if actual!=meta['sha256']:failures.append({'file':rel,'reason':'sha256_mismatch','expected':meta['sha256'],'actual':actual})
    return {'ok':not failures,'mission_id':c.get('mission_id'),'failures':failures,'file_count':len(c.get('files',{}))}

def materialize_from_map(target_root:str|Path,capsule:dict[str,Any],file_map:dict[str,bytes|str])->dict[str,Any]:
    target=Path(target_root);target.mkdir(parents=True,exist_ok=True)
    for rel,meta in capsule.get('files',{}).items():
        if rel not in file_map:raise RecoveryError(f'missing source bytes for {rel}')
        data=file_map[rel].encode() if isinstance(file_map[rel],str) else file_map[rel]
        if _sha_bytes(data)!=meta['sha256']:raise RecoveryIntegrityError(f'source digest mismatch for {rel}')
        p=target/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    return {'materialized':len(capsule.get('files',{})),'target':str(target)}

def resume_plan(projection,*,now:float|None=None)->dict[str,Any]:
    now=float(time.time() if now is None else now);ready=[];recovery=[];leased=[]
    for tid,t in projection.tasks.items():
        deps_ok=all(projection.tasks.get(dep,{}).get('status')=='completed' for dep in t.get('blocked_by',[]))
        if t.get('status')=='pending' and deps_ok:ready.append(tid)
        elif t.get('status')=='blocked' and t.get('owner_id') is None and deps_ok:recovery.append(tid)
        elif t.get('status')=='leased':
            if t.get('lease_until') is not None and float(t['lease_until'])<=now:recovery.append(tid)
            else:leased.append(tid)
    interrupted=[sid for sid,s in projection.sessions.items() if s.get('status')=='interrupted']
    active=[sid for sid,s in projection.sessions.items() if s.get('status')=='active']
    return {'ready_tasks':sorted(ready),'recovery_tasks':sorted(set(recovery)),'leased_tasks':sorted(leased),'interrupted_sessions':sorted(interrupted),'active_sessions':sorted(active)}
