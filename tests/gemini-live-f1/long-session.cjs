'use strict';
// F1 long lived real Live websocket: no microphone, no user media, metadata only.
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),crypto=require('node:crypto');
const appRoot='/home/leo/Projetos/gemini-live-studio-f1';
const sha=fn=>crypto.createHash('sha256').update(fs.readFileSync(fn)).digest('hex');
const durationMs=Number(process.env.F1_LONG_DURATION_MS||'632000');
const out='/tmp/mcf-f1-qa/long-session.json';
const run={schema:'mcf-f1-long-session/v1',utc:new Date().toISOString(),
 model:'gemini-2.5-flash-native-audio-preview-12-2025',
 appSourceSha256:sha(appRoot+'/public/app.js'),scriptSha256:sha(__filename),
 intendedDurationSeconds:durationMs/1000,microphoneUsed:false,cameraUsed:false,screenUsed:false,mediaPersisted:false,
 events:[],stats:{},limitations:['No physical microphone/headset','Only a short text prompt each minute; semantic continuity must be evaluated separately']};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 let page;
 try{
  page=await browser.newPage();
  await page.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
  await page.select('#model',run.model);
  await page.evaluate(()=>{$('compression').checked=true;$('resumption').checked=true;$('transOut').checked=true;});
  await page.click('#connect');
  await page.waitForFunction(()=>state.connected,{timeout:25000});
  const t0=Date.now();
  let tick=0,lastRequestAt=0,connectedTicks=0,disconnectedTicks=0;
  run.initial=await page.evaluate(()=>({connected:state.connected,compress:!!$('compression').checked,resumption:!!$('resumption').checked}));
  console.log('LONG_SESSION_STARTED',JSON.stringify(run.initial));
  while(Date.now()-t0<durationMs){
   const elapsed=Date.now()-t0;
   const st=await page.evaluate(()=>({
    connected:state.connected,connecting:state.connecting,wantConnected:state.wantConnected,
    handle:!!state.resumeHandle,queuedSources:state.sources.size,
    goAway:MCFLiveTelemetry.snapshot().metrics.go_away_events,
    reconnects:MCFLiveTelemetry.snapshot().metrics.reconnect_successes,
    attempts:MCFLiveTelemetry.snapshot().metrics.reconnect_attempts,
    disconnectCodes:MCFLiveTelemetry.snapshot().events.filter(x=>x.event==='disconnect').map(x=>x.code).slice(-12),
    lastErrorCount:state.events.filter(x=>x.type==='ERRO').length,
    modelTurnCompletions:state.events.filter(x=>x.type==='SESSÃO'&&x.detail==='Turno concluído.').length
   }));
   tick++;if(st.connected)connectedTicks++;else disconnectedTicks++;
   if(tick%4===1||st.goAway>0||(!st.connected&&tick%2===0)){
    run.events.push({elapsed_sec:Math.round(elapsed/1000),...st});
    console.log('LONG_HEARTBEAT',JSON.stringify({elapsed_sec:Math.round(elapsed/1000),connected:st.connected,handle:st.handle,goAway:st.goAway,reconnects:st.reconnects}));
   }
   if(st.connected&&st.queuedSources===0&&elapsed-lastRequestAt>=57000&&elapsed>10000){
    lastRequestAt=elapsed;
    await page.$eval('#prompt',el=>{el.value='Diga uma frase curta confirmando que a sessão permanece ativa.';});
    await page.click('#send');
   }
   await sleep(Math.min(15000,Math.max(0,durationMs-(Date.now()-t0))));
  }
  run.stats=await page.evaluate(()=>{
   const x=MCFLiveTelemetry.snapshot();
   return {goAway:x.metrics.go_away_events,reconnectAttempts:x.metrics.reconnect_attempts,reconnectSuccesses:x.metrics.reconnect_successes,
    disconnects:x.metrics.ws_disconnects,closeCodes:x.events.filter(e=>e.event==='disconnect').map(e=>e.code).slice(-18),
    audioUnderruns:x.metrics.audio_underruns,voiceResponseBytes:x.metrics.audio_bytes_received,
    handleAvailable:!!state.resumeHandle,finalConnected:state.connected,
    turnCompletions:state.events.filter(e=>e.type==='SESSÃO'&&e.detail==='Turno concluído.').length,
    micActive:!!state.micStream,cameraActive:!!state.cameraStream,screenActive:!!state.screenStream};
  });
  run.stats.connected_ticks=connectedTicks;run.stats.disconnected_ticks=disconnectedTicks;
  run.stats.duration_seconds=Math.round((Date.now()-t0)/1000);
  await page.click('#disconnect');
  run.finalCleanup=await page.evaluate(()=>({mic:!!state.micStream,screen:!!state.screenStream,camera:!!state.cameraStream,
   websocket:!!state.socket,queuedAudio:state.sources.size,reconnectTimer:!!state.reconnectTimer}));
 }catch(e){run.fatal=e.name+': '+e.message.slice(0,160);console.log('LONG_SESSION_ERROR',run.fatal);}
 finally{
  if(page)await page.close().catch(()=>{});await browser.close().catch(()=>{});
  fs.writeFileSync(out,JSON.stringify(run,null,2)+'\n',{mode:0o600});
  console.log('LONG_SESSION_SUMMARY',JSON.stringify({duration:run.stats.duration_seconds,goAway:run.stats.goAway,reconnects:run.stats.reconnectSuccesses,
   connected:run.stats.finalConnected,completed:run.stats.turnCompletions,fatal:run.fatal,cleanup:run.finalCleanup}));
  if(run.fatal||(run.stats.duration_seconds||0)<600)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.name);process.exitCode=2;});
