#!/usr/bin/env python3
from __future__ import annotations
import hashlib, importlib.util, json, subprocess, sys
from pathlib import Path

experiment=Path(__file__).resolve().parents[1]
repo=experiment.parents[1]

registry=json.loads((experiment/'registry/registry.json').read_text(encoding='utf-8'))
assets=json.loads((experiment/'assets/registry.json').read_text(encoding='utf-8'))
motion=json.loads((experiment/'motion/presets.json').read_text(encoding='utf-8'))

component_ids={item['id'] for item in registry['components']}
categories={item['category'] for item in registry['components']}
required_categories={'typography','layout','learning','diagram','ui','motion','media','progress','code','fx'}
native_count=sum(1 for item in registry['components'] if item['origin']['kind']=='mcf')
implemented_motion=sum(1 for item in motion['presets'] if item['status']=='IMPLEMENTED')
approved_assets=sum(1 for item in assets['assets'] if item['status']=='APPROVED')

template=next((item for item in registry['templates'] if item['id']=='technical-lesson-n4'),None)

checks={
    'COMPONENT_COUNT_34_PLUS':'PASS' if len(registry['components'])>=34 else 'FAIL',
    'MCF_NATIVE_COUNT_33_PLUS':'PASS' if native_count>=33 else 'FAIL',
    'CANONICAL_CATEGORY_COVERAGE':'PASS' if required_categories.issubset(categories) else 'FAIL',
    'ASSET_REGISTRY':'PASS' if approved_assets>=2 else 'FAIL',
    'MOTION_PRESET_LIBRARY':'PASS' if len(motion['presets'])>=19 and implemented_motion>=12 else 'FAIL',
    'TECHNICAL_LESSON_TEMPLATE':'PASS' if template and template['status']=='APPROVED' else 'FAIL',
    'AUTHORING_CORE':'PASS' if (experiment/'src/authoring/LessonAuthoringPanel.tsx').exists() and (experiment/'src/authoring/lessonOps.ts').exists() else 'FAIL',
    'PROJECT_IMPORT_EXTRACTION':'PASS' if (experiment/'src/importer/projectExtract.ts').exists() else 'FAIL',
    'PREFLIGHT_BOUNDARY':'PASS' if (experiment/'src/preflight/preflight.ts').exists() and (experiment/'src/preflight/adapter.ts').exists() else 'FAIL',
    'FIGMA_BRIDGE_CONTRACT':'PASS' if (experiment/'src/figma/bridge.ts').exists() and (repo/'docs/proposals/MCF-CONTENT-STUDIO-N4-FIGMA-BRIDGE.md').exists() else 'FAIL',
    'DATA_LESSON_DEMO':'PASS' if (experiment/'src/templates/runtime-agentico-data-demo.lesson.json').exists() else 'FAIL',
    'SCALE_ARCHITECTURE_PAYLOAD':'PASS' if (experiment/'src/templates/architecture-control-plane.lesson.json').exists() else 'FAIL',
    'SCALE_UI_CODE_PAYLOAD':'PASS' if (experiment/'src/templates/ui-code-agent-flow.lesson.json').exists() else 'FAIL',
    'SCALE_PROOF_WORKFLOW':'PASS' if (repo/'.github/workflows/content-studio-n4-scale-proof.yml').exists() else 'FAIL',
}

if any(value!='PASS' for value in checks.values()):
    raise SystemExit('Evolution prechecks failed: '+json.dumps(checks,ensure_ascii=False))

figma_doc=(repo/'docs/proposals/MCF-CONTENT-STUDIO-N4-FIGMA-BRIDGE.md').read_text(encoding='utf-8')
reservations=[]
if 'BLOCKED_BY_AMBIGUOUS_EXTERNAL_TARGET' in figma_doc:
    reservations.append('Real Figma-derived proof remains blocked by ambiguous external target; contract/schema/tests are implemented.')
reservations.append('Exact Instavar VideoSpec compatibility is not claimed; adapter-neutral preflight boundary is used.')

evidence={
    'git_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),
    'registry_version':registry['registryVersion'],
    'component_count':len(registry['components']),
    'native_component_count':native_count,
    'categories':sorted(categories),
    'approved_asset_count':approved_assets,
    'motion_preset_count':len(motion['presets']),
    'implemented_motion_count':implemented_motion,
    'checks':checks,
    'reservations':reservations,
}
canonical=json.dumps(evidence,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
digest=hashlib.sha256(canonical).hexdigest()

auditor_path=repo/'ops/multiagent-runtime-v2/adversarial_auditor.py'
spec=importlib.util.spec_from_file_location('mcf_evolution_adversarial_auditor',auditor_path)
module=importlib.util.module_from_spec(spec)
assert spec and spec.loader
sys.modules[spec.name]=module
spec.loader.exec_module(module)

packet={
    'claim':{'status':'PASS','subject':'MCF-CONTENT-STUDIO-N4-EVOLUTION-001 technical evidence packet'},
    'checks':checks,
    'receipt':{
        'mission_id':'MCF-CONTENT-STUDIO-N4-EVOLUTION-001',
        'task_id':'FINAL-TECHNICAL-AUDIT',
        'execution_id':evidence['git_head'],
        'actor_id':'EvolutionTechnicalAdversarialAuditor',
        'result_sha256':digest,
    },
    'evidence':evidence,
    'provenance':{
        'mission_id':'MCF-CONTENT-STUDIO-N4-EVOLUTION-001',
        'task_id':'FINAL-TECHNICAL-AUDIT',
        'execution_id':evidence['git_head'],
        'actor_id':'EvolutionTechnicalAdversarialAuditor',
        'evidence_refs':[
            'registry/registry.json',
            'assets/registry.json',
            'motion/presets.json',
            'docs/proposals/MCF-CONTENT-STUDIO-N4-EVOLUTION-CHECKLIST.md',
        ],
    },
}

result=module.TechnicalAdversarialAuditor().audit(packet,now=0)
result['mission_id']='MCF-CONTENT-STUDIO-N4-EVOLUTION-001'
result['reservations']=reservations
result['methodological_note']='Deterministic technical audit; cognitive=false. External Figma ambiguity is preserved as a reservation, not rewritten as PASS.'
out=experiment/'out/evolution-adversarial-audit.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
if result['verdict']!='PASS':
    raise SystemExit(1)
