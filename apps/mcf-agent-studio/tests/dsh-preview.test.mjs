import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

test('conversational preview uses native DSH bridge without 9Router credentials',async t=>{
 const root=await mkdtemp(join(tmpdir(),'studio-dsh-preview-'));
 const app=dirname(dirname(fileURLToPath(import.meta.url)));
 const token='a'.repeat(64),bridgePort=43440,studioPort=43441;
 const data=join(root,'draft.json'),profile=join(root,'cordis.patch.yml');
 const tokenfile=join(root,'bridge-token');
 await mkdir(root,{recursive:true});
 await writeFile(tokenfile,token,{mode:0o600});
 await writeFile(profile,'# MCF/Hello World: test\n- insert:\n    - id: preset-hello-world-agent\n');
 await writeFile(join(root,'source.js'),'export default {};\n');
 await writeFile(data,JSON.stringify({
  revision:1,current:{name:'Hello World Agent',mode:'instructed',response:'Hello World!',instructions:'Responda gentilmente.',tools:[]},
  history:[]
 }));
 let called=false;
 const mock=createServer(async(req,res)=>{
   if(req.url!=='/preview-chat'||req.headers['x-agent-studio-bridge']!==token){res.writeHead(403);res.end('{}');return;}
   let buffer='';for await (const c of req)buffer+=c;
   const body=JSON.parse(buffer),envelope=JSON.parse(body.prompt);
   assert.equal(envelope.message,'oi');
   assert.equal(envelope.instructions,'Responda gentilmente.');
   called=true;
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify({answer:'Olá! Sou a prévia DSH.',sessionId:'session-01234567-89ab-4cde-8f01-23456789abcd',preset:'mcf-studio-preview'}));
 });
 await new Promise((ok,no)=>mock.once('error',no).listen(bridgePort,'127.0.0.1',ok));
 const server=spawn(process.execPath,[join(app,'server.mjs')],{
   cwd:app,env:{...process.env,AGENT_STUDIO_PORT:String(studioPort),
     AGENT_STUDIO_DSH_BRIDGE:'http://127.0.0.1:'+bridgePort,
     AGENT_STUDIO_DSH_TOKEN_FILE:tokenfile,AGENT_STUDIO_DATA:data,
     AGENT_STUDIO_PROFILE:profile,AGENT_STUDIO_AGENT:join(root,'source.js'),
     NINEROUTER_API_KEY:'',AGENT_STUDIO_API_KEY:''},
   stdio:['ignore','pipe','pipe']
 });
 t.after(async()=>{
   server.kill('SIGTERM');
   await new Promise(ok=>mock.close(ok));
   await rm(root,{recursive:true,force:true});
 });
 const url='http://127.0.0.1:'+studioPort;
 let online=false;
 for(let i=0;i<55;i++){
  try{const x=await fetch(url+'/health');if(x.ok){online=true;break}}catch{}
  await new Promise(r=>setTimeout(r,65));
 }
 assert.equal(online,true);
 const response=await fetch(url+'/api/preview',{
   method:'POST',headers:{'content-type':'application/json',origin:url},
   body:JSON.stringify({message:'oi'})
 });
 assert.equal(response.status,200);
 const answer=await response.json();
 assert.equal(answer.channel,'dsh-preview');
 assert.equal(answer.answer,'Olá! Sou a prévia DSH.');
 assert.equal(answer.draftOnly,true);
 assert.equal(called,true);
 const state=await fetch(url+'/api/state').then(r=>r.json());
 assert.equal(state.revision,1,'preview never changes draft');
 assert.equal(state.provider.configured,false,'does not need direct 9Router key');
});
