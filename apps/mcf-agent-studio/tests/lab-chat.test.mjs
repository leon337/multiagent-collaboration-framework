import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

test('Agent Lab: persistent agent session, no API key, reset gated and draft isolated',async t=>{
 const root=await mkdtemp(join(tmpdir(),'agent-lab-test-'));
 const app=dirname(dirname(fileURLToPath(import.meta.url)));
 const token='9'.repeat(64),bridgePort=43560,studioPort=43561;
 const profile=join(root,'profile.yml'),data=join(root,'draft.json'),tokenPath=join(root,'token');
 await writeFile(profile,'# MCF/Hello World: test\n- insert:\n    - id: preset-hello-world-agent\n');
 await writeFile(join(root,'agent.js'),'export default {};\n');
 await writeFile(tokenPath,token,{mode:0o600});
 let id='session-11111111-1111-4111-8111-111111111111',messages=[],calls=0;
 const mock=createServer(async(req,res)=>{
  res.setHeader('content-type','application/json');
  if(req.headers['x-agent-studio-bridge']!==token){res.writeHead(403);res.end(JSON.stringify({error:'Invalid token'}));return;}
  let body={};if(req.method==='POST'){let raw='';for await(const c of req)raw+=c;body=JSON.parse(raw)}
  if(req.url==='/lab/status')res.end(JSON.stringify({ready:true,sessionId:id,preset:'hello-world-agent',messages,running:false}));
  else if(req.url==='/lab/reset'){id='session-22222222-2222-4222-8222-222222222222';messages=[];res.end(JSON.stringify({reset:true,sessionId:null,messages}));}
  else if(req.url==='/lab/message'){
   calls++;const ans='Real DSH: '+body.text;messages.push({role:'user',text:body.text,at:'2026-10-23T00:00:00Z'}, {role:'agent',text:ans,at:'2026-10-23T00:00:00Z'});
   res.end(JSON.stringify({sessionId:id,preset:'hello-world-agent',answer:ans,elapsedMs:25,count:messages.length}));
  }else{res.writeHead(404);res.end(JSON.stringify({error:'Not Found'}))}
 });
 await new Promise((ok,bad)=>mock.once('error',bad).listen(bridgePort,'127.0.0.1',ok));
 const server=spawn(process.execPath,[join(app,'server.mjs')],{
  cwd:app,env:{...process.env,AGENT_STUDIO_PORT:String(studioPort),
   AGENT_STUDIO_DSH_BRIDGE:'http://127.0.0.1:'+bridgePort,AGENT_STUDIO_DSH_TOKEN_FILE:tokenPath,
   AGENT_STUDIO_DATA:data,AGENT_STUDIO_PROFILE:profile,AGENT_STUDIO_AGENT:join(root,'agent.js'),
   NINEROUTER_API_KEY:'',AGENT_STUDIO_API_KEY:''},stdio:['ignore','pipe','pipe']
 });
 t.after(async()=>{server.kill('SIGTERM');await new Promise(ok=>mock.close(ok));await rm(root,{force:true,recursive:true});});
 const base='http://127.0.0.1:'+studioPort;
 let ready=false;for(let i=0;i<70;i++){try{ready=(await fetch(base+'/health')).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,60))}
 assert.equal(ready,true);
 const api=async(path,method='GET',body)=>{
  const resp=await fetch(base+path,{method,headers:body===undefined?{}:{origin:base,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:resp.status,body:await resp.json()};
 };
 const html=await fetch(base+'/lab');assert.equal(html.status,200);assert.match(await html.text(),/Laboratório do Agente/);
 const start=(await api('/api/state')).body;
 assert.equal(start.revision,1);
 let lab=await api('/api/lab/status');assert.equal(lab.status,200);assert.equal(lab.body.messages.length,0);
 const first=await api('/api/lab/message','POST',{text:'oi'});
 const second=await api('/api/lab/message','POST',{text:'calcule 2*3'});
 assert.equal(first.status,200);assert.equal(second.status,200);
 assert.equal(first.body.sessionId,second.body.sessionId,'same DSH session for two messages');
 assert.equal(calls,2);
 lab=await api('/api/lab/status');assert.equal(lab.body.messages.length,4);
 assert.equal((await api('/api/state')).body.revision,1,'lab cannot modify Studio draft');
 const invalid=await api('/api/lab/reset','POST',{confirmation:'wrong'});
 assert.equal(invalid.status,403,'a reset is gated by confirmation');
 assert.equal((await api('/api/lab/status')).body.messages.length,4);
 assert.equal((await api('/api/lab/message','POST',{text:' '})).status,422,'empty messages rejected');
 const reset=await api('/api/lab/reset','POST',{confirmation:'NOVA CONVERSA'});
 assert.equal(reset.status,200);
 const next=await api('/api/lab/message','POST',{text:'nova conversa'});
 assert.notEqual(next.body.sessionId,first.body.sessionId,'new session ID after reset');
 assert.equal((await api('/api/state')).body.provider.configured,false,'no second API key');
});
