#!/usr/bin/env node
/**
 * MCF native DSH workspace isolation acceptance test.
 * Read-only default. --probe deliberately creates one blank native Session
 * per preset; it DOES NOT call an LLM or touch user chat history.
 */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const endpoint=process.env.MCF_STUDIO_URL||'http://127.0.0.1:4317';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(endpoint))throw Error('Somente loopback local');
const exact=['hello-world-agent','mcf-studio-brain','mcf-studio-preview'];
const request=async(path,method='GET',body)=>{
 const res=await fetch(endpoint+path,{
  method,headers:{...(body===undefined?{}:{origin:endpoint,'content-type':'application/json'})},
  body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)
 });
 if(!res.ok)throw Error(method+' '+path+' HTTP '+res.status+' '+(await res.text()).slice(0,180));
 return res.json();
};
const inspected=await request('/api/dsh/workspaces');
assert.equal(inspected.isolationValid,true);
assert.deepEqual(Object.keys(inspected.presets).sort(),[...exact].sort());
const ids=[],paths=[];
for(const preset of exact){
 const w=inspected.presets[preset];
 assert.ok(w.ready,'workspace must be registered: '+preset);
 assert.ok(w.id,'workspace ID: '+preset);
 assert.ok(w.path.endsWith('/'+preset),'isolated physical directory: '+preset);
 assert.ok(w.sessions.every(s=>s.accounted),'every DSH session attached: '+preset);
 ids.push(w.id);paths.push(w.path);
}
assert.equal(new Set(ids).size,3,'distinct workspace IDs');
assert.equal(new Set(paths).size,3,'distinct canonical directories');
assert.equal(inspected.current.plannerInCorrectWorkspace,true);
assert.equal(inspected.current.labInCorrectWorkspace,true);
assert.equal(inspected.legacy?.unaccounted,0,'legacy sessions preserved');
const probes=[];
if(process.argv.includes('--probe')){
 for(const preset of exact){
  const result=await request('/api/dsh/workspaces/probe','POST',{preset});
  assert.equal(result.preset,preset);
  assert.equal(result.workspaceId,inspected.presets[preset].id);
  assert.equal(result.accounted,true);
  probes.push(result);
 }
 const after=await request('/api/dsh/workspaces');
 assert.equal(after.isolationValid,true);
 for(const probe of probes){
  assert.ok(after.presets[probe.preset].sessionIds.includes(probe.sessionId));
  assert.ok(!after.legacy.sessionIds.includes(probe.sessionId),
   'no new session in legacy workspace');
 }
}
const report={
 passed:true,
 date:new Date().toISOString(),
 presets:Object.fromEntries(exact.map(p=>[p,{id:inspected.presets[p].id,
   path:inspected.presets[p].path,count:inspected.presets[p].sessionIds.length}])),
 migrated:{...inspected.current},
 legacyCount:inspected.legacy.count,
 legacyUnaccounted:inspected.legacy.unaccounted,
 probes
};
if(process.env.MCF_WORKSPACE_REPORT)await writeFile(process.env.MCF_WORKSPACE_REPORT,JSON.stringify(report,null,2)+'\n',{mode:0o600});
process.stdout.write(JSON.stringify(report,null,2)+'\n');
