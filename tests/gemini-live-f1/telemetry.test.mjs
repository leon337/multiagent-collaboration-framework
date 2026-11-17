import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {join} from 'node:path';
const source=readFileSync(join(import.meta.dirname,'../../apps/gemini-live-studio/public/telemetry.js'),'utf8');
function make(){const window={};runInNewContext(source,{window,Date});return window.MCFLiveTelemetry;}
test('F1 version and private memory-only contract',()=>{
 const t=make(),d=t.snapshot();
 assert.equal(d.schema,'mcf-live-f1-telemetry/v1');assert.equal(d.scope,'browser-memory-only');
});
test('live recovery counters and barge-in are independently measurable',()=>{
 const t=make();
 for(const e of ['reconnect_attempt','reconnect_success','barge_in','go_away'])t.record(e,{count:1});
 const m=t.snapshot().metrics;
 assert.equal(m.reconnect_attempts,1);assert.equal(m.reconnect_successes,1);assert.equal(m.barge_in_events,1);assert.equal(m.go_away_events,1);
});
test('drops, underruns and bytes are numerical metadata only',()=>{
 const t=make();t.record('input_dropped',{count:1});t.record('audio_underrun',{count:1});t.record('audio_rx_bytes',{bytes:1234});
 const m=t.snapshot().metrics;
 assert.equal(m.input_frames_dropped,1);assert.equal(m.audio_underruns,1);assert.equal(m.audio_bytes_received,1234);
});
test('whitelist strips microphone, prompt, screenshot and token content',()=>{
 const t=make();t.record('audio_rx_bytes',{bytes:512,pcm:'SECRET',transcript:'PRIVATE',screen:'FRAME',api_key:'AQ.TEST',access_token:'SECRET_TOKEN'});
 const events=JSON.stringify(t.snapshot().events);
 assert.ok(events.includes('"bytes":512'));
 for(const word of ['SECRET','PRIVATE','FRAME','api_key','access_token','AQ.TEST'])assert.ok(!events.includes(word));
});
test('numerical metadata is bounded and invalid event names discarded',()=>{
 const t=make();t.record('raw_audio',{pcm:'VOICE'});t.record('playback_queue_ms',{elapsed_ms:243.42,model:'../../secret'});
 const s=t.snapshot();
 assert.equal(s.events.length,1);assert.equal(s.events[0].elapsed_ms,243);assert.ok(!('model' in s.events[0]));
});
test('buffer bounded and statistics report sample sizes',()=>{
 const t=make();
 for(let i=0;i<580;i++)t.record('setup_complete',{latency_ms:300+i});
 const s=t.snapshot();assert.equal(s.events.length,500);
 assert.equal(s.metrics.setup_latency_ms.samples,500);
 assert.ok(Number.isInteger(s.metrics.setup_latency_ms.p50));
});

test('playback p50/p95 is scheduled playback latency, separate from receive latency',()=>{
 const t=make();
 for(const n of [200,300,400,500,600])t.record('first_playback',{latency_ms:n});
 t.record('first_audio',{latency_ms:140});
 const m=t.snapshot().metrics;
 assert.deepEqual(JSON.parse(JSON.stringify(m.first_playback_latency_ms)),{samples:5,p50:400,p95:600});
 assert.equal(m.first_audio_latency_ms.p50,140);
});
test('normal idle intervals do not inflate within-generation underrun counts',()=>{
 const t=make();t.record('audio_underrun',{count:1,elapsed_ms:200});
 for(let i=0;i<9;i++)t.record('playback_idle_resume',{elapsed_ms:1500});
 const m=t.snapshot().metrics;assert.equal(m.audio_underruns,1);assert.equal(m.playback_idle_resumes,9);
});

test('lost frame counts aggregate actual frames rather than event count',()=>{
 const t=make();t.record('input_dropped',{count:12});t.record('input_dropped',{count:3});
 assert.equal(t.snapshot().metrics.input_frames_dropped,15);
});
test('silent responses and response timeouts are numeric private metadata only',()=>{
 const t=make();t.record('response_no_audio',{count:1,prompt:'secret'});t.record('response_timeout',{count:1,token:'NO'});
 const s=t.snapshot();assert.equal(s.metrics.silent_turns,1);assert.equal(s.metrics.response_timeouts,1);
 assert.ok(!JSON.stringify(s).includes('secret'));
});


test('voice response proxy is labeled separately from verified audible latency',()=>{
 const t=make();
 for(const ms of [410,850,1200])t.record('voice_to_audio_proxy',{latency_ms:ms,transcript:'PRIVATE'});
 const m=t.snapshot().metrics.voice_to_audio_proxy_ms;
 assert.equal(m.samples,3);assert.equal(m.p50,850);assert.equal(m.p95,1200);
 assert.match(m.scope,/NOT_ear/);
 assert.ok(!JSON.stringify(t.snapshot()).includes('PRIVATE'));
});
test('disconnects before a response have a separate numeric indicator',()=>{
 const t=make();t.record('response_interrupted',{count:1,token:'SECRET'});
 assert.equal(t.snapshot().metrics.response_interrupted,1);
 assert.ok(!JSON.stringify(t.snapshot()).includes('SECRET'));
});
