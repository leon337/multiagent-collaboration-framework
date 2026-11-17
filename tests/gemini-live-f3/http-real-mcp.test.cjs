'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const URL='http://127.0.0.1:18375';
async function post(route,obj){
 const r=await fetch(URL+route,{method:'POST',headers:{'Content-Type':'application/json',
  'X-MCF-UI-Intent':'playwright-mcp-tool','Origin':URL},body:JSON.stringify(obj),signal:AbortSignal.timeout(36000)});
 const data=await r.json();return {httpStatus:r.status,...data};
}
test('real MCP browser isolation; navigate, snapshot, find, tabs, shutdown through HTTP gateway',async()=>{
 const sessionId=randomUUID();
 try{
  const initial=await (await fetch(URL+'/api/browser/status')).json();
  assert.ok(initial.toolNames.includes('playwright_snapshot'));
  assert.ok(initial.disabledTools.includes('browser_run_code_unsafe'));
  const prep=await post('/api/browser/prepare',{sessionId,name:'playwright_navigate',
   args:{url:'https://example.com/'}});
  assert.equal(prep.httpStatus,200);assert.equal(prep.approvalNeeded,true);
  assert.equal(prep.summary.includes('https://example.com/'),true);
  const nav=await post('/api/browser/decision',{sessionId,requestId:prep.requestId,allow:true});
  assert.equal(nav.httpStatus,200);assert.equal(nav.tool,'playwright_navigate');
  assert.equal(nav.output.includes('https://example.com/'),true);
  assert.equal(nav.receiptId.length,36);
  const read=await post('/api/browser/prepare',{sessionId,name:'playwright_snapshot',args:{depth:4}});
  assert.equal(read.approvalNeeded,false);
  const snap=await post('/api/browser/decision',{sessionId,requestId:read.requestId,allow:false});
  assert.equal(snap.httpStatus,200);
  assert.equal(snap.status==='SUCCESS',true);
  assert.equal(snap.output.includes('Example Domain'),true);
  const findPrep=await post('/api/browser/prepare',{sessionId,name:'playwright_find',args:{text:'Example',maxResults:4}});
  const found=await post('/api/browser/decision',{sessionId,requestId:findPrep.requestId,allow:false});
  assert.equal(found.httpStatus,200);assert.equal(found.status==='SUCCESS',true);
  const tabPrep=await post('/api/browser/prepare',{sessionId,name:'playwright_tabs',args:{action:'list'}});
  const tabs=await post('/api/browser/decision',{sessionId,requestId:tabPrep.requestId,allow:false});
  assert.equal(tabs.httpStatus,200);assert.equal(tabs.status==='SUCCESS',true);
  console.log('REAL_MCP_NAV_AND_SNAPSHOT',{
   tool:'@playwright/mcp',navigated:nav.status,resultText:snap.output.slice(0,240).replace(/\n/g,' '),
   found:found.status,tabs:tabs.status,origin:'https://example.com',
   profile:'isolated_headless',modelKeysAccess:false});
 }finally{
  const ended=await post('/api/browser/end',{sessionId});
  assert.equal(ended.closed,true);
  const endStatus=await (await fetch(URL+'/api/browser/status')).json();
  assert.equal(endStatus.ready,false);assert.equal(endStatus.activeOrigin,null);
 }
});
test('same-origin authorization and unsafe tools blocked at HTTP boundary',async()=>{
 const sid=randomUUID();
 const headers={'Content-Type':'application/json','X-MCF-UI-Intent':'playwright-mcp-tool'};
 const foreign=await fetch(URL+'/api/browser/prepare',{method:'POST',headers:{...headers,Origin:'https://evil.invalid'},
 body:JSON.stringify({sessionId:sid,name:'playwright_navigate',args:{url:'https://example.com'}})});
 assert.equal(foreign.status,403);
 const unsafe=await post('/api/browser/prepare',{sessionId:sid,name:'playwright_run_code',args:{code:'process.exit(1)'}});
 assert.equal(unsafe.httpStatus,400);
 const local=await post('/api/browser/prepare',{sessionId:sid,name:'playwright_navigate',args:{url:'http://localhost:18375/api/status'}});
 assert.equal(local.httpStatus,400);
 await post('/api/browser/end',{sessionId:sid});
});
