import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NineRouterModelGateway,
  NineRouterGatewayError,
} from './nine-router-model-gateway.adapter.ts';

const req = {
  agentId: 'Beatriz',
  missionId: 'MCF-496',
  requestId: 'req-001',
  model: 'verified/free-model',
  messages: [{role: 'user', content: 'Teste sintético sem dados privados.'}],
};
const base = {
  enabled: true,
  baseUrl: 'http://127.0.0.1:20129/v1',
  apiKey: 'test-key-not-real',
  verifiedFreeModels: ['verified/free-model'],
};
function errorCode(fn, code) {
  assert.rejects(fn, e => e instanceof NineRouterGatewayError && e.code === code);
}
test('fail closed: disabled transport never fetches', async () => {
  let calls = 0;
  const g = new NineRouterModelGateway({...base, enabled:false, fetchImpl:async()=>{calls++; throw Error();}});
  await errorCode(()=>g.infer(req),'DISABLED');
  assert.equal(calls,0);
});
test('fail closed: non-verified model and absent key', async () => {
  const g = new NineRouterModelGateway({...base,fetchImpl:async()=>{throw Error('SHOULD_NOT_CALL');}});
  await errorCode(()=>g.infer({...req,model:'paid/model'}),'MODEL_NOT_VERIFIED');
  const noKey = new NineRouterModelGateway({...base,apiKey:''});
  await errorCode(()=>noKey.infer(req),'INVALID_CONFIGURATION');
});
test('fail closed: no public host, wrong port, credentials or redirect URL', () => {
  for (const url of ['http://example.org:20129/v1','https://127.0.0.1:20129/v1',
   'http://127.0.0.1:20128/v1','http://user:pass@127.0.0.1:20129/v1',
   'http://127.0.0.1:20129/v1?paid=true','http://127.0.0.1:20129/v2']) {
    assert.throws(()=>new NineRouterModelGateway({...base,baseUrl:url}),e=>e.code==='INVALID_CONFIGURATION');
  }
});
test('synthetic authorized request carries no prompt or key in telemetry', async()=>{
  let received;
  const fakeFetch=async(url,options)=>{
    received={url:url.href,options};
    return new Response(JSON.stringify({model:req.model,choices:[{message:{content:'OK'}}],usage:{prompt_tokens:11,completion_tokens:2}}),{
      status:200,headers:{'content-type':'application/json'},
    });
  };
  const g = new NineRouterModelGateway({...base, fetchImpl:fakeFetch});
  const r=await g.infer(req);
  assert.equal(r.content,'OK');
  assert.equal(r.telemetry.agentId,'Beatriz');
  assert.equal(r.telemetry.outcome,'TRANSPORT_OK');
  assert.equal(r.telemetry.inputTokens,11);
  assert.equal(r.telemetry.reportedModel,req.model);
  assert.equal(received.url,'http://127.0.0.1:20129/v1/chat/completions');
  assert.equal(received.options.headers.authorization,'Bearer test-key-not-real');
  assert.equal(received.options.redirect,'error');
  assert.equal(JSON.parse(received.options.body).model,req.model);
  assert.equal(JSON.stringify(r.telemetry).includes('test-key-not-real'),false);
  assert.equal(JSON.stringify(r.telemetry).includes(req.messages[0].content),false);
});
test('unverified upstream fallback model is rejected', async()=>{
  const g=new NineRouterModelGateway({...base,fetchImpl:async()=>new Response(JSON.stringify({
    model:'paid/other-model',choices:[{message:{content:'cannot be credited'}}],
  }),{status:200})});
  await errorCode(()=>g.infer(req),'INVALID_UPSTREAM_RESPONSE');
});
test('401 sanitized: never reflect upstream key or body', async()=>{
  const g=new NineRouterModelGateway({...base,fetchImpl:async()=>new Response('secret key leaked',{status:401})});
  await assert.rejects(()=>g.infer(req),e=>e.code==='UPSTREAM_REJECTED'&&!e.message.includes('secret'));
});
test('network/timeout errors map to safe codes', async()=>{
  const a=new NineRouterModelGateway({...base,fetchImpl:async()=>{throw Error('private-host') }});
  await errorCode(()=>a.infer(req),'UPSTREAM_UNAVAILABLE');
  const b=new NineRouterModelGateway({...base,fetchImpl:async()=>{throw new DOMException('timeout','TimeoutError') }});
  await errorCode(()=>b.infer(req),'TIMEOUT');
});
test('reject invalid messages, size and token budget without network call', async()=>{
  const g=new NineRouterModelGateway({...base,fetchImpl:async()=>{throw Error('SHOULD_NOT_CALL')}});
  await errorCode(()=>g.infer({...req,messages:[{role:'user',content:'x'.repeat(33000)}]}),'INVALID_REQUEST');
  await errorCode(()=>g.infer({...req,maxOutputTokens:9999}),'INVALID_REQUEST');
  await errorCode(()=>g.infer({...req,agentId:'../../unsafe'}),'INVALID_REQUEST');
  await errorCode(()=>g.infer({...req,messages:[{role:'tool',content:'forbidden'}]}),'INVALID_REQUEST');
});
