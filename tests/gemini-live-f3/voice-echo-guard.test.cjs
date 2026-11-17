'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const MCFVoiceApproval=require('../../apps/gemini-live-studio/public/voice-approval.js');
const root=path.join(__dirname,'../../apps/gemini-live-studio/public');
function setup(){
 const nodes=new Map(), calls={recognition:0,recognizer:null,decisions:[]};
 class Elem{
  constructor(){this.open=false;this.hidden=false;this.checked=false;this.disabled=false;
   this.textContent='';this.children=[];this.onclick=null;}
  addEventListener(){} removeEventListener(){} showModal(){this.open=true;}
  close(){this.open=false;} prepend(e){this.children.unshift(e);}
 }
 function el(id){if(!nodes.has(id))nodes.set(id,new Elem());return nodes.get(id);}
 el('playwrightVoiceEnabled').checked=true;el('playwrightTools').checked=true;el('tools').checked=true;
 class Recognizer{
  start(){calls.recognition++;calls.recognizer=this;}
  abort(){if(calls.recognizer===this)calls.recognizer=null;}
 }
 const window={SpeechRecognition:Recognizer,addEventListener(){},crypto:{getRandomValues(a){
  a.set([1,2,3,4]);return a;}}};
 const fetch=async(url,{body}={})=>{
  if(url==='/api/browser/status')return {ok:true,json:async()=>({ready:false,provider:'@playwright/mcp',toolNames:[],navigationPolicy:'public_https_per_request'})};
  if(url==='/api/browser/prepare'){
   return {ok:true,json:async()=>({requestId:'aaaaaaaa-1111-4111-8111-111111111111',
    name:'playwright_navigate',summary:'NAVEGAR https://example.org/',approvalNeeded:true,expiresInSec:45})};
  }
  if(url==='/api/browser/decision'){
   const x=JSON.parse(body);calls.decisions.push(x);
   return {ok:true,json:async()=>({status:x.allow?'SUCCESS':'DENIED',
    tool:'playwright_navigate',receiptId:'bbbbbbbb-2222-4222-8222-222222222222',output:'simulated'})};
  }
  if(url==='/api/browser/end')return {ok:true,json:async()=>({closed:true})};
  throw Error('unexpected route '+url);
 };
 const context={window,document:{getElementById:el,createElement:()=>new Elem()},fetch,
  AbortSignal,Date,Promise,URL,crypto:{randomUUID:()=>'cccccccc-3333-4333-8333-333333333333'},
  setTimeout,clearTimeout,MCFVoiceApproval,
  state:{connectionGeneration:1,mcpEpoch:1,connected:false,wantConnected:false,
   micStream:null,micStarting:false},stopAllVisual(){},clearPlay(){},stopMic(){}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'playwright-tools.js'),'utf8'),context,
  {filename:'playwright-tools.js',timeout:1000});
 return {el,window,calls};
}
async function open(ui){
 const result=ui.window.MCFPlaywrightTools.run('playwright_navigate',{url:'https://example.org'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(ui.el('playwrightApprovalDialog').open,true);
 return result;
}
function say(ui,transcript){
 assert.ok(ui.calls.recognizer);
 ui.calls.recognizer.onresult({results:{length:1,0:{isFinal:true,0:{transcript}}}});
}
test('screen reader echo and synthetic click cannot grant without trusted final button',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/<strong id="playwrightVoicePhrase" aria-live="off"/);
 const ui=setup(),pending=await open(ui);
 assert.equal(ui.calls.recognition,0);
 assert.equal(ui.el('playwrightVoicePhrase').textContent,'1 2 3 4');
 assert.ok(!ui.el('playwrightVoicePhrase').textContent.includes('autorizo'));
 ui.el('playwrightListen').onclick({isTrusted:false});
 assert.equal(ui.calls.recognition,0);
 ui.el('playwrightListen').onclick({isTrusted:true});
 assert.equal(ui.calls.recognition,1);
 say(ui,'autorizo 1 2 3 4'); // Can be delayed screen-reader echo, not human proof.
 assert.equal(ui.calls.decisions.length,0);
 assert.equal(ui.el('playwrightApprovalDialog').open,true);
 assert.match(ui.el('playwrightVoiceStatus').textContent,/NÃO está autorizada/);
 ui.el('playwrightApprove').onclick({isTrusted:false});
 assert.equal(ui.calls.decisions.length,0);
 ui.el('playwrightApprove').onclick({isTrusted:true});
 const result=await pending;
 assert.equal(result.status,'SUCCESS');
 assert.deepEqual(ui.calls.decisions.map(x=>x.allow),[true]);
 assert.equal(ui.el('playwrightVoicePhrase').textContent,'');
});
test('incorrect phrase cannot grant; manual fallback uses trusted click',async()=>{
 const ui=setup(),pending=await open(ui);
 ui.el('playwrightListen').onclick({isTrusted:true});
 say(ui,'autorizo 9 9 9 9');
 assert.equal(ui.calls.decisions.length,0);
 assert.match(ui.el('playwrightVoiceStatus').textContent,/não corresponde/);
 ui.el('playwrightApprove').onclick({isTrusted:true});
 assert.equal((await pending).status,'SUCCESS');
});
test('spoken denial fails closed without any confirmation click',async()=>{
 const ui=setup(),pending=await open(ui);
 ui.el('playwrightListen').onclick({isTrusted:true});
 say(ui,'recuso');
 assert.equal((await pending).status,'DENIED');
 assert.deepEqual(ui.calls.decisions.map(x=>x.allow),[false]);
});
