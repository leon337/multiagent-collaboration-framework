'use strict';
// Checks real microphone path via browser AudioWorklet, never sends mic to Gemini or writes PCM.
const fs=require('node:fs');
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const result={schema:'mcf-f1-physical-browser/v1',at_utc:new Date().toISOString(),mediaPersisted:false};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 let page;
 try{
  page=await browser.newPage();
  await page.goto('http://127.0.0.1:18372/',{waitUntil:'networkidle2'});
  await page.evaluate(()=>navigator.permissions?.query?.({name:'microphone'}).catch(()=>({state:'unknown'})));
  result.capture=await page.evaluate(async()=>{
   let ctx=null,stream=null,node=null,source=null,gain=null;
   let frames=0,samples=0,maxRms=0,sumRms=0;
   try{
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const track=stream.getAudioTracks()[0];
    if(!track)throw Error('NO_AUDIO_TRACK');
    ctx=new AudioContext({latencyHint:'interactive'});
    await ctx.audioWorklet.addModule('/capture-worklet.js');
    source=ctx.createMediaStreamSource(stream);
    node=new AudioWorkletNode(ctx,'pcm16-capture',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{frameSamples:640}});
    gain=ctx.createGain();gain.gain.value=0;
    source.connect(node);node.connect(gain);gain.connect(ctx.destination);
    node.port.onmessage=e=>{
      if(e.data?.type==='pcm'){
       frames++;samples+=e.data.samples;
       maxRms=Math.max(maxRms,Number(e.data.rms||0));sumRms+=Number(e.data.rms||0);
       // Crucial: raw buffer discarded immediately, never copied, serialized or sent.
      }
    };
    await ctx.resume();
    await new Promise(ok=>setTimeout(ok,2800));
    const o={ok:frames>=30,deviceLabel:track.label,trackActive:track.readyState==='live',
     inputSampleRate:ctx.sampleRate,outputSampleRate:16000,pcmFrames:frames,pcmSamples:samples,
     meanRms:Number((sumRms/(frames||1)).toFixed(6)),maxRms:Number(maxRms.toFixed(6)),
     deviceIdPersisted:false,pcmPersisted:false};
    return o;
   }catch(e){return {ok:false,error:e.name,message:e.message.slice(0,90)};}
   finally{
    try{node?.port.postMessage({type:'stop'});}catch{}
    try{node?.disconnect();}catch{}
    try{source?.disconnect();}catch{}
    try{gain?.disconnect();}catch{}
    stream?.getTracks().forEach(t=>t.stop());
    await ctx?.close().catch(()=>{});
   }
  });
  result.status=result.capture.ok?'PASS':'INCOMPLETE';
  console.log('PHYSICAL_BROWSER',JSON.stringify(result.capture));
 }catch(e){result.status='ERROR';result.error=e.name+': '+e.message.slice(0,120);}
 finally{if(page)await page.close().catch(()=>{});await browser.close();
  fs.mkdirSync('/tmp/mcf-f1-qa',{recursive:true});
  fs.writeFileSync('/tmp/mcf-f1-qa/browser-physical.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
  if(result.status!=='PASS')process.exitCode=1;
 }
})().catch(e=>{console.error(e.name);process.exitCode=2;});
