#!/usr/bin/env python3
"""Low-level physical speaker path check: PipeWire sink monitor, no recorded audio saved."""
import os,array,math,subprocess,threading,time,json
from pathlib import Path
base=Path('/tmp/mcf-f1-qa')
sink=subprocess.check_output(['pactl','get-default-sink'],text=True).strip()
capture={'samples':0,'sum_square':0,'peak':0,'errors':[]}
proc=subprocess.Popen(['parec','--raw','--device='+sink+'.monitor','--rate=48000','--channels=1','--format=s16le'],
 stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=0)
def consumer():
 while True:
  try:d=os.read(proc.stdout.fileno(),8192)
  except:break
  if not d:break
  vals=array.array('h');vals.frombytes(d[:len(d)//2*2])
  capture['samples']+=len(vals)
  capture['sum_square']+=sum(int(v)**2 for v in vals)
  capture['peak']=max(capture['peak'],max((abs(v) for v in vals),default=0))
t=threading.Thread(target=consumer,daemon=True);t.start()
time.sleep(.35)
rate=48000
pulse=array.array('h',(int(32767*.06*math.sin(2*math.pi*660*i/rate)) for i in range(rate)))
pp=subprocess.run(['paplay','--raw','--device='+sink,'--rate=48000','--channels=1','--format=s16le'],
 input=pulse.tobytes(),stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=6)
time.sleep(.4)
proc.terminate()
try:proc.wait(timeout=2)
except:proc.kill()
t.join(timeout=2)
out={'schema':'mcf-f1-speaker-monitor/v1','sink':sink,'paplay_exit':pp.returncode,
 'monitor_samples':capture['samples'],
 'monitor_rms':round((capture['sum_square']/max(capture['samples'],1))**.5/32768,6),
 'monitor_peak':round(capture['peak']/32768,6),
 'monitor_exit':proc.returncode,'pcm_recorded_to_disk':False,
 'limitation':'Sink monitor signal proves delivery to PipeWire output, not that user physically heard it'}
base.mkdir(exist_ok=True)
(base/'speaker-monitor.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out))
