'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const srcRoot=process.env.F2_APP_ROOT||'/tmp/mcf-gemini-live-f2/apps/gemini-live-studio';
const report={schema:'mcf-f2-visual-consent-browser/v1',timestamp:new Date().toISOString(),url:process.env.F2_URL||'http://127.0.0.1:18374/',results:[],noRealGoogleCalls:true,
 sourceSha256:Object.fromEntries(['public/app.js','public/media-policy.js','public/index.html'].map(x=>[x,crypto.createHash('sha256').update(fs.readFileSync(path.join(srcRoot,x))).digest('hex')])),
 captureBytesPersisted:false};
function check(name,pass,observed){report.results.push({name,pass:!!pass,observed});console.log(name,pass?'PASS':'FAIL',JSON.stringify(observed));}
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 let page;
 const errors=[];
 try{
  page=await browser.newPage();
  page.on('pageerror',e=>errors.push(e.name));
  await page.goto(report.url,{waitUntil:'networkidle2'});
  const setup=await page.evaluate(()=>{
   const counters={camera:0,screen:0,sent:0};
   window.__F2TestCounters=counters;
   window.__F2TestMedia=[];
   const nativeMedia=window.navigator.mediaDevices||{};
   const stream=()=>{
    const canvas=document.createElement('canvas');
    canvas.width=320;canvas.height=180;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#334455';ctx.fillRect(0,0,320,180);
    const s=canvas.captureStream(1);window.__F2TestMedia.push(s);return s;
   };
   window.__F2CreateStream=stream;
   Object.defineProperty(nativeMedia,'getUserMedia',{configurable:true,value:async()=>{counters.camera++;return stream();}});
   Object.defineProperty(nativeMedia,'getDisplayMedia',{configurable:true,value:async()=>{counters.screen++;return stream();}});
   state.connected=true;state.wantConnected=true;
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(value){counters.sent++;},close(){}};
   setButtons(true);return {policy:!!window.MCFMediaPolicy,dialog:!!document.getElementById('visualConsentDialog')};
  });
  check('F2_MEDIA_POLICY_LOADED',setup.policy&&setup.dialog,setup);
  await page.click('#camera');
  const prompt=await page.evaluate(()=>({open:document.getElementById('visualConsentDialog').open,camera:window.__F2TestCounters.camera,label:document.getElementById('visualConsentTitle').textContent}));
  check('CAMERA_REQUIRES_EXPLICIT_CONSENT',prompt.open&&prompt.camera===0&&prompt.label.includes('câmera'),prompt);
  await page.click('#visualConsentReject');
  await page.waitForFunction(()=>!document.getElementById('visualConsentDialog').open);
  const denied=await page.evaluate(()=>({camera:window.__F2TestCounters.camera,sharing:document.getElementById('visualStatus').getAttribute('data-sharing')}));
  check('CANCEL_NO_HARDWARE_CAPTURE',denied.camera===0&&denied.sharing==='false',denied);
  await page.click('#camera');await page.click('#visualConsentApprove');
  await page.waitForFunction(()=>!!state.cameraStream,{timeout:5000});
  const granted=await page.evaluate(()=>({camera:window.__F2TestCounters.camera,sharing:document.getElementById('visualStatus').getAttribute('data-sharing'),
   label:document.getElementById('visualStatus').textContent,stopVisible:!document.getElementById('stopVisual').hidden,track:state.cameraStream.getVideoTracks()[0].readyState}));
  check('CAMERA_APPROVED_WITH_PERSISTENT_STATUS',granted.camera===1&&granted.sharing==='true'&&granted.stopVisible&&granted.track==='live'&&granted.label.includes('Câmera'),granted);
  await page.click('#screen');
  const screenPrompt=await page.evaluate(()=>({open:document.getElementById('visualConsentDialog').open,title:document.getElementById('visualConsentTitle').textContent,screen:window.__F2TestCounters.screen}));
  check('SCREEN_REQUIRES_SEPARATE_CONSENT',screenPrompt.open&&screenPrompt.screen===0&&screenPrompt.title.includes('tela'),screenPrompt);
  await page.click('#visualConsentApprove');
  await page.waitForFunction(()=>!!state.screenStream&&state.cameraStream===null,{timeout:5000});
  const switched=await page.evaluate(()=>({screen:window.__F2TestCounters.screen,oldTrack:window.__F2TestMedia[0].getVideoTracks()[0].readyState,
   label:document.getElementById('visualStatus').textContent}));
  check('SWITCH_RELEASES_OLD_CAMERA',switched.screen===1&&switched.oldTrack==='ended'&&switched.label.includes('Tela'),switched);
  const ended=await page.evaluate(()=>{
   const track=state.screenStream.getVideoTracks()[0];
   track.dispatchEvent(new Event('ended'));
   return {sharing:document.getElementById('visualStatus').getAttribute('data-sharing'),screen:!!state.screenStream,timer:state.frameTimer,stopVisible:!document.getElementById('stopVisual').hidden};
  });
  check('OS_STOP_RELEASES_CAPTURE_AND_FRAME_TIMER',ended.sharing==='false'&&!ended.screen&&!ended.timer&&!ended.stopVisible,ended);
  await page.click('#screen');await page.click('#visualConsentApprove');
  await page.waitForFunction(()=>!!state.screenStream,{timeout:5000});
  await page.click('#stopVisual');
  const kill=await page.evaluate(()=>({screen:!!state.screenStream,sharing:document.getElementById('visualStatus').getAttribute('data-sharing'),
    lastTrack:window.__F2TestMedia.at(-1).getVideoTracks()[0].readyState,timer:state.frameTimer}));
  check('VISIBLE_KILL_SWITCH_STOPS_TRACKS',!kill.screen&&kill.sharing==='false'&&kill.lastTrack==='ended'&&!kill.timer,kill);
  await page.evaluate(()=>{
   window.__F2ResolvePicker=null;
   Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:()=>{
    window.__F2TestCounters.camera++;
    return new Promise(ok=>window.__F2ResolvePicker=ok);
   }});
  });
  await page.click('#camera');await page.click('#visualConsentApprove');
  await page.waitForFunction(()=>typeof window.__F2ResolvePicker==='function',{timeout:5000});
  await page.evaluate(()=>disconnect());
  const stale=await page.evaluate(async()=>{
   const s=window.__F2CreateStream();const track=s.getVideoTracks()[0];window.__F2ResolvePicker(s);
   await new Promise(resolve=>setTimeout(resolve,75));
   return {track:track.readyState,sharing:visualPolicy.isSharing(),status:document.getElementById('visualStatus').getAttribute('data-sharing')};
  });
  check('DISCONNECT_DURING_BROWSER_PERMISSION_REJECTS_LATE_STREAM',stale.track==='ended'&&!stale.sharing&&stale.status==='false',stale);
  const reopen=await page.evaluate(()=>{
   const count=window.__F2TestCounters.camera+window.__F2TestCounters.screen;
   state.connected=true;state.wantConnected=true;setButtons(true);
   return {countBefore:count,countAfter:window.__F2TestCounters.camera+window.__F2TestCounters.screen,sharing:visualPolicy.isSharing()};
  });
  check('RECONNECT_NEVER_RESTARTS_VISUAL_CAPTURE',reopen.countBefore===reopen.countAfter&&!reopen.sharing,reopen);
  check('NO_UNCAUGHT_BROWSER_ERRORS',errors.length===0,{errors});
 }catch(e){check('UNEXPECTED_BROWSER_EXCEPTION',false,{name:e.name,message:String(e.message).slice(0,220)});}
 finally{
  await page?.close().catch(()=>{});await browser.close().catch(()=>{});
  report.passed=report.results.filter(x=>x.pass).length;
  report.failed=report.results.filter(x=>!x.pass).length;
  fs.writeFileSync('/tmp/mcf-f2-visual-browser.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('F2_1_VISUAL_BROWSER',report.passed,'PASS',report.failed,'FAIL');
  if(report.failed)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.name);process.exitCode=2;});
