import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChatCompletion } from '../response-parser.mjs';

test('parse JSON and SSE chat payloads without exposing upstream data', () => {
  assert.equal(parseChatCompletion(JSON.stringify({choices:[{message:{content:'OK'}}]})),'OK');
  const events = [
    'data: '+JSON.stringify({choices:[{delta:{content:'Bo'}}]}),
    '',
    'data: '+JSON.stringify({choices:[{delta:{content:'m dia'}}]}),
    '',
    'data: [DONE]',
    ''
  ].join('\n');
  assert.equal(parseChatCompletion(events,'text/event-stream'),'Bom dia');
  assert.equal(parseChatCompletion('event: message\ndata: '+JSON.stringify({choices:[{message:{content:'Fim'}}]})+'\n\n'),'Fim');
  assert.throws(()=>parseChatCompletion('data: nope\n\n'),/SSE.*inválido/);
  assert.throws(()=>parseChatCompletion('garbage'),/incompatível/);
});

test('end-to-end API: 9Router-compatible SSE authentication, AI proposal and conversation', async t => {
  const routerPort=43195, appPort=43194, origin='http://127.0.0.1:'+appPort;
  const base=dirname(dirname(fileURLToPath(import.meta.url)));
  const dir=await mkdtemp(join(tmpdir(),'agent-studio-sse-'));
  const profile=join(dir,'cordis.patch.yml'), source=join(dir,'index.js');
  await writeFile(profile,'# MCF/Hello World: test\n- insert:\n    - id: preset-hello-world-agent\n');
  await writeFile(source,'export default {};\n');
  await mkdir(join(dir,'store'));
  const mock=createServer(async (req,res)=>{
    if(req.url==='/v1/models'){
      res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({data:[{id:'mock/sse-model'}]}));return;
    }
    if(req.url!=='/v1/chat/completions'||req.headers.authorization!=='Bearer sk-test-lab'){
      res.writeHead(401);res.end('Denied');return;
    }
    let body='';
    for await(const chunk of req)body+=chunk;
    const payload=JSON.parse(body);
    const proposal=payload.response_format?.type==='json_object';
    const result=proposal?'{"changes":{"response":"Nova resposta com IA!"},"explanation":"Alterada via SSE"}':'OK';
    const mid=Math.ceil(result.length/2);
    res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache'});
    for(const piece of [result.slice(0,mid),result.slice(mid)]){
      res.write('data: '+JSON.stringify({choices:[{delta:{content:piece}}]})+'\n\n');
    }
    res.end('data: [DONE]\n\n');
  });
  await new Promise((resolve,reject)=>mock.once('error',reject).listen(routerPort,'127.0.0.1',resolve));
  const server=spawn(process.execPath,[join(base,'server.mjs')],{cwd:base,env:{
    ...process.env,AGENT_STUDIO_PORT:String(appPort), AGENT_STUDIO_ROUTER_BASE:'http://127.0.0.1:'+routerPort+'/v1',
    AGENT_STUDIO_API_KEY:'',NINEROUTER_API_KEY:'', AGENT_STUDIO_DATA:join(dir,'store','state.json'),
    AGENT_STUDIO_PROFILE:profile,AGENT_STUDIO_AGENT:source
  },stdio:['ignore','pipe','pipe']});
  t.after(async()=>{server.kill('SIGTERM');await new Promise(resolve=>mock.close(resolve));await rm(dir,{force:true,recursive:true});});
  const call=async(path,method='GET',data)=>{
    const resp=await fetch(origin+path,{method,headers: data===undefined?{}:{'content-type':'application/json',origin},body:data===undefined?undefined:JSON.stringify(data)});
    return {status:resp.status,data:await resp.json()};
  };
  let online=false;
  for(let i=0;i<40;i++){
    try{if((await call('/health')).status===200){online=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,70));
  }
  assert.equal(online,true,'studio running in mock isolated environment');
  let r=await call('/api/provider/test','POST',{});
  assert.equal(r.status,422,'cannot claim connected without key');
  r=await call('/api/provider','POST',{key:'sk-test-lab',model:'mock/sse-model'});
  assert.equal(r.status,200);
  r=await call('/api/provider/test','POST',{});
  assert.deepEqual({status:r.status,ok:r.data.ok,received:r.data.replyReceived},{status:200,ok:true,received:true});
  r=await call('/api/state');
  assert.equal(r.data.provider.verified,true,'verified only after real streamed completion');
  r=await call('/api/propose','POST',{prompt:'Altere a resposta com IA.',useAi:true});
  assert.equal(r.status,200);
  assert.equal(r.data.next.response,'Nova resposta com IA!');
  assert.equal(r.data.source,'ai');
  assert.equal((await call('/api/state')).data.current.response,'Hello World!','no publish or apply by default');
});
