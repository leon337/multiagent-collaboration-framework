'use strict';
// Playback quality classification: do not label silence between turns as underrun.
// 100ms PCM segments; no audio device, API key or text contents are recorded.
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),crypto=require('node:crypto');
const result={schema:'mcf-f1-metric-classifier/v1',at_utc:new Date().toISOString(),cases:[]};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();
 try{
  await page.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
  const observed=await page.evaluate(()=>{
   const was=state.audioCtx,muted=state.muted;
   let fakeTime=10,starts=[];
   const ctx={state:'running',resume:async()=>{},get currentTime(){return fakeTime;},destination:{},
    createBuffer(_c,frames,rate){return {duration:frames/rate,getChannelData:()=>new Float32Array(frames)};},
    createBufferSource(){return {buffer:null,onended:null,connect(){},disconnect(){},stop(){},
     start(t){starts.push({time:t,length:this.buffer.duration});}}}};
   state.audioCtx=ctx;state.muted=false;state.nextPlay=0;state.sources.clear();state.playbackTurnOpen=false;
   const prev=()=>({underrun:MCFLiveTelemetry.snapshot().metrics.audio_underruns,
                    idle:MCFLiveTelemetry.snapshot().metrics.playback_idle_resumes});
   const before=prev(),chunk=bytesToBase64(new Uint8Array(4800));
   playAudio(chunk);
   fakeTime=11; // 0.78 seconds after the first chunk completed, but same turn.
   playAudio(chunk);
   const afterWithin=prev();
   handleMessage({serverContent:{generationComplete:true,turnComplete:true}});
   fakeTime=22;
   state.f0LastPromptAt=performance.now()-400;
   playAudio(chunk);
   const afterIdle=prev();
   const timings=MCFLiveTelemetry.snapshot().metrics;
   clearPlay();state.audioCtx=was;state.muted=muted;
   return {before,afterWithin,afterIdle,firstPlayback:timings.first_playback_latency_ms,
    scheduled:starts.map(x=>Number(x.time.toFixed(3)))};
  });
  function add(id,pass,obs){result.cases.push({id,result:pass?'PASS':'FAIL',observed:obs});console.log(id,pass?'PASS':'FAIL',JSON.stringify(obs));}
  add('UNDERRUN_ONLY_WITHIN_ACTIVE_GENERATION',observed.afterWithin.underrun===observed.before.underrun+1,observed);
  add('TURN_IDLE_RESUME_EXCLUDED_FROM_UNDERRUN',observed.afterIdle.underrun===observed.afterWithin.underrun&&observed.afterIdle.idle===observed.afterWithin.idle+1,observed);
  add('FIRST_SCHEDULED_AUDIO_LATENCY_INCLUDES_PREBUFFER',observed.firstPlayback.samples===1&&observed.firstPlayback.p50>=490&&observed.firstPlayback.p50<=800,observed.firstPlayback);
 }catch(e){result.error=e.name+': '+e.message.slice(0,160);}
 finally{
  await page.close().catch(()=>{});await browser.close();
  result.passed=result.cases.filter(x=>x.result==='PASS').length;result.failed=result.cases.filter(x=>x.result==='FAIL').length;
  const outfile='/tmp/mcf-f1-qa/metric-classifier.json';
  fs.writeFileSync(outfile,JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log('METRIC_CLASSIFIER',result.passed,'/',result.cases.length);
  if(result.error||result.failed)process.exitCode=1;
 }
})().catch(e=>{console.log('FATAL',e.name);process.exitCode=2;});
