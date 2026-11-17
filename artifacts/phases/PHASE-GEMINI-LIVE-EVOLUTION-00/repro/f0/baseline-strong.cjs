'use strict';
// F0 strengthened synthetic-media E2E. No physical recording, secrets or personal screenshots.
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const BASE='http://127.0.0.1:18371/';
const out=path.join(__dirname,'BASELINE-STRONG.json');
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const results={schema:'mcf-f0-strong-e2e/v1',time:new Date().toISOString(),virtual_media:true,origin:BASE,cases:[],counters:{},browser_errors:[]};
 const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const root=path.resolve(__dirname,'..');
 results.source_sha256=Object.fromEntries(['server.js','public/app.js','public/index.html','public/style.css','public/telemetry.js'].map(rel=>[rel,sha(path.join(root,rel))]));
 results.test_script_sha256=sha(__filename);
 const add=(id,pass,detail)=>{results.cases.push({id,status:pass?'PASS':'FAIL',detail});console.log(id,pass?'PASS':'FAIL',detail||'');};
 let page;
 try{
  page=await browser.newPage();
  page.on('pageerror',e=>results.browser_errors.push(e.name));
  await page.goto(BASE,{waitUntil:'networkidle2'});
  await page.select('#model','gemini-2.5-flash-native-audio-preview-12-2025');
  await page.click('#connect');
  await page.waitForFunction(()=>state.connected,{timeout:15000});
  add('REAL_MODEL_25_SETUP',true,'setupComplete');
  await page.evaluate(()=>{
   window.__strong={sentAudioFrames:0,sentAudioBytes:0,sentCameraFrames:0,sentScreenFrames:0,sentImageMessages:0,sentTextMessages:0,sentFunctionResponses:0,modelAudioChunks:0,modelAudioBytes:0,inputTranscriptions:0,outputTranscriptions:0,turnComplete:0,toolCallNames:[],toolResponseNames:[],retainedTracks:[]};
   const st=window.__strong,s=state.socket,send=s.send.bind(s);
   s.send=(serialized)=>{
    try{
     const d=JSON.parse(serialized);
     const a=d.realtimeInput?.audio, v=d.realtimeInput?.video;
     if(a?.mimeType==='audio/pcm;rate=16000'&&a.data){st.sentAudioFrames++;st.sentAudioBytes+=Math.floor(a.data.length*3/4);}
     if(v?.mimeType==='image/jpeg'&&v.data){if(state.screenStream)st.sentScreenFrames++;else st.sentCameraFrames++;}
     if(d.clientContent?.turns?.length){for(const t of d.clientContent.turns)for(const part of t.parts||[]){if(part.inlineData?.data)st.sentImageMessages++;if(part.text)st.sentTextMessages++;}}
     if(d.toolResponse?.functionResponses){st.sentFunctionResponses+=d.toolResponse.functionResponses.length;for(const x of d.toolResponse.functionResponses)st.toolResponseNames.push(x.name);}
    }catch{}
    return send(serialized);
   };
   s.addEventListener('message',async e=>{
    try{
     const raw=typeof e.data==='string'?e.data:e.data instanceof Blob?await e.data.text():new TextDecoder().decode(e.data);
     const m=JSON.parse(raw);
     for(const c of m.toolCall?.functionCalls||[])st.toolCallNames.push(c.name);
     if(m.serverContent?.inputTranscription?.text)st.inputTranscriptions++;
     if(m.serverContent?.outputTranscription?.text)st.outputTranscriptions++;
     if(m.serverContent?.turnComplete)st.turnComplete++;
     for(const p of m.serverContent?.modelTurn?.parts||[])if(p.inlineData?.data&&String(p.inlineData?.mimeType||'').startsWith('audio/')){st.modelAudioChunks++;st.modelAudioBytes+=Math.floor(p.inlineData.data.length*3/4);}
    }catch{}
   });
  });
  await page.click('#mic');
  await page.waitForFunction(()=>!!state.micStream,{timeout:6000});
  await new Promise(ok=>setTimeout(ok,1600));
  const audioStats=await page.evaluate(()=>{__strong.retainedTracks.push(...state.micStream.getTracks());return {frames:__strong.sentAudioFrames,bytes:__strong.sentAudioBytes};});
  add('PCM_AUDIO_FRAMES_SENT',audioStats.frames>=3&&audioStats.bytes>=1024,JSON.stringify(audioStats));
  await page.click('#mic');
  await page.click('#camera');
  await page.waitForFunction(()=>!!state.cameraStream,{timeout:6000});
  await new Promise(ok=>setTimeout(ok,1600));
  const cameraFrames=await page.evaluate(()=>{__strong.retainedTracks.push(...state.cameraStream.getTracks());return __strong.sentCameraFrames;});
  add('JPEG_CAMERA_FRAMES_SENT',cameraFrames>=1,'frames='+cameraFrames);
  await page.click('#camera');
  await page.evaluate(()=>{navigator.mediaDevices.getDisplayMedia=()=>navigator.mediaDevices.getUserMedia({video:true,audio:false});});
  await page.click('#screen');
  await page.waitForFunction(()=>!!state.screenStream,{timeout:6000});
  await new Promise(ok=>setTimeout(ok,1600));
  const screenFrames=await page.evaluate(()=>{__strong.retainedTracks.push(...state.screenStream.getTracks());return __strong.sentScreenFrames;});
  add('JPEG_SCREEN_FRAMES_SENT',screenFrames>=1,'frames='+screenFrames+' (mock display capture)');
  await page.click('#screen');
  const before=await page.evaluate(()=>__strong.sentImageMessages);
  await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=48;c.height=48;
   const ctx=c.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(0,0,48,48);
   const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));
   const file=new File([blob],'F0-SYNTHETIC.png',{type:'image/png'});
   const transfer=new DataTransfer();transfer.items.add(file);
   const input=document.getElementById('imageFile');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await new Promise(ok=>setTimeout(ok,1400));
  const after=await page.evaluate(()=>__strong.sentImageMessages);
  add('IMAGE_FILE_MULTIMODAL_SENT',after>before,'image_messages='+(after-before));
  await page.type('#prompt','Neste teste de diagnóstico, chame a função get_current_time e depois responda uma frase em português.');
  await page.click('#send');
  await page.waitForFunction(()=>__strong.toolResponseNames.includes('get_current_time')&&__strong.turnComplete>0&&__strong.modelAudioChunks>0,{timeout:25000}).catch(()=>{});
  await new Promise(ok=>setTimeout(ok,500));
  const stats=await page.evaluate(()=>({...__strong,retainedTracks:__strong.retainedTracks.map(t=>t.readyState),socketConnected:state.connected}));
  results.counters={...stats,retainedTracks:undefined};
  add('REAL_TEXT_SENT',stats.sentTextMessages>=2,'text_messages='+stats.sentTextMessages);
  add('TOOL_GET_CURRENT_TIME_REAL',stats.toolCallNames.includes('get_current_time')&&stats.toolResponseNames.includes('get_current_time'),'tool_calls='+stats.toolCallNames.length+' tool_responses='+stats.sentFunctionResponses);
  add('AUDIO_PCM_RESPONSE_REAL',stats.modelAudioChunks>0&&stats.modelAudioBytes>=256,'audio_chunks='+stats.modelAudioChunks+' bytes='+stats.modelAudioBytes);
  add('MODEL_TURN_AND_TRANSCRIPT',stats.turnComplete>0&&stats.outputTranscriptions>0,'turns='+stats.turnComplete+' transcript_chunks='+stats.outputTranscriptions);
  await page.click('#disconnect');
  await new Promise(ok=>setTimeout(ok,350));
  const clean=await page.evaluate(()=>({cleared:!state.micStream&&!state.cameraStream&&!state.screenStream&&!state.connected,tracks:__strong.retainedTracks.map(t=>t.readyState)}));
  add('TRACKS_ACTUALLY_ENDED',clean.cleared&&clean.tracks.length>=3&&clean.tracks.every(x=>x==='ended'),JSON.stringify(clean));
  for(const [model,label] of [['gemini-3.8-live','LIVE_3_8_SETUP'],['gemini-3.8-live-extended-thinking','LIVE_EXTENDED_SETUP']]){
   await page.select('#model',model);await page.click('#connect');
   try{await page.waitForFunction(()=>state.connected,{timeout:16000});add(label,true,'setupComplete');}
   catch{add(label,false,'setup missing');}
   if(await page.evaluate(()=>state.connected))await page.click('#disconnect');
  }
  add('NO_BROWSER_RUNTIME_EXCEPTIONS',results.browser_errors.length===0,'count='+results.browser_errors.length);
 }catch(e){add('SMOKE_EXCEPTION',false,e.name+': '+e.message.slice(0,180));}
 finally{
  if(page)await page.close().catch(()=>{});
  await browser.close().catch(()=>{});
  results.passed=results.cases.filter(x=>x.status==='PASS').length;
  results.failed=results.cases.filter(x=>x.status==='FAIL').length;
  fs.writeFileSync(out,JSON.stringify(results,null,2)+'\n',{mode:0o600});
  console.log('SUMMARY',JSON.stringify({pass:results.passed,fail:results.failed,modelAudioChunks:results.counters.modelAudioChunks,toolResponses:results.counters.sentFunctionResponses}));
  if(results.failed)process.exitCode=1;
 }
})().catch(e=>{console.error('SMOKE_FATAL',e.name);process.exitCode=2;});
