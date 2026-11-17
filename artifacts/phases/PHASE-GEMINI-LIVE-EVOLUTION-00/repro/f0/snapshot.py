#!/usr/bin/env python3
"""F0 snapshot: avoid secrets, logs, captured media and personal content."""
import os,json,hashlib,subprocess,pathlib,datetime,re
root=pathlib.Path(__file__).resolve().parent.parent
out=pathlib.Path(__file__).parent/'SNAPSHOT.json'
def run(cmd):
 try:return subprocess.check_output(cmd,stderr=subprocess.DEVNULL,text=True,timeout=5).strip()
 except:return 'not_available'
files=[]
for p in sorted(root.rglob('*')):
 if not p.is_file():continue
 r=p.relative_to(root).as_posix()
 if any(z in r for z in ('.private/','node_modules/','/sessions/','/captures/')) or r.endswith('.log') or r.startswith('f0/'):continue
 if p.stat().st_size>2_000_000: continue
 b=p.read_bytes()
 files.append({'path':r,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'mode':oct(p.stat().st_mode&0o777)})
key=root/'.private/api-key.json'
source_files=[p for p in root.rglob('*') if p.is_file() and (p.suffix in ['.js','.cjs','.html','.css','.md','.sh']) and not '.private' in str(p) and not 'f0/' in str(p)]
candidate_count=0
for p in source_files:
 x=p.read_text(errors='replace')
 candidate_count+=len(re.findall(r'(?:AIza[A-Za-z0-9_-]{30,}|AQ\.[A-Za-z0-9_-]{30,})',x))
snapshot={
 'captured_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'machine':{'hostname':run(['hostname']),'os':run(['uname','-sr']),'node':run(['node','-v']),'python':run(['python3','-V']),'chrome':run(['google-chrome','--version'])},
 'application':{'path':str(root),'git_repository':(root/'.git').exists(),'port':18371,'binding':'127.0.0.1','server_process':'node/server.js','files':files,'source_key_pattern_matches':candidate_count},
 'credential':{'present':key.exists(),'key_file_mode':oct(key.stat().st_mode&0o777) if key.exists() else None,'key_directory_mode':oct(key.parent.stat().st_mode&0o777) if key.parent.exists() else None,'key_material_included':False},
 'caveats':['Hashes cover source files only; secrets and local media excluded','Physical device, paid quota and MCF runtime integrations not proven'],
}
out.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
os.chmod(out,0o600)
print('SNAPSHOT_CREATED')
print('SOURCE_FILES',len(files),'SOURCE_KEY_PATTERN_MATCHES',candidate_count)
print('SHA256_MANIFEST',hashlib.sha256(out.read_bytes()).hexdigest())
