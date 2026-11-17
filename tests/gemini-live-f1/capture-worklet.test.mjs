import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const source=readFileSync(join(import.meta.dirname,'../../apps/gemini-live-studio/public/capture-worklet.js'),'utf8');
function make(rate=48000,size=640,autoAck=true,ctxStart=0){
 let Type;
 class FakeProcessor{
  constructor(){const self=this;this.port={onmessage:null,posted:[],postMessage(data,transfer){self.port.posted.push({data,transfer});if(autoAck&&data?.type==='pcm')self.port.onmessage?.({data:{type:'ack'}});}};}
 }
 const sandbox={AudioWorkletProcessor:FakeProcessor,sampleRate:rate,currentTime:ctxStart,registerProcessor:(name,t)=>{assert.equal(name,'pcm16-capture');Type=t;},Float32Array,Int16Array,Number,Math};
 vm.runInNewContext(source,sandbox);
 const processor=new Type({processorOptions:{frameSamples:size}});
 processor.__clock=sandbox;processor.__clockStart=ctxStart;return processor;
}
function feed(proc,seconds=1,rate=48000,wave=t=>Math.sin(2*Math.PI*1000*t)*0.5){
 const count=Math.round(seconds*rate),input=new Float32Array(128),output=new Float32Array(128);
 for(let start=0;start<count;start+=128){
  if(proc.__clock)proc.__clock.currentTime=proc.__clockStart+start/rate;
  input.fill(0);
  for(let i=0;i<128&&start+i<count;i++)input[i]=wave((start+i)/rate);
  proc.process([[input]],[[output]]);
  assert.ok(output.every(v=>v===0),'worklet must never play microphone input');
 }
}
function sampleOutput(proc){
 return Array.from(proc.port.posted.flatMap(({data})=>Array.from(new Int16Array(data.buffer))));
}
test('stages 40ms PCM16 little-endian frames at 48 kHz input',()=>{
 const p=make(48000);feed(p,1.01,48000,()=>0.5);
 assert.equal(p.port.posted.length,25);
 for(const m of p.port.posted){assert.equal(m.data.samples,640);assert.equal(m.data.rate,16000);assert.equal(m.data.buffer.byteLength,1280);assert.ok(m.transfer.includes(m.data.buffer));}
 const values=sampleOutput(p);assert.equal(values.length,16000);
 assert.ok(values.every(v=>Math.abs(v-16384)<=2),"DC deviation = "+Math.max(...values.map(v=>Math.abs(v-16384))));
});
test('44.1k input resamples to ~16k at fixed frame cadence',()=>{
 const p=make(44100);feed(p,1.01,44100,()=>0.25);
 const chunks=p.port.posted.length;
 assert.ok(chunks>=24&&chunks<=25,'frames='+chunks);
 assert.ok(sampleOutput(p).every(v=>v>8000&&v<8200));
});
test('resampling phase continues across input blocks without audible boundary jumps',()=>{
 const p=make(48000);feed(p,1.01,48000);
 const pcm=sampleOutput(p).map(v=>v/32768);
 let mse=0;
 for(let i=0;i<pcm.length;i++){const expected=Math.sin(2*Math.PI*1000*i/16000)*0.5;mse+=(pcm[i]-expected)**2;}
 mse/=pcm.length;
 assert.ok(mse<0.0001,'mse='+mse);
});
test('buffer resets every 640 samples, never contains uninitialized previous frame',()=>{
 const p=make(48000);feed(p,.21,48000,t=>t<.10?.6:-.4);
 assert.equal(p.port.posted.length,5);
 const a=new Int16Array(p.port.posted[0].data.buffer),b=new Int16Array(p.port.posted[4].data.buffer);
 assert.ok(a.every(x=>x>15000));assert.ok(b.every(x=>x<0));
});
test('RMS is measured without raw voice or transcript metadata',()=>{
 const p=make(48000);feed(p,.09,48000,()=>0.2);
 assert.equal(p.port.posted.length,2);
 assert.ok(Math.abs(p.port.posted[0].data.rms-.2)<.001);
 const keys=Object.keys(p.port.posted[0].data).sort();
 assert.deepEqual(keys,['buffer','captureTimeSec','droppedFrames','rate','rms','samples','type']);
});
test('stop message halts processing after cleanup',()=>{
 const p=make(48000);p.port.onmessage({data:{type:'stop'}});
 assert.equal(p.process([[new Float32Array(128)]],[[new Float32Array(128)]]),false);
});

test('anti-alias suppresses 12kHz voice-band alias after 48k -> 16k resampling',()=>{
 const low=make(48000),high=make(48000);
 feed(low,.9,48000,t=>Math.sin(2*Math.PI*1000*t)*.7);
 feed(high,.9,48000,t=>Math.sin(2*Math.PI*12000*t)*.7);
 const rms=p=>{const v=sampleOutput(p).slice(250);return Math.sqrt(v.reduce((sum,x)=>sum+x*x,0)/v.length);};
 const clean=rms(low),folded=rms(high);
 assert.ok(clean>9000,'voice-band signal unexpectedly attenuated '+clean);
 assert.ok(folded<clean*.15,'insufficient antialias suppression: '+(folded/clean));
});
test('bounded worklet MessagePort credits discard delayed input instead of unbounded memory growth',()=>{
 const p=make(48000,640,false);
 feed(p,.6,48000,()=>.2);
 assert.equal(p.port.posted.length,3);
 assert.equal(p.pendingFrames,3);
 assert.ok(p.droppedFrames>=10,'dropped='+p.droppedFrames);
 p.port.onmessage({data:{type:'ack'}});
 feed(p,.05,48000,()=>.2);
 assert.equal(p.port.posted.length,4);
 assert.ok(p.port.posted[3].data.droppedFrames>=10);
 assert.ok(p.pendingFrames<=3);
});
test('all transmitted frames are acknowledged to preserve realtime throughput',()=>{
 const p=make(44100,640,true);
 feed(p,3,44100,()=>.1);
 assert.ok(p.port.posted.length>=74);
 assert.equal(p.droppedFrames,0);
 assert.equal(p.pendingFrames,0);
});

test('Worklet timestamp uses AudioContext clock even after delayed initialization',()=>{
 const p=make(48000,640,true,.6);feed(p,.25,48000,()=>.2);
 const packets=p.port.posted;assert.ok(packets.length>=6);
 const first=packets[0].data.captureTimeSec;const last=packets.at(-1).data.captureTimeSec;
 assert.ok(first>.635&&first<.655,'first sample contextTime='+first);
 assert.ok(last>first+.18);
 // A fresh packet received ~50ms later is not stale under 350ms guard.
 assert.ok((first+.05-first)*1000<350);
});
