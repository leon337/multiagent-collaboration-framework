import test from 'node:test';
import assert from 'node:assert/strict';
import {MODELS,metadataOnly,parseListeners,probeModels,revalidate,checkCredential,readKeySecurely} from './f0-current-revalidation.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
test('metadata classifier excludes extra provider fields and certifies no extra capabilities',()=>{
 const id='gemini-3.8-live';
 const data=metadataOnly({name:'models/'+id,supportedGenerationMethods:['bidiGenerateContent'],apiKey:'LEAK'},id);
 assert.deepEqual(data.supported_methods,['bidiGenerateContent']);
 assert.equal(data.limits.cost,'NOT_VERIFIED');
 assert.ok(!JSON.stringify(data).includes('LEAK'));
});
test('HTTP 200 with missing, empty or different-model JSON cannot pass discovery',()=>{
 for(const data of [null,{}, {name:'models/other',supportedGenerationMethods:['bidiGenerateContent']},
   {name:'models/gemini-3.8-live',supportedGenerationMethods:[]}]){
  const r=metadataOnly(data,'gemini-3.8-live');
  assert.equal(r.metadata_http_status,'INVALID_METADATA');
 }
});
test('probe scrubs provider responses and returns invalid metadata as failure',async()=>{
 const secret='API_KEY_NOT_FOR_LOGS';
 const out=await probeModels(secret,async(url,opts)=>{
  assert.equal(opts.headers['x-goog-api-key'],secret);
  if(url.includes('extended'))return {ok:false,status:429};
  return {ok:true,json:async()=>({name:'models/invalid',supportedGenerationMethods:['bidiGenerateContent'],privateToken:secret})};
 });
 assert.equal(out.length,MODELS.length);
 assert.ok(out.some(r=>r.metadata_http_status===429));
 assert.ok(out.some(r=>r.metadata_http_status==='INVALID_METADATA'));
 assert.ok(!JSON.stringify(out).includes(secret));
});
test('literal 0.0.0.0:port or IPv6 dual-stack cannot pass loopback-only criterion',()=>{
 const withPid=(host)=>'LISTEN 0 511 '+host+':18377 0.0.0.0:* users:(("node",pid=1788,fd=25))';
 for(const addr of ['0.0.0.0','[::]','[::1]','192.168.1.99']){
  const parsed=parseListeners(withPid(addr),18377);
  assert.equal(parsed.loopback_only,false,addr);
 }
 assert.equal(parseListeners(withPid('127.0.0.1'),18377).loopback_only,true);
 assert.equal(parseListeners(withPid('127.0.0.1')+'\n'+withPid('0.0.0.0'),18377).loopback_only,false);
});
test('all listeners count even if PID is not disclosed by ss',()=>{
 const known='LISTEN 0 511 127.0.0.1:18377 0.0.0.0:* users:(("node",pid=1788,fd=25))';
 const noPid='LISTEN 0 511 0.0.0.0:18377 0.0.0.0:*';
 const result=parseListeners(known+'\n'+noPid,18377);
 assert.equal(result.matches.length,2);
 assert.equal(result.loopback_only,false);
 assert.equal(parseListeners(noPid,18377).loopback_only,false);
 const loopNoPid='LISTEN 0 511 127.0.0.1:18377 0.0.0.0:*';
 assert.equal(parseListeners(loopNoPid,18377).loopback_only,false);
});
test('invalid live path and port fail closed',async()=>{
 await assert.rejects(revalidate({liveDir:null}),/LIVE_DIRECTORY_MISSING/);
 await assert.rejects(revalidate({liveDir:'/tmp',servicePort:0}),/INVALID_LOCAL_PORT/);
});

test('a private symlink directory does not mask world-writable real key parent',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mcf-f0-link-'));
 try{
  const secretDirectory=path.join(root,'private-link-dir');
  const vulnerableDirectory=path.join(root,'target-world-writable');
  fs.mkdirSync(secretDirectory,{mode:0o700});
  fs.mkdirSync(vulnerableDirectory,{mode:0o777});
  fs.chmodSync(vulnerableDirectory,0o777);
  const target=path.join(vulnerableDirectory,'test-api-key.json');
  fs.writeFileSync(target,JSON.stringify({key:'FAKE_KEY_NEVER_REAL'}),{mode:0o600});
  fs.symlinkSync(target,path.join(secretDirectory,'api-key.json'));
  const check=checkCredential(path.join(secretDirectory,'api-key.json'));
  assert.equal(check.protectedModes,false);
  assert.equal(check.credential_metadata.key_target_parent_mode,'777');
  assert.equal(check.credential_metadata.key_link_parent_mode,'700');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('malformed credential parser cannot expose source bytes in errors',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mcf-f0-secret-'));
 try{
  const file=path.join(root,'key.json');
  fs.writeFileSync(file,'PRIVATE_CRED_SHOULD_NOT_LOG { [ invalid');
  assert.throws(()=>readKeySecurely(file),e=>{
   assert.equal(e.message,'CREDENTIAL_NOT_READABLE');
   return !e.message.includes('PRIVATE_CRED_SHOULD_NOT_LOG');
  });
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
