import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

test('mobile Lab proxy: tailnet-origin-only writes, whitelist and no editor exposure', async t => {
 const app=dirname(dirname(fileURLToPath(import.meta.url)));
 const root=await mkdtemp(join(tmpdir(),'mcf-mobile-lab-'));
 const publicOrigin='https://mcf-leo-n43sm.tail582305.ts.net:8492';
 const mock=createServer(async(req,res)=>{
   res.setHeader('content-type',req.url==='/lab'?'text/html':'application/json');
   if(req.url==='/lab'){
     res.end('<html><a href="/">↗ Editar comportamento no Studio</a><a href="/#publish">Publicação ↗</a></html>');
     return;
   }
   if(req.url==='/api/lab/status'){res.end(JSON.stringify({ready:true,messages:[]}));return;}
   if(req.url==='/api/lab/message'){
     let raw='';for await(const chunk of req)raw+=chunk;
     if(req.headers.origin!=='http://127.0.0.1:43580'){res.writeHead(403);res.end(JSON.stringify({error:'Bad upstream Origin'}));return;}
     res.end(JSON.stringify({answer:JSON.parse(raw).text,sessionId:'session-demo'}));return;
   }
   res.end('{}');
 });
 await new Promise((resolve,reject)=>mock.once('error',reject).listen(43580,'127.0.0.1',resolve));
 const child=spawn(process.execPath,[join(app,'mobile-lab-proxy.mjs')],{
   env:{...process.env,MCF_AGENT_LAB_PROXY_PORT:'43581',
     MCF_AGENT_LAB_LOCAL_UPSTREAM:'http://127.0.0.1:43580',
     MCF_AGENT_LAB_PUBLIC_ORIGIN:publicOrigin},cwd:app,
   stdio:['ignore','pipe','pipe']
 });
 t.after(async()=>{child.kill('SIGTERM');await new Promise(resolve=>mock.close(resolve));await rm(root,{recursive:true,force:true});});
 let ready=false;
 for(let i=0;i<45;i++){try{if((await fetch('http://127.0.0.1:43581/lab')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,80));}
 assert.equal(ready,true);
 const base='http://127.0.0.1:43581';
 const page=await fetch(base+'/lab');
 assert.equal(page.status,200);
 const markup=await page.text();
 assert.match(markup,/somente no notebook/);
 assert.doesNotMatch(markup,/<a href="\/#publish">/);
 assert.match(page.headers.get('content-security-policy'),/script-src 'self'/);
 const status=await fetch(base+'/api/lab/status');
 assert.equal(status.status,200);
 assert.deepEqual(await status.json(),{ready:true,messages:[]});
 for(const forbidden of ['/api/state','/api/publish/status','/api/dsh/status','/api/provider','/.data/dsh-bridge-token','/server.mjs'])
   assert.equal((await fetch(base+forbidden)).status,404,forbidden);
 const wrong=await fetch(base+'/api/lab/message',{method:'POST',
   headers:{origin:'https://evil.example','content-type':'application/json'},
   body:JSON.stringify({text:'oi'})});
 assert.equal(wrong.status,403);
 const okay=await fetch(base+'/api/lab/message',{method:'POST',
   headers:{origin:publicOrigin,'content-type':'application/json'},
   body:JSON.stringify({text:'oi'})});
 assert.equal(okay.status,200);
 assert.equal((await okay.json()).answer,'oi');
 assert.equal((await fetch(base+'/api/lab/message',{method:'POST',
   headers:{origin:publicOrigin,'content-type':'application/x-www-form-urlencoded'},body:'text=oi'})).status,415);
});
