import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectMessage, isOwnChat, normalizeJid, enforceRate, readPlainText, safeResponse } from '../src/policy.mjs';
import { PrivateState } from '../src/state.mjs';
import { GuardedConversation } from '../src/conversation.mjs';
import { makePortal, isAuthenticated, loadAdminToken } from '../src/portal.mjs';

const mine='5511999999999@s.whatsapp.net';
function message(id, text, {jid=mine,fromMe=true,seconds=Math.floor(Date.now()/1000)}={}) {
  return { key:{id,remoteJid:jid,fromMe},messageTimestamp:seconds,message:{conversation:text} };
}
const config =()=>({identities:[mine],connectedAt:Date.now()-1000,sentIds:new Set()});
async function fixture(t) {
  const dir=await mkdtemp(join(tmpdir(),'mcf-wa-local-test-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const state=new PrivateState(join(dir,'state.json'));
  await state.load();
  return {dir,state};
}
const wait=async(fn,timeout=1500)=>{
  const start=Date.now();
  while(!fn()){if(Date.now()-start>timeout)throw Error('condition_timeout');await new Promise(r=>setTimeout(r,10));}
};
test('JID normalization rejects groups, statuses, and external domains',()=>{
 assert.equal(normalizeJid('5511999999999:4@s.whatsapp.net'),mine);
 for(const jid of ['some@g.us','status@broadcast','me@newsletter','','551100@evil.invalid'])
   assert.equal(normalizeJid(jid),'');
});
test('self JID only, not arbitrary one-to-one contacts',()=>{
 assert.equal(isOwnChat(mine,[mine]),true);
 assert.equal(isOwnChat('5521999999999@s.whatsapp.net',[mine]),false);
 assert.equal(isOwnChat('12345@lid',['12345@lid']),true);
});
test('only messages from own linked devices in Message Yourself are accepted',()=>{
 assert.equal(inspectMessage(message('msg123456','/mestre oi'),config()).kind,'prompt');
 assert.equal(inspectMessage(message('msg123456','/mestre oi',{fromMe:false}),config()).kind,'ignore');
 assert.equal(inspectMessage(message('msg123456','/mestre oi',{jid:'5511987654321@s.whatsapp.net'}),config()).kind,'ignore');
 assert.equal(inspectMessage(message('msg123456','/mestre oi',{jid:'12345@g.us'}),config()).kind,'ignore');
});
test('slash prefix and explicit controls, not conversation data',()=>{
 assert.equal(inspectMessage(message('msg123456','bom dia'),config()).kind,'ignore');
 assert.equal(inspectMessage(message('msg123457','/mestre parar'),config()).kind,'stop');
 assert.equal(inspectMessage(message('msg123458','/mestre iniciar'),config()).kind,'start');
 assert.equal(inspectMessage(message('msg123459','/mestre status'),config()).kind,'status');
});
test('history backfill and old messages are ignored',()=>{
 assert.equal(inspectMessage(message('msg123450','/mestre oi',{seconds:Math.floor(Date.now()/1000)-600}),config()).kind,'ignore');
});
test('no media access, ephemeral plain text only',()=>{
 assert.equal(readPlainText({message:{imageMessage:{caption:'/mestre oi'}}}),'');
 assert.equal(readPlainText({message:{ephemeralMessage:{message:{conversation:'/mestre status'}}}}),'/mestre status');
});
test('oversize input, odd IDs, generated echos filtered',()=>{
 assert.equal(inspectMessage(message('x','/mestre teste'),config()).kind,'ignore');
 assert.equal(inspectMessage(message('msg123456','/mestre '+ 'a'.repeat(820)),config()).kind,'ignore');
 assert.equal(inspectMessage(message('msg123456','/mestre teste'),{...config(),sentIds:new Set(['msg123456'])}).kind,'ignore');
});
test('rate limit enforces 3 per 60 seconds',()=>{
 let ts=[];for(let i=0;i<3;i++){const r=enforceRate(ts,1000+i*10);assert.equal(r.allowed,true);ts=r.times;}
 assert.equal(enforceRate(ts,1040).allowed,false);
 assert.equal(enforceRate(ts,65000).allowed,true);
});
test('response sanitized with no trigger prefix',()=>{
 assert.equal(safeResponse('  Olá\u0001  '),'MESTRE: Olá');
 assert.throws(()=>safeResponse(' '),/empty_reply/);
});
test('state persists IDs without plaintext or losing session ID',async t=>{
 const {dir,state}=await fixture(t);
 assert.equal(await state.record('msg123456'),true);
 assert.equal(await state.record('msg123456'),false);
 await state.complete('session-12345678');
 assert.equal((await stat(join(dir,'state.json'))).mode&0o777,0o600);
 const s=await readFile(join(dir,'state.json'),'utf8');
 assert.equal(s.includes('Olá do usuário'),false);
 const other=new PrivateState(join(dir,'state.json'));await other.load();
 assert.equal(other.data.sessionId,'session-12345678');assert.deepEqual(other.data.seen,['msg123456']);
});
test('authorized command invokes actual contract only once',async t=>{
 const {state}=await fixture(t),sent=[];
 let calls=0;
 const c=new GuardedConversation({
  state,invoke:async()=>{calls++;return {answer:'Tudo certo',sessionId:'session-12345678'};},
  send:async(jid,text)=>{sent.push({jid,text});return {key:{id:'reply123456'}};},
  getIdentity:()=>[mine],getConnectedAt:()=>Date.now()-5000
 });
 await c.receive({type:'notify',messages:[message('msg123456','/mestre oi')]});
 await wait(()=>sent.length===1);
 await c.receive({type:'notify',messages:[message('msg123456','/mestre oi')]});
 assert.equal(calls,1);assert.equal(sent[0].jid,mine);
 assert.equal(sent[0].text,'MESTRE: Tudo certo');
 await wait(()=>state.data.processed===1);
});
test('STOP suppresses in-flight reply and enforces pause',async t=>{
 const {state}=await fixture(t),sent=[];
 let resolve;
 const c=new GuardedConversation({
  state,invoke:()=>new Promise(r=>resolve=r),
  send:async(_jid,text)=>{sent.push(text);return {key:{id:'echo123456'}};},
  getIdentity:()=>[mine],getConnectedAt:()=>Date.now()-5000
 });
 await c.receive({type:'notify',messages:[message('msg123457','/mestre abc')]});
 await c.receive({type:'notify',messages:[message('msg123458','/mestre parar')]});
 assert.equal(state.data.armed,false);
 resolve({answer:'A resposta tardia não pode chegar',sessionId:'session-12345678'});
 await wait(()=>!c.current);
 assert.equal(sent.some(x=>x.includes('resposta tardia')),false);
});
test('unrelated echo, group and history cannot reach the model',async t=>{
 const {state}=await fixture(t);let called=0;
 const c=new GuardedConversation({state,invoke:async()=>{called++;throw Error('forbidden');},send:async()=>{},getIdentity:()=>[mine],getConnectedAt:()=>Date.now()-5000});
 await c.receive({type:'append',messages:[message('msg123451','/mestre oi')]});
 await c.receive({type:'notify',messages:[message('msg123452','/mestre oi',{jid:'12345@g.us'}),message('msg123453','/mestre oi',{jid:'5521999999999@s.whatsapp.net'})]});
 assert.equal(called,0);
});
test('portal authentication and QR hidden from anonymous calls',async t=>{
 const {dir}=await fixture(t);
 const token=await loadAdminToken(dir);
 assert.equal(isAuthenticated('Bearer '+token,token),true);
 assert.equal(isAuthenticated('Bearer '+'0'.repeat(64),token),false);
 const server=makePortal({
  token,getStatus:()=>({connected:false,armed:true,qrAvailable:true}),
  getQr:()=> 'ABCD-QR-SECRET',setArmed:async()=>{}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>server.close(r)));
 // makePortal insists on matching its configured port. Direct listen(0) returns different port;
 // verify rejection of a forged host, and test approved route in separate test.
 const port=server.address().port;
 const denial=await fetch('http://127.0.0.1:'+port+'/api/qr',{headers:{host:'evil.example'}});
 assert.equal(denial.status,403);
 assert.equal((await denial.text()).includes('ABCD-QR-SECRET'),false);
});
test('linking credentials token is stored privately',async t=>{
 const {dir}=await fixture(t);
 const x=await loadAdminToken(dir),y=await loadAdminToken(dir);
 assert.equal(x,y);assert.equal(x.length,64);
 assert.equal((await stat(join(dir,'admin-token'))).mode&0o777,0o600);
});

test('loopback pairing QR is refused by tailnet host and POST requires token', async t=>{
 const {dir}=await fixture(t);
 const token=await loadAdminToken(dir);
 const net=await import('node:net');
 const listener=net.createServer();
 await new Promise(r=>listener.listen(0,'127.0.0.1',r));
 const port=listener.address().port;
 await new Promise(r=>listener.close(r));
 let armed=true;
 const server=makePortal({token,port,getStatus:()=>({connected:false,qrAvailable:true,armed}),getQr:()=> 'LOCAL_TEST_QR',setArmed:async value=>{armed=value;}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+port;
 const pair=await fetch(base+'/pair');
 assert.equal(pair.status,200);
 assert.match(await pair.text(),/Conectar WhatsApp ao MCF/);
 const qr=await fetch(base+'/api/local-qr');
 assert.equal(qr.status,200);
 assert.equal((await qr.json()).data,'LOCAL_TEST_QR');
 const forged=await new Promise((resolve,reject)=>{
  const req=http.get({host:'127.0.0.1',port,path:'/api/local-qr',headers:{Host:'mcf-leo-n43sm.tail582305.ts.net:8499'}},res=>{
   let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,body}));
  });req.on('error',reject);
 });
 assert.equal(forged.status,401);
 assert.ok(!forged.body.includes('LOCAL_TEST_QR'));
 const noAuth=await fetch(base+'/api/pause',{method:'POST',body:'{}'});
 assert.equal(noAuth.status,401);
 const wrongOrigin=await fetch(base+'/api/pause',{method:'POST',headers:{authorization:'Bearer '+token,origin:'https://evil.invalid'},body:'{}'});
 assert.equal(wrongOrigin.status,403);
 assert.equal(armed,true);
 const ok=await fetch(base+'/api/pause',{method:'POST',headers:{authorization:'Bearer '+token,origin:base},body:'{}'});
 assert.equal(ok.status,200);assert.equal(armed,false);
});

test('delayed model acknowledgement is sent once, followed by real answer',async t=>{
 const {state}=await fixture(t);const sent=[];let resolve;
 const c=new GuardedConversation({
  state,ackDelayMs:20,
  invoke:()=>new Promise(r=>resolve=r),
  send:async(_jid,text)=>{sent.push(text);return {key:{id:'bridge'+sent.length+'abcde'}};},
  getIdentity:()=>[mine],getConnectedAt:()=>Date.now()-3000
 });
 await c.receive({type:'notify',messages:[message('ask123456','/mestre teste longo')]});
 await wait(()=>sent.length===1);
 assert.match(sent[0],/processando/);
 resolve({answer:'Concluído',sessionId:'session-12345678'});
 await wait(()=>state.data.processed===1);
 assert.equal(sent.length,2);
 assert.equal(sent[1],'MESTRE: Concluído');
});

test('finished short model turn does not emit delayed acknowledgement',async t=>{
 const {state}=await fixture(t);const sent=[];
 const c=new GuardedConversation({
  state,ackDelayMs:25,
  invoke:async()=>({answer:'Rápido',sessionId:'session-12345678'}),
  send:async(_jid,text)=>{sent.push(text);return {key:{id:'reply999999'}};},
  getIdentity:()=>[mine],getConnectedAt:()=>Date.now()-3000
 });
 await c.receive({type:'notify',messages:[message('ask123457','/mestre teste rápido')]});
 await wait(()=>state.data.processed===1);
 await new Promise(r=>setTimeout(r,45));
 assert.deepEqual(sent,['MESTRE: Rápido']);
});
