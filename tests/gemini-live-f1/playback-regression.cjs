'use strict';
// Regression for uninterrupted, ordered 24kHz PCM chunks — no user media or secrets.
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const BASE=process.env.F1_STUDIO_URL||'http://127.0.0.1:18372/';
const SOURCE=process.env.F1_SOURCE_ROOT||'/home/leo/Projetos/gemini-live-studio-f1';
const OUT=process.env.F1_PLAYBACK_REPORT||'/home/leo/Projetos/gemini-live-studio-f1/f1/playback-regression.json';
const cases=[];
function record(id,passed,observed){cases.push({id,passed,observed});console.log(id,passed?'PASS':'FAIL',JSON.stringify(observed));}
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.name));
 try{
  await page.goto(BASE,{waitUntil:'networkidle2'});
  const r=await page.evaluate(()=>{
   const previous=state.audioCtx;
   const started=[],stopped=[],finished=[];
   let mockTime=5;
   const ctx={state:'running',get currentTime(){return mockTime;},resume:async()=>{},destination:{},
    createBuffer(n,frames,sampleRate){const dest=new Float32Array(frames);return {duration:frames/sampleRate,getChannelData:()=>dest};},
    createBufferSource(){const src={buffer:null,onended:null,connect(){},disconnect(){},
       start(at){started.push({at,duration:this.buffer.duration});},
       stop(){stopped.push(started.length);}};
       return src;
    }};
   state.audioCtx=ctx;state.muted=false;state.nextPlay=0;state.sources.clear();
   state.playbackEpoch=0;state.playScheduledSamples=0;state.playFinishedSamples=0;
   const samples=2400; // 100ms PCM at 24kHz
   const chunk=bytesToBase64(new Uint8Array(samples*2)); // silence, no actual sound
   for(let i=0;i<200;i++)playAudio(chunk); // 20s delivered in an immediate burst
   const first={count:started.length,stopped:stopped.length,pending:state.sources.size,
                queueSeconds:state.nextPlay-ctx.currentTime,samples:state.playScheduledSamples};
   let overlapping=0,gaps=0;
   for(let i=1;i<started.length;i++){
     const delta=started[i].at-(started[i-1].at+started[i-1].duration);
     if(delta<-.000001)overlapping++;
     if(delta>.000001)gaps++;
   }
   handleMessage({serverContent:{generationComplete:true,turnComplete:true}});
   const afterGeneration={stopped:stopped.length,pending:state.sources.size,queueSeconds:state.nextPlay-ctx.currentTime};
   // Microphone hears the speaker: default must NOT cancel audio.
   const saved={socket:state.socket,connected:state.connected,micStream:state.micStream,sessionVadAuto:state.sessionVadAuto};
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(){}};
   state.connected=true;state.micStream={getTracks:()=>[]};state.sessionVadAuto=true;
   state.micSpeechFrames=0;state.micActive=false;$('fastBargeIn').checked=false;
   for(let i=0;i<20;i++)processAudioFrame({buffer:new Int16Array(640).buffer,rms:0.3,samples:640});
   const echo={stopped:stopped.length,pending:state.sources.size};
   state.socket=saved.socket;state.connected=saved.connected;state.micStream=saved.micStream;state.sessionVadAuto=saved.sessionVadAuto;
   // Real confirmed interruption cancels the stream deliberately.
   handleMessage({serverContent:{interrupted:true}});
   const afterInterrupt={stopped:stopped.length,pending:state.sources.size,nextPlay:state.nextPlay};
   playAudio(chunk);
   const afterRestart={start:started.at(-1).at,stopped:stopped.length,pending:state.sources.size};
   clearPlay();state.audioCtx=previous;
   return {first,overlapping,gaps,afterGeneration,echo,afterInterrupt,afterRestart};
  });
  record('ALL_200_CHUNKS_ACCEPTED',r.first.count===200&&r.first.stopped===0&&r.first.pending===200&&r.first.samples===480000,r.first);
  record('SAMPLE_EXACT_CONTIGUOUS_TIMELINE',r.overlapping===0&&r.gaps===0&&Math.abs(r.first.queueSeconds-20.12)<0.01,{overlap:r.overlapping,gaps:r.gaps,duration:r.first.queueSeconds});
  record('GENERATION_COMPLETE_DOES_NOT_TRUNCATE',r.afterGeneration.stopped===0&&r.afterGeneration.pending===200,r.afterGeneration);
  record('SPEAKER_ECHO_DOES_NOT_SELF_INTERRUPT',r.echo.stopped===0&&r.echo.pending===200,r.echo);
  record('SERVER_INTERRUPTED_STOPS_AUDIO',r.afterInterrupt.stopped===200&&r.afterInterrupt.pending===0&&r.afterInterrupt.nextPlay===0,r.afterInterrupt);
  record('NEXT_TURN_CAN_START_CLEANLY',r.afterRestart.pending===1&&r.afterRestart.start>=5.1,r.afterRestart);
  const netClose=await page.evaluate(async()=>{
   const realFetch=window.fetch,RealWS=window.WebSocket,ctxBefore=state.audioCtx;
   const nodes=[],stops=[];
   try{
    window.fetch=async(input,opts)=>String(input).includes('/api/token')?
      {ok:true,status:200,json:async()=>({token:'fake-token-not-real'})}:realFetch(input,opts);
    class FakeWebSocket{
     static OPEN=1;
     constructor(){this.readyState=1;}
     send(){}
     close(){this.readyState=3;}
    }
    window.WebSocket=FakeWebSocket;
    await connect(false);
    const ws=state.socket;
    await ws.onmessage({data:JSON.stringify({setupComplete:{}})});
    state.audioCtx={state:'running',currentTime:3,resume:async()=>{},destination:{},
      createBuffer(n,frames,rate){return {duration:frames/rate,getChannelData:()=>new Float32Array(frames)};},
      createBufferSource(){return {buffer:null,onended:null,connect(){},disconnect(){},
        start(when){nodes.push(when);},stop(){stops.push(1);}};}
    };
    const chunk=bytesToBase64(new Uint8Array(4800));
    for(let i=0;i<20;i++)playAudio(chunk);
    const before=state.sources.size;
    ws.onclose({code:1006});
    const after=state.sources.size;
    const observed={before,after,stopCalls:stops.length,socketClosed:state.socket===null,
      stillQueuedSeconds:Number((state.nextPlay-3).toFixed(2))};
    disconnect();
    return {pass:before===20&&after===20&&observed.stopCalls===0&&observed.socketClosed,observed};
   }finally{
    state.audioCtx=ctxBefore;window.WebSocket=RealWS;window.fetch=realFetch;
   }
  });
  record('WEBSOCKET_CLOSE_DRAINS_ALREADY_RECEIVED_AUDIO',netClose.pass,netClose.observed);
  record('NO_BROWSER_EXCEPTIONS',errors.length===0,{errors:errors.length});
 }catch(e){record('TEST_EXCEPTION',false,{name:e.name,message:e.message.slice(0,140)});}
 finally{
  await page.close().catch(()=>{});await browser.close();
  const hashes={};
  for(const rel of ['public/app.js','public/index.html'])hashes[rel]=crypto.createHash('sha256').update(fs.readFileSync(path.join(SOURCE,rel))).digest('hex');
  const output={schema:'mcf-f1-playback-regression/v1',utc:new Date().toISOString(),origin:BASE,synthetic_pcm:true,cases,passed:cases.filter(c=>c.passed).length,failed:cases.filter(c=>!c.passed).length,source_sha256:hashes};
  fs.writeFileSync(OUT,JSON.stringify(output,null,2)+'\n',{mode:0o600});
  console.log('PLAYBACK_REGRESSION',output.passed,'/',cases.length);
  if(output.failed)process.exitCode=1;
 }
})().catch(e=>{console.error(e.name,e.message);process.exitCode=2;});
