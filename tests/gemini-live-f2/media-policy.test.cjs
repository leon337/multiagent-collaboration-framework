'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../apps/gemini-live-studio/public/media-policy.js'),'utf8'),ctx);
const create=ctx.window.MCFMediaPolicy.createMediaController;
const stream=()=>{let n=0;const track={readyState:'live',onended:null,stop(){n++;this.readyState='ended';}};return {track,getTracks:()=>[track],getVideoTracks:()=>[track],stops:()=>n};};
function fixture(){
 let consent=true,connected=true,cam=stream(),screen=stream(),cameraCalls=0,screenCalls=0;
 const events=[];
 const policy=create({requestConsent:async k=>{events.push('consent:'+k);return consent;},
 requestCamera:async()=>{cameraCalls++;return cam;},requestScreen:async()=>{screenCalls++;return screen;},
 isConnected:()=>connected,onStart:k=>events.push('start:'+k),onStop:k=>events.push('stop:'+k),onError:(k,e)=>events.push('error:'+k)});
 return {policy,events,cam,screen,deny:()=>consent=false,disconnect:()=>connected=false,calls:()=>({cameraCalls,screenCalls})};
}
test('denied consent cannot request camera hardware',async()=>{
 const x=fixture();x.deny();assert.equal(await x.policy.start('camera'),false);
 assert.equal(x.calls().cameraCalls,0);assert.equal(x.policy.isSharing(),false);
});
test('approved camera becomes active; stop closes track',async()=>{
 const x=fixture();assert.equal(await x.policy.start('camera'),true);
 assert.equal(x.policy.getActive('camera'),x.cam);
 x.policy.stop('camera');assert.equal(x.cam.stops(),1);assert.equal(x.policy.isSharing(),false);
});
test('screen replaces camera after successful permission',async()=>{
 const x=fixture();await x.policy.start('camera');await x.policy.start('screen');
 assert.equal(x.cam.stops(),1);assert.equal(x.policy.getActive('camera'),null);
 assert.equal(x.policy.getActive('screen'),x.screen);
});
test('denied switch retains previously permitted stream',async()=>{
 const x=fixture();await x.policy.start('camera');x.deny();
 assert.equal(await x.policy.start('screen'),false);assert.equal(x.cam.stops(),0);
});
test('OS screen-ended callback revokes active capture',async()=>{
 const x=fixture();await x.policy.start('screen');
 x.screen.track.readyState='ended';x.screen.track.onended();
 assert.equal(x.policy.isSharing(),false);assert.equal(x.screen.stops(),1);
});
test('disconnect after permission prompt discards stream when promise resolves',async()=>{
 let release;const gate=new Promise(ok=>release=ok);const s=stream();
 let requested;const inPicker=new Promise(ok=>requested=ok);
 let connected=true,started=0;
 const p=create({requestConsent:async()=>true,requestCamera:async()=>{requested();return gate;},requestScreen:async()=>s,
 isConnected:()=>connected,onStart:()=>started++,onStop:()=>{}});
 const pending=p.start('camera');await inPicker;
 connected=false;p.stopAll();release(s);
 assert.equal(await pending,false);assert.equal(s.stops(),1);assert.equal(started,0);
});
test('disconnect during consent invalidates late acceptance',async()=>{
 let release;const gate=new Promise(ok=>release=ok);let acquired=0;
 const p=create({requestConsent:async()=>gate,requestCamera:async()=>{acquired++;return stream();},
 requestScreen:async()=>stream(),isConnected:()=>true,onStart:()=>{},onStop:()=>{}});
 const task=p.start('camera');p.stopAll();release(true);
 assert.equal(await task,false);assert.equal(acquired,0);
});
test('second request cannot overtake pending consent',async()=>{
 let release;const gate=new Promise(ok=>release=ok);const s=stream();let count=0;
 const p=create({requestConsent:async()=>gate,requestCamera:async()=>{count++;return s;},
 requestScreen:async()=>{count++;return stream();},isConnected:()=>true,onStart:()=>{},onStop:()=>{}});
 const first=p.start('camera');assert.equal(await p.start('screen'),false);
 release(true);assert.equal(await first,true);assert.equal(count,1);p.stopAll();
});
test('user stop while native picker pending makes late result stale',async()=>{
 let release;const gate=new Promise(ok=>release=ok);const s=stream();
 let requested;const inPicker=new Promise(ok=>requested=ok);
 const p=create({requestConsent:async()=>true,requestCamera:async()=>{requested();return gate;},requestScreen:async()=>s,
 isConnected:()=>true,onStart:()=>{throw Error('should not start');},onStop:()=>{}});
 const task=p.start('camera');await inPicker;
 p.stop('camera');release(s);
 assert.equal(await task,false);assert.equal(s.stops(),1);
});
test('no implicit reconnect acquisition',async()=>{
 const x=fixture();await x.policy.start('camera');x.disconnect();x.policy.stopAll();
 assert.equal(x.calls().cameraCalls,1);assert.equal(x.policy.isSharing(),false);
});
test('browser permission error remains inactive',async()=>{
 let errs=0;const p=create({requestConsent:async()=>true,requestCamera:async()=>{throw Error('denied');},
 requestScreen:async()=>stream(),isConnected:()=>true,onStart:()=>{throw Error('should not');},
 onStop:()=>{},onError:()=>errs++});
 assert.equal(await p.start('camera'),false);assert.equal(errs,1);assert.equal(p.isSharing(),false);
});
