'use strict';
// Checks same-session context after reconnect using a fictional keyword. No user data saved.
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs');
(async()=>{
 const b=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 let p;const out={schema:'mcf-f1-semantic-resume/v1',at_utc:new Date().toISOString(),model:'gemini-2.5-flash-native-audio-preview-12-2025',synthetic_keyword_only:true};
 try{
  p=await b.newPage();await p.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
  await p.select('#model',out.model);
  await p.evaluate(()=>{$('compression').checked=true;$('resumption').checked=true;$('transOut').checked=true;});
  await p.click('#connect');await p.waitForFunction(()=>state.connected,{timeout:20000});
  const counts=()=>p.evaluate(()=>({gen:MCFLiveTelemetry.snapshot().events.filter(x=>x.event==='generation_complete').length,
    done:state.events.filter(x=>x.type==='SESSÃO'&&x.detail==='Turno concluído.').length,
    model:state.transcript.filter(x=>x.role==='model').length,handle:!!state.resumeHandle}));
  async function sendAndAwait(text){
   const old=await counts();
   await p.$eval('#prompt',(node,value)=>node.value=value,text);await p.click('#send');
   await p.waitForFunction((o)=>
     MCFLiveTelemetry.snapshot().events.filter(x=>x.event==='generation_complete').length>o.gen ||
     state.events.filter(x=>x.type==='SESSÃO'&&x.detail==='Turno concluído.').length>o.done,
     {timeout:25000},old);
   return await counts();
  }
  await sendAndAwait('Durante esta sessão, memorize a palavra fictícia de diagnóstico girassol. Não é uma senha. Responda de forma breve.');
  await p.waitForFunction(()=>!!state.resumeHandle,{timeout:16000}).catch(()=>{});
  out.handleBefore=await p.evaluate(()=>!!state.resumeHandle);
  if(!out.handleBefore)throw Error('NO_RESUME_HANDLE');
  await p.evaluate(()=>state.socket.close(1000,'QA context test'));
  await p.waitForFunction(()=>state.connected&&MCFLiveTelemetry.snapshot().metrics.reconnect_successes>0,{timeout:22000});
  out.reconnected=true;
  const old=await counts();
  await sendAndAwait('Qual era a palavra fictícia que eu pedi para memorizar? Responda apenas a palavra.');
  const stateR=await p.evaluate((modelCount)=>{
   const newTexts=state.transcript.filter(x=>x.role==='model').slice(modelCount).map(x=>String(x.text||'').toLowerCase()).join(' ');
   return {containsKeyword:newTexts.includes('girassol'),newModelFragments:state.transcript.filter(x=>x.role==='model').length-modelCount,
     hasResumeHandle:!!state.resumeHandle,reconnects:MCFLiveTelemetry.snapshot().metrics.reconnect_successes};
  },old.model);
  out.semantic=stateR;
  out.semanticResumeConfirmed=stateR.containsKeyword&&stateR.newModelFragments>0;
  await p.click('#disconnect');
 }catch(e){out.error=e.name+': '+e.message.slice(0,140);out.semanticResumeConfirmed=false;}
 finally{
  await p?.close().catch(()=>{});await b.close();
  fs.mkdirSync('/tmp/mcf-f1-qa',{recursive:true});
  fs.writeFileSync('/tmp/mcf-f1-qa/semantic-resume.json',JSON.stringify(out,null,2)+'\n',{mode:0o600});
  console.log('SEMANTIC_RESUME',JSON.stringify(out));
  if(!out.semanticResumeConfirmed)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.name,e.message);process.exitCode=2;});
