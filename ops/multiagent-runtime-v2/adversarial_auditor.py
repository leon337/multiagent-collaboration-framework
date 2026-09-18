from __future__ import annotations
import hashlib, json, time
from dataclasses import dataclass, asdict
from typing import Any

@dataclass(frozen=True)
class Finding:
    code: str
    ok: bool
    detail: str
    severity: str = 'high'

class TechnicalAdversarialAuditor:
    """Deterministic fail-closed auditor. It makes no cognitive-agent claim."""
    schema='mcf_adversarial_audit/v1'
    cognitive=False

    @staticmethod
    def _sha(value: Any) -> str:
        if isinstance(value, bytes): data=value
        elif isinstance(value, str): data=value.encode()
        else: data=json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
        return hashlib.sha256(data).hexdigest()

    def audit(self, packet: dict[str,Any], *, now: float|None=None) -> dict[str,Any]:
        now=float(time.time() if now is None else now)
        findings=[]
        add=lambda code,ok,detail,severity='high': findings.append(Finding(code,bool(ok),detail,severity))
        claim=packet.get('claim',{}); checks=packet.get('checks',{})
        if claim.get('status')=='PASS':
            add('FALSE_GREEN',bool(checks) and all(v=='PASS' for v in checks.values()),'PASS claim requires non-empty all-PASS observed checks')
        else: add('FALSE_GREEN',True,'No PASS claim to validate','medium')
        receipt=packet.get('receipt'); required_receipt={'mission_id','task_id','execution_id','actor_id','result_sha256'}
        receipt_ok=isinstance(receipt,dict) and required_receipt.issubset(receipt)
        add('RECEIPT_REQUIRED',receipt_ok,'Execution receipt must carry mission/task/execution/actor/result digest')
        evidence=packet.get('evidence')
        if receipt_ok and evidence is not None:
            add('EVIDENCE_INTEGRITY',receipt['result_sha256']==self._sha(evidence),'Receipt result_sha256 must match supplied evidence')
        else: add('EVIDENCE_INTEGRITY',False,'Evidence or valid receipt missing')
        msg=packet.get('message')
        if msg is not None:
            expected=packet.get('expected_message_target')
            add('MAILBOX_TARGET',expected is not None and msg.get('target_id')==expected,'Message target must equal intended recipient')
        else: add('MAILBOX_TARGET',True,'No mailbox claim supplied','medium')
        parent=packet.get('parent_capability'); child=packet.get('child_capability')
        if parent is not None or child is not None:
            cap_ok=isinstance(parent,dict) and isinstance(child,dict)
            if cap_ok:
                cap_ok=(parent.get('agent_id')==child.get('agent_id') and parent.get('task_id')==child.get('task_id')
                        and set(child.get('allowed_tools',[])).issubset(set(parent.get('allowed_tools',[])))
                        and float(child.get('expires_at',0))<=float(parent.get('expires_at',0)))
            add('CAPABILITY_ESCALATION',cap_ok,'Child capability must preserve scope, narrow tools and not extend expiry')
        else: add('CAPABILITY_ESCALATION',True,'No delegation supplied','medium')
        task=packet.get('task')
        if task and task.get('status')=='leased':
            until=task.get('lease_until')
            add('STALE_LEASE',until is not None and float(until)>now,'Leased task must have an unexpired lease')
        else: add('STALE_LEASE',True,'No active lease supplied','medium')
        execution=packet.get('execution')
        if execution and execution.get('status') in {'running','interrupted','recovery_required'}:
            recovery=packet.get('recovery') or {}
            add('EXECUTOR_RECOVERY',bool(recovery.get('checkpoint_ref')),'Non-terminal execution must expose durable recovery checkpoint')
        else: add('EXECUTOR_RECOVERY',True,'Execution is terminal or absent','medium')
        provenance=packet.get('provenance') or {}; required_prov={'mission_id','task_id','execution_id','actor_id','evidence_refs'}
        add('PROVENANCE_REQUIRED',required_prov.issubset(provenance) and bool(provenance.get('evidence_refs')),'Result requires mission/task/execution/actor plus at least one evidence reference')
        dag=packet.get('dag')
        if dag is not None:
            nodes=set(dag); visiting=set(); visited=set()
            def visit(node):
                if node in visiting: return False
                if node in visited: return True
                visiting.add(node)
                for dep in dag.get(node,[]):
                    if dep not in nodes or not visit(dep): return False
                visiting.remove(node); visited.add(node); return True
            add('DAG_VALID',all(visit(n) for n in list(nodes)),'DAG must reference existing nodes and remain acyclic')
        else: add('DAG_VALID',True,'No DAG supplied','medium')
        failed=[f for f in findings if not f.ok]
        result={'schema':self.schema,'cognitive':False,'verdict':'PASS' if not failed else 'REJECT',
                'finding_count':len(findings),'failed_count':len(failed),'findings':[asdict(x) for x in findings]}
        result['audit_sha256']=self._sha(result)
        return result
