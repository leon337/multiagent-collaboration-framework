/* F0 minimal privacy-first telemetry: numeric/enum signals only, memory only. */
(()=>{
'use strict';
const items=[],LIMIT=500;
const accepted=new Set(['connect_attempt','ws_open','setup_complete','first_audio','disconnect','text_sent','tool_call','tokens','browser_error','reconnect_attempt','reconnect_success','audio_underrun','playback_queue_ms','barge_in','input_dropped','vad_start','vad_end','go_away','generation_complete','audio_rx_bytes','reconnect_budget_exhausted','playback_idle_resume','first_playback']);
function record(event,fields={}){
 if(!accepted.has(event))return;
 const allowed={};
 for(const name of ['model','elapsed_ms','latency_ms','code','bytes','count','total_tokens']){
  const v=fields[name];
  if(typeof v==='number'&&Number.isFinite(v))allowed[name]=Math.max(0,Math.round(v));
  else if(name==='model'&&typeof v==='string'&&/^[a-z0-9._-]{1,100}$/.test(v))allowed.model=v;
 }
 items.push({at:new Date().toISOString(),event,...allowed});
 while(items.length>LIMIT)items.shift();
}
function pct(series,p){const a=series.slice().sort((x,y)=>x-y);return a.length?a[Math.max(0,Math.ceil(a.length*p)-1)]:null;}
function snapshot(){
 const events=items.map(x=>({...x})),setup=events.filter(x=>x.event==='setup_complete'&&Number.isFinite(x.latency_ms)).map(x=>x.latency_ms);
 const first=events.filter(x=>x.event==='first_audio'&&Number.isFinite(x.latency_ms)).map(x=>x.latency_ms);
 return {schema:'mcf-live-f1-telemetry/v1',scope:'browser-memory-only',events,
  metrics:{setup_latency_ms:{samples:setup.length,p50:pct(setup,.5),p95:pct(setup,.95)},first_audio_latency_ms:{samples:first.length,p50:pct(first,.5),p95:pct(first,.95)},first_playback_latency_ms:(()=>{const vals=events.filter(x=>x.event==='first_playback'&&Number.isFinite(x.latency_ms)).map(x=>x.latency_ms);return {samples:vals.length,p50:pct(vals,.5),p95:pct(vals,.95)};})(),
   ws_disconnects:events.filter(x=>x.event==='disconnect').length,tool_calls:events.filter(x=>x.event==='tool_call').reduce((n,x)=>n+(x.count||0),0),reconnect_attempts:events.filter(x=>x.event==='reconnect_attempt').length,reconnect_successes:events.filter(x=>x.event==='reconnect_success').length,barge_in_events:events.filter(x=>x.event==='barge_in').length,audio_underruns:events.filter(x=>x.event==='audio_underrun').length,playback_idle_resumes:events.filter(x=>x.event==='playback_idle_resume').length,input_frames_dropped:events.filter(x=>x.event==='input_dropped').length,go_away_events:events.filter(x=>x.event==='go_away').length,audio_bytes_received:events.filter(x=>x.event==='audio_rx_bytes').reduce((sum,x)=>sum+(x.bytes||0),0)},
  limitations:['No audio transcript, API key, ephemeral token, raw media, email, IP address or screen content','Cost estimation requires verified provider price and usage classification']};
}
window.MCFLiveTelemetry=Object.freeze({record,snapshot});
})();