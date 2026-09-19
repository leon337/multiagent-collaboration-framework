#!/usr/bin/env python3
import argparse,importlib.util,json,shutil
PROVIDERS={
  "kokoro":{"module":"kokoro","command":"kokoro","qualityClass":"neural-local"},
  "supertonic":{"module":"supertonic","command":"supertonic","qualityClass":"neural-local"},
  "piper":{"module":"piper","command":"piper","qualityClass":"neural-local"},
  "espeak":{"module":None,"command":"espeak","qualityClass":"fallback-system"},
}
def main():
  ap=argparse.ArgumentParser();ap.add_argument("--require",choices=sorted(PROVIDERS));args=ap.parse_args()
  providers={}
  for name,meta in PROVIDERS.items():
    module_ok=bool(meta["module"] and importlib.util.find_spec(meta["module"]))
    command_path=shutil.which(meta["command"]) if meta["command"] else None
    providers[name]={**meta,"moduleAvailable":module_ok,"commandPath":command_path,"available":module_ok or bool(command_path)}
  selected=args.require
  ok=not selected or providers[selected]["available"]
  print(json.dumps({"status":"PASS" if ok else "MISSING_PROVIDER","providers":providers,"selected":selected,"policy":"fallback-only; never replace approved narration voice implicitly"},indent=2))
  raise SystemExit(0 if ok else 2)
if __name__=="__main__":main()
