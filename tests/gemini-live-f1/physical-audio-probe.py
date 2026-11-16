#!/usr/bin/env python3
"""F1.5: physical audio I/O hardware-path probe. Never saves recorded PCM or speech."""
import array,math,os,subprocess,time,json,datetime,sys
from pathlib import Path
root=Path('/tmp/mcf-f1-qa')
root.mkdir(parents=True,exist_ok=True)
def call(args):
 try:return subprocess.check_output(args,stderr=subprocess.DEVNULL,text=True,timeout=3).strip()
 except:return ''
sink=call(['pactl','get-default-sink']);source=call(['pactl','get-default-source'])
def record(device,rate,seconds):
 cmd=['parec','--device='+device,'--raw','--rate='+str(rate),'--channels=1','--format=s16le','--latency-msec=40']
 proc=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 need=int(rate*seconds)*2
 received=bytearray()
 try:
  while len(received)<need:
   buf=proc.stdout.read(min(4096,need-len(received)))
   if not buf:break
   received.extend(buf)
 finally:
  proc.terminate()
  try:proc.wait(timeout=2)
  except:proc.kill()
 # Metrics only; forget raw immediately.
 vals=array.array('h');vals.frombytes(received[:len(received)//2*2])
 n=len(vals)
 rms=math.sqrt(sum(int(x)*int(x) for x in vals)/n)/32768 if n else 0
 peak=max((abs(x) for x in vals),default=0)/32768
 zero_ratio=sum(x==0 for x in vals)/n if n else 1
 del received,vals
 return {'samples':n,'seconds':round(n/rate,3),'rms':round(rms,6),'peak':round(peak,6),'zero_ratio':round(zero_ratio,4)}
result={'schema':'mcf-f1-physical-io/v1','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'host':call(['hostname']),'default_source':source,'default_sink':sink,
 'privacy':{'recorded_media_persisted':False,'speech_transcript_persisted':False,'generated_tone_hz':440,'generated_volume_pct':8}}
if not source or not sink:
 result['status']='NO_DEFAULT_IO'
else:
 result['input_probe']=record(source,16000,2.0)
 rate=48000;duration=1.3
 # Low-volume original 440 Hz tone. Physical speaker may be audible briefly.
 pcm=array.array('h',(int(32767*.08*math.sin(2*math.pi*440*i/rate)) for i in range(int(rate*duration))))
 sink_monitor=sink+'.monitor'
 mon=subprocess.Popen(['parec','--device='+sink_monitor,'--raw','--rate='+str(rate),'--channels=1','--format=s16le'],
     stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 time.sleep(.2)
 playback=subprocess.run(['paplay','--device='+sink,'--raw','--rate='+str(rate),'--channels=1','--format=s16le'],
     input=pcm.tobytes(),capture_output=True,timeout=8)
 # PipeWire monitor capture: read buffered data in memory only.
 import select
 capture=bytearray()
 t=time.monotonic()
 while time.monotonic()-t<.4:
  ready,_,_=select.select([mon.stdout],[],[],.08)
  if ready:
   part=os.read(mon.stdout.fileno(),128*1024)
   if not part:break
   capture.extend(part)
 mon.terminate()
 try:mon.wait(timeout=1)
 except:mon.kill()
 samples=array.array('h');samples.frombytes(capture[:len(capture)//2*2])
 n=len(samples)
 rms=math.sqrt(sum(int(x)*int(x) for x in samples)/n)/32768 if n else 0
 result['sink_monitor_probe']={'samples':n,'observed_rms':round(rms,6),'paplay_exit':playback.returncode,'monitor_available':n>1000}
 result['status']='INPUT_AND_OUTPUT_PATH_TESTED' if result['input_probe']['samples']>=30000 and playback.returncode==0 and n>1000 else 'PARTIAL_HARDWARE_PATH'
 del capture,samples,pcm
out=root/'physical-io.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
os.chmod(out,0o600)
print(json.dumps(result,ensure_ascii=False))
