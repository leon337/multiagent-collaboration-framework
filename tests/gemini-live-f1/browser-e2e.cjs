'use strict';
// F1 browser E2E. Runs on local staging server with virtual media only.
// Never exports raw PCM, screen frames, API keys, tokens or conversation text.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const BASE=process.env.F1_STUDIO_URL||'http://127.0.0.1:18372/';
const report=process.env.F1_REPORT_PATH||path.join(__dirname,'f1-browser-results.json');
const result={date:new Date().toISOString(),origin:BASE,virtual_media:true,real_api:true,cases:[],observed:{},errors:[]};
const srcRoot=process.env.F1_SOURCE_ROOT||path.join(__dirname,'../../apps/gemini-live-studio');
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
result.source_sha256=Object.fromEntries(['server.js','public/app.js','public/index.html','public/telemetry.js','public/capture-worklet.js'].map(rel=>[rel,digest(path.join(srcRoot,rel))]));
result.test_script_sha256=digest(__filename);
const add=(id,ok,detail)=>{result.cases.push({id,result:ok?'PASS':'FAIL',detail});console.log(id,ok?'PASS':'FAIL',detail||'');};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 let page;
 try{
  page=await browser.newPage();
  page.on('pageerror',err=>result.errors.push(err.name));
  await page.goto(BASE,{waitUntil:'networkidle2'});
  const mode=await page.evaluate(()=>({worklet:!!window.AudioWorkletNode,scriptProcessorUsed:document.querySelector('script[src*="capture-worklet"]')!==null}));
  add('BROWSER_WORKLET_CAPABILITY',mode.worklet,'AudioWorkletNode='+mode.worklet);
  add('F1_DASHBOARD_RENDERED',await page.$eval('#f1Metrics',x=>!!x),'F1 diagnostics in UI');
  const manual=await page.evaluate(()=>{
   const oldSocket=state.socket,oldConnected=state.connected,oldStream=state.micStream,oldVad=$('vad').checked;
   const sent=[];state.socket={readyState:1,bufferedAmount:0,send:v=>sent.push(JSON.parse(v))};
   state.connected=true;state.micStream={getTracks:()=>[]};$('vad').checked=false;
   state.manualVadStarted=false;state.micSpeechFrames=0;state.micSilenceMs=0;state.preRoll=[];state.micActive=false;
   const buf=new Int16Array(640).buffer;
   for(let i=0;i<4;i++)processAudioFrame({buffer:buf,rms:.08,samples:640});
   for(let i=0;i<25;i++)processAudioFrame({buffer:buf,rms:.001,samples:640});
   const stats={started:sent.filter(x=>x.realtimeInput?.activityStart).length,ended:sent.filter(x=>x.realtimeInput?.activityEnd).length,pcm:sent.filter(x=>x.realtimeInput?.audio).length,after:state.manualVadStarted};
   $('vad').checked=oldVad;state.socket=oldSocket;state.connected=oldConnected;state.micStream=oldStream;
   state.manualVadStarted=false;state.preRoll=[];state.micSpeechFrames=0;state.micSilenceMs=0;
   return stats;
  });
  add('MANUAL_VAD_START_END',manual.started===1&&manual.ended===1&&!manual.after,JSON.stringify(manual));
  add('MANUAL_VAD_PREROLL_AND_PCM',manual.pcm>=15,'PCM frames='+manual.pcm);
  const interrupted=await page.evaluate(()=>{
    let stops=0;state.sources.add({stop(){stops++;},disconnect(){}});
    state.nextPlay=1000;
    handleMessage({serverContent:{interrupted:true}});
    return {stops,empty:state.sources.size===0,nextPlay:state.nextPlay};
  });
  add('INTERRUPTION_CLEARS_PLAYBACK',interrupted.stops===1&&interrupted.empty&&interrupted.nextPlay===0,JSON.stringify(interrupted));
  const backpressure=await page.evaluate(()=>{
   const old=state.socket,was=state.connected;
   let writes=0;state.socket={readyState:1,bufferedAmount:400001,send:()=>writes++};state.connected=true;
   const sent=send({realtimeInput:{audio:{mimeType:'audio/pcm;rate=16000',data:'AA=='}}});
   state.socket=old;state.connected=was;
   return {sent,writes,metrics:window.MCFLiveTelemetry.snapshot().metrics.input_frames_dropped};
  });
  add('BACKPRESSURE_DROPS_FRAMES',!backpressure.sent&&backpressure.writes===0&&backpressure.metrics>=1,JSON.stringify(backpressure));
  const playback=await page.evaluate(async()=>{
    const src=new Uint8Array(48000),b64=bytesToBase64(src);
    const before=state.playDropCount;
    for(let i=0;i<5;i++)playAudio(b64);
    const queue=state.audioCtx?state.nextPlay-state.audioCtx.currentTime:Infinity;
    const drops=state.playDropCount-before;
    clearPlay();
    await state.audioCtx?.close();state.audioCtx=null;
    return {drops,queueSec:Number(queue.toFixed(2)),cleared:state.sources.size===0};
  });
  add('PLAYBACK_QUEUE_BACKLOG_BOUNDED',playback.drops>=1&&playback.queueSec<=2.2&&playback.cleared,JSON.stringify(playback));
  const generation=await page.evaluate(()=>{const old=MCFLiveTelemetry.snapshot().events.filter(x=>x.event==='generation_complete').length;handleMessage({serverContent:{generationComplete:true}});return MCFLiveTelemetry.snapshot().events.filter(x=>x.event==='generation_complete').length===old+1;});
  add('GENERATION_COMPLETE_SIGNAL',generation,'counted without replay');
  await page.select('#model','gemini-2.5-flash-native-audio-preview-12-2025');
  await page.click('#connect');
  try{await page.waitForFunction(()=>state.connected,{timeout:17000});add('LIVE_SETUP_REAL',true,'setupComplete');}
  catch(e){add('LIVE_SETUP_REAL',false,e.name);throw e;}
  await page.evaluate(()=>{
   window.__f1Media={frames:0,bytes:0};
   const ws=state.socket,original=ws.send.bind(ws);
   ws.send=(text)=>{
    try{const m=JSON.parse(text);const chunk=m.realtimeInput?.audio?.data;if(chunk){window.__f1Media.frames++;window.__f1Media.bytes+=Math.floor(chunk.length*.75);}}catch{}
    return original(text);
   };
  });
  await page.click('#mic');
  await page.waitForFunction(()=>!!state.micStream&&!!state.micNode,{timeout:8000});
  await new Promise(ok=>setTimeout(ok,1550));
  const mic=await page.evaluate(()=>({frames:window.__f1Media.frames,bytes:window.__f1Media.bytes,worklet:state.micNode instanceof AudioWorkletNode,sampleRate:state.micCtx.sampleRate,streamLive:state.micStream.getAudioTracks().every(x=>x.readyState==='live')}));
  add('WORKLET_AUDIO_SENT_REAL',mic.worklet&&mic.frames>=15&&mic.bytes>=16000,JSON.stringify(mic));
  await page.click('#mic');
  await page.waitForFunction(()=>!state.micStream&&!state.micNode,{timeout:4000});
  add('WORKLET_STOP_CLEAN',await page.evaluate(()=>!state.micStream&&!state.micCtx&&!state.micNode),'no dangling input stream or context');
  // Session resume may arrive on idle; create a short turn if no handle (no text persisted in this report).
  if(!(await page.evaluate(()=>!!state.resumeHandle))){
   await page.type('#prompt','Responda em uma frase breve, por favor.');await page.click('#send');
   await page.waitForFunction(()=>!!state.resumeHandle,{timeout:14000}).catch(()=>{});
  }
  const hasHandle=await page.evaluate(()=>!!state.resumeHandle);
  result.observed.handle_available=hasHandle;
  result.observed.resume_handle_at_close=hasHandle;
  const userMessagesBefore=await page.evaluate(()=>state.transcript.filter(x=>x.role==='user').length);
  await page.evaluate(()=>state.socket.close(1000,'network-reconnect-test'));
  try{
   await page.waitForFunction(()=>state.connected&&window.MCFLiveTelemetry.snapshot().metrics.reconnect_successes>=1,{timeout:17000});
   const counters=await page.evaluate(()=>({success:MCFLiveTelemetry.snapshot().metrics.reconnect_successes,attempts:MCFLiveTelemetry.snapshot().metrics.reconnect_attempts,users:state.transcript.filter(x=>x.role==='user').length}));
   add('WEBSOCKET_RECONNECT_REAL',counters.success>=1&&counters.attempts>=1,'reconnected to Google Live API');
   add('NO_DUPLICATE_USER_TURNS_AFTER_RECONNECT',counters.users===userMessagesBefore,'user turns before/after='+userMessagesBefore+'/'+counters.users);
  }catch(e){add('WEBSOCKET_RECONNECT_REAL',false,'timeout waiting for setupComplete');}
  if(hasHandle)add('RESUMPTION_HANDLE_PRESENT',true,'handle available; context preservation not independently attested');
  else result.observed.session_resumption='NOT_VERIFIED_NO_HANDLE';
  const serverEvent=await page.evaluate(()=>{const n=state.goAwayCount;handleMessage({goAway:{timeLeft:'2s'}});return state.goAwayCount===n+1;});
  add('GOAWAY_SIGNAL_RECOGNIZED',serverEvent,'event counted, no raw token logged');
  await page.click('#disconnect');
  await new Promise(ok=>setTimeout(ok,300));
  add('FINAL_RESOURCE_CLEANUP',await page.evaluate(()=>!state.connected&&!state.micStream&&!state.cameraStream&&!state.screenStream&&!state.reconnectTimer),'no active media or retry');
  add('NO_JS_RUNTIME_ERRORS',result.errors.length===0,'pageErrors='+result.errors.length);
 }catch(e){add('TEST_EXCEPTION',false,e.name+': '+e.message.slice(0,180));}
 finally{
  try{if(page)await page.close();}catch{}
  await browser.close();
  result.passed=result.cases.filter(x=>x.result==='PASS').length;
  result.failed=result.cases.filter(x=>x.result==='FAIL').length;
  fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log('SUMMARY',JSON.stringify({pass:result.passed,fail:result.failed,handleAvailable:result.observed.handle_available}));
  if(result.failed)process.exitCode=1;
 }
})().catch(e=>{console.error('F1 Browser harness failed:',e.name);process.exitCode=2;});
