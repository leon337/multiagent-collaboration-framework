'use strict';
// Fully integrated browser microphone -> AudioWorklet -> app.processAudioFrame -> WebSocket stub,
// with a deliberate 650ms AudioWorklet module initialization delay.
// No Gemini API calls, no PCM/transcript persisted, original app unchanged.
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),crypto=require('node:crypto');
const path='/home/leo/Projetos/gemini-live-studio-f1/public/';
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path+f)).digest('hex');
const report={schema:'mcf-f1-clock-origin-integrated-browser/v1',atUtc:new Date().toISOString(),appSha256:sha('app.js'),workletSha256:sha('capture-worklet.js'),mediaPersisted:false,googleApiCalled:false};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 let page;
 try{
  page=await browser.newPage();
  await page.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
  report.observed=await page.evaluate(async()=>{
   const tmp=new AudioContext({latencyHint:'interactive'});
   const proto=Object.getPrototypeOf(tmp.audioWorklet);
   const original=proto.addModule;
   await tmp.close();
   let addModuleCalls=0, frames=0, bytes=0, sends=0;
   let startupCtxAge=null;
   const prior={socket:state.socket,connected:state.connected,will:state.wantConnected};
   const beforeStale=state.staleInputDrops,beforeWorklet=state.workletDrops;
   proto.addModule=async function(...args){
    addModuleCalls++;
    await new Promise(resolve=>setTimeout(resolve,650));
    startupCtxAge=this===undefined?null:null;
    return original.apply(this,args);
   };
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(raw){
    sends++;
    const parsed=JSON.parse(raw);
    if(parsed.realtimeInput?.audio?.data){frames++;bytes+=Math.round(parsed.realtimeInput.audio.data.length*3/4);}
   }};
   state.connected=true;state.wantConnected=true;state.sessionVadAuto=true;
   try{
    await startMic();
    if(!state.micStream||!state.micNode)throw Error('startMic did not establish an AudioWorklet');
    const starting=state.micCtx.currentTime;
    await new Promise(resolve=>setTimeout(resolve,2400));
    const o={startClockSeconds:Number(starting.toFixed(3)),moduleCalls:addModuleCalls,frames,sends,bytes,
      staleDrops:state.staleInputDrops-beforeStale,workletDrops:state.workletDrops-beforeWorklet,
      inputContextRate:state.micCtx.sampleRate,trackLive:state.micStream.getAudioTracks().every(t=>t.readyState==='live')};
    return o;
   }finally{
    stopMic();
    proto.addModule=original;
    state.socket=prior.socket;state.connected=prior.connected;state.wantConnected=prior.will;
   }
  });
  const o=report.observed;
  report.pass=o.moduleCalls>=1&&o.startClockSeconds>=.35&&o.frames>=35&&o.staleDrops===0&&o.trackLive&&o.workletDrops===0;
  console.log('DELAYED_MIC_INTEGRATION',report.pass?'PASS':'FAIL',JSON.stringify(o));
 }catch(e){report.pass=false;report.error=e.name+': '+e.message.slice(0,180);console.log('DELAYED_MIC_INTEGRATION FAIL',report.error);}
 finally{
  await page?.close().catch(()=>{});await browser.close().catch(()=>{});
  fs.writeFileSync('/tmp/mcf-f1-qa/clock-origin-integration.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  if(!report.pass)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.name,e.message);process.exitCode=2;});
