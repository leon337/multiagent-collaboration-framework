import test from 'node:test';
import assert from 'node:assert/strict';
import {MODELS,metadataOnly,probeModels,revalidate} from './f0-current-revalidation.mjs';
test('metadata classifier never treats model listing as proof of tools, quotas or real audio',()=>{
 const r=metadataOnly({supportedGenerationMethods:['bidiGenerateContent','countTokens'],apiKey:'SHOULD_NOT_LEAK'},'example');
 assert.deepEqual(r.supported_methods,['bidiGenerateContent','countTokens']);
 assert.equal(r.limits.physical_audio,'NOT_VERIFIED');
 assert.ok(!JSON.stringify(r).includes('SHOULD_NOT_LEAK'));
});
test('probe scrubs provider response and preserves negative outcomes',async()=>{
 const leaked='PRIVATE_API_KEY_SHOULD_NOT_LOG';
 const results=await probeModels(leaked,async(url,opts)=>{
  assert.equal(opts.headers['x-goog-api-key'],leaked);
  if(url.includes('extended'))return {ok:false,status:429};
  return {ok:true,json:async()=>({supportedGenerationMethods:['bidiGenerateContent'],privateToken:leaked})};
 });
 assert.equal(results.length,MODELS.length);
 assert.ok(results.some(r=>r.metadata_http_status===429));
 assert.ok(!JSON.stringify(results).includes(leaked));
 assert.ok(!results.every(r=>r.metadata_http_status===200));
});
test('invalid live path and service port fail closed',async()=>{
 await assert.rejects(revalidate({liveDir:null}),/LIVE_DIRECTORY_MISSING/);
 await assert.rejects(revalidate({liveDir:'/tmp',servicePort:0}),/INVALID_LOCAL_PORT/);
});
