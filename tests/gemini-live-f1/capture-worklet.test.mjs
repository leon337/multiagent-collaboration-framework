import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const source=readFileSync(join(import.meta.dirname,'../../apps/gemini-live-studio/public/capture-worklet.js'),'utf8');
function make(rate=48000,size=640){
 let Type;
 class FakeProcessor{
  constructor(){const self=this;this.port={onmessage:null,posted:[],postMessage(data,transfer){self.port.posted.push({data,transfer});}};}
 }
 vm.runInNewContext(source,{AudioWorkletProcessor:FakeProcessor,sampleRate:rate,registerProcessor:(name,t)=>{assert.equal(name,'pcm16-capture');Type=t;},Float32Array,Int16Array,Number,Math});
 const processor=new Type({processorOptions:{frameSamples:size}});return processor;
}
function feed(proc,seconds=1,rate=48000,wave=t=>Math.sin(2*Math.PI*1000*t)*0.5){
 const count=Math.round(seconds*rate),input=new Float32Array(128),output=new Float32Array(128);
 for(let start=0;start<count;start+=128){
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
 const p=make(48000);feed(p,1,48000,()=>0.5);
 assert.equal(p.port.posted.length,25);
 for(const m of p.port.posted){assert.equal(m.data.samples,640);assert.equal(m.data.rate,16000);assert.equal(m.data.buffer.byteLength,1280);assert.ok(m.transfer.includes(m.data.buffer));}
 const values=sampleOutput(p);assert.equal(values.length,16000);
 assert.ok(values.every(v=>v===16384));
});
test('44.1k input resamples to ~16k at fixed frame cadence',()=>{
 const p=make(44100);feed(p,1,44100,()=>0.25);
 const chunks=p.port.posted.length;
 assert.ok(chunks>=24&&chunks<=25,'frames='+chunks);
 assert.ok(sampleOutput(p).every(v=>v>8000&&v<8200));
});
test('resampling phase continues across input blocks without audible boundary jumps',()=>{
 const p=make(48000);feed(p,1,48000);
 const pcm=sampleOutput(p).map(v=>v/32768);
 let mse=0;
 for(let i=0;i<pcm.length;i++){const expected=Math.sin(2*Math.PI*1000*i/16000)*0.5;mse+=(pcm[i]-expected)**2;}
 mse/=pcm.length;
 assert.ok(mse<0.0001,'mse='+mse);
});
test('buffer resets every 640 samples, never contains uninitialized previous frame',()=>{
 const p=make(48000);feed(p,.2,48000,t=>t<.10?.6:-.4);
 assert.equal(p.port.posted.length,5);
 const a=new Int16Array(p.port.posted[0].data.buffer),b=new Int16Array(p.port.posted[4].data.buffer);
 assert.ok(a.every(x=>x>15000));assert.ok(b.every(x=>x<0));
});
test('RMS is measured without raw voice or transcript metadata',()=>{
 const p=make(48000);feed(p,.08,48000,()=>0.2);
 assert.equal(p.port.posted.length,2);
 assert.ok(Math.abs(p.port.posted[0].data.rms-.2)<.001);
 const keys=Object.keys(p.port.posted[0].data).sort();
 assert.deepEqual(keys,['buffer','rate','rms','samples','type']);
});
test('stop message halts processing after cleanup',()=>{
 const p=make(48000);p.port.onmessage({data:{type:'stop'}});
 assert.equal(p.process([[new Float32Array(128)]],[[new Float32Array(128)]]),false);
});
