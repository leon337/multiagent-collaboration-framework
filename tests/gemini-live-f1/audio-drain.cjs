'use strict';
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs');
const url=process.env.F1_STUDIO_URL||'http://127.0.0.1:18372/';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.name));
 const result={date:new Date().toISOString(),provider:'Gemini Live',real_api:true,virtual_audio_output:true};
 try{
  await page.goto(url,{waitUntil:'networkidle2'});
  await page.select('#model',process.env.F1_TEST_MODEL||'gemini-2.5-flash-native-audio-preview-12-2025');
  await page.click('#connect');
  await page.waitForFunction(()=>state.connected,{timeout:18000});
  await page.evaluate(()=>{
    window.__audioDrain={audioNodes:0,startCalls:0,stopCalls:0,endedCalls:0,interruptsAtStart:MCFLiveTelemetry.snapshot().metrics.barge_in_events,starts:[],totalSamplesAtStart:state.playScheduledSamples};
    const ctx=state.audioCtx;
    const original=ctx.createBufferSource.bind(ctx);
    ctx.createBufferSource=()=>{
      const src=original();const ostart=src.start.bind(src),ostop=src.stop.bind(src);
      window.__audioDrain.audioNodes++;
      src.start=(when)=>{window.__audioDrain.startCalls++;window.__audioDrain.starts.push({when,duration:src.buffer?.duration||0});return ostart(when);};
      src.stop=(...args)=>{window.__audioDrain.stopCalls++;return ostop(...args);};
      src.addEventListener('ended',()=>window.__audioDrain.endedCalls++);
      return src;
    };
  });
  await page.type('#prompt','Responda somente por voz, em português brasileiro, com uma história de pelo menos dez segundos, aproximadamente cinco frases completas, e termine com a expressão fim da história.');
  await page.click('#send');
  await page.waitForFunction(()=>state.events.some(x=>x.type==='SESSÃO'&&x.detail==='Turno concluído.')&&window.__audioDrain.audioNodes>0,{timeout:50000});
  const atTurnEnd=await page.evaluate(()=>({nodes:__audioDrain.audioNodes,ended:__audioDrain.endedCalls,pending:state.sources.size,seconds:state.playScheduledSamples/24000,contextState:state.audioCtx.state}));
  await page.waitForFunction(()=>state.sources.size===0,{timeout:45000});
  result.atTurnEnd=atTurnEnd;result.model=process.env.F1_TEST_MODEL||'gemini-2.5-flash-native-audio-preview-12-2025';
  result.final=await page.evaluate(()=>{
   const m=window.__audioDrain;
   const all=m.starts;
   let overlap=0,gap=0;
   for(let i=1;i<all.length;i++){
     const diff=all[i].when-(all[i-1].when+all[i-1].duration);
     if(diff<-.00001)overlap++;
     if(diff>.00001)gap++;
   }
   const last=all.at(-1);
   return {audioNodes:m.audioNodes,startCalls:m.startCalls,stopCalls:m.stopCalls,endedCalls:m.endedCalls,
     scheduledSamples:state.playScheduledSamples-m.totalSamplesAtStart,
     playedSamples:state.playFinishedSamples,
     seconds:(state.playScheduledSamples-m.totalSamplesAtStart)/24000,
     interrupted:MCFLiveTelemetry.snapshot().metrics.barge_in_events-m.interruptsAtStart,
     overlap,gap,queueEmpty:state.sources.size===0,
     audioContextRunning:state.audioCtx.state==='running',
     lastEnd:last?.when+last?.duration};
  });
  const f=result.final;
  result.pass=f.audioNodes>0&&f.audioNodes===f.startCalls&&f.startCalls===f.endedCalls&&f.stopCalls===0&&f.interrupted===0&&f.overlap===0&&f.gap===0&&f.queueEmpty&&f.audioContextRunning&&f.seconds>2;
  console.log('AUDIO_OUTPUT_DRAIN',result.pass?'PASS':'FAIL',JSON.stringify({...f,lastEnd:undefined}));
  await page.click('#disconnect');
  result.pageErrors=errors.length;
 }catch(e){result.pass=false;result.failure=e.name+': '+e.message.slice(0,200);console.log('AUDIO_OUTPUT_DRAIN FAIL',result.failure);}
 finally{
  try{await page.close();}catch{}
  await browser.close();
  fs.writeFileSync(process.env.F1_DRAIN_REPORT||'/home/leo/Projetos/gemini-live-studio-f1/f1/audio-drain-results.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log('FINISHED',result.pass?'PASS':'FAIL','errors',errors.length);
  if(!result.pass)process.exitCode=1;
 }
})().catch(e=>{console.error(e.name,e.message);process.exitCode=2;});
