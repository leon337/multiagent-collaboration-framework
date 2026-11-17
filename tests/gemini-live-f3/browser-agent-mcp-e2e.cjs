'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const puppeteer=require(process.env.PUPPETEER_MODULE||'/home/leo/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const URL=`http://127.0.0.1:${process.env.MCF_F3_TEST_PORT||'18375'}/`;
const root=path.join(__dirname,'../../apps/gemini-live-studio');
const report={schema:'mcf-f3-playwright-mcp-agent-e2e-v1',date:new Date().toISOString(),
 provider:'real_@playwright/mcp_0.0.85',browserProfile:'isolated',model:'simulatedGeminiToolCall',
 results:[],rawPersonalDataPersisted:false,
 hashes:Object.fromEntries(['public/app.js','public/playwright-tools.js','public/index.html','mcp-playwright-gateway.cjs','server.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]))};
function check(id,pass,observed){report.results.push({id,pass:!!pass,observed});console.log(id,pass?'PASS':'FAIL',JSON.stringify(observed));}
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message.slice(0,125)));
 try{
  await page.goto(URL,{waitUntil:'networkidle2'});
  const cfg=await page.evaluate(()=>{
   const all=(setupConfig().tools||[]).flatMap(t=>t.functionDeclarations||[]);
   return {tools:all.map(x=>x.name),runtime:!!window.MCFPlaywrightTools,
    toggle:document.getElementById('playwrightTools').checked,
    separatePage:!!document.getElementById('playwrightApprovalDialog')};
  });
  check('GEMINI_FUNCTION_DECLARATIONS_INCLUDE_SCOPED_MCP_TOOLS',cfg.tools.includes('playwright_navigate')&&cfg.tools.includes('playwright_snapshot')&&cfg.tools.includes('playwright_type')&&!cfg.tools.includes('browser_run_code_unsafe')&&cfg.toggle&&cfg.separatePage,cfg);
  await page.evaluate(()=>{
   window.__mcfPackets=[];
   state.connected=true;state.wantConnected=true;state.connectionGeneration=12345;
   state.socket={readyState:WebSocket.OPEN,bufferedAmount:0,send(data){window.__mcfPackets.push(JSON.parse(data));},close(){}};
   MCFPlaywrightTools.beginSession();
   window.__mcfPending=handleTools({functionCalls:[{id:'nav-1',name:'playwright_navigate',args:{url:'https://example.com/'}}]});
  });
  await page.waitForFunction(()=>document.getElementById('playwrightApprovalDialog').open,{timeout:10000});
  const gate=await page.evaluate(()=>({open:document.getElementById('playwrightApprovalDialog').open,
   title:document.getElementById('playwrightApprovalSummary').textContent,
   resultPackets:window.__mcfPackets.length}));
  check('MODEL_NAVIGATION_STOPS_AT_HUMAN_GATE',gate.open&&gate.title.includes('https://example.com')&&gate.resultPackets===0,gate);
  await page.click('#playwrightApprove');
  await page.waitForFunction(()=>window.__mcfPackets.length===1,{timeout:30000});
  const nav=await page.evaluate(()=>{
   const c=window.__mcfPackets[0].toolResponse.functionResponses[0];
   return {id:c.id,status:c.response.status,hasReceipt:!!c.response.receipt_id,providerContent:c.response.result?.includes('https://example.com/')};
  });
  check('HUMAN_APPROVED_NAVIGATION_RETURNS_GEMINI_TOOL_RESPONSE',nav.id==='nav-1'&&nav.status==='SUCCESS'&&nav.hasReceipt&&nav.providerContent,nav);
  await page.evaluate(()=>{window.__mcfPending=handleTools({functionCalls:[{id:'read-1',name:'playwright_snapshot',args:{depth:3}}]});});
  await page.waitForFunction(()=>window.__mcfPackets.length===2,{timeout:16000});
  const snap=await page.evaluate(()=>{
   const c=window.__mcfPackets[1].toolResponse.functionResponses[0];
   return {id:c.id,status:c.response.status,untrusted:c.response.content_is_untrusted,
    containsHeading:c.response.result?.includes('Example Domain'),approvalOpen:document.getElementById('playwrightApprovalDialog').open};
  });
  check('SAFE_SNAPSHOT_AUTOMATIC_WITH_UNTRUSTED_LABEL',snap.id==='read-1'&&snap.status==='SUCCESS'&&snap.untrusted&&snap.containsHeading&&!snap.approvalOpen,snap);
  await page.evaluate(()=>{window.__mcfPending=handleTools({functionCalls:[{id:'close-1',name:'playwright_close',args:{}}]});});
  await page.waitForFunction(()=>document.getElementById('playwrightApprovalDialog').open,{timeout:10000});
  const pending=await page.evaluate(()=>({packetCount:window.__mcfPackets.length,summary:document.getElementById('playwrightApprovalSummary').textContent}));
  check('CLOSE_DOES_NOT_RUN_WITHOUT_HUMAN_CONFIRMATION',pending.packetCount===2&&pending.summary.includes('ENCERRAR'),pending);
  await page.click('#playwrightDeny');
  await page.waitForFunction(()=>window.__mcfPackets.length===3,{timeout:10000});
  const denied=await page.evaluate(()=>{
   const c=window.__mcfPackets[2].toolResponse.functionResponses[0];
   return {id:c.id,status:c.response.status,receipts:document.getElementById('playwrightReceipts').children.length};
  });
  check('DENIED_CLOSE_RETURNS_RECEIPT_WITHOUT_EXECUTION',denied.id==='close-1'&&denied.status==='DENIED'&&denied.receipts===3,denied);
  await page.evaluate(()=>{
   window.__mcfPending=handleTools({functionCalls:[
    {id:'cancel-first',name:'playwright_navigate',args:{url:'https://github.com/'}},
    {id:'cancel-second',name:'playwright_snapshot',args:{}}
   ]});
  });
  await page.waitForFunction(()=>document.getElementById('playwrightApprovalDialog').open,{timeout:9000});
  const cancelled=await page.evaluate(async()=>{
   const previous=state.mcpEpoch;
   handleMessage({toolCallCancellation:{ids:['cancel-first','cancel-second']}});
   await window.__mcfPending;
   return {before:previous,after:state.mcpEpoch,packets:window.__mcfPackets.length,
    open:document.getElementById('playwrightApprovalDialog').open,
    tools:state.events.filter(x=>x.type==='FERRAMENTA').slice(-3).map(x=>x.detail)};
  });
  check('MODEL_CANCEL_PREVENTS_REMAINING_TOOL_BATCH_ACTIONS',
   cancelled.after>cancelled.before&&cancelled.packets===3&&!cancelled.open, cancelled);
  await page.evaluate(()=>disconnect());
  await page.waitForFunction(()=>document.getElementById('playwrightStatus').textContent.includes('encerrada'),{timeout:13000});
  const terminated=await page.evaluate(()=>({status:document.getElementById('playwrightStatus').textContent,websocket:state.socket===null}));
  check('DISCONNECT_CLEANS_ISOLATED_PLAYWRIGHT_SESSION',terminated.websocket&&terminated.status.includes('encerrada'),terminated);
  check('NO_UNCAUGHT_JS_ERRORS',jsErrors.length===0,{errors:jsErrors});
 }catch(e){check('UNEXPECTED_BROWSER_ERROR',false,{type:e.name,message:e.message.slice(0,190)});}
 finally{
  await page.close().catch(()=>{});await browser.close().catch(()=>{});
  report.pass=report.results.filter(x=>x.pass).length;report.fail=report.results.filter(x=>!x.pass).length;
  fs.writeFileSync('/tmp/mcf-f3-playwright-agent-e2e.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('F3_PLAYWRIGHT_MCP_AGENT_E2E',report.pass,'PASS',report.fail,'FAIL');
  if(report.fail)process.exitCode=1;
 }
})().catch(e=>{console.log('FATAL',e.name);process.exitCode=2;});
