#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json, subprocess
from pathlib import Path

experiment=Path(__file__).resolve().parents[1]
repo=experiment.parents[1]
registry=json.loads((experiment/'registry/registry.json').read_text(encoding='utf-8'))
checklist=(repo/'docs/proposals/MCF-CONTENT-STUDIO-N4-CHECKLIST.md').read_text(encoding='utf-8')
audit_pack=repo/'artifacts/phases/PHASE-CONTENT-STUDIO-N4-FOUNDATION-001/PHASE-CONTENT-STUDIO-N4-FOUNDATION-001-AUDIT-PACK.md'

checks={
    'COMPONENT_COUNT': 'PASS' if len(registry['components'])>=11 else 'FAIL',
    'MCF_NATIVE_COUNT': 'PASS' if sum(1 for x in registry['components'] if x['origin']['kind']=='mcf')>=10 else 'FAIL',
    'EXTERNAL_APPROVED': 'PASS' if any(x['origin']['kind']=='external' and x['status']=='APPROVED' for x in registry['components']) else 'FAIL',
    'ASPECT_SUPPORT': 'PASS' if all(set(['9:16','16:9']).issubset(set(x['supportedAspects'])) for x in registry['components']) else 'FAIL',
    'LICENSE_EVIDENCE': 'PASS' if all(x['license']['id'] and x['license']['evidence'] for x in registry['components']) else 'FAIL',
    'AUDIT_PACK_PRESENT': 'PASS' if audit_pack.exists() else 'FAIL',
    'NO_PUBLISHED_CLAIM': 'PASS' if 'PUBLICADO' not in checklist else 'FAIL',
}
if any(value!='PASS' for value in checks.values()):
    raise SystemExit('Mission-specific adversarial prechecks failed: '+json.dumps(checks,ensure_ascii=False))

evidence={
    'git_head': subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),
    'registry_version': registry['registryVersion'],
    'component_ids': [x['id'] for x in registry['components']],
    'checks': checks,
    'audit_pack': str(audit_pack.relative_to(repo)),
}
canonical=json.dumps(evidence,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
digest=hashlib.sha256(canonical).hexdigest()

auditor_path=repo/'ops/multiagent-runtime-v2/adversarial_auditor.py'
spec=importlib.util.spec_from_file_location('mcf_adversarial_auditor',auditor_path)
module=importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)

packet={
    'claim': {'status':'PASS','subject':'MCF-CONTENT-STUDIO-N4-001 technical evidence packet'},
    'checks': checks,
    'receipt': {
        'mission_id':'MCF-CONTENT-STUDIO-N4-001',
        'task_id':'G8-TECHNICAL-AUDIT',
        'execution_id': evidence['git_head'],
        'actor_id':'TechnicalAdversarialAuditor',
        'result_sha256':digest,
    },
    'evidence': evidence,
    'provenance': {
        'mission_id':'MCF-CONTENT-STUDIO-N4-001',
        'task_id':'G8-TECHNICAL-AUDIT',
        'execution_id':evidence['git_head'],
        'actor_id':'TechnicalAdversarialAuditor',
        'evidence_refs':[evidence['audit_pack'],'registry/registry.json','docs/proposals/MCF-CONTENT-STUDIO-N4-CHECKLIST.md'],
    },
}
result=module.TechnicalAdversarialAuditor().audit(packet,now=0)
result['methodological_note']='Deterministic technical audit; cognitive=false; this is not an Emily independent cognitive review.'
out=experiment/'out/adversarial-audit.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
if result['verdict']!='PASS':
    raise SystemExit(1)
