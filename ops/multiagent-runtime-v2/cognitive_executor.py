from __future__ import annotations
import json, os, subprocess, sys, time, uuid
from pathlib import Path
from typing import Any
from live_history import HistoryLog

class ExecutorError(RuntimeError): pass

class CognitiveExecutor:
    """Interface do Harness. Implementações devem declarar se são cognitivas de fato."""
    executor_type='abstract'
    cognitive=False
    def doctor(self) -> dict[str,Any]: raise NotImplementedError
    def provision_agent(self,agent_id:str,metadata:dict[str,Any]|None=None)->dict[str,Any]: raise NotImplementedError
    def start_task(self,agent_id:str,task_id:str,payload:dict[str,Any])->dict[str,Any]: raise NotImplementedError
    def interrupt(self,execution_id:str)->dict[str,Any]: raise NotImplementedError
    def resume(self,execution_id:str)->dict[str,Any]: raise NotImplementedError
    def collect_events(self,execution_id:str)->dict[str,Any]: raise NotImplementedError
    def dispose(self,execution_id:str)->dict[str,Any]: raise NotImplementedError

class LocalProcessExecutor(CognitiveExecutor):
    """Executor local durável de referência. É real e paralelo, mas NÃO é um LLM cognitivo."""
    executor_type='local-process'
    cognitive=False
    def __init__(self,root:str|Path):
        self.root=Path(root); self.agents=self.root/'agents'; self.executions=self.root/'executions'
        self.agents.mkdir(parents=True,exist_ok=True); self.executions.mkdir(parents=True,exist_ok=True)
        self.processes:dict[str,subprocess.Popen]={}
        self.worker=Path(__file__).with_name('executor_worker.py')
    def doctor(self):
        return {'available':self.worker.exists(),'executor_type':self.executor_type,'cognitive':False,'python':sys.executable,'worker':str(self.worker),'boundary':'chatgpt-bubble-local-sandbox'}
    def provision_agent(self,agent_id,metadata=None):
        p=self.agents/f'{agent_id}.json'; data={'agent_id':agent_id,'executor_type':self.executor_type,'cognitive':False,'metadata':metadata or {},'provisioned_at':time.time()}; p.write_text(json.dumps(data,indent=2,sort_keys=True)+'\n'); return data
    def _dir(self,eid): return self.executions/eid
    def _checkpoint(self,eid):
        p=self._dir(eid)/'checkpoint.json'
        return json.loads(p.read_text()) if p.exists() else None
    def _launch(self,eid):
        d=self._dir(eid)
        if not (d/'request.json').exists(): raise ExecutorError('unknown execution')
        current=self.processes.get(eid)
        if current and current.poll() is None: raise ExecutorError('execution already running')
        env=dict(os.environ); env['PYTHONPATH']=str(Path(__file__).parent)+os.pathsep+env.get('PYTHONPATH','')
        p=subprocess.Popen([sys.executable,str(self.worker),str(d)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env=env)
        self.processes[eid]=p
        return {'execution_id':eid,'pid':p.pid,'executor_type':self.executor_type,'cognitive':False}
    def start_task(self,agent_id,task_id,payload):
        if not (self.agents/f'{agent_id}.json').exists(): self.provision_agent(agent_id)
        eid=payload.get('execution_id') or str(uuid.uuid4()); d=self._dir(eid); d.mkdir(parents=True,exist_ok=False)
        req={'execution_id':eid,'agent_id':agent_id,'task_id':task_id,'steps':int(payload.get('steps',5)),'delay_s':float(payload.get('delay_s',0.02)),'result':payload.get('result','completed')}
        (d/'request.json').write_text(json.dumps(req,indent=2,sort_keys=True)+'\n')
        (d/'checkpoint.json').write_text(json.dumps({'status':'pending','next_step':1,'attempt':0},indent=2,sort_keys=True)+'\n')
        return self._launch(eid)
    def interrupt(self,eid):
        p=self.processes.get(eid)
        if p and p.poll() is None:
            p.terminate(); p.wait(timeout=2)
        return {'execution_id':eid,'interrupted':True,'checkpoint':self._checkpoint(eid)}
    def simulate_crash(self,eid):
        p=self.processes.get(eid)
        if p and p.poll() is None:
            p.kill(); p.wait(timeout=2)
        return {'execution_id':eid,'crashed':True,'checkpoint':self._checkpoint(eid)}
    def resume(self,eid):
        cp=self._checkpoint(eid)
        if not cp: raise ExecutorError('missing checkpoint')
        if cp.get('status')=='completed': return {'execution_id':eid,'already_completed':True,'checkpoint':cp}
        return self._launch(eid)
    def collect_events(self,eid):
        d=self._dir(eid)
        if not d.exists(): raise ExecutorError('unknown execution')
        projection=HistoryLog(d/'events.jsonl').projection(eid)
        projection['checkpoint']=self._checkpoint(eid)
        p=self.processes.get(eid); projection['process_running']=bool(p and p.poll() is None)
        return projection
    def wait(self,eid,timeout=5):
        p=self.processes.get(eid)
        if p: p.wait(timeout=timeout)
        return self.collect_events(eid)
    def dispose(self,eid):
        p=self.processes.get(eid)
        if p and p.poll() is None:
            p.terminate(); p.wait(timeout=2)
        self.processes.pop(eid,None)
        return {'execution_id':eid,'disposed':True,'checkpoint':self._checkpoint(eid)}
