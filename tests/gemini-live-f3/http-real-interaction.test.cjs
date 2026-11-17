'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const ROOT=`http://127.0.0.1:${process.env.MCF_F3_TEST_PORT||'18375'}`;
async function post(path,data){
 const r=await fetch(ROOT+path,{method:'POST',headers:{'Content-Type':'application/json',
  'X-MCF-UI-Intent':'playwright-mcp-tool',Origin:ROOT},
  body:JSON.stringify(data),signal:AbortSignal.timeout(37000)});
 return {httpStatus:r.status,...await r.json()};
}
async function tool(sid,name,args,allow=true){
 const p=await post('/api/browser/prepare',{sessionId:sid,name,args});
 assert.equal(p.httpStatus,200,p.error);
 assert.equal(p.approvalNeeded,['playwright_navigate','playwright_click','playwright_type','playwright_close'].includes(name));
 const r=await post('/api/browser/decision',{sessionId:sid,requestId:p.requestId,allow});
 assert.equal(r.httpStatus,200,r.error);
 return r;
}
test('real official MCP can type and click in synthetic todo app with explicit per-action approval',async()=>{
 const sid=randomUUID();
 try{
  const nav=await tool(sid,'playwright_navigate',{url:'https://demo.playwright.dev/todomvc/'},true);
  assert.equal(nav.status,'SUCCESS',nav.output?.slice(0,200));
  const snapshot=await tool(sid,'playwright_snapshot',{depth:6},false);
  assert.equal(snapshot.status,'SUCCESS');
  const text=snapshot.output;
  const match=text.match(/textbox[^\n]*\[ref=(e\d+)\]/i);
  assert.ok(match,'textbox ref absent: '+text.slice(0,950));
  const typing=await tool(sid,'playwright_type',
    {target:match[1],element:'Campo de nova tarefa de teste no TodoMVC',text:'Teste Playwright MCP MCF',submit:true},true);
  assert.equal(typing.status,'SUCCESS',typing.output?.slice(0,220));
  const updated=await tool(sid,'playwright_snapshot',{depth:7},false);
  assert.equal(updated.status,'SUCCESS');
  assert.ok(updated.output.includes('Teste Playwright MCP MCF'),updated.output.slice(0,1200));
  const box=updated.output.match(/checkbox[^\n]*\[ref=(e\d+)\]/i);
  assert.ok(box,'Expected test checkbox');
  const clicked=await tool(sid,'playwright_click',{target:box[1],element:'Marcar tarefa sintética de teste como concluída'},true);
  assert.equal(clicked.status,'SUCCESS');
  const final=await tool(sid,'playwright_snapshot',{depth:7},false);
  assert.ok(/checked|completed|Concluíd/i.test(final.output),'Click not reflected: '+final.output.slice(0,700));
  console.log('REAL_PLAYWRIGHT_MCP_INTERACTION',
   JSON.stringify({site:'public synthetic TodoMVC',typed:'Test value',clicked:'checkbox',
    receipts:6,modelCredentials:false,profile:'isolated',result:'PASS'}));
 }finally{await post('/api/browser/end',{sessionId:sid});}
});
