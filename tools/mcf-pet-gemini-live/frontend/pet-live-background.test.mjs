import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=readFileSync(new URL("./pet-live.js",import.meta.url),"utf8");

test("visibilitychange updates the audio state without terminating Gemini Live",()=>{
  assert.match(source,/document\.addEventListener\("visibilitychange",syncBackgroundAudio\)/);
  assert.doesNotMatch(source,/if\s*\(\s*document\.hidden\s*&&\s*active\s*\)\s*end\s*\(/);
  assert.match(source,/window\.addEventListener\("pagehide",\(\)=>end\(false\)\)/);
});

test("hidden tabs silence microphone capture by default and block PCM transmission",()=>{
  assert.match(source,/const backgroundConsent=backgroundToggle\?\.checked===true/);
  assert.match(source,/const shouldCapture=!hidden\|\|backgroundConsent/);
  assert.match(source,/microphonePausedForBackground=!shouldCapture/);
  assert.match(source,/if\(microphonePausedForBackground\)return/);
  assert.match(source,/track\.enabled=shouldCapture/);
});

test("muting an active stream flushes trailing audio exactly on transition",()=>{
  assert.match(source,/const enteringMuted=!shouldCapture&&!microphonePausedForBackground/);
  assert.match(source,/if\(enteringMuted&&ready&&socket\?\.readyState===WebSocket\.OPEN\)/);
  assert.match(source,/socket\.send\(JSON\.stringify\(\{type:"audio_stream_end"\}\)\)/);
});

test("background recording requires explicit per-session opt-in, reset on stop",()=>{
  assert.match(source,/backgroundToggle\.disabled=true/);
  assert.match(source,/backgroundToggle\.checked=false; \/\/ opt-in is ALWAYS per session/);
  assert.match(source,/backgroundToggle\.disabled=false/);
  assert.match(source,/backgroundAudioConsented:backgroundToggle\?\.checked===true/);
});

test("session state and tool scopes remain separate from background microphone permission",()=>{
  assert.match(source,/const toolScope=toolsToggle\?\.checked!==true\?"conversation"/);
  assert.match(source,/body\.proposal_drafts_enabled/);
  assert.match(source,/socket=new WebSocket\(/);
  assert.match(source,/stream\?\.getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
});
