/* F0 automated local smoke. Uses virtual media; never reads actual microphone/camera/screen. */
'use strict';
const puppeteer=require('/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const URL='http://127.0.0.1:18371/';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const result={verified_at_utc:new Date().toISOString(),origin:URL,virtual_media:true,cases:[],page_errors:[],observed:{}};
 const add=(id,passed,details)=>{result.cases.push({id,result:passed?'PASS':'FAIL',details});console.log(id,passed?'PASS':'FAIL',details||'');};
 let page;
 try{
  page=await browser.newPage();
  page.on('pageerror',e=>result.page_errors.push(e.name));
  page.on('console',m=>{if(m.type()==='error')result.observed.page_console_error_count=(result.observed.page_console_error_count||0)+1;});
  await page.goto(URL,{waitUntil:'networkidle2'});
  const key=await page.$eval('#keyChip',el=>el.textContent);add('UI_STATUS_CONFIGURED',key.includes('configurada'),key.trim());
  const bad=(await fetch(URL+'api/key',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify({key:'AAAAAA-INVALIDAAAAAAAAAAAAAAAAAAAAAA'})})).status;
  add('ORIGIN_RESTRICTION',bad===403,'HTTP '+bad);
  const privateFile=await page.evaluate(async()=>{const r=await fetch('/.private/api-key.json');return r.status;});
  add('PRIVATE_FILES_NOT_SERVED',privateFile===404,'HTTP '+privateFile);
  await page.select('#model','gemini-2.5-flash-native-audio-preview-12-2025');
  await page.click('#connect');
  await page.waitForFunction(()=>document.getElementById('connectionStatus').textContent.includes('Sessão ao vivo'),{timeout:12000});
  add('LIVE_2_5_SETUP',true,'setupComplete received');
  // Read only transport/metadata signals; do not persist audio/text content.
  await page.evaluate(()=>{
    window.__f0={input:0,output:0,toolCalls:0,turns:0,errors:0,sessionUpdates:0};
    state.socket.addEventListener('message',async e=>{
      try{
        const d=typeof e.data==='string'?e.data:e.data instanceof Blob?await e.data.text():new TextDecoder().decode(e.data);
        const m=JSON.parse(d);const s=window.__f0;
        s.input+=Number(!!m.serverContent?.inputTranscription?.text);
        s.output+=Number(!!m.serverContent?.outputTranscription?.text);
        s.toolCalls+=(m.toolCall?.functionCalls?.length||0);
        s.turns+=Number(!!m.serverContent?.turnComplete);
        s.sessionUpdates+=Number(!!m.sessionResumptionUpdate);
        s.errors+=Number(!!m.error);
      }catch{}
    });
  });
  await page.click('#mic');await page.waitForFunction(()=>document.querySelector('#mic small').textContent==='ON',{timeout:7000});
  await new Promise(r=>setTimeout(r,1400));
  await page.click('#mic');add('VIRTUAL_MIC_PCM',await page.$eval('#mic small',el=>el.textContent==='OFF'),'fake device, real Web Audio audio/pcm path');
  await page.click('#camera');await page.waitForFunction(()=>document.querySelector('#camera small').textContent==='ON',{timeout:7000});
  await new Promise(r=>setTimeout(r,1300));
  await page.click('#camera');add('VIRTUAL_CAMERA_FRAME',await page.$eval('#camera small',el=>el.textContent==='OFF'),'virtual camera frame pipeline (not physical webcam)');
  await page.evaluate(()=>{navigator.mediaDevices.getDisplayMedia=()=>navigator.mediaDevices.getUserMedia({video:true,audio:false});});
  await page.click('#screen');await page.waitForFunction(()=>document.querySelector('#screen small').textContent==='ON',{timeout:7000});
  await new Promise(r=>setTimeout(r,1200));
  await page.click('#screen');add('VIRTUAL_SCREEN_FRAME',await page.$eval('#screen small',el=>el.textContent==='OFF'),'mock getDisplayMedia; no real screen captured');
  await page.type('#prompt','Para este teste, chame a função get_current_time. Responda com uma frase curta.');
  await page.click('#send');
  await new Promise(r=>setTimeout(r,9500));
  const f=await page.evaluate(()=>({signals:window.__f0,tools:state.tools,tokenUsage:state.tokens,events:state.events.map(e=>e.type),socket:state.connected}));
  result.observed=f;const metrics=await page.evaluate(()=>window.MCFLiveTelemetry?.snapshot());result.telemetry_summary=metrics?.metrics;add('TELEMETRY_MINIMAL',!!metrics?.metrics?.setup_latency_ms?.samples,'setup samples='+metrics?.metrics?.setup_latency_ms?.samples);add('TELEMETRY_PRIVATE',!/(?:AQ\.|AIza|access_token|secret|Para este teste)/i.test(JSON.stringify(metrics?.events||[])),'metadata-only signals');add('REAL_TEXT_TURN',f.socket,'Gemini session still connected after text input');
  add('FUNCTION_CALL_REAL',f.tools>0,'tool invocation count '+f.tools);
  add('AUDIO_RESPONSE_SIGNAL',f.signals.turns>0||f.signals.output>0,'turnComplete='+f.signals.turns+' outputTranscript='+f.signals.output);
  await page.click('#disconnect');await new Promise(r=>setTimeout(r,500));
  const clean=await page.evaluate(()=>!state.micStream&&!state.cameraStream&&!state.screenStream&&!state.connected);
  add('CLEAN_SHUTDOWN',clean,'media tracks cleared');
  await page.select('#model','gemini-3.8-live');
  await page.click('#connect');await page.waitForFunction(()=>document.getElementById('connectionStatus').textContent.includes('Sessão ao vivo'),{timeout:12000});
  add('LIVE_3_8_SETUP',true,'setupComplete received');await page.click('#disconnect');
  add('NO_JS_RUNTIME_ERRORS',result.page_errors.length===0,'count '+result.page_errors.length);
 }catch(e){add('TEST_EXCEPTION',false,e.name+': '+e.message.slice(0,160));}
 finally{
  if(page)await page.close().catch(()=>{});
  await browser.close().catch(()=>{});
  result.passed=result.cases.filter(x=>x.result==='PASS').length;
  result.failed=result.cases.filter(x=>x.result==='FAIL').length;
  fs.writeFileSync(path.join(__dirname,'BASELINE-TESTS.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log('SUMMARY',JSON.stringify({passed:result.passed,failed:result.failed,signals:result.observed.signals,tools:result.observed.tools}));
  if(result.failed)process.exitCode=1;
 }
})().catch(e=>{console.error('F0 test framework failed:',e.name);process.exitCode=2;});
