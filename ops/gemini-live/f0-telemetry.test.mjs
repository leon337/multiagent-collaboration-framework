import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {join} from 'node:path';
const base=join(import.meta.dirname,'../../artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro');
const source=readFileSync(join(base,'public/telemetry.js'),'utf8');
function api(){
 const window={};
 runInNewContext(source,{window,Date});
 return window.MCFLiveTelemetry;
}
test('telemetry API is browser memory only',()=>{
 const t=api(),s=t.snapshot();
 assert.equal(s.schema,'mcf-live-f0-telemetry/v1');
 assert.equal(s.scope,'browser-memory-only');
 assert.equal(s.events.length,0);
});
test('unknown events fail closed',()=>{
 const t=api();t.record('secrets_published',{code:200});
 assert.equal(t.snapshot().events.length,0);
});
test('allowlist strips arbitrary content and credentials',()=>{
 const t=api();t.record('setup_complete',{latency_ms:700,api_key:'AQ.TEST-SHOULD-NOT-LEAK',transcript:'PRIVATE',url:'https://service.invalid/?access_token=PRIVATE',frame:'FAKE'});
 const s=JSON.stringify(t.snapshot().events);
 assert.ok(s.includes('"latency_ms":700'));
 for(const forbidden of ['PRIVATE','access_token=','FAKE','api_key','transcript','AQ.TEST']) assert.ok(!s.includes(forbidden),'unexpected '+forbidden);
});
test('model id rejects injection text',()=>{
 const t=api();t.record('connect_attempt',{model:'not-valid\n<script>',code:200});
 const e=t.snapshot().events[0];
 assert.ok(!('model' in e));assert.equal(e.code,200);
});
test('numeric fields are clamped and rounded',()=>{
 const t=api();t.record('first_audio',{latency_ms:-3.9,count:1.8,bytes:Infinity});
 const e=t.snapshot().events[0];
 assert.equal(e.latency_ms,0);assert.equal(e.count,2);assert.ok(!('bytes' in e));
});
test('percentiles count and nearest rank',()=>{
 const t=api();for(const n of [100,300,200,400,500])t.record('setup_complete',{latency_ms:n});
 const m=t.snapshot().metrics.setup_latency_ms;
 assert.equal(m.samples,5);assert.equal(m.p50,300);assert.equal(m.p95,500);
});
test('event buffer remains bounded at 500 entries',()=>{
 const t=api();for(let i=0;i<620;i++)t.record('connect_attempt',{count:i});
 const s=t.snapshot();assert.equal(s.events.length,500);assert.equal(s.events[0].count,120);
});
test('snapshot returns copies that cannot mutate telemetry state',()=>{
 const t=api();t.record('tool_call',{count:1});
 const s=t.snapshot();s.events[0].count=999;
 assert.equal(t.snapshot().events[0].count,1);
});
test('HTML loads telemetry before app JavaScript',()=>{
 const html=readFileSync(join(base,'public/index.html'),'utf8');
 assert.ok(html.indexOf('/telemetry.js')>=0);
 assert.ok(html.indexOf('/telemetry.js')<html.indexOf('/app.js'));
});
