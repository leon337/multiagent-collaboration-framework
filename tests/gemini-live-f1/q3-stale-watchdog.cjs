'use strict';
// F1 no-network adversarial probes: stale mic packets and silent-turn watchdog.
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),crypto=require('node:crypto');
const report={schema:'mcf-f1-q3-stale-and-watchdog/v1',at_utc:new Date().toISOString(),
 sourceAppSha256:crypto.createHash('sha256').update(fs.readFileSync('/home/leo/Projetos/gemini-live-studio-f1/public/app.js')).digest('hex'),
 sourceWorkletSha256:crypto.createHash('sha256').update(fs.readFileSync('/home/leo/Projetos/gemini-live-studio-f1/public/capture-worklet.js')).digest('hex'),
 results:[],rawMicSaved:false};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await browser.newPage();
 const add=(id,ok,observed)=>{report.results.push({id,pass:!!ok,observed});console.log(id,ok?'PASS':'FAIL',JSON.stringify(observed));};
 try{
  await p.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
  const v=await p.evaluate(()=>{
   const old={socket:state.socket,connected:state.connected,stream:state.micStream,ctx:state.micCtx,
    vad:state.sessionVadAuto};
   let sends=0;
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(){sends++;}};
   state.connected=true;state.micStream={getTracks:()=>[]};state.micCtx={currentTime:20};state.sessionVadAuto=true;
   const before=MCFLiveTelemetry.snapshot().metrics.input_frames_dropped;
   const initial=state.staleInputDrops;
   const frame=(at,drops=0)=>({buffer:new Int16Array(640).buffer,samples:640,rms:.03,rate:16000,captureTimeSec:at,droppedFrames:drops});
   processAudioFrame(frame(19.45));
   const afterStale={sends,stale:state.staleInputDrops-initial,dropped:MCFLiveTelemetry.snapshot().metrics.input_frames_dropped-before};
   processAudioFrame(frame(19.98,12));
   const afterFresh={sends,stale:state.staleInputDrops-initial,dropped:MCFLiveTelemetry.snapshot().metrics.input_frames_dropped-before};
   state.socket=old.socket;state.connected=old.connected;state.micStream=old.stream;
   state.micCtx=old.ctx;state.sessionVadAuto=old.vad;
   return {afterStale,afterFresh};
  });
  add('STALE_MIC_PACKET_REJECTED',v.afterStale.sends===0&&v.afterStale.stale===1&&v.afterStale.dropped===1,v.afterStale);
  add('FRESH_MIC_PACKET_SENT_AND_DROP_COUNT_ACCURATE',v.afterFresh.sends===1&&v.afterFresh.dropped===13,v.afterFresh);
  const timeout=await p.evaluate(async()=>{
   const old={socket:state.socket,connected:state.connected,timer:window.setTimeout};
   let sends=0;
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(){sends++;},close(){}};
   state.connected=true;
   window.setTimeout=(fn,ms,...args)=>old.timer.call(window,fn,ms===16000?45:ms,...args);
   const before=MCFLiveTelemetry.snapshot().metrics.response_timeouts;
   sendPrompt('Teste de tempo de resposta sem dados pessoais.');
   await new Promise(ok=>old.timer.call(window,ok,110));
   const observed={writes:sends,timeoutEvents:MCFLiveTelemetry.snapshot().metrics.response_timeouts-before,
    stillConnected:state.connected,noAutoRetry:sends===1};
   handleMessage({serverContent:{turnComplete:true}});
   window.setTimeout=old.timer;
   disconnect();
   state.socket=old.socket;state.connected=old.connected;
   return observed;
  });
  add('SILENT_TURN_WARNING_NO_REPLAY',timeout.writes===1&&timeout.timeoutEvents===1&&timeout.noAutoRetry,timeout);
 }catch(e){add('UNEXPECTED_TEST_ERROR',false,{name:e.name,message:e.message.slice(0,130)});}
 finally{
  await p.close();await browser.close();
  report.pass=report.results.filter(r=>r.pass).length;
  report.fail=report.results.filter(r=>!r.pass).length;
  fs.writeFileSync('/tmp/mcf-f1-qa/q3-stale-watchdog.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('Q3_STALE_WATCHDOG',report.pass,report.fail);
  if(report.fail)process.exitCode=1;
 }
})().catch(e=>{console.log('FATAL',e.name);process.exitCode=2;});
