import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { saveOauthTokens, loadOauthTokens, invoke, googleRequest } from '../src/bridge.mjs';

test('OAuth token store is encrypted, private and roundtrips', async()=>{
  const previous=process.env.MCF_GOOGLE_BRIDGE_STATE_DIR;
  const dir=await mkdtemp(path.join(tmpdir(),'mcf-google-sec-'));
  process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=dir;
  try {
    await saveOauthTokens({refresh_token:'test-only-refresh-token',access_token:'test-access',expires_at:1234});
    const raw=await readFile(path.join(dir,'workspace-tokens.enc'));
    assert.equal(raw.includes('test-only-refresh-token'),false);
    assert.equal((await stat(path.join(dir,'workspace-tokens.enc'))).mode & 0o077,0);
    assert.equal((await stat(path.join(dir,'key'))).mode & 0o077,0);
    assert.equal((await loadOauthTokens()).refresh_token,'test-only-refresh-token');
    await assert.rejects(invoke('google.gmail.send',{secret:'should-not-be-audited'}),/UNSUPPORTED_OPERATION/);
    const audit=await readFile(path.join(dir,'audit.jsonl'),'utf8');
    assert.equal(audit.includes('should-not-be-audited'),false);
    assert.ok(audit.includes('UNSUPPORTED_OPERATION'));
  } finally {
    if(previous===undefined) delete process.env.MCF_GOOGLE_BRIDGE_STATE_DIR;
    else process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=previous;
    await rm(dir,{recursive:true,force:true});
  }
});
test('Gemini model list uses allowlisted Google API and does not log the key',async()=>{
  const original=globalThis.fetch;
  const previous=process.env.GEMINI_API_KEY;
  const oldKey=process.env.GOOGLE_API_KEY;
  process.env.GEMINI_API_KEY='fake-test-key';
  delete process.env.GOOGLE_API_KEY;
  globalThis.fetch=async (url,options)=>{
    assert.match(url,/^https:\/\/generativelanguage.googleapis.com\/v1beta\/models/);
    assert.equal(options.headers['x-goog-api-key'],'fake-test-key');
    return Response.json({models:[{name:'models/demo',displayName:'Demo',supportedGenerationMethods:['generateContent']}]});
  };
  try {
    const found=await invoke('google.gemini.models');
    assert.equal(found.result.models[0].name,'models/demo');
    await assert.rejects(googleRequest('https://example.com/leak','gemini'),/GOOGLE_HOST_NOT_ALLOWED/);
  } finally {
    globalThis.fetch=original;
    if(previous===undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY=previous;
    if(oldKey===undefined) delete process.env.GOOGLE_API_KEY; else process.env.GOOGLE_API_KEY=oldKey;
  }
});
