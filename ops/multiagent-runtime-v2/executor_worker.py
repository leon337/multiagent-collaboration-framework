from __future__ import annotations
import json, os, sys, time
from pathlib import Path
from live_history import HistoryLog

def atomic_json(path: Path, value: dict):
    tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(value,ensure_ascii=False,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    os.replace(tmp,path)

def main(exec_dir: str) -> int:
    d=Path(exec_dir)
    req=json.loads((d/'request.json').read_text())
    cp_path=d/'checkpoint.json'
    cp=json.loads(cp_path.read_text()) if cp_path.exists() else {'next_step':1,'attempt':0,'status':'pending'}
    execution_id=req['execution_id']; agent_id=req['agent_id']; task_id=req['task_id']
    log=HistoryLog(d/'events.jsonl')
    attempt=int(cp.get('attempt',0))+1
    next_step=int(cp.get('next_step',1))
    kind='EXECUTOR_STARTED' if attempt==1 else 'EXECUTOR_RESUMED'
    log.append(execution_id,agent_id,kind,f'{task_id}: attempt {attempt}',evidence={'task_id':task_id,'attempt':attempt,'pid':os.getpid()},idempotency_key=f'attempt:{attempt}')
    cp.update({'attempt':attempt,'status':'running','pid':os.getpid(),'next_step':next_step})
    atomic_json(cp_path,cp)
    steps=int(req.get('steps',5)); delay=float(req.get('delay_s',0.02))
    for step in range(next_step,steps+1):
        payload={'task_id':task_id,'step':step,'steps':steps,'pid':os.getpid()}
        log.append(execution_id,agent_id,'EXECUTOR_STEP',f'{task_id}: step {step}/{steps}',evidence=payload,idempotency_key=f'step:{step}')
        cp.update({'status':'running','next_step':step+1,'last_step':step,'pid':os.getpid()})
        atomic_json(cp_path,cp)
        time.sleep(delay)
    result={'task_id':task_id,'result':req.get('result','completed'),'steps':steps}
    log.append(execution_id,agent_id,'EXECUTOR_COMPLETED',f'{task_id}: completed',evidence=result,idempotency_key='completed')
    cp.update({'status':'completed','next_step':steps+1,'result':result,'pid':os.getpid()})
    atomic_json(cp_path,cp)
    return 0

if __name__=='__main__':
    raise SystemExit(main(sys.argv[1]))
