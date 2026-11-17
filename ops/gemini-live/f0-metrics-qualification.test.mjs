import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {qualifyTelemetry} from './f0-metrics-qualification.mjs';
const source=fs.readFileSync(new URL('../../apps/gemini-live-studio/public/telemetry.js',import.meta.url),'utf8');
function telemetry(){
 const window={};
 vm.runInNewContext(source,{window,Date});
 return window.MCFLiveTelemetry;
}
test('zero samples are not qualified and price is not fabricated',()=>{
 const s=qualifyTelemetry(telemetry().snapshot());
 assert.equal(s.latency.setup_latency_ms.samples,0);
 assert.equal(s.latency.setup_latency_ms.qualification,'EXPLORATORY_ONLY');
 assert.equal(s.estimated_cost.status,'NOT_VERIFIED');
 assert.equal(s.estimated_cost.amount,null);
 assert.equal(s.quota.provider_quota_verified,false);
});
test('30 samples meet threshold but never claim actual acoustic proof',()=>{
 const t=telemetry();
 for(let n=1;n<=30;n++)t.record('setup_complete',{latency_ms:100+n});
 const s=qualifyTelemetry(t.snapshot());
 assert.equal(s.latency.setup_latency_ms.p50,115);
 assert.equal(s.latency.setup_latency_ms.p95,129);
 assert.equal(s.latency.setup_latency_ms.qualification,'SAMPLE_THRESHOLD_MET');
 assert.equal(s.has_physical_audio_latency_evidence,false);
 assert.equal(s.latency.setup_latency_ms.is_physical_ear_latency_verified,false);
});
test('reconnect rate, 429, errors, tokens and disconnects are counted conservatively',()=>{
 const t=telemetry();
 t.record('reconnect_attempt',{count:1});
 t.record('reconnect_attempt',{count:2});
 t.record('reconnect_success',{count:1});
 t.record('browser_error',{code:429});
 t.record('disconnect',{code:1006});
 t.record('tokens',{total_tokens:670});
 const s=qualifyTelemetry(t.snapshot());
 assert.equal(s.reconnect.attempts,2);
 assert.equal(s.reconnect.successes,1);
 assert.equal(s.reconnect.success_rate,0.5);
 assert.equal(s.quota.observed_429_events,1);
 assert.equal(s.browser_error_events,1);
 assert.equal(s.websocket_disconnects,1);
 assert.equal(s.tokens.last_observed_total,670);
});
test('no credential, prompt, media or PII leaks through aggregate output',()=>{
 const t=telemetry();
 t.record('connect_attempt',{model:'gemini-3.8-live',api_key:'SECRET-X',prompt:'PRIVATE'});
 t.record('setup_complete',{latency_ms:850,token:'SECRET-X',transcript:'PRIVATE'});
 const out=JSON.stringify(qualifyTelemetry(t.snapshot()));
 for(const secret of ['SECRET-X','PRIVATE','gemini-3.8-live','api_key','transcript'])assert.ok(!out.includes(secret),secret);
});
test('invalid and oversized snapshots fail closed',()=>{
 for(const value of [null,{}, {schema:'other',scope:'browser-memory-only',events:[]},
  {schema:'mcf-live-f1-telemetry/v1',scope:'wrong',events:[]},
  {schema:'mcf-live-f1-telemetry/v1',scope:'browser-memory-only',events:Array(501).fill({})}]){
  assert.throws(()=>qualifyTelemetry(value),/INVALID_TELEMETRY/);
 }
});
