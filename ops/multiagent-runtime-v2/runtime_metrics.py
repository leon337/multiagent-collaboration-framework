from __future__ import annotations
import json,math,statistics
from pathlib import Path
from typing import Any
from runtime import MissionStore
SCHEMA='mcf_runtime_metrics/v1'
def _percentile(values,q):
    if not values:return 0.0
    xs=sorted(float(x) for x in values)
    if len(xs)==1:return xs[0]
    pos=(len(xs)-1)*q;lo=math.floor(pos);hi=math.ceil(pos)
    return xs[lo] if lo==hi else xs[lo]+(xs[hi]-xs[lo])*(pos-lo)
def _journal_metrics(db_path,mission_id):
    if not db_path or not mission_id or not Path(db_path).exists():return {'queue_time_ms':{'observed':0,'median':0.0,'p95':0.0},'tool_time_ms':{'calls':0,'sum':0.0,'p95':0.0},'retries':0}
    s=MissionStore(db_path);events=s.events(mission_id);s.close();created={};first={};leases={};tool_start={};tool=[]
    for e in events:
        p=e.payload
        if e.event_type=='task/created':created[p['task_id']]=e.timestamp
        elif e.event_type=='task/updated' and p.get('status')=='leased':leases[p['task_id']]=leases.get(p['task_id'],0)+1;first.setdefault(p['task_id'],e.timestamp)
        elif e.event_type=='tool/requested':tool_start[p['call_id']]=e.timestamp
        elif e.event_type in {'tool/completed','tool/failed'} and p.get('call_id') in tool_start:tool.append(max(0,(e.timestamp-tool_start[p['call_id']])*1000))
    q=[max(0,(first[t]-created[t])*1000) for t in first if t in created]
    return {'queue_time_ms':{'observed':len(q),'median':statistics.median(q) if q else 0.0,'p95':_percentile(q,.95)},'tool_time_ms':{'calls':len(tool),'sum':sum(tool),'p95':_percentile(tool,.95)},'retries':sum(max(0,n-1) for n in leases.values())}
def collect(team_dir,*,mission_db=None,mission_id=None):
    team=Path(team_dir);receipts=[]
    for p in sorted((team/'receipts').glob('*.json')):
        try:r=json.loads(p.read_text())
        except Exception:continue
        if r.get('worker')=='audit':continue
        receipts.append(r)
    evidence=[]
    for p in sorted((team/'evidence').glob('*.json')):
        if p.name=='audit.json':continue
        try:
            e=json.loads(p.read_text())
            if e.get('worker'):evidence.append(e)
        except Exception:pass
    durations=[float(r.get('duration_ms',0)) for r in receipts if r.get('duration_ms') is not None];success=sum(r.get('status')=='PASS' for r in receipts);points=[]
    for e in evidence:
        if e.get('started') is not None and e.get('ended') is not None:points.extend([(float(e['started']),1),(float(e['ended']),-1)])
    active=peak=0
    for _,d in sorted(points,key=lambda x:(x[0],-x[1])):active+=d;peak=max(peak,active)
    jm=_journal_metrics(mission_db,mission_id)
    return {'schema':SCHEMA,'worker_count':len(receipts),'success_count':success,'failure_count':len(receipts)-success,'success_rate':success/len(receipts) if receipts else 0.0,'duration_ms':{'median':statistics.median(durations) if durations else 0.0,'p95':_percentile(durations,.95),'max':max(durations) if durations else 0.0},'peak_concurrency_observed':peak,'model_context_usage':None,**jm}
def policy(m,max_team_size=8):
    workers=max(1,int(m.get('worker_count') or 1));rate=float(m.get('success_rate') or 0);peak=int(m.get('peak_concurrency_observed') or 1);p95=float((m.get('duration_ms') or {}).get('p95') or 0)
    if rate<.8:team=max(1,workers-1);reason='reduce_parallelism_after_failures'
    elif peak>=workers and rate==1:team=min(max_team_size,workers+1);reason='safe_capacity_probe'
    else:team=workers;reason='hold_current_parallelism'
    return {'schema':'mcf_runtime_policy/v1','team_size':team,'timeout_ms':max(5000,int(max(p95*4,1000))),'fanout_strategy':'parallel_independent_then_audit_fanin','model_policy':'BLOCKED_G08_NO_BUBBLE_NATIVE_COGNITIVE_BACKEND','reason':reason}
