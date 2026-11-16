'use strict';
// F1 adversarial browser scenarios, offline and synthetic. Does NOT call Gemini API.
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const BASE=process.env.F1_STUDIO_URL||'http://127.0.0.1:18372/';
const out=process.env.F1_ADVERSARIAL_REPORT||path.join(__dirname,'adversarial-results.json');
const stage=process.env.F1_SOURCE_ROOT||path.join(__dirname,'../../apps/gemini-live-studio');
const src=path.join(stage,'public/app.js');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={schema:'mcf-f1-adversarial-browser/v1',date:new Date().toISOString(),origin:BASE,sourceAppSHA:sha(src),testScriptSHA:sha(__filename),cases:[],errors:[]};
 async function scenario(id,func){
  let page;
  try{
   page=await browser.newPage();
   page.on('pageerror',e=>report.errors.push(e.name));
   await page.goto(BASE,{waitUntil:'networkidle2'});
   const r=await page.evaluate(func);
   report.cases.push({id,pass:Boolean(r.pass),observed:r.observed});
   console.log(id,r.pass?'PASS':'FAIL',JSON.stringify(r.observed));
  }catch(e){report.cases.push({id,pass:false,error:e.name+': '+e.message.slice(0,170)});console.log(id,'FAIL',e.message.slice(0,120));}
  finally{if(page)await page.close().catch(()=>{});}
 }
 await scenario('MIC_DOUBLE_START_CANCEL_NO_ORPHAN',async()=>{
  const old=navigator.mediaDevices.getUserMedia,originalSocket=state.socket;
  let callCount=0,resolveStream,trackStopped=0;
  const track={stop(){trackStopped++;},readyState:'live'};
  const stream={getTracks:()=>[track]};
  navigator.mediaDevices.getUserMedia=()=>{callCount++;return new Promise(done=>resolveStream=done);};
  state.connected=true;state.socket={readyState:1,bufferedAmount:0,send(){}};
  const a=startMic(),b=startMic();
  await new Promise(ok=>setTimeout(ok,0));
  const during={requests:callCount,micStarting:state.micStarting};
  stopMic();
  if(resolveStream)resolveStream(stream);
  await Promise.all([a,b]);
  const observed={...during,tracksStopped:trackStopped,micStreamNull:!state.micStream,micCtxNull:!state.micCtx,micStartingAfter:state.micStarting};
  navigator.mediaDevices.getUserMedia=old;state.socket=originalSocket;state.connected=false;
  return {pass:observed.requests===1&&observed.tracksStopped===1&&observed.micStreamNull&&observed.micCtxNull&&!observed.micStartingAfter,observed};
 });
 await scenario('CANCELLED_TOKEN_CANNOT_CREATE_OBSOLETE_WS',async()=>{
  const realFetch=window.fetch,RealWS=window.WebSocket;
  const pending=[];let count=0;const wsInstances=[];
  window.fetch=(input,options)=>String(input).includes('/api/token')?new Promise(done=>pending.push(done)):realFetch(input,options);
  class FakeWS{static OPEN=1;constructor(url){count++;this.readyState=0;wsInstances.push(this);}send(){}close(){this.readyState=3;}}
  window.WebSocket=FakeWS;
  const a=connect(false);
  await new Promise(ok=>setTimeout(ok,0));
  disconnect();
  const b=connect(false);
  await new Promise(ok=>setTimeout(ok,0));
  pending[1]({ok:true,status:200,json:async()=>({token:'fake-2'})});
  await b;
  pending[0]({ok:true,status:200,json:async()=>({token:'fake-1'})});
  await a;
  const beforeDisconnect={sockets:count,currentIsSecond:state.socket===wsInstances[0]};
  const stale=wsInstances[0];
  disconnect();
  stale.onopen?.();
  await stale.onmessage?.({data:JSON.stringify({setupComplete:{}})});
  const after={connected:state.connected,socket:state.socket===null,closed:stale.readyState===3};
  window.fetch=realFetch;window.WebSocket=RealWS;
  return {pass:count===1&&beforeDisconnect.currentIsSecond&&!after.connected&&after.socket&&after.closed,observed:{...beforeDisconnect,...after}};
 });
 await scenario('VAD_FROZEN_AFTER_SETUP',()=>{
  const original=state.socket,connected=state.connected,originalVad=$('vad').checked;
  const sends=[];
  state.socket={readyState:1,bufferedAmount:0,send:s=>sends.push(JSON.parse(s))};
  state.connected=true;state.micStream={getTracks:()=>[]};state.sessionVadAuto=true;
  $('vad').checked=false;
  for(let i=0;i<4;i++)processAudioFrame({buffer:new Int16Array(640).buffer,rms:.08,samples:640});
  const observed={audio:sends.filter(x=>x.realtimeInput?.audio).length,activityStart:sends.filter(x=>x.realtimeInput?.activityStart).length};
  state.socket=original;state.connected=connected;state.micStream=null;state.sessionVadAuto=null;$('vad').checked=originalVad;
  return {pass:observed.audio===4&&observed.activityStart===0,observed};
 });
 await scenario('CONTROL_MESSAGES_SURVIVE_BACKPRESSURE',()=>{
  const original=state.socket,connected=state.connected;
  const sent=[];state.socket={readyState:1,bufferedAmount:900000,send:s=>sent.push(JSON.parse(s))};state.connected=true;
  const control=send({realtimeInput:{activityStart:{}}});
  const media=send({realtimeInput:{audio:{mimeType:'audio/pcm;rate=16000',data:'AA=='}}});
  const observed={control,media,sent:sent.length};
  state.socket=original;state.connected=connected;
  return {pass:control&&!media&&sent.length===1&&!!sent[0].realtimeInput?.activityStart,observed};
 });
 await scenario('VAD_START_NOT_COMMITTED_ON_SEND_ERROR',()=>{
  const original=state.socket,was=state.connected;
  let attempts=0;const events=[];
  state.socket={readyState:1,bufferedAmount:0,send:s=>{const d=JSON.parse(s);if(d.realtimeInput?.activityStart&&attempts++===0)throw Error('simulated send failure');events.push(d);}};
  state.connected=true;state.micStream={getTracks:()=>[]};state.sessionVadAuto=false;
  state.manualVadStarted=false;state.micSpeechFrames=0;state.micSilenceMs=0;state.preRoll=[];
  for(let i=0;i<2;i++)processAudioFrame({buffer:new Int16Array(640).buffer,rms:.08,samples:640});
  const afterFailure=state.manualVadStarted;
  processAudioFrame({buffer:new Int16Array(640).buffer,rms:.08,samples:640});
  const afterRecovery=state.manualVadStarted;
  for(let i=0;i<25;i++)processAudioFrame({buffer:new Int16Array(640).buffer,rms:.001,samples:640});
  const afterSilence=state.manualVadStarted;
  const observed={afterFailure,afterRecovery,afterSilence,startSent:events.filter(e=>e.realtimeInput?.activityStart).length,endSent:events.filter(e=>e.realtimeInput?.activityEnd).length};
  state.socket=original;state.connected=was;state.micStream=null;state.sessionVadAuto=null;
  return {pass:!afterFailure&&afterRecovery&&!afterSilence&&observed.startSent===1&&observed.endSent===1,observed};
 });
 await scenario('TOKEN_NETWORK_FAILURE_RETRIES_BOUNDED',async()=>{
  const realFetch=window.fetch;
  window.fetch=(input,options)=>String(input).includes('/api/token')?Promise.reject(Error('temporary network failure')):realFetch(input,options);
  await connect(false);
  const observed={retryScheduled:!!state.reconnectTimer,attempts:state.retries,wantConnected:state.wantConnected,connected:state.connected};
  disconnect();window.fetch=realFetch;
  return {pass:observed.retryScheduled&&observed.attempts===1&&observed.wantConnected&&!observed.connected,observed};
 });
 await browser.close();
 report.passed=report.cases.filter(x=>x.pass).length;report.failed=report.cases.filter(x=>!x.pass).length;
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{mode:0o600});
 console.log('F1_ADVERSARIAL_SUMMARY',JSON.stringify({passed:report.passed,failed:report.failed,pageErrors:report.errors.length}));
 if(report.failed)process.exitCode=1;
})().catch(e=>{console.error('ADVERSARIAL_FATAL',e.name,e.message);process.exitCode=2;});
