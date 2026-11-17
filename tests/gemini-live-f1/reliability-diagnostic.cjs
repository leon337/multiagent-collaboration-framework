'use strict';
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs');
const result={schema:'mcf-f1-reliability-diagnostic/v1',utc:new Date().toISOString(),turns:[],failureEvents:[],notStored:['access_token','prompt_text','audio','transcript','api_key']};
const sleep=n=>new Promise(r=>setTimeout(r,n));
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 let page;
 try{
  page=await browser.newPage();
  page.on('pageerror',e=>result.failureEvents.push({type:'JS_ERROR',name:e.name}));
  await page.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
  await page.select('#model','gemini-2.5-flash-native-audio-preview-12-2025');
  await page.evaluate(()=>{$('compression').checked=true;$('resumption').checked=true;});
  await page.click('#connect');
  await page.waitForFunction(()=>state.connected,{timeout:17000});
  const stateFlags=()=>page.evaluate(()=>({
   connected:state.connected,wantConnected:state.wantConnected,retries:state.retries,handle:!!state.resumeHandle,
   first_audio:MCFLiveTelemetry.snapshot().events.filter(e=>e.event==='first_audio').length,
   generation:MCFLiveTelemetry.snapshot().events.filter(e=>e.event==='generation_complete').length,
   turn_done:state.events.filter(e=>e.type==='SESSÃO'&&e.detail==='Turno concluído.').length,
   disconnects:MCFLiveTelemetry.snapshot().metrics.ws_disconnects,
   close_codes:MCFLiveTelemetry.snapshot().events.filter(e=>e.event==='disconnect').map(e=>e.code),
   reconnects:MCFLiveTelemetry.snapshot().metrics.reconnect_successes
  }));
  result.initial=await stateFlags();
  for(let i=0;i<6;i++){
   let before=await stateFlags(),start=Date.now();
   await page.$eval('#prompt',(el,index)=>{el.value='Responda com uma frase simples de teste. Número '+(index+1)+'.';},i);
   await page.click('#send');
   let after,first=null,done=null;
   for(let j=0;j<110;j++){
    after=await stateFlags();
    if(first===null&&after.first_audio>before.first_audio)first=Date.now()-start;
    if(after.generation>before.generation||after.turn_done>before.turn_done){done=Date.now()-start;break;}
    if(!after.connected)break;
    await sleep(150);
   }
   let t={index:i+1,first_audio_ms:first,completion_ms:done,connected:after?.connected,
    generation_delta:after.generation-before.generation,turn_done_delta:after.turn_done-before.turn_done,
    close_codes:after.close_codes,handle:after.handle};
   result.turns.push(t);console.log('DIAG_TURN',JSON.stringify(t));
   if(!after.connected||done===null)break;
   await sleep(1100);
  }
  if((await stateFlags()).connected){
   result.network_before=await stateFlags();
   await page.setOfflineMode(true);
   await page.evaluate(()=>state.socket?.close(1000,'QA induced disconnect'));
   await sleep(1300);await page.setOfflineMode(false);
   try{await page.waitForFunction(()=>state.connected&&MCFLiveTelemetry.snapshot().metrics.reconnect_successes>0,{timeout:17000});result.network_reconnected=true;}
   catch{result.network_reconnected=false;}
   result.network_after=await stateFlags();
  }
  result.final=await stateFlags();
  await page.click('#disconnect');
 }catch(e){result.fatal=e.name+': '+e.message.slice(0,140);}
 finally{
  if(page)await page.close().catch(()=>{});
  await browser.close().catch(()=>{});
  fs.mkdirSync('/tmp/mcf-f1-qa',{recursive:true});
  fs.writeFileSync('/tmp/mcf-f1-qa/reliability-diagnostic.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log('DIAG_SUMMARY',JSON.stringify({turns:result.turns.length,completed:result.turns.filter(x=>x.completion_ms!==null).length,last:result.final,network:result.network_reconnected,fatal:result.fatal}));
  if(result.fatal)process.exitCode=1;
 }
})().catch(e=>{console.error('UNCAUGHT',e.name);process.exitCode=2;});
