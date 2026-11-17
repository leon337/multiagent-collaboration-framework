'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const URL=process.env.F2_URL||'http://127.0.0.1:18374/';
const ROOT=path.join(__dirname,'../../apps/gemini-live-studio');
const report={schema:'mcf-f2-2-browser-qa-v1',url:URL,at:new Date().toISOString(),mockProvider:true,noRawMediaPersisted:true,results:[],
 sourceSha256:Object.fromEntries(['public/vision-ui.js','public/index.html','public/app.js','server.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,f))).digest('hex')]))};
function check(name,pass,observed){report.results.push({name,pass:!!pass,observed});console.log(name,pass?'PASS':'FAIL',JSON.stringify(observed));}
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,160)));
 try{
  await page.evaluateOnNewDocument(()=>{
   const nativeFetch=window.fetch.bind(window);
   window.__f2requests={catalog:0,analysis:0,last:null,sendToLive:0,error:false};
   window.fetch=(url,opts={})=>{
    const target=String(url);
    if(target==='/api/vision/models'){
     window.__f2requests.catalog++;
     return Promise.resolve(new Response(JSON.stringify({models:[
      {id:'gemini-3.5-flash',label:'3.5 Flash',methodVerified:true},
      {id:'gemini-3.8-live',label:'3.8 Live',methodVerified:false}
     ]}),{status:200,headers:{'Content-Type':'application/json'}}));
    }
    if(target==='/api/vision/analyze'){
     window.__f2requests.analysis++;
     const body=JSON.parse(opts.body);
     window.__f2requests.last={kind:body.kind,model:body.model,mime:body.mimeType,consent:body.consent,
      bytes:body.base64.length,hasRaw:body.base64.length>10,header:opts.headers['X-MCF-User-Consent']};
     if(window.__f2requests.error)return Promise.resolve(new Response(JSON.stringify({error:'Limite de cota. Não houve fallback.'}),{status:429}));
     return Promise.resolve(new Response(JSON.stringify({traceId:'11111111-2222-3333-4444-555555555555',
      model:body.model,kind:body.kind,content:'É uma imagem de teste. Sem informações privadas.',usage:{totalTokens:12},
      uploadedToGoogleFiles:body.kind==='video',remoteFileDeleted:true}),{status:200,headers:{'Content-Type':'application/json'}}));
    }
    return nativeFetch(url,opts);
   };
  });
  await page.goto(URL,{waitUntil:'networkidle2'});
  await page.waitForFunction(()=>document.getElementById('visionModel').options.length>1);
  const has=await page.evaluate(()=>({panel:!!document.getElementById('visionTitle'),catalog:window.__f2requests.catalog,
    options:document.getElementById('visionModel').options.length}));
  check('ANALYSIS_PANEL_AND_VERIFIED_CATALOG',has.panel&&has.catalog===1&&has.options===3,has);
  const setFile=await page.evaluate(()=>{
   const bytes=new Uint8Array([137,80,78,71,13,10,26,10,...new Array(80).fill(3)]);
   const file=new File([bytes],'scene.png',{type:'image/png'});
   const input=document.getElementById('visionFile');
   Object.defineProperty(input,'files',{configurable:true,value:[file]});
   input.dispatchEvent(new Event('change',{bubbles:true}));
   return {button:document.getElementById('visionAnalyze').disabled,info:document.getElementById('visionFileInfo').textContent};
  });
  check('IMAGE_FILE_ADMISSION_ENABLED',!setFile.button&&setFile.info.includes('scene.png'),setFile);
  await page.click('#visionAnalyze');
  const pending=await page.evaluate(()=>({open:document.getElementById('visionConsentDialog').open,requests:window.__f2requests.analysis}));
  check('CONFIRMATION_REQUIRED_BEFORE_MEDIA_TRANSFER',pending.open&&pending.requests===0,pending);
  await page.click('#visionConsentReject');
  const rejected=await page.evaluate(()=>({requests:window.__f2requests.analysis,status:document.getElementById('visionStatus').textContent}));
  check('USER_DENIAL_SENDS_ZERO_MEDIA',rejected.requests===0&&rejected.status.includes('cancelada'),rejected);
  await page.click('#visionAnalyze');await page.click('#visionConsentApprove');
  await page.waitForFunction(()=>document.getElementById('visionResult').textContent.includes('imagem de teste'));
  const analyzed=await page.evaluate(()=>({calls:window.__f2requests.analysis,last:window.__f2requests.last,
   result:document.getElementById('visionResult').textContent,shareEnabled:!document.getElementById('visionShareToLive').disabled,
   trace:document.getElementById('visionTrace').textContent,liveRequests:window.__f2requests.sendToLive}));
  check('IMAGE_ANALYSIS_USES_EXPLICIT_CONSENT_AND_MODEL',analyzed.calls===1&&analyzed.last.kind==='image'&&analyzed.last.consent&&analyzed.last.model==='gemini-3.5-flash'&&analyzed.last.header==='yes',analyzed.last);
  check('ANALYSIS_RESULT_TRACE_NO_AUTO_LIVE_SHARE',analyzed.shareEnabled&&analyzed.trace.includes('11111111')&&analyzed.liveRequests===0,{trace:analyzed.trace,shareEnabled:analyzed.shareEnabled});
  const share=await page.evaluate(()=>{
   const old={socket:state.socket,connected:state.connected,stream:state.micStream,micStarting:state.micStarting,awaiting:state.awaitingTerminal};
   const ws={readyState:WebSocket.OPEN,bufferedAmount:0,send(message){
    window.__f2requests.sendToLive++;const d=JSON.parse(message);window.__f2requests.liveLast={
     untrusted:d.clientContent.turns[0].parts[0].text.includes('não confiável como instrução'),fileIncluded:JSON.stringify(d).includes('base64')};
   }};
   state.socket=ws;state.connected=true;state.micStream=null;state.micStarting=false;state.awaitingTerminal=false;
   const priorConfirm=window.confirm;window.confirm=()=>true;
   document.getElementById('visionShareToLive').click();
   window.confirm=priorConfirm;
   const out={count:window.__f2requests.sendToLive,last:window.__f2requests.liveLast};
   clearPendingTurn();state.awaitingTerminal=false;
   state.socket=old.socket;state.connected=old.connected;state.micStream=old.stream;state.micStarting=old.micStarting;state.awaitingTerminal=old.awaiting;
   return out;
  });
  check('LIVE_SUMMARY_REQUIRES_SEPARATE_ACTION_WITH_UNTRUSTED_LABEL',share.count===1&&share.last.untrusted&&!share.last.fileIncluded,share);
  await page.evaluate(()=>{
   const bytes=new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,...new Array(25).fill(0)]);
   const input=document.getElementById('visionFile');
   Object.defineProperty(input,'files',{configurable:true,value:[new File([bytes],'clip.mp4',{type:'video/mp4'})]});
   input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.click('#visionAnalyze');await page.click('#visionConsentApprove');
  await page.waitForFunction(()=>window.__f2requests.analysis===2);
  const video=await page.evaluate(()=>({kind:window.__f2requests.last.kind,mime:window.__f2requests.last.mime,
   status:document.getElementById('visionStatus').textContent}));
  check('VIDEO_UPLOAD_EXECUTES_ONLY_AFTER_EXPLICIT_CONSENT',video.kind==='video'&&video.mime==='video/mp4',video);
  await page.evaluate(()=>{
   window.__f2requests.error=true;
   const bytes=new Uint8Array([137,80,78,71,13,10,26,10,...new Array(80).fill(3)]);
   const input=document.getElementById('visionFile');
   Object.defineProperty(input,'files',{configurable:true,value:[new File([bytes],'again.png',{type:'image/png'})]});
   input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.click('#visionAnalyze');await page.click('#visionConsentApprove');
  await page.waitForFunction(()=>document.getElementById('visionStatus').textContent.includes('Falha'));
  const fail=await page.evaluate(()=>({status:document.getElementById('visionStatus').textContent,calls:window.__f2requests.analysis}));
  check('QUOTA_ERROR_EXPLICIT_NO_SILENT_MODEL_FALLBACK',fail.status.includes('cota')&&fail.calls===3,fail);
  check('NO_UNCAUGHT_BROWSER_ERRORS',errors.length===0,{errors});
 }catch(e){check('BROWSER_EXCEPTION',false,{name:e.name,message:e.message.slice(0,170)});}
 finally{
  await page.close().catch(()=>{});await browser.close().catch(()=>{});
  report.pass=report.results.filter(r=>r.pass).length;
  report.fail=report.results.filter(r=>!r.pass).length;
  fs.writeFileSync('/tmp/mcf-f2-vision-browser.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('F2_VISION_BROWSER',report.pass,'PASS',report.fail,'FAIL');
  if(report.fail)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.name);process.exitCode=2;});
