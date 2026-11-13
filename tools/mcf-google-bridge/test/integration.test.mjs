import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startHttp } from '../src/http.mjs';
import { getLocalHttpToken } from '../src/bridge.mjs';

test('MCP handshake, tools/list and status tool',async()=>{
  const client=new Client({name:'mcf-google-bridge-test',version:'1.0.0'});
  const transport=new StdioClientTransport({
    command:process.execPath,args:['src/index.mjs'],cwd:process.cwd(),
    env:{...process.env,GOOGLE_BRIDGE_ALLOW_GENERATION:'false'},stderr:'pipe'
  });
  try {
    await client.connect(transport);
    const listing=await client.listTools();
    assert.equal(listing.tools.length,7);
    assert.ok(listing.tools.some(x=>x.name==='google.status'));
    assert.ok(!listing.tools.some(x=>x.name==='google.gmail.send'));
    const result=await client.callTool({name:'google.status',arguments:{}});
    assert.equal(result.isError,undefined);
    assert.equal(JSON.parse(result.content[0].text).operation,'google.status');
    const denied=await client.callTool({name:'google.gemini.generate',arguments:{model:'x-test',prompt:'teste'}});
    assert.equal(denied.isError,true);
    assert.match(denied.content[0].text,/OPERATION_DISABLED/);
  } finally { await client.close(); }
},{timeout:30000});
test('HTTP loopback authenticates and denies unsupported actions',async()=>{
  const original=process.env.MCF_GOOGLE_BRIDGE_STATE_DIR;
  const isolatedDir=await mkdtemp(path.join(tmpdir(),'mcf-bridge-test-'));
  process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=isolatedDir;
  // Import-time stateDir is resolved by this test runner's dedicated process;
  // keep this test isolated from an installed daemon.
  const server=await startHttp({port:0});
  const port=server.address().port;
  try {
    const health=await fetch('http://127.0.0.1:'+port+'/healthz');
    assert.equal(health.status,200);
    const noAuth=await fetch('http://127.0.0.1:'+port+'/v1/execute',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({operation:'google.status',args:{}})
    });
    assert.equal(noAuth.status,401);
    const token=await getLocalHttpToken();
    const call=(operation,args={})=>fetch('http://127.0.0.1:'+port+'/v1/execute',{
      method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},
      body:JSON.stringify({operation,args})
    });
    const ok=await call('google.status');
    assert.equal(ok.status,200);
    assert.equal((await ok.json()).operation,'google.status');
    const denied=await call('google.gmail.send',{to:'nobody@example.org'});
    assert.equal(denied.status,404);
    assert.equal((await denied.json()).error,'UNSUPPORTED_OPERATION');
  } finally {
    await new Promise(r=>server.close(r));
    await rm(isolatedDir,{recursive:true,force:true});
    if(original===undefined) delete process.env.MCF_GOOGLE_BRIDGE_STATE_DIR;
    else process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=original;
  }
},{timeout:30000});
