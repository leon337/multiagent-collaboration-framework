'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const sourceRoot=process.env.F1_SOURCE_ROOT||'/tmp/mcf-f1-response-gate/apps/gemini-live-studio';
const report={schema:'mcf-f1-response-watchdog-browser-v1',utc:new Date().toISOString(),url:'http://127.0.0.1:18373',sourceSha256:Object.fromEntries(['public/app.js','public/index.html','public/telemetry.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceRoot,f))).digest('hex')])),results:[],realProvider:false,realSpeaker:false,mediaPersisted:false};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.name));
 const check=(id,ok,observed)=>{report.results.push({id,pass:!!ok,observed});console.log(id,ok?'PASS':'FAIL',JSON.stringify(observed));};
 try{
  await page.goto(process.env.F1_STUDIO_URL||'http://127.0.0.1:18373/',{waitUntil:'networkidle2'});
  check('MANUAL_RECOVERY_BUTTON_AVAILABLE',await page.$('#recoverLastTurn')!==null,{});
  const voice=await page.evaluate(()=>{
   let writes=0; const prior={socket:state.socket,connected:state.connected,stream:state.micStream,ctx:state.micCtx,auto:state.sessionVadAuto,muted:state.muted};
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(){writes++;}};state.connected=true;
   state.micStream={getTracks:()=>[]};state.micCtx={currentTime:30};state.sessionVadAuto=true;state.muted=true;
   const before=MCFLiveTelemetry.snapshot().metrics.voice_to_audio_proxy_ms.samples;
   const frame=rms=>({type:'pcm',buffer:new Int16Array(640).buffer,samples:640,rms,rate:16000,captureTimeSec:29.98,droppedFrames:0});
   for(let i=0;i<4;i++)processAudioFrame(frame(.055));
   for(let i=0;i<20;i++)processAudioFrame(frame(.001));
   const armed={pending:state.pendingPromptAudio,kind:state.pendingTurnKind,writes};
   const speechEnd=state.pendingTurnStartedAt;
   playAudio(btoa(String.fromCharCode(...new Uint8Array(640))));
   const after={pending:state.pendingPromptAudio,voiceProxyRecorded:MCFLiveTelemetry.snapshot().metrics.voice_to_audio_proxy_ms.samples-before,speechEndWasFinite:Number.isFinite(speechEnd)};
   clearPendingTurn();state.muted=prior.muted;state.socket=prior.socket;state.connected=prior.connected;state.micStream=prior.stream;state.micCtx=prior.ctx;state.sessionVadAuto=prior.auto;
   return {armed,after};
  });
  check('VOICE_AUTO_SILENCE_ARMS_WATCHDOG',voice.armed.pending&&voice.armed.kind==='voice'&&voice.armed.writes>=24,voice.armed);
  check('MODEL_AUDIO_DISARMS_VOICE_AND_RECORDS_PROXY',!voice.after.pending&&voice.after.voiceProxyRecorded===1&&voice.after.speechEndWasFinite,voice.after);
  const invalid=await page.evaluate(()=>{
   const oldConnected=state.connected;state.connected=true;
   watchResponse('voice');
   playAudio('@@invalid-base64@@');
   const pending=state.pendingPromptAudio;
   clearPendingTurn();state.connected=oldConnected;
   return {pending};
  });
  check('INVALID_PROVIDER_AUDIO_KEEPS_WATCHDOG_ACTIVE',invalid.pending,invalid);
  const timeout=await page.evaluate(async()=>{
   const oldTimer=window.setTimeout,oldSocket=state.socket,oldConnected=state.connected;
   let writes=0;
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(){writes++;}};state.connected=true;
   window.setTimeout=(fn,ms,...args)=>oldTimer.call(window,fn,ms===20000||ms===16000?35:ms,...args);
   const before=MCFLiveTelemetry.snapshot().metrics.response_timeouts;
   watchResponse('voice');
   await new Promise(resolve=>oldTimer.call(window,resolve,85));
   const a={timeouts:MCFLiveTelemetry.snapshot().metrics.response_timeouts-before,writes,pending:state.pendingPromptAudio,
    recoveryShown:!document.getElementById('recoverLastTurn').hidden};
   handleMessage({serverContent:{generationComplete:true,turnComplete:true}});
   const b={afterPending:state.pendingPromptAudio,silentTurns:MCFLiveTelemetry.snapshot().metrics.silent_turns,recoveryShown:!document.getElementById('recoverLastTurn').hidden};
   clearPendingTurn();window.setTimeout=oldTimer;state.socket=oldSocket;state.connected=oldConnected;
   return {a,b};
  });
  check('VOICE_TIMEOUT_WARNING_NO_AUTOMATIC_REPLAY',timeout.a.timeouts===1&&timeout.a.writes===0&&timeout.a.recoveryShown,timeout.a);
  check('SILENT_TERMINAL_NO_DOUBLE_COUNT_AND_MANUAL_RECOVERY',timeout.b.afterPending===false&&timeout.b.silentTurns>=1&&timeout.b.recoveryShown,timeout.b);
  const recovery=await page.evaluate(()=>{
   const old={socket:state.socket,connected:state.connected,confirm:window.confirm};
   let writes=0;
   state.connected=true;
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(){writes++;}};
   const b=document.getElementById('recoverLastTurn');b.hidden=false;b.disabled=false;
   window.confirm=()=>false;b.click();
   const rejected=writes===0;
   window.confirm=()=>true;b.click();
   const accepted={writes,kind:state.pendingTurnKind,buttonHidden:b.hidden};
   clearPendingTurn();state.socket=old.socket;state.connected=old.connected;window.confirm=old.confirm;
   return {rejected,accepted};
  });
  check('MANUAL_RECOVERY_NEEDS_EXPLICIT_CONFIRM_AND_ONE_SEND',recovery.rejected&&recovery.accepted.writes===1&&recovery.accepted.kind==='text'&&recovery.accepted.buttonHidden,recovery);
  const shutdown=await page.evaluate(()=>{
   const before=MCFLiveTelemetry.snapshot().metrics.response_interrupted;
   watchResponse('text'); // disconnected: should not arm.
   const disconnected=state.pendingPromptAudio;
   state.connected=true;watchResponse('text');state.connected=false;
   clearPendingTurn('socket_closed');
   return {disconnected,after:MCFLiveTelemetry.snapshot().metrics.response_interrupted-before,stillPending:state.pendingPromptAudio};
  });
  check('DISCONNECT_CANCELS_PENDING_WITHOUT_REPLAY',!shutdown.disconnected&&shutdown.after===1&&!shutdown.stillPending,shutdown);
  const stopping=await page.evaluate(()=>{
   const old={connected:state.connected,wantConnected:state.wantConnected,socket:state.socket,stream:state.micStream,voice:state.voiceInSpeech};
   state.connected=true;state.wantConnected=false;state.voiceInSpeech=true;
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(){}};
   state.micStream={getTracks:()=>[{stop(){},readyState:'live'}]};
   clearPendingTurn();
   stopMic();const result={pending:state.pendingPromptAudio,micStopped:!state.micStream};
   state.socket=old.socket;state.connected=old.connected;state.wantConnected=old.wantConnected;state.micStream=old.stream;state.voiceInSpeech=old.voice;
   return result;
  });
  check('EXPLICIT_DISCONNECT_CANNOT_ARM_NEW_VOICE_WATCHDOG',!stopping.pending&&stopping.micStopped,stopping);
  check('NO_UNCAUGHT_BROWSER_ERRORS',jsErrors.length===0,{errors:jsErrors});
 }catch(e){check('BROWSER_EXCEPTION',false,{name:e.name,message:e.message.slice(0,160)});}
 finally{
  await page.close().catch(()=>{});await browser.close().catch(()=>{});
  report.pass=report.results.filter(x=>x.pass).length;
  report.fail=report.results.filter(x=>!x.pass).length;
  fs.writeFileSync('/tmp/mcf-f1-watchdog-qa.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('F1_WATCHDOG_QA',report.pass,'PASS',report.fail,'FAIL');
  if(report.fail)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.message);process.exitCode=2;});
