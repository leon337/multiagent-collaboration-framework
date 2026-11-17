'use strict';
// F1.4 text->first scheduled audio latency sampling. Voice-end metric needs real user speaking.
// Uses real Gemini Live with existing locally configured credentials; stores numeric metrics only.
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const URL=process.env.F1_STUDIO_URL||'http://127.0.0.1:18372/',TOTAL=Number(process.env.F1_BENCH_TURNS||30);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const report={schema:'mcf-f1-text-to-playback-benchmark/v1',started_at:new Date().toISOString(),
 model:'gemini-2.5-flash-native-audio-preview-12-2025',target_turns:TOTAL,metrics:'text-send to first scheduled audio (not human speech-end)',
 sourceAppSHA:crypto.createHash('sha256').update(fs.readFileSync(path.join(process.env.F1_SOURCE_ROOT||'/home/leo/Projetos/gemini-live-studio-f1','public/app.js'))).digest('hex'),
 modelInputIsSynthetic:true,mediaPersisted:false,turns:[],pageErrors:[],limitations:['Not voice-end-to-playback latency','No real microphone used','Token costs not independently metered','No guaranteed provider quota']};
const pct=(xs,p)=>xs.length?xs.slice().sort((a,b)=>a-b)[Math.max(0,Math.ceil(p*xs.length)-1)]:null;
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 let page;
 try{
  page=await browser.newPage();page.on('pageerror',e=>report.pageErrors.push(e.name));
  await page.goto(URL,{waitUntil:'networkidle2'});
  await page.select('#model',report.model);
  await page.evaluate(()=>{$('compression').checked=true;$('resumption').checked=true;});
  await page.click('#connect');await page.waitForFunction(()=>state.connected,{timeout:18000});
  for(let i=0;i<TOTAL;i++){
   const start=new Date().toISOString(),before=await page.evaluate(()=>({done:state.events.filter(e=>e.type==='SESSÃO'&&e.detail==='Turno concluído.').length,
    generation:MCFLiveTelemetry.snapshot().events.filter(e=>e.event==='generation_complete').length,
    starts:state.playScheduledSamples}));
   await page.$eval('#prompt',(node,value)=>{node.value=value;},'Responda com uma saudação de duas palavras, em português. Este é um teste técnico.');
   await page.click('#send');
   let completion=false,found=null,turnDoneAt=null;
   const deadline=Date.now()+16000;
   while(Date.now()<deadline){
    const status=await page.evaluate((begin)=>({
      connected:state.connected,
      first_playbacks:MCFLiveTelemetry.snapshot().events.filter(e=>e.event==='first_playback'&&e.at>=begin).map(e=>e.latency_ms),
      done:state.events.filter(e=>e.type==='SESSÃO'&&e.detail==='Turno concluído.').length,
      generationAt:MCFLiveTelemetry.snapshot().events.filter(e=>e.event==='generation_complete'&&e.at>=begin).length,
      activeSources:state.sources.size,
      dropCount:state.workletDrops,
      underruns:state.playUnderruns
    }),start);
    if(status.first_playbacks.length)found=status.first_playbacks[0];
    if(status.done>before.done||status.generationAt>0){completion=true;turnDoneAt=Date.now();break;}
    if(!status.connected)break;
    await sleep(100);
   }
   report.turns.push({turn:i+1,first_scheduled_audio_ms:found,terminal_seen:completion,
    timeout:!completion,under_16s:completion,clock_start_utc:start});
   console.log('LATENCY_TURN',i+1,found,completion?'COMPLETE':'INCOMPLETE');
   if(!completion)break;
   // Do not overlap new model generations or backlog.
   try{await page.waitForFunction(()=>state.sources.size===0,{timeout:8000});}
   catch{report.turns.at(-1).drain_timeout=true;break;}
   await sleep(300);
  }
  report.end=await page.evaluate(()=>({underruns:state.playUnderruns,normalIdleResumes:state.playbackIdleResumes,
   inputWorkletDroppedFrames:state.workletDrops,connected:state.connected,
   goAway:MCFLiveTelemetry.snapshot().metrics.go_away_events,
   reconnects:MCFLiveTelemetry.snapshot().metrics.reconnect_successes}));
  await page.click('#disconnect');
 }catch(e){report.error=e.name+': '+e.message.slice(0,160);}
 finally{
  await page?.close().catch(()=>{});await browser.close().catch(()=>{});
  report.finished_at=new Date().toISOString();
  const vals=report.turns.filter(t=>t.terminal_seen&&Number.isFinite(t.first_scheduled_audio_ms)).map(t=>t.first_scheduled_audio_ms);
  report.summary={attempted:report.turns.length,completeWithAudio:vals.length,target:TOTAL,
    p50_ms:pct(vals,.5),p95_ms:pct(vals,.95),min_ms:vals.length?Math.min(...vals):null,
    max_ms:vals.length?Math.max(...vals):null,quality:'Exploratory synthetic text->scheduled playback, never voice mouth-to-ear'};
  fs.writeFileSync('/tmp/mcf-f1-qa/30turn-latency-q3.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('LATENCY_SUMMARY',JSON.stringify({summary:report.summary,end:report.end,error:report.error}));
  if(report.turns.length<TOTAL||vals.length<TOTAL||report.turns.some(t=>t.drain_timeout))process.exitCode=1;
 }
})().catch(e=>{console.log('FATAL',e.name,e.message);process.exitCode=2;});
