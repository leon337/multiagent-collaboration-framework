'use strict';
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.join(__dirname,'../../apps/gemini-live-studio');
const report={schema:'mcf-gemini-real-live-playwright-tool-v1',date:new Date().toISOString(),model:null,
 sourceSha256:Object.fromEntries(['public/app.js','public/playwright-tools.js','mcp-playwright-gateway.cjs','server.js'].map(f=>[
  f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),
 apiKeyPersisted:false,rawAudioPersisted:false,testPromptSynthetic:true,results:[]};
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errs=[];
 page.on('pageerror',e=>errs.push(e.message.slice(0,140)));
 let navigated=false,modelToolCalls=0,ready=false;
 try{
  await page.goto('http://127.0.0.1:18375/',{waitUntil:'networkidle2'});
  const status=await (await page.evaluate(()=>fetch('/api/status').then(x=>x.json())));
  report.configured=!!status.configured;
  if(!status.configured)throw Error('Local key is not configured');
  report.model=await page.$eval('#model',e=>e.value);
  await page.click('#connect');
  await page.waitForFunction(()=>state.connected,{timeout:36000});
  ready=true;
  const prompt='Teste automatizado autorizado. Use a ferramenta playwright_navigate para abrir https://example.com/. Depois use playwright_snapshot para inspecionar o título da página. Não faça login, não clique, não digite nem use dados pessoais. Responda em português.';
  await page.$eval('#prompt',(e,v)=>e.value=v,prompt);
  await page.click('#send');
  const started=Date.now(),limitMs=67000;
  while(Date.now()-started<limitMs){
   const pending=await page.evaluate(()=>({
    modal:document.getElementById('playwrightApprovalDialog').open,
    approvals:document.getElementById('playwrightApprovalSummary').textContent,
    callCount:state.tools,connected:state.connected,
    events:state.events.slice(-10).filter(x=>x.type==='FERRAMENTA').map(x=>x.detail)
   }));
   if(pending.modal){
    if(!pending.approvals.includes('https://example.com')){
     report.results.push({phase:'unexpected_approval',detail:pending.approvals.slice(0,120)});
     await page.click('#playwrightDeny');
    }else{
     await page.click('#playwrightApprove');navigated=true;
    }
   }
   modelToolCalls=pending.callCount;
   if(pending.events.some(x=>x.includes('playwright_snapshot'))&&navigated)break;
   if(navigated&&pending.callCount>=1){
    const responded=await page.evaluate(()=>Array.from(document.querySelectorAll('#messages .bubble.model')).some(x=>/Example|Domain/i.test(x.textContent)));
    if(responded)break;
   }
   if(!pending.connected)break;
   await new Promise(resolve=>setTimeout(resolve,700));
  }
  const final=await page.evaluate(()=>({
   connected:state.connected,toolCalls:state.tools,
   tools:state.events.filter(x=>x.type==='FERRAMENTA').map(x=>x.detail.slice(0,100)),
   recentErrors:state.events.filter(x=>x.type==='ERRO').slice(-3).map(x=>x.detail.slice(0,100)),
   receipts:document.getElementById('playwrightReceipts').children.length,
   lastMessages:Array.from(document.querySelectorAll('#messages .bubble.model')).slice(-2).map(x=>x.textContent.slice(0,180))
  }));
  report.results.push({phase:'live_e2e',connected:final.connected,toolCount:final.toolCalls,
   tools:final.tools,receipts:final.receipts,modelsResponseSummary:final.lastMessages,
   errors:final.recentErrors,approvedNavigation:navigated});
  report.modelSelectedToolChain=final.tools.map(x=>x.split(' →')[0]);
  report.pass=ready&&navigated&&final.tools.some(x=>x.includes('playwright_navigate'))&&
   final.lastMessages.some(x=>/Example|Domain/i.test(x))&&final.receipts>=1;
  console.log('REAL_GEMINI_PLAYWRIGHT_TOOL_E2E',JSON.stringify({pass:report.pass,model:report.model,
   ready,navigated,toolCalls:final.toolCalls,toolNames:final.tools,receipts:final.receipts,errors:final.recentErrors}));
 }catch(e){report.pass=false;report.results.push({phase:'exception',type:e.name,detail:e.message.slice(0,180)});
  console.log('REAL_GEMINI_PLAYWRIGHT_TEST_INCOMPLETE',e.name,e.message.slice(0,170));}
 finally{
  try{await page.evaluate(()=>disconnect());}catch{}
  await page.close().catch(()=>{});
  await browser.close().catch(()=>{});
  report.unhandledBrowserErrors=errs.slice(0,5);
  fs.writeFileSync('/tmp/mcf-f3-real-gemini-playwright-e2e.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  if(!report.pass)process.exitCode=1;
 }
})().catch(e=>{console.error('FATAL',e.name);process.exitCode=2;});
