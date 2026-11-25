import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pkcePair } from '../src/oauth.mjs';
import { isAllowedOperation, requireAllowed, BridgeError, tokenMatches, status, OPERATIONS } from '../src/bridge.mjs';

test('PKCE has correct S256 shape', ()=>{
  const a=pkcePair(),b=pkcePair();
  assert.ok(a.verifier.length>=43 && a.verifier.length<=128);
  assert.match(a.challenge,/^[A-Za-z0-9_-]+$/);
  assert.notEqual(a.challenge,b.challenge);
});
test('only explicit operations are registered',()=>{
  assert.equal(OPERATIONS.length,11);
  assert.equal(isAllowedOperation('google.gmail.search'),true);
  const previous = process.env.MCF_GOOGLE_CLOUD_PROVISION_ENABLED;
  delete process.env.MCF_GOOGLE_CLOUD_PROVISION_ENABLED;
  assert.equal(isAllowedOperation('google.cloud.projects.create'),false);
  assert.throws(() => requireAllowed('google.cloud.projects.create'), e => e.code === 'OPERATION_DISABLED');
  process.env.MCF_GOOGLE_CLOUD_PROVISION_ENABLED = 'true';
  assert.equal(isAllowedOperation('google.cloud.projects.create'),true);
  if (previous === undefined) delete process.env.MCF_GOOGLE_CLOUD_PROVISION_ENABLED;
  else process.env.MCF_GOOGLE_CLOUD_PROVISION_ENABLED = previous;
  assert.equal(isAllowedOperation('google.gmail.send'),false);
  assert.throws(()=>requireAllowed('google.gmail.send'),e=>e instanceof BridgeError&&e.code==='UNSUPPORTED_OPERATION');
});
test('generation disabled without explicit opt-in',()=>{
  const prior=process.env.GOOGLE_BRIDGE_ALLOW_GENERATION;
  delete process.env.GOOGLE_BRIDGE_ALLOW_GENERATION;
  assert.throws(()=>requireAllowed('google.gemini.generate'),e=>e.code==='OPERATION_DISABLED');
  if(prior!==undefined) process.env.GOOGLE_BRIDGE_ALLOW_GENERATION=prior;
});
test('local authorization token compare is exact',()=>{
  assert.equal(tokenMatches('a','a'),true);
  assert.equal(tokenMatches('a','b'),false);
  assert.equal(tokenMatches('a','aa'),false);
  assert.equal(tokenMatches(null,'abc'),false);
});
test('status excludes credential values',()=>{
  const s=JSON.stringify(status());
  assert.ok(s.includes('read-only-default'));
  assert.equal(s.includes('refresh_token'),false);
});
