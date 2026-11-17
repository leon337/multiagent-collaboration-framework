/* Gemini Live Studio F1 — bounded AudioWorklet PCM16 capture.
 * Streamed mono 16kHz input. Windowed-sinc antialias resampling has
 * fractional-phase kernels and a bounded worklet->main-thread credit queue.
 * Raw media never enters logs or persistent storage.
 */
'use strict';
class PCM16CaptureProcessor extends AudioWorkletProcessor {
 constructor(options){
  super();
  const opts=options?.processorOptions||{};
  this.targetRate=16000;
  this.inputRate=sampleRate;
  this.step=this.inputRate/this.targetRate;
  this.frameSamples=Number.isInteger(opts.frameSamples)?Math.max(320,Math.min(640,opts.frameSamples)):640;
  this.frame=new Int16Array(this.frameSamples);
  this.pos=0;this.sumsq=0;
  this.inputIndex=-1;this.nextOutputIndex=0;
  this.firstSample=0;this.stopped=false;
  this.ring=new Float32Array(128);
  this.radius=16;
  this.phaseCount=64;
  this.pendingFrames=0;
  this.maxPendingFrames=3;
  this.droppedFrames=0;
  this.kernels=[];
  // Output Nyquist is 8kHz; roll off above ~7.1kHz to suppress folded audio.
  const cutoff=Math.min(.5,7100/this.inputRate);
  for(let phase=0;phase<this.phaseCount;phase++){
   const frac=phase/this.phaseCount;
   const weights=new Float32Array(this.radius*2+1);
   let sum=0;
   for(let tap=-this.radius;tap<=this.radius;tap++){
    const x=tap-frac;
    const sinc=Math.abs(x)<1e-12?1:Math.sin(2*Math.PI*cutoff*x)/(Math.PI*x);
    const kernel=(Math.abs(x)<1e-12?2*cutoff:sinc);
    const win=.42+.5*Math.cos(Math.PI*tap/this.radius)+.08*Math.cos(2*Math.PI*tap/this.radius);
    const w=kernel*win;
    weights[tap+this.radius]=w;sum+=w;
   }
   for(let i=0;i<weights.length;i++)weights[i]/=sum;
   this.kernels.push(weights);
  }
  this.port.onmessage=e=>{
   if(e.data?.type==='stop')this.stopped=true;
   if(e.data?.type==='ack')this.pendingFrames=Math.max(0,this.pendingFrames-1);
  };
 }
 push(value){
  const v=Math.max(-1,Math.min(1,Number.isFinite(value)?value:0));
  this.frame[this.pos++]=Math.round(v<0?v*32768:v*32767);
  this.sumsq+=v*v;
  if(this.pos===this.frameSamples){
   if(this.pendingFrames<this.maxPendingFrames){
    const payload=this.frame.buffer;
    this.pendingFrames++;
    this.port.postMessage({
     type:'pcm',buffer:payload,rms:Math.sqrt(this.sumsq/this.frameSamples),
     samples:this.frameSamples,rate:this.targetRate,droppedFrames:this.droppedFrames,captureTimeSec:this.inputIndex/this.inputRate
    },[payload]);
    this.droppedFrames=0;
   }else this.droppedFrames++;
   this.frame=new Int16Array(this.frameSamples);
   this.pos=0;this.sumsq=0;
  }
 }
 process(inputs,outputs){
  for(const o of outputs)for(const ch of o)ch.fill(0);
  if(this.stopped)return false;
  const data=inputs?.[0]?.[0];
  if(!data)return true;
  for(let i=0;i<data.length;i++){
   const index=++this.inputIndex;
   const sample=Number.isFinite(data[i])?data[i]:0;
   if(index===0)this.firstSample=sample;
   this.ring[index&127]=sample;
   while(this.nextOutputIndex+this.radius<=index){
    const t=this.nextOutputIndex,base=Math.floor(t);
    const frac=t-base;
    const phase=Math.max(0,Math.min(this.phaseCount-1,Math.round(frac*this.phaseCount)));
    const weights=this.kernels[phase===this.phaseCount?0:phase];
    let y=0;
    for(let j=-this.radius;j<=this.radius;j++){
     const n=base+j;
     y+=weights[j+this.radius]*(n<0?this.firstSample:this.ring[n&127]);
    }
    this.push(y);
    this.nextOutputIndex+=this.step;
   }
  }
  return true;
 }
}
registerProcessor('pcm16-capture',PCM16CaptureProcessor);
