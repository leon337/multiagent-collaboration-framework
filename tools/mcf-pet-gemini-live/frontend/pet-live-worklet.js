// Owned local AudioWorklet: microphone samples go only to the Pet Live session
// after the user clicks Start. No background mic, storage, or tools.
class McfPetMicrophone extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.cursor = 0;
  }
  process(inputs, outputs) {
    const channel = inputs[0]?.[0];
    if (channel) for (let i=0;i<channel.length;i++) {
      this.buffer[this.cursor++] = channel[i];
      if (this.cursor===this.buffer.length) {
        const frame=this.buffer;
        this.port.postMessage({samples:frame,rate:sampleRate},[frame.buffer]);
        this.buffer=new Float32Array(2048);
        this.cursor=0;
      }
    }
    for (const output of outputs) for (const c of output) c.fill(0);
    return true;
  }
}
registerProcessor("mcf-pet-microphone", McfPetMicrophone);
