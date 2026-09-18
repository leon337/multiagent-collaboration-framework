from __future__ import annotations
import hashlib,json,multiprocessing as mp,os,time
from pathlib import Path
def _worker(i,root,barrier):
    pid=os.getpid();h=hashlib.sha256((f'worker-{i}-'+'x'*10000).encode()).hexdigest();barrier.wait(timeout=10);start=time.time();time.sleep(.12);end=time.time();Path(root,f'w{i}.json').write_text(json.dumps({'worker':i,'pid':pid,'sha256':h,'started':start,'ended':end,'status':'PASS'}))
def run(root,workers=6):
    root=Path(root);root.mkdir(parents=True,exist_ok=True);ctx=mp.get_context('spawn');barrier=ctx.Barrier(workers+1);ps=[ctx.Process(target=_worker,args=(i,str(root),barrier)) for i in range(workers)]
    for p in ps:p.start()
    barrier.wait(timeout=10)
    for p in ps:p.join(5)
    if any(p.exitcode!=0 for p in ps):raise RuntimeError('capacity probe child failed')
    rows=[json.loads((root/f'w{i}.json').read_text()) for i in range(workers)];points=[]
    for r in rows:points.extend([(r['started'],1),(r['ended'],-1)])
    active=peak=0
    for _,d in sorted(points,key=lambda x:(x[0],-x[1])):active+=d;peak=max(peak,active)
    return {'workers':workers,'pass_count':sum(r['status']=='PASS' for r in rows),'peak_concurrency_observed':peak,'unique_pids':len({r['pid'] for r in rows})}
