/* Gemini Live Studio F1 — 16 kHz, little-endian PCM capture.
 * Streaming linear interpolation preserves phase across AudioWorklet quanta.
 * Each frame contains 640 samples (40ms), transferable to UI thread.
 */
'use strict';
class PCM16CaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts=options?.processorOptions||{};
    this.targetRate=16000;
    this.inputRate=sampleRate;
    this.step=this.inputRate/this.targetRate;
    this.frameSamples=Number.isInteger(opts.frameSamples)?Math.max(320,Math.min(640,opts.frameSamples)):640;
    this.frame=new Int16Array(this.frameSamples);
    this.pos=0;
    this.sumsq=0;
    this.inputIndex=0;
    this.nextOutputIndex=0;
    this.previous=0;
    this.stopped=false;
    this.port.onmessage=e=>{if(e.data?.type==='stop')this.stopped=true;};
  }
  push(value) {
    const v=Math.max(-1,Math.min(1,Number.isFinite(value)?value:0));
    this.frame[this.pos++]=Math.round(v<0?v*32768:v*32767);
    this.sumsq+=v*v;
    if(this.pos===this.frameSamples){
      const payload=this.frame.buffer;
      this.port.postMessage({type:'pcm',buffer:payload,rms:Math.sqrt(this.sumsq/this.frameSamples),samples:this.frameSamples,rate:this.targetRate},[payload]);
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
      const x=data[i],index=this.inputIndex++;
      if(index===0){
        this.push(x);this.nextOutputIndex+=this.step;this.previous=x;continue;
      }
      while(this.nextOutputIndex<=index){
        const alpha=Math.max(0,Math.min(1,this.nextOutputIndex-(index-1)));
        this.push(this.previous+(x-this.previous)*alpha);
        this.nextOutputIndex+=this.step;
      }
      this.previous=x;
    }
    return true;
  }
}
registerProcessor('pcm16-capture',PCM16CaptureProcessor);
