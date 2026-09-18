from __future__ import annotations
import hashlib, json, os, shutil, time, uuid
from pathlib import Path
from typing import Any

class WorkspaceError(RuntimeError): pass
class WorkspaceConflict(WorkspaceError): pass
class WorkspaceAuthorizationError(WorkspaceError): pass


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def atomic_json(path: Path, value: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    os.replace(tmp,path)

class WorkspaceManager:
    def __init__(self, root: str|Path):
        self.root=Path(root); self.tasks=self.root/'tasks'; self.checkpoints=self.root/'checkpoints'; self.targets=self.root/'targets'
        for p in (self.tasks,self.checkpoints,self.targets): p.mkdir(parents=True,exist_ok=True)
    def _meta_path(self,task_id): return self.tasks/task_id/'workspace.json'
    def _work(self,task_id): return self.tasks/task_id/'work'
    def _load(self,task_id):
        p=self._meta_path(task_id)
        if not p.exists(): raise WorkspaceError(f'unknown workspace {task_id}')
        return json.loads(p.read_text())
    def _save(self,task_id,meta): atomic_json(self._meta_path(task_id),meta)
    def create(self,task_id,owner_id,allowed_prefixes=None):
        d=self.tasks/task_id
        if d.exists(): raise WorkspaceConflict(f'workspace {task_id} exists')
        (d/'work').mkdir(parents=True)
        meta={'task_id':task_id,'owner_id':owner_id,'allowed_prefixes':list(allowed_prefixes or []),'writes':{},'created_at':time.time(),'revision':1}
        self._save(task_id,meta); return meta
    def _authorize(self,task_id,actor_id):
        meta=self._load(task_id)
        if meta['owner_id']!=actor_id: raise WorkspaceAuthorizationError('workspace owner mismatch')
        return meta
    def _rel(self,relpath):
        p=Path(relpath)
        if p.is_absolute() or '..' in p.parts: raise WorkspaceAuthorizationError('path escapes workspace')
        if str(p) in {'','.'}: raise WorkspaceAuthorizationError('file path required')
        return p
    def _allowed(self,meta,rel:Path):
        prefixes=meta.get('allowed_prefixes') or []
        if not prefixes:return True
        posix=rel.as_posix()
        return any(posix==x.rstrip('/') or posix.startswith(x.rstrip('/')+'/') for x in prefixes)
    def write_file(self,task_id,actor_id,relpath,content:bytes|str):
        meta=self._authorize(task_id,actor_id); rel=self._rel(relpath)
        if not self._allowed(meta,rel): raise WorkspaceAuthorizationError(f'path {rel} not allowed')
        data=content.encode() if isinstance(content,str) else content
        target=self._work(task_id)/rel; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(data)
        meta['writes'][rel.as_posix()]={'sha256':sha_bytes(data),'size':len(data),'updated_at':time.time()}; meta['revision']=int(meta['revision'])+1; self._save(task_id,meta)
        return meta['writes'][rel.as_posix()]
    def read_file(self,task_id,actor_id,relpath):
        self._authorize(task_id,actor_id); rel=self._rel(relpath); return (self._work(task_id)/rel).read_bytes()
    def conflicts(self,task_ids):
        by_path={}
        for tid in task_ids:
            meta=self._load(tid)
            for path,info in meta.get('writes',{}).items(): by_path.setdefault(path,[]).append({'task_id':tid,**info})
        return {p:rows for p,rows in by_path.items() if len({r['sha256'] for r in rows})>1}
    def reconciliation_plan(self,task_ids):
        conflicts=self.conflicts(task_ids); files={}
        for tid in task_ids:
            for p,info in self._load(tid).get('writes',{}).items(): files.setdefault(p,[]).append({'task_id':tid,**info})
        return {'task_ids':list(task_ids),'conflicts':conflicts,'files':files,'requires_human_gate':bool(conflicts)}
    def reconcile(self,task_ids,target_name,*,approve=False,resolutions=None):
        plan=self.reconciliation_plan(task_ids)
        if not approve: raise WorkspaceAuthorizationError('reconciliation requires explicit approval')
        resolutions=resolutions or {}
        unresolved=[p for p in plan['conflicts'] if p not in resolutions]
        if unresolved: raise WorkspaceConflict('unresolved write conflicts: '+', '.join(sorted(unresolved)))
        target=self.targets/target_name
        if target.exists(): shutil.rmtree(target)
        target.mkdir(parents=True)
        for path,rows in plan['files'].items():
            chosen_task=resolutions.get(path,rows[0]['task_id'])
            source=self._work(chosen_task)/path
            if not source.exists(): raise WorkspaceError(f'missing source {chosen_task}:{path}')
            out=target/path; out.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(source,out)
        receipt={'target':str(target),'task_ids':list(task_ids),'resolutions':resolutions,'file_count':len(plan['files']),'conflict_count':len(plan['conflicts']),'approved':True,'created_at':time.time()}
        atomic_json(target/'RECONCILIATION-RECEIPT.json',receipt); return receipt
    def checkpoint(self,task_id,actor_id):
        meta=self._authorize(task_id,actor_id); cid=str(uuid.uuid4()); dst=self.checkpoints/task_id/cid
        dst.parent.mkdir(parents=True,exist_ok=True); shutil.copytree(self._work(task_id),dst)
        atomic_json(dst/'CHECKPOINT.json',{'task_id':task_id,'checkpoint_id':cid,'workspace_revision':meta['revision'],'created_at':time.time()})
        return cid
    def rollback(self,task_id,actor_id,checkpoint_id):
        meta=self._authorize(task_id,actor_id); src=self.checkpoints/task_id/checkpoint_id
        if not src.exists(): raise WorkspaceError('unknown checkpoint')
        work=self._work(task_id)
        if work.exists(): shutil.rmtree(work)
        work.mkdir(parents=True)
        for p in src.rglob('*'):
            if p.name=='CHECKPOINT.json': continue
            rel=p.relative_to(src); out=work/rel
            if p.is_dir(): out.mkdir(parents=True,exist_ok=True)
            else: out.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(p,out)
        writes={}
        for p in work.rglob('*'):
            if p.is_file():
                b=p.read_bytes(); writes[p.relative_to(work).as_posix()]={'sha256':sha_bytes(b),'size':len(b),'updated_at':time.time()}
        meta['writes']=writes; meta['revision']=int(meta['revision'])+1; meta['rolled_back_to']=checkpoint_id; self._save(task_id,meta); return meta
