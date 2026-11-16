'use strict';
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs');
const result={schema:'mcf-f1-high-fixes-adversarial/v1',utc:new Date().toISOString(),tests:[],noSecretsSaved:true};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const add=(id,pass,metrics)=>{result.tests.push({id,pass,metrics});console.log(id,pass?'PASS':'FAIL',JSON.stringify(metrics));};
 async function scenario(id,fn){
  let page;
  try{page=await browser.newPage();await page.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
   let d=await page.evaluate(fn);add(id,!!d.pass,d.observed);}
  catch(e){add(id,false,{error:e.name,message:e.message.slice(0,110)});}
  finally{await page?.close().catch(()=>{});}
 }
 await scenario('OUTPUT_CONTROLS_AVAILABLE_AFTER_DISCONNECT',()=>{
  const item={stop(){},disconnect(){}};
  state.sources.add(item);state.connected=false;state.connecting=false;setButtons(false);
  const before={stopDisabled:ui.stop.disabled,muteDisabled:ui.mute.disabled,queued:state.sources.size};
  ui.mute.click();
  const after={queued:state.sources.size,muteDisabled:ui.mute.disabled,stopDisabled:ui.stop.disabled};
  return {pass:!before.stopDisabled&&!before.muteDisabled&&after.queued===0&&after.stopDisabled,observed:{before,after}};
 });
 await scenario('TOKEN_REQUEST_TIMEOUT_AND_BOUNDED_RETRY',async()=>{
  const fetchOld=window.fetch,setOld=window.setTimeout,oldResume=$('resumption').checked;
  window.setTimeout=(fn,ms,...args)=>setOld(fn,ms===12000?45:ms,...args);
  window.fetch=(url,options)=>String(url).includes('/api/token')?new Promise((ok,fail)=>{
   options.signal?.addEventListener('abort',()=>fail(Object.assign(new Error('AbortError'),{name:'AbortError'})),{once:true});
  }):fetchOld(url,options);
  $('resumption').checked=true;
  try{
   await connect(false);
   const o={retries:state.retries,retryScheduled:!!state.reconnectTimer,connecting:state.connecting,abortCleared:state.connectAbort===null};
   return {pass:o.retries===1&&o.retryScheduled&&!o.connecting&&o.abortCleared,observed:o};
  }finally{disconnect();window.fetch=fetchOld;window.setTimeout=setOld;$('resumption').checked=oldResume;}
 });
 await scenario('WEBSOCKET_SETUP_WATCHDOG_FAILS_CLOSED',async()=>{
  const fetchOld=window.fetch,webOld=window.WebSocket,timerOld=window.setTimeout,resumeOld=$('resumption').checked;
  window.setTimeout=(fn,ms,...args)=>timerOld(fn,ms===15000?55:ms,...args);
  window.fetch=(url,opts)=>String(url).includes('/api/token')?Promise.resolve({ok:true,json:async()=>({token:'fake-local-test'})}):fetchOld(url,opts);
  class FakeWS{constructor(){this.readyState=0;}send(){}close(){this.readyState=3;}}
  window.WebSocket=FakeWS;$('resumption').checked=true;
  try{
   await connect(false);await new Promise(r=>timerOld(r,120));
   const o={retries:state.retries,retryScheduled:!!state.reconnectTimer,connecting:state.connecting,socketCleared:state.socket===null};
   return {pass:o.retries===1&&o.retryScheduled&&!o.connecting&&o.socketCleared,observed:o};
  }finally{disconnect();window.fetch=fetchOld;window.WebSocket=webOld;window.setTimeout=timerOld;$('resumption').checked=resumeOld;}
 });
 await scenario('RECONNECT_CUMULATIVE_BUDGET_STOPS_FLAPPING',()=>{
  const old=$('resumption').checked;
  $('resumption').checked=true;state.wantConnected=true;state.retries=0;state.reconnectHistory=[];
  let accepted=0;
  for(let i=0;i<7;i++){
   state.retries=0; // simulate a successful setup between failures
   const ok=scheduleReconnect('flapping-test');if(ok)accepted++;
   clearTimeout(state.reconnectTimer);state.reconnectTimer=null;
  }
  const o={accepted,reconnectHistory:state.reconnectHistory.length,budgetExhausted:MCFLiveTelemetry.snapshot().events.some(x=>x.event==='reconnect_budget_exhausted')};
  disconnect();$('resumption').checked=old;
  return {pass:accepted===6&&o.reconnectHistory===6,observed:o};
 });
 await browser.close();
 result.pass=result.tests.filter(x=>x.pass).length;result.fail=result.tests.filter(x=>!x.pass).length;
 fs.mkdirSync('/tmp/mcf-f1-qa',{recursive:true});
 fs.writeFileSync('/tmp/mcf-f1-qa/high-fixes-tests.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log('SUMMARY',result.pass,result.fail);
 if(result.fail)process.exitCode=1;
})().catch(e=>{console.error('FATAL',e.name,e.message);process.exitCode=2;});
