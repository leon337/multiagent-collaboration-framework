#!/usr/bin/env python3
import argparse,re,subprocess,json,sys
ap=argparse.ArgumentParser();ap.add_argument('media');ap.add_argument('--min-mean-db',type=float,default=-45);ap.add_argument('--max-mean-db',type=float,default=-3);ap.add_argument('--max-peak-db',type=float,default=0);a=ap.parse_args()
p=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',a.media,'-af','volumedetect','-f','null','-'],text=True,capture_output=True);t=p.stderr+p.stdout
m=re.search(r'mean_volume:\s*(-?[0-9.]+) dB',t);x=re.search(r'max_volume:\s*(-?[0-9.]+) dB',t)
if not m or not x:print(json.dumps({'status':'LOUDNESS_UNREADABLE','media':a.media}));sys.exit(2)
mean=float(m.group(1));peak=float(x.group(1));ok=a.min_mean_db<=mean<=a.max_mean_db and peak<=a.max_peak_db
print(json.dumps({'status':'PASS' if ok else 'FAIL','media':a.media,'meanDb':mean,'peakDb':peak}));sys.exit(0 if ok else 1)
