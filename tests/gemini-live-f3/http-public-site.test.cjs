'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const ROOT=process.env.F3_URL||'http://127.0.0.1:18375';
async function post(route,data){
 const resp=await fetch(ROOT+route,{method:'POST',headers:{Origin:ROOT,
  'Content-Type':'application/json','X-MCF-UI-Intent':'playwright-mcp-tool'},
  body:JSON.stringify(data),signal:AbortSignal.timeout(40000)});
 const body=await resp.json();
 return {httpStatus:resp.status,...body};
}
test('real MCP: newly approved public HTTPS origin opens without static site allowlist',async()=>{
 const sessionId=randomUUID();
 try{
  const prep=await post('/api/browser/prepare',{sessionId,
   name:'playwright_navigate',args:{url:'https://www.python.org/'}});
  assert.equal(prep.httpStatus,200);
  assert.equal(prep.approvalNeeded,true);
  assert.match(prep.summary,/python\.org/);
  // Approval is supplied by the test fixture (not claimed as human voice).
  const result=await post('/api/browser/decision',{sessionId,
   requestId:prep.requestId,allow:true});
  assert.equal(result.httpStatus,200);
  assert.equal(result.status,'SUCCESS',result.output?.slice(0,280));
  assert.match(result.output,/Page URL: https:\/\/www\.python\.org\//);
  assert.match(result.output,/Page Title: Welcome to Python\.org/);
  assert.ok(result.receiptId);
  console.log('F3_PUBLIC_SITE_PASS',{site:'www.python.org',
   tool:'playwright_navigate',receipt:!!result.receiptId,status:result.status});
 }finally{await post('/api/browser/end',{sessionId}).catch(()=>{});}
});
test('unsafe private site and refused external navigation do not reach MCP',async()=>{
 const sessionId=randomUUID();
 try{
  const bad=await post('/api/browser/prepare',{sessionId,name:'playwright_navigate',
   args:{url:'https://127.0.0.1/'}});
  assert.equal(bad.httpStatus,400);
  const p=await post('/api/browser/prepare',{sessionId,name:'playwright_navigate',
   args:{url:'https://www.rust-lang.org/'}});
  assert.equal(p.approvalNeeded,true);
  const deny=await post('/api/browser/decision',{sessionId,requestId:p.requestId,allow:false});
  assert.equal(deny.status,'DENIED');
 }finally{await post('/api/browser/end',{sessionId}).catch(()=>{});}
});