#!/usr/bin/env python3
import argparse,shutil,subprocess
def main():
  ap=argparse.ArgumentParser();ap.add_argument("--provider",choices=["espeak"],required=True);ap.add_argument("--text",required=True);ap.add_argument("--output",required=True);ap.add_argument("--voice",default="pt-br");args=ap.parse_args()
  if args.provider=="espeak":
    exe=shutil.which("espeak")
    if not exe: raise SystemExit("espeak provider unavailable")
    subprocess.run([exe,"-v",args.voice,"-s","155","-w",args.output,args.text],check=True)
    print(f"LOCAL_TTS_RENDERED provider=espeak output={args.output}")
if __name__=="__main__":main()
