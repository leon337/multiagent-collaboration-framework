/**
 * MCF F0.6: derive non-sensitive, explicit-quality metrics from an ephemeral
 * browser telemetry snapshot. This module never reads audio, transcripts,
 * API keys, screen contents or user identifiers. No price is invented.
 */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const SUPPORTED=new Set(['mcf-live-f1-telemetry/v1','mcf-live-f0-telemetry/v1']);
const LATENCIES={setup_latency_ms:'setup_complete',first_audio_latency_ms:'first_audio',
 first_playback_latency_ms:'first_playback',voice_to_audio_proxy_ms:'voice_to_audio_proxy'};
const MIN_SAMPLES=30;
const pct=(arr,p)=>arr[Math.max(0,Math.ceil(arr.length*p)-1)];
function numeric(event,key){
 const v=event?.[key];
 return typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:null;
}
function countEvents(events,name){return events.filter(e=>e?.event===name).length;}
export function qualifyTelemetry(input){
 if(!input||typeof input!=='object'||!SUPPORTED.has(input.schema)
    ||input.scope!=='browser-memory-only'||!Array.isArray(input.events)
    ||input.events.length>500)throw Error('INVALID_TELEMETRY_SNAPSHOT');
 const events=input.events;
 const latencies={};
 for(const [metric,name] of Object.entries(LATENCIES)){
  const values=events.filter(e=>e?.event===name).map(e=>numeric(e,'latency_ms'))
   .filter(n=>n!==null).sort((a,b)=>a-b);
  const enough=values.length>=MIN_SAMPLES;
  latencies[metric]={samples:values.length,p50:values.length?pct(values,.5):null,
   p95:values.length?pct(values,.95):null,
   qualification:enough?'SAMPLE_THRESHOLD_MET':'EXPLORATORY_ONLY',
   is_physical_ear_latency_verified:false};
 }
 const attempts=countEvents(events,'reconnect_attempt');
 const successes=countEvents(events,'reconnect_success');
 const tokenEvents=events.filter(e=>e?.event==='tokens').map(e=>numeric(e,'total_tokens'))
  .filter(n=>n!==null);
 const tokens=tokenEvents.length?tokenEvents.at(-1):null;
 const quota=events.filter(e=>(e?.event==='browser_error'||e?.event==='disconnect')&&numeric(e,'code')===429).length;
 return {
  schema:'mcf-f0-metrics-qualification/v1',
  scope:'non_sensitive_aggregate_only',
  source_schema:input.schema,
  latency:latencies,
  websocket_disconnects:countEvents(events,'disconnect'),
  browser_error_events:countEvents(events,'browser_error'),
  reconnect:{attempts,successes,success_rate:attempts>0&&successes<=attempts?successes/attempts:null,
   confidence:attempts>=MIN_SAMPLES?'SAMPLE_THRESHOLD_MET':'EXPLORATORY_ONLY'},
  tokens:{last_observed_total:tokens,usage_breakdown_verified:false},
  quota:{observed_429_events:quota,provider_quota_verified:false,quota_value:null},
  estimated_cost:{currency:null,amount:null,status:'NOT_VERIFIED',
   reason:'Requires verified provider price, modality token split and timestamp'},
  has_physical_audio_latency_evidence:false,
  cost_or_quota_pass:false,
  risk:'Insufficient real samples and price metadata cannot support F1/F0 gate'
 };
}
if(fileURLToPath(import.meta.url)===process.argv[1]){
 try{
  const location=process.argv[2];
  if(!location)throw Error('SNAPSHOT_FILE_REQUIRED');
  const file=fs.readFileSync(location,'utf8');
  if(file.length>2_000_000)throw Error('SNAPSHOT_TOO_LARGE');
  const result=qualifyTelemetry(JSON.parse(file));
  console.log(JSON.stringify(result,null,2));
 }catch(e){console.error('F0_METRICS_FAILED',/^(INVALID_|SNAPSHOT_)/.test(e.message)?e.message:'MISSING_OR_BAD_INPUT');process.exitCode=1;}
}
