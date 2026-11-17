'use strict';
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.join(__dirname,'../../apps/gemini-live-studio');
const report={schema:'mcf-f3-navigation-voice-consent-browser-e2e-v1',
 recordedAt:new Date().toISOString(),speechEngine:'simulated_Chrome_WebSpeech_API',
 sourceHashes:Object.fromEntries(['public/voice-approval.js','public/playwright-tools.js','public/index.html','mcp-playwright-gateway.cjs'].map(p=>[
  p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')])),
 results:[]};
function assert(name,ok,data){
 report.results.push({name,pass:!!ok,details:data});
 console.log('VOICE_BROWSER',name,ok?'PASS':'FAIL',JSON.stringify(data));
}
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,130)));
 try{
  await page.evaluateOnNewDocument(()=>{
   window.__voiceRequests={prepare:[],decision:[],spoken:[],starts:0};
   class FakeSpeechRecognition{
    start(){window.__voiceRequests.starts++;window.__recognizer=this;}
    abort(){if(window.__recognizer===this)window.__recognizer=null;}
   }
   Object.defineProperty(window,'SpeechRecognition',{value:FakeSpeechRecognition,configurable:true});
   Object.defineProperty(window,'webkitSpeechRecognition',{value:FakeSpeechRecognition,configurable:true});
   Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {constructor(text){this.text=text;}},configurable:true});
   Object.defineProperty(window,'speechSynthesis',{value:{
    speak(u){window.__voiceRequests.spoken.push(u.text);queueMicrotask(()=>u.onend?.());},
    cancel(){}
   },configurable:true});
   const realFetch=window.fetch.bind(window);
   window.fetch=(url,options={})=>{
    const route=String(url);
    if(route==='/api/browser/status')return Promise.resolve(new Response(JSON.stringify({
     ready:false,provider:'@playwright/mcp',toolNames:['playwright_navigate'],
     navigationPolicy:'public_https_per_request'
    }),{status:200}));
    if(route==='/api/browser/prepare'){
     const req=JSON.parse(options.body||'{}');window.__voiceRequests.prepare.push(req);
     return Promise.resolve(new Response(JSON.stringify({requestId:'aaaaaaaa-1111-4111-8111-111111111111',
      name:req.name,summary:'NAVEGAR no navegador isolado para '+new URL(req.args.url).origin+
       '. URL completa: '+req.args.url,approvalNeeded:true,expiresInSec:45}),{status:200}));
    }
    if(route==='/api/browser/decision'){
     const req=JSON.parse(options.body);window.__voiceRequests.decision.push(req);
     return Promise.resolve(new Response(JSON.stringify({status:req.allow?'SUCCESS':'DENIED',
      tool:'playwright_navigate',receiptId:'bbbbbbbb-2222-4222-8222-222222222222',
      output:req.allow?'Page URL: https://www.python.org/':''}),{status:200}));
    }
    if(route==='/api/browser/end')return Promise.resolve(new Response('{"closed":true}',{status:200}));
    return realFetch(url,options);
   };
   window.__say=transcript=>{
    const current=window.__recognizer;
    if(current?.onresult)current.onresult({results:{length:1,0:{isFinal:true,0:{transcript}}}});
   };
  });
  await page.goto('http://127.0.0.1:18375/',{waitUntil:'networkidle2'});
  const ready=await page.evaluate(()=>({
   supports:!document.getElementById('playwrightVoiceEnabled').disabled,
   exposed:!!window.MCFVoiceApproval,
   scriptLoaded:!!window.MCFPlaywrightTools
  }));
  assert('SPEECH_RECOGNITION_ADAPTER_AVAILABLE',ready.supports&&ready.exposed&&ready.scriptLoaded,ready);
  await page.click('#playwrightVoiceEnabled');
  await page.evaluate(()=>{
   MCFPlaywrightTools.beginSession();
   window.__nav=MCFPlaywrightTools.run('playwright_navigate',{url:'https://www.python.org/'});
  });
  await page.waitForFunction(()=>document.getElementById('playwrightApprovalDialog').open);
  await page.waitForFunction(()=>window.__voiceRequests.starts>=1,{timeout:10000});
  const before=await page.evaluate(()=>({
   code:document.getElementById('playwrightVoicePhrase').textContent,
   spoken:window.__voiceRequests.spoken[0],
   decisions:window.__voiceRequests.decision.length,
   summary:document.getElementById('playwrightApprovalSummary').textContent
  }));
  const four=(before.code.match(/\d/g)||[]).join('');
  assert('VOICE_PROMPT_BOUNDS_TO_REQUEST_WITH_FRESH_CHALLENGE',
   four.length===4&&before.summary.includes('www.python.org')&&before.decisions===0&&
    !before.spoken.includes(four),{codeLength:four.length,decisions:before.decisions});
  await page.evaluate(code=>window.__say('não autorizo '+code),four);
  await new Promise(r=>setTimeout(r,100));
  const neg=await page.evaluate(()=>({
   dialog:document.getElementById('playwrightApprovalDialog').open,
   decisions:window.__voiceRequests.decision.length}));
  assert('VOICE_NEGATED_PHRASE_NEVER_GRANTS',neg.dialog&&neg.decisions===0,neg);
  await page.click('#playwrightListen');
  await page.waitForFunction(()=>window.__voiceRequests.starts===2);
  await page.evaluate(code=>window.__say('autorizo '+code.split('').reverse().join(' ')),four);
  await new Promise(r=>setTimeout(r,120));
  const wrong=await page.evaluate(()=>window.__voiceRequests.decision.length);
  assert('WRONG_VOICE_CODE_CANNOT_GRANT',wrong===0,{decisionCount:wrong});
  await page.click('#playwrightListen');
  await page.waitForFunction(()=>window.__voiceRequests.starts===3);
  await page.evaluate(code=>window.__say('autorizo '+code.split('').join(' ')),four);
  await page.waitForFunction(()=>window.__voiceRequests.decision.length===1);
  const allowed=await page.evaluate(async()=>{
   const res=await window.__nav;
   return {approved:window.__voiceRequests.decision[0].allow,
    toolResult:res.status,receipt:!!res.receipt_id,
    challengeCleared:document.getElementById('playwrightVoicePhrase').textContent===''};
  });
  assert('EXACT_VOICE_CHALLENGE_TRIGGERS_ONE_APPROVED_TOOL_DECISION',
   allowed.approved===true&&allowed.toolResult==='SUCCESS'&&allowed.receipt&&allowed.challengeCleared,allowed);
  await page.evaluate(()=>{
   window.__other=MCFPlaywrightTools.run('playwright_navigate',{url:'https://www.rust-lang.org/'});
  });
  await page.waitForFunction(()=>document.getElementById('playwrightApprovalDialog').open);
  await page.waitForFunction(()=>window.__voiceRequests.starts===4);
  await page.evaluate(()=>window.__say('recuso'));
  await page.waitForFunction(()=>window.__voiceRequests.decision.length===2);
  const denied=await page.evaluate(async()=>{
   const r=await window.__other;
   return {approved:window.__voiceRequests.decision[1].allow,status:r.status};
  });
  assert('SPOKEN_REFUSAL_PREVENTS_SECOND_NAVIGATION',denied.approved===false&&denied.status==='DENIED',denied);
  assert('NO_BROWSER_SCRIPT_ERRORS',errors.length===0,{errors});
 }catch(e){
  const debug=await page.evaluate(()=>({
   modal:document.getElementById('playwrightApprovalDialog')?.open,
   info:document.getElementById('playwrightVoiceStatus')?.textContent,
   voiceEnabled:document.getElementById('playwrightVoiceEnabled')?.checked,
   requests:window.__voiceRequests,
   agentStatus:document.getElementById('playwrightStatus')?.textContent
  })).catch(()=>({}));
  assert('BROWSER_E2E_EXCEPTION',false,{error:e.message.slice(0,230),debug});
 }
 finally{
  await page.close().catch(()=>{});await browser.close().catch(()=>{});
  report.passed=report.results.filter(r=>r.pass).length;
  report.failed=report.results.filter(r=>!r.pass).length;
  fs.writeFileSync('/tmp/mcf-f3-voice-browser-e2e.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('VOICE_NAVIGATION_E2E',report.passed,'PASS',report.failed,'FAIL');
  if(report.failed)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.name);process.exitCode=2;});