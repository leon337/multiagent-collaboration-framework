import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const app=dirname(dirname(fileURLToPath(import.meta.url)));
const PORT=43651,MOCK=43652;
const origin='http://127.0.0.1:'+PORT;
const message=async(path,method='GET',data,headers={})=>{
 const result=await fetch(origin+path,{method,headers:{
   ...(data===undefined?{}:{origin,'content-type':'application/json'}),...headers
 },body:data===undefined?undefined:JSON.stringify(data)});
 return {status:result.status,body:await result.json()};
};
test('Guided Builder: independent workspaces, steps, secure IDs, preview and DSH coach',async t=>{
 const root=await mkdtemp(join(tmpdir(),'mcf-agent-builder-'));
 const draft=join(root,'state.json'),profile=join(root,'cordis.patch.yml'),
   workspaces=join(root,'workspaces'),tokenPath=join(root,'token');
 await writeFile(profile,'# Original DSH profile, must stay unchanged\nid: preset-hello-world-agent\n');
 await writeFile(join(root,'agent.js'),'export default {};\n');
 const token='e'.repeat(64);
 await writeFile(tokenPath,token);
 let coachCalls=0;
 const mock=createServer(async(req,res)=>{
  if(req.headers['x-agent-studio-bridge']!==token){res.writeHead(403);res.end('{}');return}
  if(req.url==='/chat'){
   let body='';for await(const c of req)body+=c;
   const data=JSON.parse(body);assert.match(data.prompt,/MCF Agent Architect/);
   coachCalls++;
   res.setHeader('content-type','application/json');
   res.end(JSON.stringify({answer:JSON.stringify({changes:{},explanation:'Comece definindo o cliente, problema e resultado esperado.'})}));
   return;
  }
  if(req.url==='/status'){
   res.setHeader('content-type','application/json');
   res.end(JSON.stringify({sessionId:'session-e84abd98-935c-4f14-b842-727d54c51e9d',ready:true,agentPreset:'mcf-studio-brain'}));return;
  }
  res.writeHead(404);res.end('{}');
 });
 await new Promise((ok,no)=>mock.once('error',no).listen(MOCK,'127.0.0.1',ok));
 const server=spawn(process.execPath,[join(app,'server.mjs')],{cwd:app,env:{
   ...process.env,AGENT_STUDIO_PORT:String(PORT),AGENT_STUDIO_DATA:draft,AGENT_STUDIO_WORKSPACES:workspaces,
   AGENT_STUDIO_PROFILE:profile,AGENT_STUDIO_AGENT:join(root,'agent.js'),
   AGENT_STUDIO_DSH_BRIDGE:'http://127.0.0.1:'+MOCK,
   AGENT_STUDIO_DSH_TOKEN_FILE:tokenPath,AGENT_STUDIO_API_KEY:'',NINEROUTER_API_KEY:''
 },stdio:['ignore','pipe','pipe']});
 t.after(async()=>{server.kill('SIGTERM');await new Promise(r=>mock.close(r));await rm(root,{recursive:true,force:true})});
 let ready=false;
 for(let i=0;i<55;i++){
  try{if((await fetch(origin+'/health')).ok){ready=true;break}}catch{}
  await new Promise(r=>setTimeout(r,70));
 }
 assert.equal(ready,true,'QA server boots');
 const main=await message('/api/state');
 assert.equal(main.body.revision,1);
 const ui=await fetch(origin+'/builder');
 assert.equal(ui.status,200);
 assert.match(await ui.text(),/Agent Architect/);
 assert.equal((await fetch(origin+'/builder.js')).status,200);
 assert.equal((await fetch(origin+'/builder.css')).status,200);
 assert.deepEqual((await message('/api/builder/workspaces')).body.items,[]);
 let r=await message('/api/builder/workspaces','POST',{kind:'new',name:'Serralheria Assistente'});
 assert.equal(r.status,201);const a=r.body.id;
 assert.match(a,/^agent-[a-f0-9-]{36}$/);
 assert.equal(r.body.checklist.liveInstalled,false);
 const aFolder=join(workspaces,a);
 assert.ok((await readdir(aFolder)).includes('agent.json'));
 assert.ok((await readdir(aFolder)).includes('README.md'));
 assert.deepEqual(await readdir(join(aFolder,'versions')),['0001.json']);
 r=await message('/api/builder/workspaces','POST',{kind:'modify',name:'Evolução do Hello World'});
 assert.equal(r.status,201);
 const b=r.body.id;
 assert.notEqual(a,b);
 assert.equal(r.body.source,'hello-world-agent');
 assert.equal((await message('/api/builder/workspaces')).body.items.length,2);
 r=await message('/api/builder/workspaces/'+a,'PATCH',{
   step:'comportamento',completedStep:'objetivo',markComplete:true,
   config:{objective:'Calcular orçamentos de estruturas metálicas a partir de medidas fornecidas.'}
 });
 assert.equal(r.status,200);
 assert.equal(r.body.revision,2);
 assert.equal(r.body.step,'comportamento');
 assert.equal(r.body.checklist.objective,true);
 assert.equal(r.body.completed.includes('objetivo'),true);
 r=await message('/api/builder/workspaces/'+a,'PATCH',{
   step:'testes',completedStep:'comportamento',markComplete:true,
   config:{mode:'fixed',response:'Orçamento de teste',tools:['calculator'],instructions:'Explique cálculos.'}
 });
 assert.equal(r.status,200);
 r=await message('/api/builder/workspaces/'+a+'/test','POST',{message:'oi'});
 assert.equal(r.status,200);assert.equal(r.body.result.answer,'Orçamento de teste');
 assert.equal(r.body.checklist.tested,true);
 assert.equal((await message('/api/builder/workspaces/'+b)).body.config.response,'Hello World!');
 r=await message('/api/builder/workspaces/'+a+'/mentor','POST',{question:'Como faço bons testes?'});
 assert.equal(r.status,200);assert.match(r.body.advice,/cliente, problema/);
 assert.equal(coachCalls,1);
 const savedCoaching=(await message('/api/builder/workspaces/'+a)).body.guidance;
 assert.equal(savedCoaching.length,1);
 assert.match(savedCoaching[0].advice,/cliente, problema/);

 r=await message('/api/builder/workspaces/'+a+'/test','POST',{message:'calcule 8*7'});
 assert.equal(r.body.result.answer,'56');assert.equal(r.body.result.channel,'local');
 assert.equal((await message('/api/builder/workspaces/'+a)).body.tests.length,2);
 // Handoff into existing Studio must be review-only, not an automatic apply.
 const bReady=await message('/api/builder/workspaces/'+b,'PATCH',{
   step:'testes',config:{objective:'Validar respostas numéricas',instructions:'Explique os cálculos',
     mode:'fixed',response:'Handoff do Agent Architect',tools:['calculator']}
 });
 assert.equal(bReady.status,200);
 const bTest=await message('/api/builder/workspaces/'+b+'/test','POST',{message:'oi'});
 assert.equal(bTest.body.result.answer,'Handoff do Agent Architect');
 const newHandoff=await message('/api/builder/workspaces/'+a+'/handoff','POST',{});
 assert.equal(newHandoff.status,422,'new agent cannot use Hello World publisher');
 const bridge=await message('/api/builder/workspaces/'+b+'/handoff','POST',{});
 assert.equal(bridge.status,200);
 assert.equal(bridge.body.applied,false);
 assert.equal(bridge.body.published,false);
 const review=await message('/api/builder/handoff/'+bridge.body.proposalId);
 assert.equal(review.status,200);
 assert.equal(review.body.source,'guided-builder');
 assert.equal(review.body.next.response,'Handoff do Agent Architect');
 assert.equal((await message('/api/state')).body.revision,1,'review does not auto apply');

 const versions=await readdir(join(aFolder,'versions'));
 assert.ok(versions.includes('0002.json')&&versions.includes('0003.json'));
 const checkServer=await message('/api/state');
 assert.equal(checkServer.body.revision,1,'main Studio untouched');
 assert.equal((await readFile(profile,'utf8')),'# Original DSH profile, must stay unchanged\nid: preset-hello-world-agent\n');
 for(const invalid of ['../../etc/passwd','agent-evil','agent-000']){
  const result=await message('/api/builder/workspaces/'+invalid);
  assert.equal(result.status,404,'No path traversal route: '+invalid);
 }
 r=await message('/api/builder/workspaces','POST',{kind:'new',name:'../unsafe'});
 // Names are labels, not paths; safe UUID folder regardless of display string.
 assert.equal(r.status,201);assert.match(r.body.id,/^agent-[a-f0-9-]{36}$/);
 r=await message('/api/builder/workspaces/'+a,'PATCH',{step:'ferramentas',config:{tools:['shell']}});
 assert.equal(r.status,422);
 r=await message('/api/builder/workspaces/'+a+'/mentor','POST',{question:'x'.repeat(900)});
 assert.equal(r.status,422);
 assert.equal((await message('/api/builder/workspaces/'+a,'PATCH',{step:'testes',config:{response:'injetado'}},{origin:'http://evil.example'})).status,403);
});
