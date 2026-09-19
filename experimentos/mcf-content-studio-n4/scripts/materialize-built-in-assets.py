#!/usr/bin/env python3
from pathlib import Path
import argparse,json,math,struct,subprocess,wave,shutil
def sine(path,freq,duration,gain):
 sr=16000;n=max(1,int(sr*duration));path.parent.mkdir(parents=True,exist_ok=True)
 with wave.open(str(path),'w') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(b''.join(struct.pack('<h',int(32767*gain*math.sin(2*math.pi*freq*i/sr))) for i in range(n)))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--registry',default='assets/registry.json');ap.add_argument('--output-root',default='public/assets/n4/generated');args=ap.parse_args()
 r=json.load(open(args.registry,encoding='utf-8'));out=Path(args.output_root);out.mkdir(parents=True,exist_ok=True);made=[]
 for a in r['assets']:
  s=a['source']
  if s['kind']!='procedural':continue
  t=out/Path(s['path']).name;g=s['generator'];p=s.get('params',{})
  if g=='sine-wav-v1':sine(t,float(p['frequency']),float(p['durationSec']),float(p['gain']))
  elif g=='ffmpeg-color-loop-v1':
   if not shutil.which('ffmpeg'):raise RuntimeError('ffmpeg required')
   subprocess.run(['ffmpeg','-loglevel','error','-y','-f','lavfi','-i',f"color=c={p['background'].replace('#','0x')}:s={p['width']}x{p['height']}:d={p['durationSec']}:r={p['fps']}",'-vf',f"drawbox=x=40:y=220:w=240:h=100:color={p['accent'].replace('#','0x')}:t=6",'-an','-c:v','libx264','-pix_fmt','yuv420p',str(t)],check=True)
  else:raise ValueError(g)
  made.append({'id':a['id'],'path':str(t),'bytes':t.stat().st_size})
 print(json.dumps({'status':'MATERIALIZED','assets':made}))
if __name__=='__main__':main()
